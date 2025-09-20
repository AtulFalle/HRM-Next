'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Edit, 
  Lock 
} from 'lucide-react'

interface PayrollCycle {
  id: string
  month: number
  year: number
  status: 'DRAFT' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'FINALIZED' | 'LOCKED'
  totalEmployees: number
  errors: number
  warnings: number
  totalAmount: number
  createdAt: string
  finalizedAt?: string
}

interface PayrollCycleTableProps {
  cycles: PayrollCycle[]
  loading: boolean
  onView: (cycle: PayrollCycle) => void
  onEdit: (cycle: PayrollCycle) => void
  onFinalize: (cycleId: string) => void
}

export function PayrollCycleTable({ 
  cycles, 
  loading, 
  onView, 
  onEdit, 
  onFinalize 
}: PayrollCycleTableProps) {
  const columns = [
    {
      key: 'period',
      label: 'Period',
      render: (value: unknown, cycle: PayrollCycle) => {
        if (!cycle.year || !cycle.month) {
          console.warn('PayrollCycle missing year or month:', cycle)
        }
        
        return (
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>
              {cycle.year && cycle.month 
                ? new Date(cycle.year, cycle.month - 1).toLocaleDateString('en-IN', {
                    month: 'long',
                    year: 'numeric',
                  })
                : 'Invalid Date'
              }
            </span>
          </div>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: unknown, cycle: PayrollCycle) => (
        <Badge 
          variant={
            cycle.status === 'FINALIZED' ? 'default' :
            cycle.status === 'IN_PROGRESS' ? 'secondary' :
            cycle.status === 'PENDING_APPROVAL' ? 'outline' :
            cycle.status === 'LOCKED' ? 'destructive' : 'outline'
          }
        >
          {cycle.status}
        </Badge>
      ),
    },
    {
      key: 'totalEmployees',
      label: 'Employees',
      render: (value: unknown, cycle: PayrollCycle) => (
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span>{cycle.totalEmployees}</span>
        </div>
      ),
    },
    {
      key: 'errors',
      label: 'Errors',
      render: (value: unknown, cycle: PayrollCycle) => (
        <div className="flex items-center space-x-2">
          {cycle.errors > 0 ? (
            <XCircle className="w-4 h-4 text-red-600" />
          ) : (
            <CheckCircle className="w-4 h-4 text-green-600" />
          )}
          <span className={cycle.errors > 0 ? 'text-red-600' : 'text-green-600'}>
            {cycle.errors}
          </span>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      render: (value: unknown, cycle: PayrollCycle) => (
        <div className="font-medium text-green-600">
          ₹{cycle.totalAmount.toLocaleString()}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value: unknown, cycle: PayrollCycle) => (
        <div className="text-sm text-gray-500">
          {new Date(cycle.createdAt).toLocaleDateString('en-IN')}
        </div>
      ),
    },
  ]

  const actions = [
    {
      label: 'View',
      icon: <Eye className="w-4 h-4" />,
      onClick: onView,
      variant: 'default' as const,
    },
    {
      label: 'Edit',
      icon: <Edit className="w-4 h-4" />,
      onClick: onEdit,
      variant: 'default' as const,
    },
    {
      label: 'Finalize',
      icon: <Lock className="w-4 h-4" />,
      onClick: (cycle: PayrollCycle) => onFinalize(cycle.id),
      variant: 'default' as const,
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Payroll Cycle Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          data={cycles}
          columns={columns}
          actions={actions}
          loading={loading}
          emptyMessage="No payroll cycles found"
          searchable={true}
          searchPlaceholder="Search by month, year, or status..."
        />
      </CardContent>
    </Card>
  )
}

