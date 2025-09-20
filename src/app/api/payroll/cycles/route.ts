import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'
import { z } from 'zod'

const createPayrollCycleSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030),
  notes: z.string().optional(),
})

const updatePayrollCycleSchema = z.object({
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'PENDING_APPROVAL', 'FINALIZED', 'LOCKED']).optional(),
  notes: z.string().optional(),
})

// GET /api/payroll/cycles - List payroll cycles
export async function GET(request: NextRequest) {
  try {
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    if (!userContext.isAdmin()) {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Build where clause
    const where: any = {}
    if (month) where.month = parseInt(month)
    if (year) where.year = parseInt(year)
    if (status) where.status = status

    // Get payroll cycles with aggregated data
    const cycles = await prisma.payroll.groupBy({
      by: ['month', 'year'],
      where,
      _count: {
        id: true,
      },
      _sum: {
        netSalary: true,
      },
      _min: {
        createdAt: true,
      },
      _max: {
        updatedAt: true,
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit,
    })

    // Get total count
    const total = await prisma.payroll.groupBy({
      by: ['month', 'year'],
      where,
      _count: {
        id: true,
      },
    })

    // Transform data to match frontend expectations
    const transformedCycles = cycles.map(cycle => {
      // Determine status based on payroll data
      let status = 'DRAFT'
      if (cycle._count.id > 0) {
        status = 'IN_PROGRESS'
        // You can add more sophisticated status logic here
      }

      return {
        id: `${cycle.year}-${cycle.month}`,
        month: cycle.month,
        year: cycle.year,
        status,
        totalEmployees: cycle._count.id,
        errors: 0, // TODO: Calculate actual errors
        warnings: 0, // TODO: Calculate actual warnings
        totalAmount: cycle._sum.netSalary || 0,
        createdAt: cycle._min.createdAt?.toISOString() || new Date().toISOString(),
        finalizedAt: cycle._max.updatedAt?.toISOString(),
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        cycles: transformedCycles,
        pagination: {
          page,
          limit,
          total: total.length,
          totalPages: Math.ceil(total.length / limit),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching payroll cycles:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payroll cycles' },
      { status: 500 }
    )
  }
}

// POST /api/payroll/cycles - Create new payroll cycle
export async function POST(request: NextRequest) {
  try {
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    if (!userContext.isAdmin()) {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createPayrollCycleSchema.parse(body)

    // Check if cycle already exists
    const existingCycle = await prisma.payroll.findFirst({
      where: {
        month: validatedData.month,
        year: validatedData.year,
      },
    })

    if (existingCycle) {
      return NextResponse.json(
        { success: false, error: 'Payroll cycle already exists for this month/year' },
        { status: 400 }
      )
    }

    // Create payroll cycle by creating initial payroll records for all active employees
    const activeEmployees = await prisma.employee.findMany({
      where: { isActive: true },
      include: { user: true },
    })

    const payrollRecords = activeEmployees.map(employee => ({
      employeeId: employee.id,
      month: validatedData.month,
      year: validatedData.year,
      basicSalary: 0, // Will be updated when inputs are added
      allowances: 0,
      deductions: 0,
      netSalary: 0,
      status: 'DRAFT' as const,
    }))

    await prisma.payroll.createMany({
      data: payrollRecords,
    })

    // Create audit log
    await prisma.payrollAuditLog.create({
      data: {
        payrollId: payrollRecords[0]?.employeeId || '', // Use first employee as reference
        action: 'CYCLE_CREATED',
        performedBy: userContext.user.id,
        details: {
          month: validatedData.month,
          year: validatedData.year,
          notes: validatedData.notes,
          employeesCount: activeEmployees.length,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: `${validatedData.year}-${validatedData.month}`,
        month: validatedData.month,
        year: validatedData.year,
        status: 'DRAFT',
        totalEmployees: activeEmployees.length,
        errors: 0,
        warnings: 0,
        totalAmount: 0,
        createdAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error creating payroll cycle:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create payroll cycle' },
      { status: 500 }
    )
  }
}
