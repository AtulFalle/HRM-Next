import { 
  User, 
  Employee, 
  Department, 
  Attendance, 
  LeaveRequest, 
  Payroll, 
  PayrollInput,
  VariablePayEntry,
  Payslip,
  PayrollCorrectionRequest,
  PayrollAuditLog,
  UserRole, 
  AttendanceStatus, 
  LeaveType, 
  LeaveStatus, 
  PayrollStatus,
  PayrollInputStatus,
  VariablePayType,
  VariablePayStatus,
  PayslipStatus,
  CorrectionType,
  CorrectionStatus
} from '@prisma/client'

// Extended types with relations
export type UserWithEmployee = User & {
  employee?: Employee & {
    department: Department
  }
}

export type EmployeeWithUser = Employee & {
  user: User
  department: Department
}

export type AttendanceWithEmployee = Attendance & {
  employee: Employee & {
    user: User
  }
}

export type LeaveRequestWithEmployee = LeaveRequest & {
  employee: Employee & {
    user: User
  }
  approver?: User
}

export type PayrollWithEmployee = Payroll & {
  employee: Employee & {
    user: User
  }
}

export type PayrollInputWithEmployee = PayrollInput & {
  employee: Employee & {
    user: User
  }
  payroll: Payroll
  approver?: User
  processor?: User
}

export type VariablePayEntryWithEmployee = VariablePayEntry & {
  employee: Employee & {
    user: User
  }
  submitter: User
  approver?: User
  rejector?: User
}

export type PayslipWithEmployee = Payslip & {
  employee: Employee & {
    user: User
  }
  payroll: Payroll
  generator: User
}

export type PayrollCorrectionRequestWithEmployee = PayrollCorrectionRequest & {
  employee: Employee & {
    user: User
  }
  payroll: Payroll
  requester: User
  reviewer?: User
}

export type PayrollAuditLogWithDetails = PayrollAuditLog & {
  payroll?: Payroll
  employee?: Employee & {
    user: User
  }
  performer: User
}

// Form types
export interface CreateEmployeeData {
  firstName: string
  lastName: string
  email: string
  username?: string
  password: string
  dateOfBirth: Date
  phoneNumber?: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  departmentId: string
  position: string
  hireDate: Date
  salary: number
  role: UserRole
}

export interface UpdateEmployeeData {
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  departmentId?: string
  position?: string
  salary?: number
  isActive?: boolean
}

export interface CreateLeaveRequestData {
  leaveType: LeaveType
  startDate: Date
  endDate: Date
  reason: string
}

export interface UpdateLeaveRequestData {
  status: LeaveStatus
  comments?: string
}

export interface CreateAttendanceData {
  date: Date
  checkIn?: Date
  checkOut?: Date
  status: AttendanceStatus
  notes?: string
}

export interface CreatePayrollData {
  month: number
  year: number
  basicSalary: number
  allowances?: number
  deductions?: number
}

export interface CreatePayrollInputData {
  employeeId: string
  month: number
  year: number
  basicSalary: number
  hra?: number
  variablePay?: number
  overtime?: number
  bonus?: number
  allowances?: number
  pf?: number
  esi?: number
  tax?: number
  insurance?: number
  leaveDeduction?: number
  otherDeductions?: number
  workingDays?: number
  presentDays?: number
  leaveDays?: number
  notes?: string
}

export interface CreateVariablePayEntryData {
  employeeId: string
  month: number
  year: number
  amount: number
  type: VariablePayType
  description: string
}

export interface UpdateVariablePayEntryData {
  status: VariablePayStatus
  rejectionReason?: string
}

export interface CreateCorrectionRequestData {
  payrollId: string
  type: CorrectionType
  description: string
  requestedAmount?: number
}

export interface UpdateCorrectionRequestData {
  status: CorrectionStatus
  reviewComments?: string
  resolution?: string
}

// Dashboard types
export interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  pendingLeaveRequests: number
  todayAttendance: number
  upcomingBirthdays: Employee[]
  recentLeaveRequests: LeaveRequestWithEmployee[]
}

export interface PayrollDashboardStats {
  totalPayrollCycles: number
  pendingApprovals: number
  processedThisMonth: number
  totalPayrollAmount: number
  pendingVariablePayEntries: number
  pendingCorrectionRequests: number
  recentPayrollCycles: PayrollWithEmployee[]
  pendingVariablePay: VariablePayEntryWithEmployee[]
}

export interface PayrollCalculationResult {
  basicSalary: number
  hra: number
  variablePay: number
  overtime: number
  bonus: number
  allowances: number
  totalEarnings: number
  pf: number
  esi: number
  tax: number
  insurance: number
  leaveDeduction: number
  otherDeductions: number
  totalDeductions: number
  netSalary: number
  workingDays: number
  presentDays: number
  leaveDays: number
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Re-export Prisma types
export type {
  User,
  Employee,
  Department,
  Attendance,
  LeaveRequest,
  Payroll,
  PayrollInput,
  VariablePayEntry,
  Payslip,
  PayrollCorrectionRequest,
  PayrollAuditLog,
  UserRole,
  AttendanceStatus,
  LeaveType,
  LeaveStatus,
  PayrollStatus,
  PayrollInputStatus,
  VariablePayType,
  VariablePayStatus,
  PayslipStatus,
  CorrectionType,
  CorrectionStatus
}
