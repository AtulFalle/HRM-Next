import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserContext } from '@/lib/auth-utils'

// GET /api/employee-requests/stats - Get request statistics for the logged-in employee
export async function GET() {
  try {
    const userContext = await getUserContext()
    
    if (!userContext?.user?.employee?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = userContext.user.employee.id

    // Get counts by status
    const [openCount, inProgressCount, resolvedCount, closedCount] = await Promise.all([
      prisma.employeeRequest.count({
        where: { employeeId, status: 'OPEN' },
      }),
      prisma.employeeRequest.count({
        where: { employeeId, status: 'IN_PROGRESS' },
      }),
      prisma.employeeRequest.count({
        where: { employeeId, status: 'RESOLVED' },
      }),
      prisma.employeeRequest.count({
        where: { employeeId, status: 'CLOSED' },
      }),
    ])

    const totalCount = openCount + inProgressCount + resolvedCount + closedCount

    return NextResponse.json({
      stats: {
        total: totalCount,
        open: openCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        closed: closedCount,
      },
    })
  } catch (error) {
    console.error('Error fetching employee request stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch request statistics' },
      { status: 500 }
    )
  }
}
