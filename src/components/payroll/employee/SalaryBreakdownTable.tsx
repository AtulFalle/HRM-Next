'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Calendar, Eye, FileSpreadsheet } from 'lucide-react'

interface SalaryBreakdown {
  id: string
  month: number
  year: number
  basicSalary: number
  hra: number
  allowances: number
  variablePay: number
  totalEarnings: number
  pf: number
  esi: number
  tax: number
  insurance: number
  otherDeductions: number
  totalDeductions: number
  netSalary: number
}

interface SalaryBreakdownTableProps {
  breakdowns: SalaryBreakdown[]
  loading: boolean
  onViewDetails: (breakdown: SalaryBreakdown) => void
}

export function SalaryBreakdownTable({ 
  breakdowns, 
  loading, 
  onViewDetails 
}: SalaryBreakdownTableProps) {
  const columns = [
    {
      key: 'period',
      label: 'Period',
      render: (value: unknown, breakdown: SalaryBreakdown) => (
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>
            {new Date(breakdown.year, breakdown.month - 1).toLocaleDateString('en-IN', {
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
      ),
    },
    {
      key: 'totalEarnings',
      label: 'Total Earnings',
      render: (value: unknown, breakdown: SalaryBreakdown) => (
        <div className="font-medium text-green-600">
          ₹{breakdown.totalEarnings.toLocaleString()}
        </div>
      ),
    },
    {
      key: 'totalDeductions',
      label: 'Total Deductions',
      render: (value: unknown, breakdown: SalaryBreakdown) => (
        <div className="font-medium text-red-600">
          ₹{breakdown.totalDeductions.toLocaleString()}
        </div>
      ),
    },
    {
      key: 'netSalary',
      label: 'Net Salary',
      render: (value: unknown, breakdown: SalaryBreakdown) => (
        <div className="font-bold text-blue-600">
          ₹{breakdown.netSalary.toLocaleString()}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: unknown, breakdown: SalaryBreakdown) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewDetails(breakdown)}
        >
          <Eye className="w-4 h-4 mr-1" />
          View Details
        </Button>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileSpreadsheet className="w-5 h-5 mr-2" />
          Salary Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          data={breakdowns}
          columns={columns}
          loading={loading}
          emptyMessage="No salary breakdowns found"
          searchable={true}
          searchPlaceholder="Search by month or year..."
        />
      </CardContent>
    </Card>
  )
}

