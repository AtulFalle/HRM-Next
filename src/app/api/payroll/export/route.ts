import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'
import { z } from 'zod'

const exportSchema = z.object({
  type: z.enum(['csv', 'excel', 'pdf']),
  format: z.enum(['payroll-summary', 'employee-details', 'variable-pay', 'corrections']),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030),
  departmentId: z.string().optional(),
  status: z.string().optional(),
})

// POST /api/payroll/export - Export payroll data
export async function POST(request: NextRequest) {
  try {
    const userContext = await getUserContext(request)
    if (!userContext.isAdmin()) {
      return NextResponse.json({ success: false, error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = exportSchema.parse(body)

    // Build where clause based on export parameters
    const where: { 
      month: number
      year: number
      status?: string
      employeeId?: string
    } = {
      month: validatedData.month,
      year: validatedData.year,
    }

    if (validatedData.status) {
      where.status = validatedData.status
    }

    if (validatedData.departmentId) {
      where.employee = {
        departmentId: validatedData.departmentId,
      }
    }

    let data: Record<string, unknown>[] = []
    let filename = ''

    switch (validatedData.format) {
      case 'payroll-summary':
        data = await getPayrollSummaryData(where)
        filename = `payroll-summary-${validatedData.month}-${validatedData.year}`
        break

      case 'employee-details':
        data = await getEmployeeDetailsData(where)
        filename = `employee-details-${validatedData.month}-${validatedData.year}`
        break

      case 'variable-pay':
        data = await getVariablePayData(where)
        filename = `variable-pay-${validatedData.month}-${validatedData.year}`
        break

      case 'corrections':
        data = await getCorrectionsData(where)
        filename = `corrections-${validatedData.month}-${validatedData.year}`
        break

      default:
        return NextResponse.json({ success: false, error: 'Invalid export format' }, { status: 400 })
    }

    // Generate file based on type
    let fileContent: string
    let contentType: string

    switch (validatedData.type) {
      case 'csv':
        fileContent = generateCSV(data)
        contentType = 'text/csv'
        filename += '.csv'
        break

      case 'excel':
        // For Excel, we'll return JSON data and let the frontend handle Excel generation
        return NextResponse.json({
          success: true,
          data: {
            filename: filename + '.xlsx',
            data,
            format: 'excel',
          },
        })

      case 'pdf':
        // For PDF, we'll return JSON data and let the frontend handle PDF generation
        return NextResponse.json({
          success: true,
          data: {
            filename: filename + '.pdf',
            data,
            format: 'pdf',
            metadata: {
              month: validatedData.month,
              year: validatedData.year,
              generatedAt: new Date().toISOString(),
              generatedBy: userContext.user.name,
            },
          },
        })

      default:
        return NextResponse.json({ success: false, error: 'Invalid export type' }, { status: 400 })
    }

    // Create audit log
    await prisma.payrollAuditLog.create({
      data: {
        action: 'PAYROLL_EXPORT',
        performedBy: userContext.user.id,
        details: {
          exportType: validatedData.type,
          exportFormat: validatedData.format,
          month: validatedData.month,
          year: validatedData.year,
          departmentId: validatedData.departmentId,
          recordCount: data.length,
        },
      },
    })

    // Return file content for CSV
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting payroll data:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to export payroll data' },
      { status: 500 }
    )
  }
}

// Helper functions for different export formats
async function getPayrollSummaryData(where: { month: number; year: number; status?: string; employeeId?: string }) {
  const payrolls = await prisma.payroll.findMany({
    where,
    include: {
      employee: {
        include: {
          user: true,
          department: true,
        },
      },
    },
    orderBy: [
      { employee: { department: { name: 'asc' } } },
      { employee: { user: { name: 'asc' } } },
    ],
  })

  return payrolls.map(payroll => ({
    'Employee ID': payroll.employee.employeeId,
    'Employee Name': `${payroll.employee.firstName} ${payroll.employee.lastName}`,
    'Department': payroll.employee.department.name,
    'Position': payroll.employee.position,
    'Basic Salary': Number(payroll.basicSalary),
    'Allowances': Number(payroll.allowances),
    'Deductions': Number(payroll.deductions),
    'Net Salary': Number(payroll.netSalary),
    'Status': payroll.status,
    'Pay Date': payroll.paidAt?.toISOString().split('T')[0] || '',
  }))
}

async function getEmployeeDetailsData(where: { month: number; year: number; status?: string; employeeId?: string }) {
  const payrollInputs = await prisma.payrollInput.findMany({
    where: {
      payroll: where,
    },
    include: {
      employee: {
        include: {
          user: true,
          department: true,
        },
      },
    },
    orderBy: [
      { employee: { department: { name: 'asc' } } },
      { employee: { user: { name: 'asc' } } },
    ],
  })

  return payrollInputs.map(input => ({
    'Employee ID': input.employee.employeeId,
    'Employee Name': `${input.employee.firstName} ${input.employee.lastName}`,
    'Department': input.employee.department.name,
    'Position': input.employee.position,
    'Basic Salary': Number(input.basicSalary),
    'HRA': Number(input.hra),
    'Variable Pay': Number(input.variablePay),
    'Overtime': Number(input.overtime),
    'Bonus': Number(input.bonus),
    'Allowances': Number(input.allowances),
    'Total Earnings': Number(input.totalEarnings),
    'PF': Number(input.pf),
    'ESI': Number(input.esi),
    'Tax': Number(input.tax),
    'Insurance': Number(input.insurance),
    'Leave Deduction': Number(input.leaveDeduction),
    'Other Deductions': Number(input.otherDeductions),
    'Total Deductions': Number(input.totalDeductions),
    'Net Salary': Number(input.totalEarnings) - Number(input.totalDeductions),
    'Working Days': input.workingDays,
    'Present Days': input.presentDays,
    'Leave Days': input.leaveDays,
    'Status': input.status,
    'Notes': input.notes || '',
  }))
}

async function getVariablePayData(where: { month: number; year: number; status?: string; employeeId?: string }) {
  const variablePayEntries = await prisma.variablePayEntry.findMany({
    where: {
      month: where.month,
      year: where.year,
      ...(where.employee?.departmentId && {
        employee: {
          departmentId: where.employee.departmentId,
        },
      }),
    },
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
    orderBy: [
      { employee: { department: { name: 'asc' } } },
      { employee: { user: { name: 'asc' } } },
    ],
  })

  return variablePayEntries.map(entry => ({
    'Employee ID': entry.employee.employeeId,
    'Employee Name': `${entry.employee.firstName} ${entry.employee.lastName}`,
    'Department': entry.employee.department.name,
    'Type': entry.type,
    'Amount': Number(entry.amount),
    'Description': entry.description,
    'Status': entry.status,
    'Submitted By': entry.submitter?.name || '',
    'Submitted At': entry.createdAt.toISOString().split('T')[0],
    'Approved By': entry.approver?.name || '',
    'Approved At': entry.approvedAt?.toISOString().split('T')[0] || '',
    'Rejected By': entry.rejector?.name || '',
    'Rejected At': entry.rejectedAt?.toISOString().split('T')[0] || '',
    'Rejection Reason': entry.rejectionReason || '',
  }))
}

async function getCorrectionsData(where: { month: number; year: number; status?: string; employeeId?: string }) {
  const correctionRequests = await prisma.payrollCorrectionRequest.findMany({
    where: {
      payroll: where,
    },
    include: {
      employee: {
        include: {
          user: true,
          department: true,
        },
      },
      submitter: true,
      approver: true,
    },
    orderBy: [
      { employee: { department: { name: 'asc' } } },
      { employee: { user: { name: 'asc' } } },
    ],
  })

  return correctionRequests.map(request => ({
    'Employee ID': request.employee.employeeId,
    'Employee Name': `${request.employee.firstName} ${request.employee.lastName}`,
    'Department': request.employee.department.name,
    'Type': request.type,
    'Description': request.description,
    'Requested Amount': request.requestedAmount ? Number(request.requestedAmount) : '',
    'Status': request.status,
    'Submitted By': request.submitter?.name || '',
    'Submitted At': request.createdAt.toISOString().split('T')[0],
    'Approved By': request.approver?.name || '',
    'Approved At': request.approvedAt?.toISOString().split('T')[0] || '',
    'Resolution Notes': request.resolutionNotes || '',
  }))
}

function generateCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csvRows = [headers.join(',')]

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header]
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    })
    csvRows.push(values.join(','))
  }

  return csvRows.join('\n')
}
