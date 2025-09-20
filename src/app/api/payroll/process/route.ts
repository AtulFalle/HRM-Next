import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'
import { PayrollCalculator } from '@/lib/payroll-calculator'
import { z } from 'zod'

const processPayrollSchema = z.object({
  month: z.number().min(1).max(12, 'Month must be between 1 and 12'),
  year: z.number().min(2020).max(2030, 'Year must be between 2020 and 2030'),
  employeeIds: z.array(z.string()).optional(), // If not provided, process all active employees
  includeVariablePay: z.boolean().default(true),
  includeAttendance: z.boolean().default(true),
  includeStatutoryDeductions: z.boolean().default(true),
  proRateForMidMonthExit: z.boolean().default(true),
})

// POST /api/payroll/process - Process payroll for multiple employees
export async function POST(request: NextRequest) {
  try {
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    // Only admins can process payroll
    if (userContext.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = processPayrollSchema.parse(body)

    // Get employees to process
    let employees
    if (validatedData.employeeIds && validatedData.employeeIds.length > 0) {
      employees = await prisma.employee.findMany({
        where: {
          id: { in: validatedData.employeeIds },
          isActive: true,
        },
        include: {
          user: true,
          department: true,
        },
      })
    } else {
      employees = await prisma.employee.findMany({
        where: { isActive: true },
        include: {
          user: true,
          department: true,
        },
      })
    }

    if (employees.length === 0) {
      return NextResponse.json({ success: false, error: 'No active employees found' }, { status: 404 })
    }

    const results = []
    const errors = []

    // Process each employee
    for (const employee of employees) {
      try {
        // Get attendance data if requested
        let attendance = []
        if (validatedData.includeAttendance) {
          const startDate = new Date(validatedData.year, validatedData.month - 1, 1)
          const endDate = new Date(validatedData.year, validatedData.month, 0)
          
          attendance = await prisma.attendance.findMany({
            where: {
              employeeId: employee.id,
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
            orderBy: { date: 'asc' },
          })
        }

        // Get variable pay entries if requested
        let variablePayEntries = []
        if (validatedData.includeVariablePay) {
          variablePayEntries = await prisma.variablePayEntry.findMany({
            where: {
              employeeId: employee.id,
              month: validatedData.month,
              year: validatedData.year,
              status: 'APPROVED',
            },
          })
        }

        // Calculate payroll
        const calculationResult = await PayrollCalculator.calculatePayroll(
          {
            employeeId: employee.id,
            month: validatedData.month,
            year: validatedData.year,
            basicSalary: Number(employee.salary),
            attendance,
            variablePayEntries,
            hireDate: employee.hireDate,
          },
          {
            includeVariablePay: validatedData.includeVariablePay,
            includeAttendance: validatedData.includeAttendance,
            includeStatutoryDeductions: validatedData.includeStatutoryDeductions,
            proRateForMidMonthExit: validatedData.proRateForMidMonthExit,
          }
        )

        // Validate calculation
        const validation = PayrollCalculator.validatePayrollCalculation(calculationResult)
        if (!validation.isValid) {
          errors.push({
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            errors: validation.errors,
            warnings: validation.warnings,
          })
          continue
        }

        // Create or update payroll record
        const payroll = await prisma.payroll.upsert({
          where: {
            employeeId_month_year: {
              employeeId: employee.id,
              month: validatedData.month,
              year: validatedData.year,
            },
          },
          update: {
            basicSalary: calculationResult.basicSalary,
            allowances: calculationResult.allowances,
            deductions: calculationResult.totalDeductions,
            netSalary: calculationResult.netSalary,
            status: 'PROCESSED',
          },
          create: {
            employeeId: employee.id,
            month: validatedData.month,
            year: validatedData.year,
            basicSalary: calculationResult.basicSalary,
            allowances: calculationResult.allowances,
            deductions: calculationResult.totalDeductions,
            netSalary: calculationResult.netSalary,
            status: 'PROCESSED',
          },
        })

        // Create or update payroll input
        await prisma.payrollInput.upsert({
          where: {
            employeeId_month_year: {
              employeeId: employee.id,
              month: validatedData.month,
              year: validatedData.year,
            },
          },
          update: {
            basicSalary: calculationResult.basicSalary,
            hra: calculationResult.hra,
            variablePay: calculationResult.variablePay,
            overtime: calculationResult.overtime,
            bonus: calculationResult.bonus,
            allowances: calculationResult.allowances,
            totalEarnings: calculationResult.totalEarnings,
            pf: calculationResult.pf,
            esi: calculationResult.esi,
            tax: calculationResult.tax,
            insurance: calculationResult.insurance,
            leaveDeduction: calculationResult.leaveDeduction,
            otherDeductions: calculationResult.otherDeductions,
            totalDeductions: calculationResult.totalDeductions,
            workingDays: calculationResult.workingDays,
            presentDays: calculationResult.presentDays,
            leaveDays: calculationResult.leaveDays,
            status: 'PROCESSED',
            processedBy: userContext.user.id,
            processedAt: new Date(),
          },
          create: {
            payrollId: payroll.id,
            employeeId: employee.id,
            month: validatedData.month,
            year: validatedData.year,
            basicSalary: calculationResult.basicSalary,
            hra: calculationResult.hra,
            variablePay: calculationResult.variablePay,
            overtime: calculationResult.overtime,
            bonus: calculationResult.bonus,
            allowances: calculationResult.allowances,
            totalEarnings: calculationResult.totalEarnings,
            pf: calculationResult.pf,
            esi: calculationResult.esi,
            tax: calculationResult.tax,
            insurance: calculationResult.insurance,
            leaveDeduction: calculationResult.leaveDeduction,
            otherDeductions: calculationResult.otherDeductions,
            totalDeductions: calculationResult.totalDeductions,
            workingDays: calculationResult.workingDays,
            presentDays: calculationResult.presentDays,
            leaveDays: calculationResult.leaveDays,
            status: 'PROCESSED',
            processedBy: userContext.user.id,
            processedAt: new Date(),
          },
        })

        results.push({
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          payrollId: payroll.id,
          calculationResult,
          warnings: validation.warnings,
        })

        // Create audit log
        await prisma.payrollAuditLog.create({
          data: {
            payrollId: payroll.id,
            employeeId: employee.id,
            action: 'PAYROLL_PROCESSED',
            details: {
              month: validatedData.month,
              year: validatedData.year,
              calculationResult,
              warnings: validation.warnings,
            },
            performedBy: userContext.user.id,
          },
        })

      } catch (error) {
        console.error(`Error processing payroll for employee ${employee.id}:`, error)
        errors.push({
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Generate summary
    const summary = PayrollCalculator.generatePayrollSummary(
      results.map(r => r.calculationResult),
      validatedData.month,
      validatedData.year
    )

    return NextResponse.json({
      success: true,
      data: {
        processed: results.length,
        total: employees.length,
        errors: errors.length,
        results,
        errors,
        summary,
      },
      message: `Payroll processed for ${results.length} employees. ${errors.length} errors encountered.`,
    })
  } catch (error) {
    console.error('Error processing payroll:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to process payroll' },
      { status: 500 }
    )
  }
}
