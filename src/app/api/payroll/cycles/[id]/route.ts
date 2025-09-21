import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'
import { z } from 'zod'

const updatePayrollCycleSchema = z.object({
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'PENDING_APPROVAL', 'FINALIZED', 'LOCKED']).optional(),
  notes: z.string().optional(),
})

// GET /api/payroll/cycles/[id] - Get specific payroll cycle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getUserContext()
    if (!userContext.isAdmin?.()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const [year, month] = id.split('-').map(Number)
    if (!year || !month) {
      return NextResponse.json(
        { success: false, error: 'Invalid cycle ID format' },
        { status: 400 }
      )
    }

    // Get payroll data for this cycle
    const payrollData = await prisma.payroll.findMany({
      where: {
        month,
        year,
      },
      include: {
        employee: {
          include: {
            user: true,
            department: true,
          },
        },
        payrollInputs: true,
        payslips: true,
        correctionRequests: true,
      },
    })

    if (payrollData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Payroll cycle not found' },
        { status: 404 }
      )
    }

    // Calculate aggregated data
    const totalEmployees = payrollData.length
    const totalAmount = payrollData.reduce((sum, payroll) => sum + Number(payroll.netSalary), 0)
    const errors = payrollData.filter(p => p.status === 'PENDING').length
    const warnings = payrollData.filter(p => p.status === 'PROCESSED').length

    // Determine overall status
    let status = 'DRAFT'
    if (totalEmployees > 0) {
      const finalizedCount = payrollData.filter(p => p.status === 'PAID').length
      if (finalizedCount === totalEmployees) {
        status = 'FINALIZED'
      } else if (finalizedCount > 0) {
        status = 'IN_PROGRESS'
      } else {
        status = 'IN_PROGRESS'
      }
    }

    const cycle = {
      id,
      month,
      year,
      status,
      totalEmployees,
      errors,
      warnings,
      totalAmount,
      createdAt: payrollData[0]?.createdAt.toISOString() || new Date().toISOString(),
      finalizedAt: payrollData[0]?.updatedAt.toISOString(),
      payrollData,
    }

    return NextResponse.json({
      success: true,
      data: cycle,
    })
  } catch (error) {
    console.error('Error fetching payroll cycle:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payroll cycle' },
      { status: 500 }
    )
  }
}

// PUT /api/payroll/cycles/[id] - Update payroll cycle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getUserContext()
    if (!userContext.isAdmin?.()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const [year, month] = id.split('-').map(Number)
    if (!year || !month) {
      return NextResponse.json(
        { success: false, error: 'Invalid cycle ID format' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updatePayrollCycleSchema.parse(body)

    // Update all payroll records for this cycle
    const updateData: { status?: 'PENDING' | 'PROCESSED' | 'PAID' | 'FINALIZED' } = {}
    if (validatedData.status) {
      updateData.status = validatedData.status as 'PENDING' | 'PROCESSED' | 'PAID' | 'FINALIZED'
    }

    const updatedPayrolls = await prisma.payroll.updateMany({
      where: {
        month,
        year,
      },
      data: updateData,
    })

    // Create audit log
    if (updatedPayrolls.count > 0) {
      await prisma.payrollAuditLog.create({
        data: {
          action: 'CYCLE_UPDATED',
          performedBy: userContext.user.id,
          details: {
            month,
            year,
            ...validatedData,
            updatedCount: updatedPayrolls.count,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id,
        month,
        year,
        ...validatedData,
        updatedCount: updatedPayrolls.count,
      },
    })
  } catch (error) {
    console.error('Error updating payroll cycle:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update payroll cycle' },
      { status: 500 }
    )
  }
}

// DELETE /api/payroll/cycles/[id] - Delete payroll cycle
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getUserContext()
    if (!userContext.isAdmin?.()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const [year, month] = id.split('-').map(Number)
    if (!year || !month) {
      return NextResponse.json(
        { success: false, error: 'Invalid cycle ID format' },
        { status: 400 }
      )
    }

    // Check if cycle is already finalized
    const existingPayrolls = await prisma.payroll.findMany({
      where: { month, year },
    })

    const finalizedCount = existingPayrolls.filter(p => p.status === 'PAID').length
    if (finalizedCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete finalized payroll cycle' },
        { status: 400 }
      )
    }

    // Delete all related data
    await prisma.$transaction(async (tx) => {
      // Delete correction requests
      await tx.payrollCorrectionRequest.deleteMany({
        where: {
          payroll: {
            month,
            year,
          },
        },
      })

      // Delete payslips
      await tx.payslip.deleteMany({
        where: {
          payroll: {
            month,
            year,
          },
        },
      })

      // Delete payroll inputs
      await tx.payrollInput.deleteMany({
        where: {
          payroll: {
            month,
            year,
          },
        },
      })

      // Delete audit logs
      await tx.payrollAuditLog.deleteMany({
        where: {
          payroll: {
            month,
            year,
          },
        },
      })

      // Delete payroll records
      await tx.payroll.deleteMany({
        where: { month, year },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Payroll cycle deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting payroll cycle:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete payroll cycle' },
      { status: 500 }
    )
  }
}
