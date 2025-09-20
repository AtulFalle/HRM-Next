import { prisma } from '@/lib/db'
import type { 
  PayrollCalculationResult, 
  CreatePayrollInputData,
  VariablePayEntry,
  Attendance
} from '@/types'

export interface PayrollCalculationOptions {
  includeVariablePay?: boolean
  includeAttendance?: boolean
  includeStatutoryDeductions?: boolean
  proRateForMidMonthExit?: boolean
}

export interface EmployeePayrollData {
  employeeId: string
  month: number
  year: number
  basicSalary: number
  attendance?: Attendance[]
  variablePayEntries?: VariablePayEntry[]
  hireDate?: Date
  exitDate?: Date
}

export class PayrollCalculator {
  private static readonly PF_RATE = 0.12 // 12% of basic salary
  private static readonly ESI_RATE = 0.0075 // 0.75% of basic salary
  private static readonly HRA_RATE = 0.4 // 40% of basic salary
  private static readonly MAX_PF_AMOUNT = 1800 // Maximum PF contribution per month

  /**
   * Calculate comprehensive payroll for an employee
   */
  static async calculatePayroll(
    employeeData: EmployeePayrollData,
    options: PayrollCalculationOptions = {}
  ): Promise<PayrollCalculationResult> {
    const {
      includeVariablePay = true,
      includeAttendance = true,
      includeStatutoryDeductions = true,
      proRateForMidMonthExit = true
    } = options

    // Get working days in the month
    const workingDays = this.getWorkingDaysInMonth(employeeData.month, employeeData.year)
    
    // Calculate attendance-based data
    let presentDays = workingDays
    let leaveDays = 0
    let overtimeHours = 0

    if (includeAttendance && employeeData.attendance) {
      const attendanceData = this.calculateAttendanceData(
        employeeData.attendance,
        employeeData.month,
        employeeData.year
      )
      presentDays = attendanceData.presentDays
      leaveDays = attendanceData.leaveDays
      overtimeHours = attendanceData.overtimeHours
    }

    // Calculate pro-rated salary if needed
    const basicSalary = proRateForMidMonthExit 
      ? this.calculateProRatedSalary(employeeData.basicSalary, presentDays, workingDays, employeeData.hireDate, employeeData.exitDate)
      : employeeData.basicSalary

    // Calculate HRA
    const hra = this.calculateHRA(basicSalary)

    // Calculate variable pay
    const variablePay = includeVariablePay && employeeData.variablePayEntries
      ? this.calculateVariablePay(employeeData.variablePayEntries)
      : 0

    // Calculate overtime pay
    const overtime = this.calculateOvertimePay(overtimeHours, basicSalary, workingDays)

    // Calculate allowances (can be configured per employee)
    const allowances = 0 // This can be made configurable

    // Calculate total earnings
    const totalEarnings = basicSalary + hra + variablePay + overtime + allowances

    // Calculate deductions
    let pf = 0
    let esi = 0
    let tax = 0
    let insurance = 0
    let leaveDeduction = 0
    let otherDeductions = 0

    if (includeStatutoryDeductions) {
      pf = this.calculatePF(basicSalary)
      esi = this.calculateESI(basicSalary)
      tax = this.calculateTax(totalEarnings)
      insurance = this.calculateInsurance(basicSalary) // Can be configured per employee
    }

    // Calculate leave deduction
    leaveDeduction = this.calculateLeaveDeduction(leaveDays, basicSalary, workingDays)

    // Calculate total deductions
    const totalDeductions = pf + esi + tax + insurance + leaveDeduction + otherDeductions

    // Calculate net salary
    const netSalary = totalEarnings - totalDeductions

    return {
      basicSalary,
      hra,
      variablePay,
      overtime,
      bonus: 0, // Can be added as variable pay entry
      allowances,
      totalEarnings,
      pf,
      esi,
      tax,
      insurance,
      leaveDeduction,
      otherDeductions,
      totalDeductions,
      netSalary,
      workingDays,
      presentDays,
      leaveDays,
    }
  }

  /**
   * Calculate working days in a month (excluding weekends)
   */
  private static getWorkingDaysInMonth(month: number, year: number): number {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
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

  /**
   * Calculate attendance data from attendance records
   */
  private static calculateAttendanceData(
    attendance: Attendance[],
    month: number,
    year: number
  ): { presentDays: number; leaveDays: number; overtimeHours: number } {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    let presentDays = 0
    let leaveDays = 0
    let overtimeHours = 0

    attendance.forEach(record => {
      if (record.date >= startDate && record.date <= endDate) {
        switch (record.status) {
          case 'PRESENT':
            presentDays++
            // Calculate overtime if check-in/check-out times are available
            if (record.checkIn && record.checkOut) {
              const workHours = (record.checkOut.getTime() - record.checkIn.getTime()) / (1000 * 60 * 60)
              if (workHours > 8) {
                overtimeHours += workHours - 8
              }
            }
            break
          case 'ABSENT':
            leaveDays++
            break
          case 'HALF_DAY':
            presentDays += 0.5
            leaveDays += 0.5
            break
          // Other statuses like LATE, HOLIDAY are handled as needed
        }
      }
    })

    return { presentDays, leaveDays, overtimeHours }
  }

  /**
   * Calculate pro-rated salary based on attendance and employment dates
   */
  private static calculateProRatedSalary(
    basicSalary: number,
    presentDays: number,
    workingDays: number,
    hireDate?: Date,
    exitDate?: Date
  ): number {
    if (workingDays === 0) return 0

    // If employee joined mid-month, pro-rate from hire date
    if (hireDate) {
      const hireMonth = hireDate.getMonth() + 1
      const hireYear = hireDate.getFullYear()
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      
      if (hireMonth === currentMonth && hireYear === currentYear) {
        const daysFromHire = Math.max(0, workingDays - hireDate.getDate() + 1)
        return Math.round((basicSalary / workingDays) * daysFromHire)
      }
    }

    // If employee exited mid-month, pro-rate until exit date
    if (exitDate) {
      const exitMonth = exitDate.getMonth() + 1
      const exitYear = exitDate.getFullYear()
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      
      if (exitMonth === currentMonth && exitYear === currentYear) {
        const daysUntilExit = exitDate.getDate()
        return Math.round((basicSalary / workingDays) * daysUntilExit)
      }
    }

    // Normal pro-rating based on attendance
    return Math.round((basicSalary / workingDays) * presentDays)
  }

  /**
   * Calculate HRA (House Rent Allowance)
   */
  private static calculateHRA(basicSalary: number): number {
    return Math.round(basicSalary * this.HRA_RATE)
  }

  /**
   * Calculate variable pay from approved entries
   */
  private static calculateVariablePay(variablePayEntries: VariablePayEntry[]): number {
    return variablePayEntries
      .filter(entry => entry.status === 'APPROVED')
      .reduce((sum, entry) => sum + Number(entry.amount), 0)
  }

  /**
   * Calculate overtime pay
   */
  private static calculateOvertimePay(
    overtimeHours: number,
    basicSalary: number,
    workingDays: number
  ): number {
    if (overtimeHours <= 0) return 0
    
    const hourlyRate = basicSalary / (workingDays * 8) // Assuming 8 hours per day
    return Math.round(overtimeHours * hourlyRate * 1.5) // 1.5x rate for overtime
  }

  /**
   * Calculate PF (Provident Fund) contribution
   */
  private static calculatePF(basicSalary: number): number {
    const pfAmount = Math.round(basicSalary * this.PF_RATE)
    return Math.min(pfAmount, this.MAX_PF_AMOUNT)
  }

  /**
   * Calculate ESI (Employee State Insurance) contribution
   */
  private static calculateESI(basicSalary: number): number {
    // ESI is only applicable if basic salary is below certain threshold
    if (basicSalary > 21000) return 0 // ESI not applicable above 21k
    return Math.round(basicSalary * this.ESI_RATE)
  }

  /**
   * Calculate income tax (simplified)
   */
  private static calculateTax(grossSalary: number): number {
    // Simplified tax calculation - in real implementation, use proper tax slabs
    const annualSalary = grossSalary * 12
    
    if (annualSalary <= 250000) return 0 // No tax below 2.5L
    if (annualSalary <= 500000) return Math.round((annualSalary - 250000) * 0.05 / 12) // 5% on next 2.5L
    if (annualSalary <= 1000000) return Math.round((12500 + (annualSalary - 500000) * 0.2) / 12) // 20% on next 5L
    return Math.round((112500 + (annualSalary - 1000000) * 0.3) / 12) // 30% above 10L
  }

  /**
   * Calculate insurance deduction (can be configured per employee)
   */
  private static calculateInsurance(basicSalary: number): number {
    // This can be made configurable per employee or company policy
    return 0
  }

  /**
   * Calculate leave deduction
   */
  private static calculateLeaveDeduction(
    leaveDays: number,
    basicSalary: number,
    workingDays: number
  ): number {
    if (leaveDays <= 0) return 0
    return Math.round((basicSalary / workingDays) * leaveDays)
  }

  /**
   * Validate payroll calculation for compliance
   */
  static validatePayrollCalculation(result: PayrollCalculationResult): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate basic salary
    if (result.basicSalary < 0) {
      errors.push('Basic salary cannot be negative')
    }

    // Validate earnings
    if (result.totalEarnings < 0) {
      errors.push('Total earnings cannot be negative')
    }

    // Validate deductions
    if (result.totalDeductions < 0) {
      errors.push('Total deductions cannot be negative')
    }

    // Validate net salary
    if (result.netSalary < 0) {
      errors.push('Net salary cannot be negative')
    }

    // Validate PF contribution
    if (result.pf > this.MAX_PF_AMOUNT) {
      warnings.push(`PF contribution (${result.pf}) exceeds maximum limit (${this.MAX_PF_AMOUNT})`)
    }

    // Validate attendance
    if (result.presentDays > result.workingDays) {
      errors.push('Present days cannot exceed working days')
    }

    if (result.leaveDays > result.workingDays) {
      errors.push('Leave days cannot exceed working days')
    }

    // Validate HRA
    const expectedHRA = Math.round(result.basicSalary * this.HRA_RATE)
    if (Math.abs(result.hra - expectedHRA) > 1) {
      warnings.push(`HRA calculation may be incorrect. Expected: ${expectedHRA}, Actual: ${result.hra}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Generate payroll summary for reporting
   */
  static generatePayrollSummary(
    results: PayrollCalculationResult[],
    month: number,
    year: number
  ): {
    totalEmployees: number
    totalBasicSalary: number
    totalEarnings: number
    totalDeductions: number
    totalNetSalary: number
    totalPF: number
    totalESI: number
    totalTax: number
    averageSalary: number
  } {
    const totalEmployees = results.length
    const totalBasicSalary = results.reduce((sum, r) => sum + r.basicSalary, 0)
    const totalEarnings = results.reduce((sum, r) => sum + r.totalEarnings, 0)
    const totalDeductions = results.reduce((sum, r) => sum + r.totalDeductions, 0)
    const totalNetSalary = results.reduce((sum, r) => sum + r.netSalary, 0)
    const totalPF = results.reduce((sum, r) => sum + r.pf, 0)
    const totalESI = results.reduce((sum, r) => sum + r.esi, 0)
    const totalTax = results.reduce((sum, r) => sum + r.tax, 0)
    const averageSalary = totalEmployees > 0 ? totalNetSalary / totalEmployees : 0

    return {
      totalEmployees,
      totalBasicSalary,
      totalEarnings,
      totalDeductions,
      totalNetSalary,
      totalPF,
      totalESI,
      totalTax,
      averageSalary,
    }
  }
}
