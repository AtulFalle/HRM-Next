'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { History } from 'lucide-react'

interface ApprovalHistory {
  id: string
  type: 'VARIABLE_PAY' | 'ATTENDANCE_EXCEPTION' | 'CORRECTION_REQUEST'
  employeeId: string
  employeeName: string
  action: 'APPROVED' | 'REJECTED'
  value: number
  date: string
  reason?: string
}

interface ApprovalHistoryTableProps {
  history: ApprovalHistory[]
  loading: boolean
}

export function ApprovalHistoryTable({ 
  history, 
  loading 
}: ApprovalHistoryTableProps) {
  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (value: unknown, history: ApprovalHistory) => (
        <div>
          <div className="font-medium">{history.employeeName}</div>
          <div className="text-sm text-gray-500">{history.employeeId}</div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (value: unknown, history: ApprovalHistory) => (
        <Badge variant="outline">{history.type.replace('_', ' ')}</Badge>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (value: unknown, history: ApprovalHistory) => (
        <Badge 
          variant={history.action === 'APPROVED' ? 'default' : 'destructive'}
        >
          {history.action}
        </Badge>
      ),
    },
    {
      key: 'value',
      label: 'Value',
      render: (value: unknown, history: ApprovalHistory) => (
        <div className="font-medium">
          {history.value > 0 ? `₹${history.value.toLocaleString()}` : '-'}
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (value: unknown, history: ApprovalHistory) => (
        <div className="text-sm text-gray-500">
          {new Date(history.date).toLocaleDateString('en-IN')}
        </div>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <History className="w-5 h-5 mr-2" />
          Approval History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="approved" className="space-y-4">
          <TabsList>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value="approved" className="space-y-4">
            <DataTable
              data={history.filter(h => h.action === 'APPROVED')}
              columns={columns}
              loading={loading}
              emptyMessage="No approved entries found"
              searchable={true}
              searchPlaceholder="Search by employee name..."
            />
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            <DataTable
              data={history.filter(h => h.action === 'REJECTED')}
              columns={columns}
              loading={loading}
              emptyMessage="No rejected entries found"
              searchable={true}
              searchPlaceholder="Search by employee name..."
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

