'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { CheckCircle, XCircle } from 'lucide-react'
import type { VariablePayEntryWithEmployee } from '@/types'

interface VariablePayApprovalTableProps {
  entries: VariablePayEntryWithEmployee[]
  loading: boolean
  onApprove: (entry: VariablePayEntryWithEmployee) => void
  onReject: (entry: VariablePayEntryWithEmployee) => void
}

export function VariablePayApprovalTable({ 
  entries, 
  loading, 
  onApprove, 
  onReject 
}: VariablePayApprovalTableProps) {
  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (value: unknown, entry: VariablePayEntryWithEmployee) => (
        <div>
          <div className="font-medium">{entry.employee.firstName} {entry.employee.lastName}</div>
          <div className="text-sm text-gray-500">{entry.employee.employeeId}</div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (value: unknown, entry: VariablePayEntryWithEmployee) => (
        <Badge variant="outline">{entry.type.replace('_', ' ')}</Badge>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value: unknown, entry: VariablePayEntryWithEmployee) => (
        <div className="font-medium text-green-600">
          ₹{Number(entry.amount).toLocaleString()}
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (value: unknown, entry: VariablePayEntryWithEmployee) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {entry.description}
        </div>
      ),
    },
    {
      key: 'submittedBy',
      label: 'Submitted By',
      render: (value: unknown, entry: VariablePayEntryWithEmployee) => (
        <div className="text-sm">{entry.submitter.name}</div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Submitted',
      render: (value: unknown, entry: VariablePayEntryWithEmployee) => (
        <div className="text-sm text-gray-500">
          {new Date(entry.createdAt).toLocaleDateString('en-IN')}
        </div>
      ),
    },
  ]

  const actions = [
    {
      label: 'Approve',
      icon: <CheckCircle className="w-4 h-4" />,
      onClick: onApprove,
      variant: 'default' as const,
    },
    {
      label: 'Reject',
      icon: <XCircle className="w-4 h-4" />,
      onClick: onReject,
      variant: 'destructive' as const,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          Variable Pay Approvals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          data={entries}
          columns={columns}
          actions={actions}
          loading={loading}
          emptyMessage="No pending variable pay entries"
          searchable={true}
          searchPlaceholder="Search by employee name or type..."
        />
      </CardContent>
    </Card>
  )
}

