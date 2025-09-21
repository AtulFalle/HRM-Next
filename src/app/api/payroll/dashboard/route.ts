import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'

// GET /api/payroll/dashboard - Get payroll dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    if (!userContext.isManagerOrAdmin?.()) {
      return NextResponse.json({ success: false, error: 'Forbidden - Manager or Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const currentDate = new Date()
    const currentMonth = month ? parseInt(month) : currentDate.getMonth() + 1
    const currentYear = year ? parseInt(year) : currentDate.getFullYear()

    // Get total payroll cycles
    const totalPayrollCycles = await prisma.payroll.count()

    // Get pending approvals (variable pay entries)
    const pendingVariablePayEntries = await prisma.variablePayEntry.count({
      where: { status: 'PENDING' },
    })

    // Get pending correction requests
    const pendingCorrectionRequests = await prisma.payrollCorrectionRequest.count({
      where: { status: 'PENDING' },
    })

    // Get processed payroll for current month
    const processedThisMonth = await prisma.payroll.count({
      where: {
        month: currentMonth,
        year: currentYear,
        status: 'PROCESSED',
      },
    })

    // Get total payroll amount for current month
    const currentMonthPayroll = await prisma.payroll.aggregate({
      where: {
        month: currentMonth,
        year: currentYear,
        status: 'PROCESSED',
      },
      _sum: {
        netSalary: true,
      },
    })

    const totalPayrollAmount = Number(currentMonthPayroll._sum.netSalary || 0)

    // Get recent payroll cycles
    const recentPayrollCycles = await prisma.payroll.findMany({
      where: {
        month: currentMonth,
        year: currentYear,
      },
      include: {
        employee: {
          include: {
            user: true,
            department: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    })

    // Get pending variable pay entries with details
    const pendingVariablePay = await prisma.variablePayEntry.findMany({
      where: { status: 'PENDING' },
      include: {
        employee: {
          include: {
            user: true,
            department: true,
          },
        },
        submitter: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    // Get payroll statistics by status
    const payrollStats = await prisma.payroll.groupBy({
      by: ['status'],
      where: {
        month: currentMonth,
        year: currentYear,
      },
      _count: {
        id: true,
      },
      _sum: {
        netSalary: true,
      },
    })

    // Get department-wise payroll summary
    const departmentPayroll = await prisma.payroll.groupBy({
      by: ['employeeId'],
      where: {
        month: currentMonth,
        year: currentYear,
        status: 'PROCESSED',
      },
      _sum: {
        netSalary: true,
      },
    })

    // Get employee details for department summary
    const departmentSummary = await Promise.all(
      departmentPayroll.map(async (dept) => {
        const employee = await prisma.employee.findUnique({
          where: { id: dept.employeeId },
          include: { department: true },
        })
        return {
          department: employee?.department.name || 'Unknown',
          totalSalary: Number(dept._sum.netSalary || 0),
        }
      })
    )

    // Group by department
    const departmentStats = departmentSummary.reduce((acc, item) => {
      const existing = acc.find(d => d.department === item.department)
      if (existing) {
        existing.totalSalary += item.totalSalary
        existing.employeeCount += 1
      } else {
        acc.push({
          department: item.department,
          totalSalary: item.totalSalary,
          employeeCount: 1,
        })
      }
      return acc
    }, [] as Array<{ department: string; totalSalary: number; employeeCount: number }>)

    // Get monthly payroll trend (last 6 months)
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const trendMonth = currentMonth - i
      const trendYear = trendMonth <= 0 ? currentYear - 1 : currentYear
      const adjustedMonth = trendMonth <= 0 ? trendMonth + 12 : trendMonth

      const monthData = await prisma.payroll.aggregate({
        where: {
          month: adjustedMonth,
          year: trendYear,
          status: 'PROCESSED',
        },
        _count: { id: true },
        _sum: { netSalary: true },
      })

      monthlyTrend.push({
        month: adjustedMonth,
        year: trendYear,
        employeeCount: monthData._count.id,
        totalSalary: Number(monthData._sum.netSalary || 0),
      })
    }

    const dashboardStats = {
      totalPayrollCycles,
      pendingApprovals: pendingVariablePayEntries,
      processedThisMonth,
      totalPayrollAmount,
      pendingVariablePayEntries,
      pendingCorrectionRequests,
      recentPayrollCycles,
      pendingVariablePay,
      payrollStats,
      departmentStats,
      monthlyTrend,
      currentPeriod: {
        month: currentMonth,
        year: currentYear,
      },
    }

    return NextResponse.json({
      success: true,
      data: { dashboardStats },
    })
  } catch (error) {
    console.error('Error fetching payroll dashboard stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payroll dashboard statistics' },
      { status: 500 }
    )
  }
}
