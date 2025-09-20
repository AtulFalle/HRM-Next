import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'
import { z } from 'zod'

const updateVariablePayEntrySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
})

// GET /api/payroll/variable-pay/[id] - Get specific variable pay entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getUserContext(request)
    if (!userContext.isManagerOrAdmin()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params

    const variablePayEntry = await prisma.variablePayEntry.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: true,
            department: true,
          },
        },
        submitter: true,
        approver: true,
        rejector: true,
      },
    })

    if (!variablePayEntry) {
      return NextResponse.json({ success: false, error: 'Variable pay entry not found' }, { status: 404 })
    }

    // Check permissions - employees can only view their own entries
    if (!userContext.isManagerOrAdmin() && variablePayEntry.employeeId !== userContext.user.employee?.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: { variablePayEntry },
    })
  } catch (error) {
    console.error('Error fetching variable pay entry:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch variable pay entry' },
      { status: 500 }
    )
  }
}

// PUT /api/payroll/variable-pay/[id] - Update variable pay entry (approve/reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getUserContext(request)
    if (!userContext.isManagerOrAdmin()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateVariablePayEntrySchema.parse(body)

    // Get existing variable pay entry
    const existingEntry = await prisma.variablePayEntry.findUnique({
      where: { id },
      include: { employee: { include: { user: true } } },
    })

    if (!existingEntry) {
      return NextResponse.json({ success: false, error: 'Variable pay entry not found' }, { status: 404 })
    }

    // Check permissions - only managers and admins can approve/reject
    if (!userContext.isManagerOrAdmin()) {
      return NextResponse.json({ success: false, error: 'Forbidden - Manager or Admin access required' }, { status: 403 })
    }

    // Don't allow updates if already processed
    if (existingEntry.status !== 'PENDING') {
      return NextResponse.json({ success: false, error: 'Variable pay entry has already been processed' }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      status: validatedData.status,
    }

    if (validatedData.status === 'APPROVED') {
      updateData.approvedBy = userContext.user.id
      updateData.approvedAt = new Date()
    } else if (validatedData.status === 'REJECTED') {
      updateData.rejectedBy = userContext.user.id
      updateData.rejectedAt = new Date()
      updateData.rejectionReason = validatedData.rejectionReason
    }

    // Update variable pay entry
    const updatedEntry = await prisma.variablePayEntry.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          include: {
            user: true,
            department: true,
          },
        },
        submitter: true,
        approver: true,
        rejector: true,
      },
    })

    // Create audit log
    await prisma.payrollAuditLog.create({
      data: {
        employeeId: existingEntry.employeeId,
        action: `VARIABLE_PAY_ENTRY_${validatedData.status}`,
        details: {
          entryId: id,
          month: existingEntry.month,
          year: existingEntry.year,
          amount: existingEntry.amount,
          type: existingEntry.type,
          rejectionReason: validatedData.rejectionReason,
        },
        performedBy: userContext.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: { variablePayEntry: updatedEntry },
      message: `Variable pay entry ${validatedData.status.toLowerCase()} successfully`,
    })
  } catch (error) {
    console.error('Error updating variable pay entry:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update variable pay entry' },
      { status: 500 }
    )
  }
}

// DELETE /api/payroll/variable-pay/[id] - Delete variable pay entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getUserContext(request)
    if (!userContext.isManagerOrAdmin()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params

    // Get existing variable pay entry
    const existingEntry = await prisma.variablePayEntry.findUnique({
      where: { id },
    })

    if (!existingEntry) {
      return NextResponse.json({ success: false, error: 'Variable pay entry not found' }, { status: 404 })
    }

    // Check permissions - only the submitter or admins can delete
    if (existingEntry.submittedBy !== userContext.user.id && userContext.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden - You can only delete your own entries' }, { status: 403 })
    }

    // Don't allow deletion if already approved
    if (existingEntry.status === 'APPROVED') {
      return NextResponse.json({ success: false, error: 'Cannot delete approved variable pay entry' }, { status: 400 })
    }

    // Create audit log before deletion
    await prisma.payrollAuditLog.create({
      data: {
        employeeId: existingEntry.employeeId,
        action: 'VARIABLE_PAY_ENTRY_DELETED',
        details: {
          deletedEntry: {
            month: existingEntry.month,
            year: existingEntry.year,
            amount: existingEntry.amount,
            type: existingEntry.type,
            status: existingEntry.status,
          },
        },
        performedBy: userContext.user.id,
      },
    })

    // Delete variable pay entry
    await prisma.variablePayEntry.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Variable pay entry deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting variable pay entry:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete variable pay entry' },
      { status: 500 }
    )
  }
}
