import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'
import { z } from 'zod'

const updateLeaveRequestSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']),
  comments: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Temporarily disabled auth for development
    // const session = await getServerSession(authOptions)
    
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { id } = await params
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 })
    }

    // Check permissions (disabled for development)
    // if (session.user.role === 'EMPLOYEE' && leaveRequest.employee.userId !== session.user.id) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    return NextResponse.json({
      success: true,
      data: leaveRequest
    })
  } catch (error) {
    console.error('Error fetching leave request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Temporarily disabled auth for development
    // const session = await getServerSession(authOptions)
    
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateLeaveRequestSchema.parse(body)

    // Check if leave request exists
    const existingRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true }
    })

    if (!existingRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 })
    }

    // Check permissions (disabled for development)
    // const isAdmin = session.user.role === 'ADMIN'
    // const isManager = session.user.role === 'MANAGER'
    // const isOwnRequest = existingRequest.employee.userId === session.user.id

    // if (!isAdmin && !isManager && !isOwnRequest) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    // Only admin/manager can approve/reject, employees can only cancel their own requests
    // if (session.user.role === 'EMPLOYEE' && !isOwnRequest) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    // if (session.user.role === 'EMPLOYEE' && validatedData.status !== 'CANCELLED') {
    //   return NextResponse.json({ error: 'Employees can only cancel their own requests' }, { status: 403 })
    // }

    // Only pending requests can be approved/rejected
    if (existingRequest.status !== 'PENDING' && ['APPROVED', 'REJECTED'].includes(validatedData.status)) {
      return NextResponse.json({ error: 'Only pending requests can be approved or rejected' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {
      status: validatedData.status,
      comments: validatedData.comments,
    }

    // Set approver and approval date for approved/rejected requests (disabled for development)
    if (['APPROVED', 'REJECTED'].includes(validatedData.status)) {
      // Get user context for approval
      const userContext = await getUserContext()
      if (userContext) {
        updateData.approvedBy = userContext.user.id
      }
      updateData.approvedAt = new Date()
    }

    const leaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Leave request updated successfully',
      data: leaveRequest
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating leave request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Temporarily disabled auth for development
    // const session = await getServerSession(authOptions)
    
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { id } = await params
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true }
    })

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 })
    }

    // Check permissions - only admin or the employee who created the request can delete (disabled for development)
    // const isAdmin = session.user.role === 'ADMIN'
    // const isOwnRequest = leaveRequest.employee.userId === session.user.id

    // if (!isAdmin && !isOwnRequest) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    // Only pending requests can be deleted
    if (leaveRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Only pending requests can be deleted' }, { status: 400 })
    }

    await prisma.leaveRequest.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Leave request deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting leave request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
