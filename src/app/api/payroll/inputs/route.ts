import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'
import { z } from 'zod'

const createPayrollInputSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  month: z.number().min(1).max(12, 'Month must be between 1 and 12'),
  year: z.number().min(2020).max(2030, 'Year must be between 2020 and 2030'),
  basicSalary: z.number().min(0, 'Basic salary must be positive'),
  hra: z.number().min(0, 'HRA must be positive').default(0),
  variablePay: z.number().min(0, 'Variable pay must be positive').default(0),
  overtime: z.number().min(0, 'Overtime must be positive').default(0),
  bonus: z.number().min(0, 'Bonus must be positive').default(0),
  allowances: z.number().min(0, 'Allowances must be positive').default(0),
  pf: z.number().min(0, 'PF must be positive').default(0),
  esi: z.number().min(0, 'ESI must be positive').default(0),
  tax: z.number().min(0, 'Tax must be positive').default(0),
  insurance: z.number().min(0, 'Insurance must be positive').default(0),
  leaveDeduction: z.number().min(0, 'Leave deduction must be positive').default(0),
  otherDeductions: z.number().min(0, 'Other deductions must be positive').default(0),
  workingDays: z.number().min(0, 'Working days must be positive').default(0),
  presentDays: z.number().min(0, 'Present days must be positive').default(0),
  leaveDays: z.number().min(0, 'Leave days must be positive').default(0),
  notes: z.string().optional(),
})

const updatePayrollInputSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSED', 'REJECTED']).optional(),
  notes: z.string().optional(),
})

// GET /api/payroll/inputs - Get payroll inputs
export async function GET(request: NextRequest) {
  try {
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    if (!userContext.isManagerOrAdmin()) {
      return NextResponse.json({ success: false, error: 'Forbidden - Manager or Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const employeeId = searchParams.get('employeeId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}

    // If not admin/manager, only show own payroll inputs
    if (!userContext.isManagerOrAdmin()) {
      if (!userContext.user.employee?.id) {
        return NextResponse.json({ success: false, error: 'Employee record not found' }, { status: 404 })
      }
      where.employeeId = userContext.user.employee.id
    } else if (employeeId) {
      where.employeeId = employeeId
    }

    if (month) {
      where.month = parseInt(month)
    }
    if (year) {
      where.year = parseInt(year)
    }
    if (status) {
      where.status = status
    }

    const [payrollInputs, total] = await Promise.all([
      prisma.payrollInput.findMany({
        where,
        include: {
          employee: {
            include: {
              user: true,
              department: true,
            },
          },
          payroll: true,
          approver: true,
          processor: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payrollInput.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        payrollInputs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching payroll inputs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payroll inputs' },
      { status: 500 }
    )
  }
}

// POST /api/payroll/inputs - Create payroll input
export async function POST(request: NextRequest) {
  try {
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    if (!userContext.isManagerOrAdmin()) {
      return NextResponse.json({ success: false, error: 'Forbidden - Manager or Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createPayrollInputSchema.parse(body)

    // Check if payroll input already exists for this employee and month/year
    const existingInput = await prisma.payrollInput.findUnique({
      where: {
        employeeId_month_year: {
          employeeId: validatedData.employeeId,
          month: validatedData.month,
          year: validatedData.year,
        },
      },
    })

    if (existingInput) {
      return NextResponse.json(
        { success: false, error: 'Payroll input already exists for this employee and period' },
        { status: 400 }
      )
    }

    // Calculate totals
    const totalEarnings = validatedData.basicSalary + validatedData.hra + validatedData.variablePay + 
                         validatedData.overtime + validatedData.bonus + validatedData.allowances
    const totalDeductions = validatedData.pf + validatedData.esi + validatedData.tax + 
                           validatedData.insurance + validatedData.leaveDeduction + validatedData.otherDeductions

    // Create or find payroll record
    const payroll = await prisma.payroll.upsert({
      where: {
        employeeId_month_year: {
          employeeId: validatedData.employeeId,
          month: validatedData.month,
          year: validatedData.year,
        },
      },
      update: {},
      create: {
        employeeId: validatedData.employeeId,
        month: validatedData.month,
        year: validatedData.year,
        basicSalary: validatedData.basicSalary,
        allowances: validatedData.allowances,
        deductions: totalDeductions,
        netSalary: totalEarnings - totalDeductions,
        status: 'PENDING',
      },
    })

    // Create payroll input
    const payrollInput = await prisma.payrollInput.create({
      data: {
        payrollId: payroll.id,
        employeeId: validatedData.employeeId,
        month: validatedData.month,
        year: validatedData.year,
        basicSalary: validatedData.basicSalary,
        hra: validatedData.hra,
        variablePay: validatedData.variablePay,
        overtime: validatedData.overtime,
        bonus: validatedData.bonus,
        allowances: validatedData.allowances,
        totalEarnings,
        pf: validatedData.pf,
        esi: validatedData.esi,
        tax: validatedData.tax,
        insurance: validatedData.insurance,
        leaveDeduction: validatedData.leaveDeduction,
        otherDeductions: validatedData.otherDeductions,
        totalDeductions,
        workingDays: validatedData.workingDays,
        presentDays: validatedData.presentDays,
        leaveDays: validatedData.leaveDays,
        notes: validatedData.notes,
        status: 'DRAFT',
      },
      include: {
        employee: {
          include: {
            user: true,
            department: true,
          },
        },
        payroll: true,
      },
    })

    // Create audit log
    await prisma.payrollAuditLog.create({
      data: {
        payrollId: payroll.id,
        employeeId: validatedData.employeeId,
        action: 'PAYROLL_INPUT_CREATED',
        details: {
          month: validatedData.month,
          year: validatedData.year,
          totalEarnings,
          totalDeductions,
          netSalary: totalEarnings - totalDeductions,
        },
        performedBy: userContext.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: { payrollInput },
      message: 'Payroll input created successfully',
    })
  } catch (error) {
    console.error('Error creating payroll input:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create payroll input' },
      { status: 500 }
    )
  }
}
