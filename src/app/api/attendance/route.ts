import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'

// GET /api/attendance - Get attendance records for current user
export async function GET(request: NextRequest) {
  try {
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const employeeId = searchParams.get('employeeId')

    // Determine target employee(s) for attendance data
    let targetEmployeeId = userContext.user.employee?.id
    let isAdminView = false

    if (employeeId) {
      // Specific employee requested
      if (employeeId !== userContext.user.employee?.id) {
        // Only managers and admins can view other employees' attendance
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

    // Build date filter
    const dateFilter: any = {}
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0)
      dateFilter.date = {
        gte: startDate,
        lte: endDate
      }
    }

    const whereClause: any = {
      ...dateFilter
    }

    // Add employee filter if not admin view
    if (!isAdminView && targetEmployeeId) {
      whereClause.employeeId = targetEmployeeId
    }

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc'
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            user: {
              select: {
                email: true
              }
            }
          }
        },
        regularizer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: attendance })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/attendance - Create or update attendance record
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
    const { action, location, notes } = body

    if (!action || !['checkin', 'checkout'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if attendance record exists for today
    let attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today
        }
      }
    })

    if (!attendance) {
      // Create new attendance record
      attendance = await prisma.attendance.create({
        data: {
          employeeId,
          date: today,
          checkIn: action === 'checkin' ? new Date() : null,
          checkOut: action === 'checkout' ? new Date() : null,
          checkInLocation: action === 'checkin' ? location : null,
          checkOutLocation: action === 'checkout' ? location : null,
          notes: notes || null
        }
      })
    } else {
      // Update existing record
      const updateData: any = {}
      
      if (action === 'checkin' && !attendance.checkIn) {
        updateData.checkIn = new Date()
        updateData.checkInLocation = location
      } else if (action === 'checkout' && !attendance.checkOut) {
        updateData.checkOut = new Date()
        updateData.checkOutLocation = location
      } else {
        return NextResponse.json({ 
          success: false, 
          error: action === 'checkin' ? 'Already checked in today' : 'Already checked out today' 
        }, { status: 400 })
      }

      if (notes) {
        updateData.notes = notes
      }

      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: updateData
      })
    }

    return NextResponse.json({ success: true, data: attendance })
  } catch (error) {
    console.error('Error updating attendance:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}