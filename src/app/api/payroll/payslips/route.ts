import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'
import { z } from 'zod'

const generatePayslipSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  month: z.number().min(1).max(12, 'Month must be between 1 and 12'),
  year: z.number().min(2020).max(2030, 'Year must be between 2020 and 2030'),
})

// GET /api/payroll/payslips - Get payslips
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

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}

    // If not admin/manager, only show own payslips
    if (!userContext.isManagerOrAdmin?.() || typeof userContext.isManagerOrAdmin !== 'function') {
      if (!userContext.user?.employee?.id) {
        return NextResponse.json({ success: false, error: 'Employee record not found' }, { status: 404 })
      }
      where.employeeId = userContext.user.employee.id
    } else if (employeeId) {
      where.employeeId = employeeId
    }

    if (month) {
      const parsedMonth = parseInt(month)
      if (!isNaN(parsedMonth)) {
        where.month = parsedMonth
      }
    }
    if (year) {
      where.year = parseInt(year)
    }

    const [payslips, total] = await Promise.all([
      prisma.payslip.findMany({
        where,
        include: {
          employee: {
            include: {
              user: true,
              department: true,
            },
          },
          payroll: true,
          generator: true,
        },
        orderBy: { generatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payslip.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        payslips,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching payslips:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payslips' },
      { status: 500 }
    )
  }
}

// POST /api/payroll/payslips - Generate payslip
export async function POST(request: NextRequest) {
  try {
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    // Only managers and admins can generate payslips
    if (!userContext.isManagerOrAdmin?.() ) {
      return NextResponse.json({ success: false, error: 'Forbidden - Manager or Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = generatePayslipSchema.parse(body)

    // Get payroll data
    const payroll = await prisma.payroll.findUnique({
      where: {
        employeeId_month_year: {
          employeeId: validatedData.employeeId,
          month: validatedData.month,
          year: validatedData.year,
        },
      },
      include: {
        employee: {
          include: {
            user: true,
            department: true,
          },
        },
        payrollInputs: true,
      },
    })

    if (!payroll) {
      return NextResponse.json({ success: false, error: 'Payroll not found' }, { status: 404 })
    }

    // Check if payroll is processed
    if (payroll.status !== 'PROCESSED' && payroll.status !== 'PAID') {
      return NextResponse.json({ success: false, error: 'Payroll must be processed before generating payslip' }, { status: 400 })
    }

    // Check if payslip already exists
    const existingPayslip = await prisma.payslip.findUnique({
      where: {
        employeeId_month_year: {
          employeeId: validatedData.employeeId,
          month: validatedData.month,
          year: validatedData.year,
        },
      },
    })

    if (existingPayslip) {
      return NextResponse.json({ success: false, error: 'Payslip already exists for this employee and period' }, { status: 400 })
    }

    // Get payroll input for detailed calculation
    const payrollInput = payroll.payrollInputs[0]
    if (!payrollInput) {
      return NextResponse.json({ success: false, error: 'Payroll input not found' }, { status: 404 })
    }

    // Create calculation result from payroll input
    const calculationResult = {
      basicSalary: Number(payrollInput.basicSalary),
      hra: Number(payrollInput.hra),
      variablePay: Number(payrollInput.variablePay),
      overtime: Number(payrollInput.overtime),
      bonus: Number(payrollInput.bonus),
      allowances: Number(payrollInput.allowances),
      totalEarnings: Number(payrollInput.totalEarnings),
      pf: Number(payrollInput.pf),
      esi: Number(payrollInput.esi),
      tax: Number(payrollInput.tax),
      insurance: Number(payrollInput.insurance),
      leaveDeduction: Number(payrollInput.leaveDeduction),
      otherDeductions: Number(payrollInput.otherDeductions),
      totalDeductions: Number(payrollInput.totalDeductions),
      netSalary: Number(payrollInput.totalEarnings) - Number(payrollInput.totalDeductions),
      workingDays: payrollInput.workingDays,
      presentDays: payrollInput.presentDays,
      leaveDays: payrollInput.leaveDays,
    }

    // Generate payslip filename
    const fileName = `payslip_${payroll.employee.employeeId}_${validatedData.month}_${validatedData.year}.pdf`
    const filePath = `/payslips/${fileName}`

    // Create payslip record
    const payslip = await prisma.payslip.create({
      data: {
        payrollId: payroll.id,
        employeeId: validatedData.employeeId,
        month: validatedData.month,
        year: validatedData.year,
        fileName,
        filePath,
        fileSize: 0, // Will be updated when file is actually generated
        generatedBy: userContext.user.id,
        status: 'GENERATED',
      },
      include: {
        employee: {
          include: {
            user: true,
            department: true,
          },
        },
        payroll: true,
        generator: true,
      },
    })

    // Create audit log
    await prisma.payrollAuditLog.create({
      data: {
        payrollId: payroll.id,
        employeeId: validatedData.employeeId,
        action: 'PAYSLIP_GENERATED',
        details: {
          payslipId: payslip.id,
          fileName,
          month: validatedData.month,
          year: validatedData.year,
          netSalary: calculationResult.netSalary,
        },
        performedBy: userContext.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: { 
        payslip,
        calculationResult,
        message: 'Payslip generated successfully. Use the download endpoint to get the PDF file.'
      },
    })
  } catch (error) {
    console.error('Error generating payslip:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to generate payslip' },
      { status: 500 }
    )
  }
}
