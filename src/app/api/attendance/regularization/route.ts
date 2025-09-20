import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'

// GET /api/attendance/regularization - Get regularization requests
export async function GET(request: NextRequest) {
  try {
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')

    // Determine target employee(s) for regularization requests
    let targetEmployeeId = userContext.user.employee?.id
    let isAdminView = false

    if (employeeId) {
      // Specific employee requested
      if (employeeId !== userContext.user.employee?.id) {
        // Only managers and admins can view other employees' requests
        if (!userContext.isManagerOrAdmin()) {
          return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }
        targetEmployeeId = employeeId
      }
    } else if (userContext.isManagerOrAdmin()) {
      // No specific employee requested and user is manager/admin - show all employees
      isAdminView = true
      targetEmployeeId = undefined
    } else if (!targetEmployeeId) {
      // Regular employee with no employee record
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 })
    }

    const whereClause: any = {}
    
    // Add employee filter if not admin view
    if (!isAdminView && targetEmployeeId) {
      whereClause.employeeId = targetEmployeeId
    }

    const requests = await prisma.attendanceRegularizationRequest.findMany({
      where: whereClause,
      orderBy: {
        requestedAt: 'desc'
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

    return NextResponse.json({ success: true, data: requests })
  } catch (error) {
    console.error('Error fetching regularization requests:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/attendance/regularization - Create regularization request
export async function POST(request: NextRequest) {
  try {
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    const employeeId = userContext.user.employee?.id
    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 })
    }

    const body = await request.json()
    const { date, reason } = body

    if (!date || !reason) {
      return NextResponse.json({ success: false, error: 'Date and reason are required' }, { status: 400 })
    }

    const requestDate = new Date(date)
    requestDate.setHours(0, 0, 0, 0)

    // Check if request already exists for this date
    const existingRequest = await prisma.attendanceRegularizationRequest.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: requestDate
        }
      }
    })

    if (existingRequest) {
      return NextResponse.json({ success: false, error: 'Request already exists for this date' }, { status: 400 })
    }

    // Check if attendance record exists for this date
    const attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: requestDate
        }
      }
    })

    if (!attendance) {
      return NextResponse.json({ success: false, error: 'No attendance record found for this date' }, { status: 400 })
    }

    // Create regularization request
    const regularizationRequest = await prisma.attendanceRegularizationRequest.create({
      data: {
        employeeId,
        date: requestDate,
        reason
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
        }
      }
    })

    return NextResponse.json({ success: true, data: regularizationRequest })
  } catch (error) {
    console.error('Error creating regularization request:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
