import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'
import { z } from 'zod'

const createPayrollSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  month: z.number().min(1).max(12, 'Month must be between 1 and 12'),
  year: z.number().min(2020).max(2030, 'Year must be between 2020 and 2030'),
  basicSalary: z.number().min(0, 'Basic salary must be positive'),
  allowances: z.number().min(0, 'Allowances must be positive').default(0),
  deductions: z.number().min(0, 'Deductions must be positive').default(0),
})

export async function GET(request: NextRequest) {
  try {
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
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

    // If employee, only show own payroll
    if (userContext.isEmployee()) {
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

    const [payroll, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
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
          }
        },
        skip,
        take: limit,
        orderBy: [
          { year: 'desc' },
          { month: 'desc' }
        ]
      }),
      prisma.payroll.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        payroll,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching payroll:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    // Only admin can create payroll records
    if (!userContext.isAdmin()) {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createPayrollSchema.parse(body)

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: validatedData.employeeId }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check if payroll already exists for this employee, month, and year
    const existingPayroll = await prisma.payroll.findUnique({
      where: {
        employeeId_month_year: {
          employeeId: validatedData.employeeId,
          month: validatedData.month,
          year: validatedData.year
        }
      }
    })

    if (existingPayroll) {
      return NextResponse.json(
        { error: 'Payroll already exists for this employee, month, and year' },
        { status: 400 }
      )
    }

    // Calculate net salary
    const netSalary = validatedData.basicSalary + validatedData.allowances - validatedData.deductions

    const payroll = await prisma.payroll.create({
      data: {
        employeeId: validatedData.employeeId,
        month: validatedData.month,
        year: validatedData.year,
        basicSalary: validatedData.basicSalary,
        allowances: validatedData.allowances,
        deductions: validatedData.deductions,
        netSalary: netSalary,
      },
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
        }
      }
    })

    return NextResponse.json(
      { 
        success: true,
        message: 'Payroll record created successfully',
        data: payroll
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating payroll:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
