'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { Calendar, Eye, Download, Receipt } from 'lucide-react'
import type { PayslipWithEmployee } from '@/types'

interface PayslipHistoryTableProps {
  payslips: PayslipWithEmployee[]
  loading: boolean
  onDownload: (payslip: PayslipWithEmployee) => Promise<void>
}

export function PayslipHistoryTable({ 
  payslips, 
  loading, 
  onDownload 
}: PayslipHistoryTableProps) {
  const columns = [
    {
      key: 'period',
      label: 'Month',
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
      key: 'netSalary',
      label: 'Net Salary',
      render: (value: unknown, payslip: PayslipWithEmployee) => (
        <div className="font-bold text-blue-600">
          ₹{Number(payslip.payroll.netSalary).toLocaleString()}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: unknown, payslip: PayslipWithEmployee) => (
        <Badge 
          variant={
            payslip.status === 'DOWNLOADED' ? 'default' :
            payslip.status === 'GENERATED' ? 'secondary' : 'outline'
          }
        >
          {payslip.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: unknown, payslip: PayslipWithEmployee) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // Open payslip in new tab for viewing
              window.open(`/api/payroll/payslips/${payslip.id}/download`, '_blank')
            }}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await onDownload(payslip)
            }}
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Receipt className="w-5 h-5 mr-2" />
          Payslip History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          data={payslips}
          columns={columns}
          loading={loading}
          emptyMessage="No payslips found"
          searchable={true}
          searchPlaceholder="Search by month or year..."
        />
      </CardContent>
    </Card>
  )
}

