'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { PayrollCalculationResult, PayrollWithEmployee } from '@/types'

interface PayslipTemplateProps {
  payroll: PayrollWithEmployee
  calculationResult: PayrollCalculationResult
  companyInfo?: {
    name: string
    address: string
    logo?: string
  }
}

export function PayslipTemplate({ 
  payroll, 
  calculationResult, 
  companyInfo = {
    name: 'HRM Company',
    address: '123 Business Street, City, State 12345'
  }
}: PayslipTemplateProps) {
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

  return (
    <div className="payslip-container bg-white text-black max-w-4xl mx-auto p-8" id="payslip-content">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{companyInfo.name}</h1>
        <p className="text-gray-600 mb-4">{companyInfo.address}</p>
        <h2 className="text-2xl font-semibold text-gray-800">PAYSLIP</h2>
        <p className="text-gray-600">
          For the month of {getMonthName(payroll.month)} {payroll.year}
        </p>
      </div>

      <Separator className="my-6" />

      {/* Employee Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Employee Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Employee ID:</span>
              <span>{payroll.employee.employeeId}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Name:</span>
              <span>{payroll.employee.firstName} {payroll.employee.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Department:</span>
              <span>{payroll.employee.departmentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Position:</span>
              <span>{payroll.employee.position}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Date of Joining:</span>
              <span>{formatDate(payroll.employee.hireDate)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payroll Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Pay Period:</span>
              <span>{getMonthName(payroll.month)} {payroll.year}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Pay Date:</span>
              <span>{formatDate(new Date())}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <Badge variant={payroll.status === 'PAID' ? 'default' : 'secondary'}>
                {payroll.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Working Days:</span>
              <span>{calculationResult.workingDays}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Present Days:</span>
              <span>{calculationResult.presentDays}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings and Deductions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Earnings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-green-700">Earnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Basic Salary</span>
              <span className="font-medium">{formatCurrency(calculationResult.basicSalary)}</span>
            </div>
            <div className="flex justify-between">
              <span>HRA</span>
              <span className="font-medium">{formatCurrency(calculationResult.hra)}</span>
            </div>
            {calculationResult.variablePay > 0 && (
              <div className="flex justify-between">
                <span>Variable Pay</span>
                <span className="font-medium">{formatCurrency(calculationResult.variablePay)}</span>
              </div>
            )}
            {calculationResult.overtime > 0 && (
              <div className="flex justify-between">
                <span>Overtime</span>
                <span className="font-medium">{formatCurrency(calculationResult.overtime)}</span>
              </div>
            )}
            {calculationResult.bonus > 0 && (
              <div className="flex justify-between">
                <span>Bonus</span>
                <span className="font-medium">{formatCurrency(calculationResult.bonus)}</span>
              </div>
            )}
            {calculationResult.allowances > 0 && (
              <div className="flex justify-between">
                <span>Allowances</span>
                <span className="font-medium">{formatCurrency(calculationResult.allowances)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold text-green-700">
              <span>Total Earnings</span>
              <span>{formatCurrency(calculationResult.totalEarnings)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Deductions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-red-700">Deductions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {calculationResult.pf > 0 && (
              <div className="flex justify-between">
                <span>Provident Fund (PF)</span>
                <span className="font-medium">{formatCurrency(calculationResult.pf)}</span>
              </div>
            )}
            {calculationResult.esi > 0 && (
              <div className="flex justify-between">
                <span>ESI</span>
                <span className="font-medium">{formatCurrency(calculationResult.esi)}</span>
              </div>
            )}
            {calculationResult.tax > 0 && (
              <div className="flex justify-between">
                <span>Income Tax (TDS)</span>
                <span className="font-medium">{formatCurrency(calculationResult.tax)}</span>
              </div>
            )}
            {calculationResult.insurance > 0 && (
              <div className="flex justify-between">
                <span>Insurance</span>
                <span className="font-medium">{formatCurrency(calculationResult.insurance)}</span>
              </div>
            )}
            {calculationResult.leaveDeduction > 0 && (
              <div className="flex justify-between">
                <span>Leave Deduction</span>
                <span className="font-medium">{formatCurrency(calculationResult.leaveDeduction)}</span>
              </div>
            )}
            {calculationResult.otherDeductions > 0 && (
              <div className="flex justify-between">
                <span>Other Deductions</span>
                <span className="font-medium">{formatCurrency(calculationResult.otherDeductions)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold text-red-700">
              <span>Total Deductions</span>
              <span>{formatCurrency(calculationResult.totalDeductions)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Net Salary */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700 mb-2">
              Net Salary: {formatCurrency(calculationResult.netSalary)}
            </div>
            <p className="text-gray-600">
              Amount in words: {numberToWords(calculationResult.netSalary)} Rupees Only
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 mt-8">
        <p>This is a computer-generated payslip and does not require a signature.</p>
        <p>Generated on: {formatDate(new Date())}</p>
      </div>
    </div>
  )
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
