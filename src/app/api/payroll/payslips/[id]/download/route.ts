import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'
import jsPDF from 'jspdf'

// GET /api/payroll/payslips/[id]/download - Download payslip as PDF
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get payslip data
    const payslip = await prisma.payslip.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: true,
            department: true,
          },
        },
        payroll: {
          include: {
            payrollInputs: true,
          },
        },
        generator: true,
      },
    })

    if (!payslip) {
      return NextResponse.json({ success: false, error: 'Payslip not found' }, { status: 404 })
    }

    // Check permissions - employees can only download their own payslips
    if (!userContext.isManagerOrAdmin() && payslip.employeeId !== userContext.user.employee?.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Get payroll input for detailed calculation
    const payrollInput = payslip.payroll.payrollInputs[0]
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

    // Generate PDF
    const pdf = generatePayslipPDF(payslip, calculationResult)

    // Update payslip download status
    await prisma.payslip.update({
      where: { id },
      data: {
        downloadedAt: new Date(),
        status: 'DOWNLOADED',
      },
    })

    // Create audit log
    await prisma.payrollAuditLog.create({
      data: {
        payrollId: payslip.payrollId,
        employeeId: payslip.employeeId,
        action: 'PAYSLIP_DOWNLOADED',
        details: {
          payslipId: payslip.id,
          fileName: payslip.fileName,
        },
        performedBy: userContext.user.id,
      },
    })

    // Return PDF as response
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${payslip.fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading payslip:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to download payslip' },
      { status: 500 }
    )
  }
}

function generatePayslipPDF(payslip: any, calculationResult: any): jsPDF {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  
  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return months[month - 1]
  }

  let yPosition = 20

  // Header
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text('HRM Company', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 10

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text('123 Business Street, City, State 12345', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 15

  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text('PAYSLIP', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 8

  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`For the month of ${getMonthName(payslip.month)} ${payslip.year}`, pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 20

  // Employee Information
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Employee Information', 20, yPosition)
  yPosition += 10

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  const employeeInfo = [
    ['Employee ID:', payslip.employee.employeeId],
    ['Name:', `${payslip.employee.firstName} ${payslip.employee.lastName}`],
    ['Department:', payslip.employee.department.name],
    ['Position:', payslip.employee.position],
    ['Date of Joining:', formatDate(payslip.employee.hireDate)],
  ]

  employeeInfo.forEach(([label, value]) => {
    pdf.text(label, 20, yPosition)
    pdf.text(value, 80, yPosition)
    yPosition += 6
  })

  yPosition += 10

  // Payroll Information
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Payroll Information', 20, yPosition)
  yPosition += 10

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  const payrollInfo = [
    ['Pay Period:', `${getMonthName(payslip.month)} ${payslip.year}`],
    ['Pay Date:', formatDate(new Date())],
    ['Status:', payslip.payroll.status],
    ['Working Days:', calculationResult.workingDays.toString()],
    ['Present Days:', calculationResult.presentDays.toString()],
  ]

  payrollInfo.forEach(([label, value]) => {
    pdf.text(label, 20, yPosition)
    pdf.text(value, 80, yPosition)
    yPosition += 6
  })

  yPosition += 15

  // Earnings and Deductions Table
  const tableData = [
    // Earnings
    ['EARNINGS', ''],
    ['Basic Salary', formatCurrency(calculationResult.basicSalary)],
    ['HRA', formatCurrency(calculationResult.hra)],
  ]

  if (calculationResult.variablePay > 0) {
    tableData.push(['Variable Pay', formatCurrency(calculationResult.variablePay)])
  }
  if (calculationResult.overtime > 0) {
    tableData.push(['Overtime', formatCurrency(calculationResult.overtime)])
  }
  if (calculationResult.bonus > 0) {
    tableData.push(['Bonus', formatCurrency(calculationResult.bonus)])
  }
  if (calculationResult.allowances > 0) {
    tableData.push(['Allowances', formatCurrency(calculationResult.allowances)])
  }

  tableData.push(['', ''])
  tableData.push(['TOTAL EARNINGS', formatCurrency(calculationResult.totalEarnings)])

  // Deductions
  tableData.push(['', ''])
  tableData.push(['DEDUCTIONS', ''])

  if (calculationResult.pf > 0) {
    tableData.push(['Provident Fund (PF)', formatCurrency(calculationResult.pf)])
  }
  if (calculationResult.esi > 0) {
    tableData.push(['ESI', formatCurrency(calculationResult.esi)])
  }
  if (calculationResult.tax > 0) {
    tableData.push(['Income Tax (TDS)', formatCurrency(calculationResult.tax)])
  }
  if (calculationResult.insurance > 0) {
    tableData.push(['Insurance', formatCurrency(calculationResult.insurance)])
  }
  if (calculationResult.leaveDeduction > 0) {
    tableData.push(['Leave Deduction', formatCurrency(calculationResult.leaveDeduction)])
  }
  if (calculationResult.otherDeductions > 0) {
    tableData.push(['Other Deductions', formatCurrency(calculationResult.otherDeductions)])
  }

  tableData.push(['', ''])
  tableData.push(['TOTAL DEDUCTIONS', formatCurrency(calculationResult.totalDeductions)])

  // Draw table
  const tableStartY = yPosition
  const col1X = 20
  const col2X = 120
  const rowHeight = 8

  tableData.forEach((row, index) => {
    const currentY = tableStartY + (index * rowHeight)
    
    if (row[0] === 'EARNINGS' || row[0] === 'DEDUCTIONS') {
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(12)
    } else if (row[0] === 'TOTAL EARNINGS' || row[0] === 'TOTAL DEDUCTIONS') {
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(11)
    } else {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
    }

    pdf.text(row[0], col1X, currentY)
    pdf.text(row[1], col2X, currentY)

    // Draw line after totals
    if (row[0] === 'TOTAL EARNINGS' || row[0] === 'TOTAL DEDUCTIONS') {
      pdf.line(col1X, currentY + 2, pageWidth - 20, currentY + 2)
    }
  })

  yPosition = tableStartY + (tableData.length * rowHeight) + 20

  // Net Salary
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`Net Salary: ${formatCurrency(calculationResult.netSalary)}`, pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 10

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Amount in words: ${numberToWords(calculationResult.netSalary)} Rupees Only`, pageWidth / 2, yPosition, { align: 'center' })

  // Footer
  yPosition = pageHeight - 30
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text('This is a computer-generated payslip and does not require a signature.', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 5
  pdf.text(`Generated on: ${formatDate(new Date())}`, pageWidth / 2, yPosition, { align: 'center' })

  return pdf
}

// Helper function to convert numbers to words (simplified)
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']

  if (num === 0) return 'Zero'

  const convertHundreds = (n: number): string => {
    let result = ''
    if (n > 99) {
      result += ones[Math.floor(n / 100)] + ' Hundred '
      n %= 100
    }
    if (n > 19) {
      result += tens[Math.floor(n / 10)] + ' '
      n %= 10
    } else if (n > 9) {
      result += teens[n - 10] + ' '
      return result
    }
    if (n > 0) {
      result += ones[n] + ' '
    }
    return result
  }

  let result = ''
  if (num >= 10000000) {
    result += convertHundreds(Math.floor(num / 10000000)) + 'Crore '
    num %= 10000000
  }
  if (num >= 100000) {
    result += convertHundreds(Math.floor(num / 100000)) + 'Lakh '
    num %= 100000
  }
  if (num >= 1000) {
    result += convertHundreds(Math.floor(num / 1000)) + 'Thousand '
    num %= 1000
  }
  if (num > 0) {
    result += convertHundreds(num)
  }

  return result.trim()
}
