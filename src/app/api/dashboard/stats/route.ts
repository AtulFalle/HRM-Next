import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Temporarily disabled auth for development
    // const session = await getServerSession(authOptions)
    
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    // Get basic counts
    const [
      totalEmployees,
      activeEmployees,
      totalDepartments,
      pendingLeaveRequests,
      todayAttendance,
      monthlyPayroll,
      onboardingStats
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { isActive: true } }),
      prisma.department.count({ where: { isActive: true } }),
      prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      prisma.attendance.count({ 
        where: { 
          date: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
          },
          status: 'PRESENT'
        } 
      }),
      prisma.payroll.aggregate({
        where: {
          month: today.getMonth() + 1,
          year: today.getFullYear(),
          status: 'PAID'
        },
        _sum: {
          netSalary: true
        }
      }),
      prisma.onboardingSubmission.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      })
    ])

    // Get upcoming birthdays (next 7 days)
    const upcomingBirthdays = await prisma.employee.findMany({
      where: {
        isActive: true,
        dateOfBirth: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lte: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)
        }
      },
      include: {
        department: {
          select: {
            name: true
          }
        }
      },
      take: 5,
      orderBy: { dateOfBirth: 'asc' }
    })

    // Get recent leave requests
    const recentLeaveRequests = await prisma.leaveRequest.findMany({
      where: {
        status: 'PENDING'
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
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    // Get attendance statistics for the current month
    const monthlyAttendance = await prisma.attendance.groupBy({
      by: ['status'],
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _count: {
        status: true
      }
    })

    // Get department-wise employee count
    const departmentStats = await prisma.department.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { employees: true }
        }
      },
      orderBy: {
        employees: {
          _count: 'desc'
        }
      }
    })

    // Calculate attendance rate
    const totalAttendanceRecords = monthlyAttendance.reduce((sum, record) => sum + record._count.status, 0)
    const presentRecords = monthlyAttendance.find(record => record.status === 'PRESENT')?._count.status || 0
    const attendanceRate = totalAttendanceRecords > 0 ? Math.round((presentRecords / totalAttendanceRecords) * 100) : 0

    // Process onboarding stats
    const onboardingCounts = {
      created: onboardingStats.find(s => s.status === 'CREATED')?._count.status || 0,
      inProgress: onboardingStats.find(s => s.status === 'IN_PROGRESS')?._count.status || 0,
      completed: onboardingStats.find(s => s.status === 'COMPLETED')?._count.status || 0,
      cancelled: onboardingStats.find(s => s.status === 'CANCELLED')?._count.status || 0,
    }

    const stats = {
      totalEmployees,
      activeEmployees,
      totalDepartments,
      pendingLeaveRequests,
      todayAttendance,
      monthlyPayrollTotal: monthlyPayroll._sum.netSalary || 0,
      attendanceRate,
      onboardingStats: onboardingCounts,
      upcomingBirthdays: upcomingBirthdays.map(emp => ({
        name: `${emp.firstName} ${emp.lastName}`,
        date: emp.dateOfBirth,
        department: emp.department.name
      })),
      recentLeaveRequests: recentLeaveRequests.map(req => ({
        id: req.id,
        employeeName: `${req.employee.firstName} ${req.employee.lastName}`,
        leaveType: req.leaveType,
        startDate: req.startDate,
        endDate: req.endDate,
        reason: req.reason,
        createdAt: req.createdAt
      })),
      monthlyAttendance: monthlyAttendance.map(record => ({
        status: record.status,
        count: record._count.status
      })),
      departmentStats: departmentStats.map(dept => ({
        name: dept.name,
        employeeCount: dept._count.employees
      })),
      recentActivities: [
        ...recentLeaveRequests.slice(0, 3).map(req => ({
          id: req.id,
          type: 'leave',
          message: `${req.employee.firstName} ${req.employee.lastName} applied for ${req.leaveType} leave`,
          timestamp: req.createdAt.toISOString()
        })),
        ...upcomingBirthdays.slice(0, 2).map(emp => ({
          id: `birthday-${emp.employeeId}`,
          type: 'employee',
          message: `${emp.firstName} ${emp.lastName} has a birthday coming up`,
          timestamp: new Date().toISOString()
        }))
      ]
    }

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
