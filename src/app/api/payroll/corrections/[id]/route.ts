import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'
import { z } from 'zod'

const updateCorrectionRequestSchema = z.object({
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESOLVED']),
  reviewComments: z.string().optional(),
  resolution: z.string().optional(),
})

// GET /api/payroll/corrections/[id] - Get specific correction request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const correctionRequest = await prisma.payrollCorrectionRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: true,
            department: true,
          },
        },
        payroll: true,
        requester: true,
        reviewer: true,
      },
    })

    if (!correctionRequest) {
      return NextResponse.json({ success: false, error: 'Correction request not found' }, { status: 404 })
    }

    // Check permissions - employees can only view their own requests
    if (!userContext.isManagerOrAdmin() && correctionRequest.employeeId !== userContext.user.employee?.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: { correctionRequest },
    })
  } catch (error) {
    console.error('Error fetching correction request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch correction request' },
      { status: 500 }
    )
  }
}

// PUT /api/payroll/corrections/[id] - Update correction request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateCorrectionRequestSchema.parse(body)

    // Get existing correction request
    const existingRequest = await prisma.payrollCorrectionRequest.findUnique({
      where: { id },
      include: { payroll: true },
    })

    if (!existingRequest) {
      return NextResponse.json({ success: false, error: 'Correction request not found' }, { status: 404 })
    }

    // Check permissions - only managers and admins can review/update correction requests
    if (!userContext.isManagerOrAdmin()) {
      return NextResponse.json({ success: false, error: 'Forbidden - Manager or Admin access required' }, { status: 403 })
    }

    // Don't allow updates if already resolved
    if (existingRequest.status === 'RESOLVED') {
      return NextResponse.json({ success: false, error: 'Correction request has already been resolved' }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      status: validatedData.status,
      reviewComments: validatedData.reviewComments,
      resolution: validatedData.resolution,
    }

    // Set reviewer and review date for status changes
    if (validatedData.status !== 'PENDING' && validatedData.status !== existingRequest.status) {
      updateData.reviewedBy = userContext.user.id
      updateData.reviewedAt = new Date()
    }

    // Update correction request
    const updatedRequest = await prisma.payrollCorrectionRequest.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          include: {
            user: true,
            department: true,
          },
        },
        payroll: true,
        requester: true,
        reviewer: true,
      },
    })

    // Create audit log
    await prisma.payrollAuditLog.create({
      data: {
        payrollId: existingRequest.payrollId,
        employeeId: existingRequest.employeeId,
        action: `CORRECTION_REQUEST_${validatedData.status}`,
        details: {
          requestId: id,
          type: existingRequest.type,
          newStatus: validatedData.status,
          reviewComments: validatedData.reviewComments,
          resolution: validatedData.resolution,
        },
        performedBy: userContext.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: { correctionRequest: updatedRequest },
      message: `Correction request ${validatedData.status.toLowerCase()} successfully`,
    })
  } catch (error) {
    console.error('Error updating correction request:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update correction request' },
      { status: 500 }
    )
  }
}

// DELETE /api/payroll/corrections/[id] - Delete correction request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get existing correction request
    const existingRequest = await prisma.payrollCorrectionRequest.findUnique({
      where: { id },
    })

    if (!existingRequest) {
      return NextResponse.json({ success: false, error: 'Correction request not found' }, { status: 404 })
    }

    // Check permissions - only the requester or admins can delete
    if (existingRequest.requestedBy !== userContext.user.id && userContext.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden - You can only delete your own requests' }, { status: 403 })
    }

    // Don't allow deletion if already resolved
    if (existingRequest.status === 'RESOLVED') {
      return NextResponse.json({ success: false, error: 'Cannot delete resolved correction request' }, { status: 400 })
    }

    // Create audit log before deletion
    await prisma.payrollAuditLog.create({
      data: {
        payrollId: existingRequest.payrollId,
        employeeId: existingRequest.employeeId,
        action: 'CORRECTION_REQUEST_DELETED',
        details: {
          deletedRequest: {
            type: existingRequest.type,
            description: existingRequest.description,
            status: existingRequest.status,
          },
        },
        performedBy: userContext.user.id,
      },
    })

    // Delete correction request
    await prisma.payrollCorrectionRequest.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Correction request deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting correction request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete correction request' },
      { status: 500 }
    )
  }
}
