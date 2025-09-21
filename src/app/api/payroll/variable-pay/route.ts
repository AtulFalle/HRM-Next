import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'
import { z } from 'zod'

const createVariablePayEntrySchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  month: z.number().min(1).max(12, 'Month must be between 1 and 12'),
  year: z.number().min(2020).max(2030, 'Year must be between 2020 and 2030'),
  amount: z.number().min(0, 'Amount must be positive'),
  type: z.enum(['PERFORMANCE_BONUS', 'COMMISSION', 'OVERTIME', 'INCENTIVE', 'ARREARS', 'RETROACTIVE', 'OTHER']),
  description: z.string().min(1, 'Description is required'),
})

// GET /api/payroll/variable-pay - Get variable pay entries
export async function GET(request: NextRequest) {
  try {
    const userContext = await getUserContext()
    if (!userContext.isManagerOrAdmin?.()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const employeeId = searchParams.get('employeeId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}

    // If not admin/manager, only show own variable pay entries
    if (!userContext.isManagerOrAdmin?.()) {
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
    if (type) {
      where.type = type
    }

    const [variablePayEntries, total] = await Promise.all([
      prisma.variablePayEntry.findMany({
        where,
        include: {
          employee: {
            include: {
              user: true,
              department: true,
            },
          },
          submitter: true,
          approver: true,
          rejector: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.variablePayEntry.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        variablePayEntries,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching variable pay entries:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch variable pay entries' },
      { status: 500 }
    )
  }
}

// POST /api/payroll/variable-pay - Create variable pay entry
export async function POST(request: NextRequest) {
  try {
    const userContext = await getUserContext()
    if (!userContext.isManagerOrAdmin?.()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createVariablePayEntrySchema.parse(body)

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: validatedData.employeeId },
      include: { user: true },
    })

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 })
    }

    // Check permissions - employees can only submit for themselves, managers/admins can submit for anyone
    if (!userContext.isManagerOrAdmin() && validatedData.employeeId !== userContext.user.employee?.id) {
      return NextResponse.json({ success: false, error: 'Forbidden - You can only submit variable pay for yourself' }, { status: 403 })
    }

    // Check if variable pay entry already exists for this employee and month/year/type
    const existingEntry = await prisma.variablePayEntry.findFirst({
      where: {
        employeeId: validatedData.employeeId,
        month: validatedData.month,
        year: validatedData.year,
        type: validatedData.type,
        status: { not: 'REJECTED' },
      },
    })

    if (existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Variable pay entry already exists for this employee, period, and type' },
        { status: 400 }
      )
    }

    // Create variable pay entry
    const variablePayEntry = await prisma.variablePayEntry.create({
      data: {
        employeeId: validatedData.employeeId,
        month: validatedData.month,
        year: validatedData.year,
        amount: validatedData.amount,
        type: validatedData.type,
        description: validatedData.description,
        status: 'PENDING',
        submittedBy: userContext.user.id,
      },
      include: {
        employee: {
          include: {
            user: true,
            department: true,
          },
        },
        submitter: true,
      },
    })

    // Create audit log
    await prisma.payrollAuditLog.create({
      data: {
        employeeId: validatedData.employeeId,
        action: 'VARIABLE_PAY_ENTRY_CREATED',
        details: {
          month: validatedData.month,
          year: validatedData.year,
          amount: validatedData.amount,
          type: validatedData.type,
          description: validatedData.description,
        },
        performedBy: userContext.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: { variablePayEntry },
      message: 'Variable pay entry created successfully',
    })
  } catch (error) {
    console.error('Error creating variable pay entry:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create variable pay entry' },
      { status: 500 }
    )
  }
}
