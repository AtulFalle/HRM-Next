'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable } from '@/components/ui/data-table'
import { PayslipTemplate } from './payslip-template'
import { 
  Download, 
  Eye, 
  FileText, 
  Calendar,
  User,
  Building,
  DollarSign
} from 'lucide-react'
import { toast } from 'sonner'
import type { PayslipWithEmployee } from '@/types'

interface PayslipViewerProps {
  payslips: PayslipWithEmployee[]
  loading?: boolean
  onRefresh?: () => void
}

export function PayslipViewer({ payslips, loading = false, onRefresh }: PayslipViewerProps) {
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipWithEmployee | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  const handleDownload = async (payslip: PayslipWithEmployee) => {
    try {
      setDownloading(payslip.id)
      
      const response = await fetch(`/api/payroll/payslips/${payslip.id}/download`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to download payslip')
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = payslip.fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Payslip downloaded successfully')
      
      // Refresh the list to update download status
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error downloading payslip:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to download payslip')
    } finally {
      setDownloading(null)
    }
  }

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (value: unknown, payslip: PayslipWithEmployee) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {payslip.employee.firstName} {payslip.employee.lastName}
            </div>
            <div className="text-sm text-gray-500">
              {payslip.employee.employeeId}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'period',
      label: 'Period',
      render: (value: unknown, payslip: PayslipWithEmployee) => (
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>
            {new Date(payslip.year, payslip.month - 1).toLocaleDateString('en-IN', {
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      render: (value: unknown, payslip: PayslipWithEmployee) => (
        <div className="flex items-center space-x-2">
          <Building className="w-4 h-4 text-gray-400" />
          <span>{payslip.employee.departmentId}</span>
        </div>
      ),
    },
    {
      key: 'netSalary',
      label: 'Net Salary',
      render: (value: unknown, payslip: PayslipWithEmployee) => (
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="font-medium text-green-600">
            {new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(Number(payslip.payroll.netSalary))}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: unknown, payslip: PayslipWithEmployee) => (
        <Badge 
          variant={payslip.status === 'DOWNLOADED' ? 'default' : 'secondary'}
        >
          {payslip.status}
        </Badge>
      ),
    },
    {
      key: 'generatedAt',
      label: 'Generated',
      render: (value: unknown, payslip: PayslipWithEmployee) => (
        <div className="text-sm text-gray-500">
          {new Date(payslip.generatedAt).toLocaleDateString('en-IN')}
        </div>
      ),
    },
  ]

  const actions = [
    {
      label: 'View',
      icon: Eye,
      onClick: (payslip: PayslipWithEmployee) => setSelectedPayslip(payslip),
    },
    {
      label: 'Download',
      icon: Download,
      onClick: (payslip: PayslipWithEmployee) => handleDownload(payslip),
      loading: (payslip: PayslipWithEmployee) => downloading === payslip.id,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payslips</h2>
          <p className="text-gray-600">View and download employee payslips</p>
        </div>
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">
            {payslips.length} payslip{payslips.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Payslips Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable<PayslipWithEmployee>
            data={payslips}
            columns={columns}
            actions={actions as never}
            loading={loading}
            emptyMessage="No payslips found"
            searchable={true}
          />
        </CardContent>
      </Card>

      {/* Payslip Preview Dialog */}
      <Dialog open={!!selectedPayslip} onOpenChange={() => setSelectedPayslip(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Payslip - {selectedPayslip?.employee.firstName} {selectedPayslip?.employee.lastName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPayslip && (
            <div className="mt-4">
              <PayslipTemplate
                payroll={{
                  ...selectedPayslip.payroll,
                  employee: selectedPayslip.employee,
                }}
                calculationResult={{
                  basicSalary: Number(selectedPayslip.payroll.basicSalary),
                  hra: 0, // This would come from payroll input
                  variablePay: 0,
                  overtime: 0,
                  bonus: 0,
                  allowances: Number(selectedPayslip.payroll.allowances),
                  totalEarnings: Number(selectedPayslip.payroll.basicSalary) + Number(selectedPayslip.payroll.allowances),
                  pf: 0,
                  esi: 0,
                  tax: 0,
                  insurance: 0,
                  leaveDeduction: 0,
                  otherDeductions: 0,
                  totalDeductions: Number(selectedPayslip.payroll.deductions),
                  netSalary: Number(selectedPayslip.payroll.netSalary),
                  workingDays: 0,
                  presentDays: 0,
                  leaveDays: 0,
                }}
              />
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPayslip(null)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => selectedPayslip && handleDownload(selectedPayslip)}
                  disabled={downloading === selectedPayslip.id}
                >
                  {downloading === selectedPayslip.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
