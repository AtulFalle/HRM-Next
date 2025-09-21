import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'

// PUT /api/attendance/regularization/[id] - Review regularization request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    // Only managers and admins can review requests
    if (!userContext.isManagerOrAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { status, reviewComments } = body

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
    }

    // Get the regularization request
    const regularizationRequest = await prisma.attendanceRegularizationRequest.findUnique({
      where: { id },
      include: {
        employee: true
      }
    })

    if (!regularizationRequest) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 })
    }

    if (regularizationRequest.status !== 'PENDING') {
      return NextResponse.json({ success: false, error: 'Request already reviewed' }, { status: 400 })
    }

    // Update the regularization request
    const updatedRequest = await prisma.attendanceRegularizationRequest.update({
      where: { id },
      data: {
        status,
        reviewedBy: userContext.user.id,
        reviewedAt: new Date(),
        reviewComments
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        reviewer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // If approved, update the attendance record
    if (status === 'APPROVED') {
      await prisma.attendance.update({
        where: {
          employeeId_date: {
            employeeId: regularizationRequest.employeeId,
            date: regularizationRequest.date
          }
        },
        data: {
          isRegularized: true,
          regularizedBy: userContext.user.id,
          regularizedAt: new Date()
        }
      })
    }

    return NextResponse.json({ success: true, data: updatedRequest })
  } catch (error) {
    console.error('Error reviewing regularization request:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/attendance/regularization/[id] - Get specific regularization request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    const regularizationRequest = await prisma.attendanceRegularizationRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        reviewer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!regularizationRequest) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 })
    }

    // Check if user has permission to view this request
    if (regularizationRequest.employeeId !== userContext.user?.employee?.id && !userContext.isManagerOrAdmin?.()) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: regularizationRequest })
  } catch (error) {
    console.error('Error fetching regularization request:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
