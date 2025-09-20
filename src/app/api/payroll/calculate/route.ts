import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'
import { z } from 'zod'

const calculatePayrollSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  month: z.number().min(1).max(12, 'Month must be between 1 and 12'),
  year: z.number().min(2020).max(2030, 'Year must be between 2020 and 2030'),
  includeVariablePay: z.boolean().default(true),
  includeAttendance: z.boolean().default(true),
})

// POST /api/payroll/calculate - Calculate payroll for an employee
export async function POST(request: NextRequest) {
  try {
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    // Only managers and admins can calculate payroll
    if (!userContext.isManagerOrAdmin()) {
      return NextResponse.json({ success: false, error: 'Forbidden - Manager or Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = calculatePayrollSchema.parse(body)

    // Get employee details
    const employee = await prisma.employee.findUnique({
      where: { id: validatedData.employeeId },
      include: { user: true, department: true },
    })

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 })
    }

    // Calculate working days in the month
    const startDate = new Date(validatedData.year, validatedData.month - 1, 1)
    const endDate = new Date(validatedData.year, validatedData.month, 0)
    const workingDays = getWorkingDaysInMonth(startDate, endDate)

    // Get attendance data if requested
    let presentDays = 0
    let leaveDays = 0
    let attendanceData = []

    if (validatedData.includeAttendance) {
      attendanceData = await prisma.attendance.findMany({
        where: {
          employeeId: validatedData.employeeId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: 'asc' },
      })

      presentDays = attendanceData.filter(att => att.status === 'PRESENT').length
      leaveDays = attendanceData.filter(att => att.status === 'ABSENT').length
    }

    // Get approved variable pay entries if requested
    let totalVariablePay = 0
    let variablePayEntries = []

    if (validatedData.includeVariablePay) {
      variablePayEntries = await prisma.variablePayEntry.findMany({
        where: {
          employeeId: validatedData.employeeId,
          month: validatedData.month,
          year: validatedData.year,
          status: 'APPROVED',
        },
        include: { submitter: true, approver: true },
      })

      totalVariablePay = variablePayEntries.reduce((sum, entry) => sum + Number(entry.amount), 0)
    }

    // Calculate basic salary (pro-rated if mid-month exit)
    const basicSalary = Number(employee.salary)
    const proRatedSalary = calculateProRatedSalary(basicSalary, presentDays, workingDays)

    // Calculate HRA (typically 40% of basic salary)
    const hra = Math.round(proRatedSalary * 0.4)

    // Calculate statutory deductions
    const pf = Math.round(proRatedSalary * 0.12) // 12% of basic salary
    const esi = Math.round(proRatedSalary * 0.0075) // 0.75% of basic salary (if applicable)
    
    // Calculate tax (simplified - in real implementation, use proper tax slabs)
    const grossSalary = proRatedSalary + hra + totalVariablePay
    const tax = calculateTax(grossSalary)

    // Calculate leave deduction
    const leaveDeduction = leaveDays > 0 ? Math.round((basicSalary / workingDays) * leaveDays) : 0

    // Calculate totals
    const totalEarnings = proRatedSalary + hra + totalVariablePay
    const totalDeductions = pf + esi + tax + leaveDeduction
    const netSalary = totalEarnings - totalDeductions

    const calculationResult = {
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee.employeeId,
        department: employee.department.name,
        position: employee.position,
      },
      period: {
        month: validatedData.month,
        year: validatedData.year,
        workingDays,
        presentDays,
        leaveDays,
      },
      earnings: {
        basicSalary: proRatedSalary,
        hra,
        variablePay: totalVariablePay,
        overtime: 0, // Can be calculated from attendance if needed
        bonus: 0, // Can be added as separate variable pay entry
        allowances: 0, // Can be configured per employee
        totalEarnings,
      },
      deductions: {
        pf,
        esi,
        tax,
        insurance: 0, // Can be configured per employee
        leaveDeduction,
        otherDeductions: 0, // Can be added as needed
        totalDeductions,
      },
      netSalary,
      variablePayEntries,
      attendanceData: validatedData.includeAttendance ? attendanceData : undefined,
    }

    // Create audit log
    await prisma.payrollAuditLog.create({
      data: {
        employeeId: validatedData.employeeId,
        action: 'PAYROLL_CALCULATED',
        details: {
          month: validatedData.month,
          year: validatedData.year,
          calculationResult,
        },
        performedBy: userContext.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: { calculationResult },
      message: 'Payroll calculated successfully',
    })
  } catch (error) {
    console.error('Error calculating payroll:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to calculate payroll' },
      { status: 500 }
    )
  }
}

// Helper function to calculate working days in a month (excluding weekends)
function getWorkingDaysInMonth(startDate: Date, endDate: Date): number {
  let workingDays = 0
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay()
    // Count Monday to Friday as working days (1-5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      workingDays++
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return workingDays
}

// Helper function to calculate pro-rated salary
function calculateProRatedSalary(basicSalary: number, presentDays: number, workingDays: number): number {
  if (workingDays === 0) return 0
  return Math.round((basicSalary / workingDays) * presentDays)
}

// Helper function to calculate tax (simplified)
function calculateTax(grossSalary: number): number {
  // Simplified tax calculation - in real implementation, use proper tax slabs
  if (grossSalary <= 250000) return 0 // No tax below 2.5L
  if (grossSalary <= 500000) return Math.round((grossSalary - 250000) * 0.05) // 5% on next 2.5L
  if (grossSalary <= 1000000) return Math.round(12500 + (grossSalary - 500000) * 0.2) // 20% on next 5L
  return Math.round(112500 + (grossSalary - 1000000) * 0.3) // 30% above 10L
}
