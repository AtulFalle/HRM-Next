'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 

  CheckCircle, 
  XCircle, 
  Plus,
  Eye,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

interface LeaveRequest {
  id: string
  startDate: string
  endDate: string
  leaveType: 'SICK_LEAVE' | 'VACATION' | 'PERSONAL_LEAVE' | 'MATERNITY_LEAVE' | 'PATERNITY_LEAVE' | 'EMERGENCY_LEAVE'
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  daysRequested: number
  createdAt: string
  updatedAt: string
  employee: {
    id: string
    firstName: string
    lastName: string
    employeeId: string
    department: {
      name: string
    }
  }
  approvedBy?: {
    name: string
  }
  comments?: string
}

interface LeaveManagerProps {
  employeeId?: string
}

export function LeaveManager({ employeeId }: LeaveManagerProps) {
  const { data: session } = useSession()
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')
  const [approvalComment, setApprovalComment] = useState('')

  // New request form state
  const [newRequest, setNewRequest] = useState({
    startDate: '',
    endDate: '',
    leaveType: '',
    reason: '',
  })

  const fetchLeaveRequests = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (employeeId) params.append('employeeId', employeeId)
      
      const response = await fetch(`/api/leave?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setLeaveRequests(data.data.leaveRequests || [])
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error)
      toast.error('Failed to fetch leave requests')
    } finally {
      setLoading(false)
    }
  }, [employeeId])

  useEffect(() => {
    fetchLeaveRequests()
  }, [fetchLeaveRequests])

  const handleSubmitRequest = async () => {
    try {
      const response = await fetch('/api/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newRequest,
          employeeId: employeeId || session?.user?.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Leave request submitted successfully')
        setShowNewRequestDialog(false)
        setNewRequest({ startDate: '', endDate: '', leaveType: '', reason: '' })
        fetchLeaveRequests()
      } else {
        toast.error(data.message || 'Failed to submit leave request')
      }
    } catch (error) {
      console.error('Error submitting leave request:', error)
      toast.error('Failed to submit leave request')
    }
  }

  const handleApproval = async () => {
    if (!selectedRequest) return

    try {
      const response = await fetch(`/api/leave/${selectedRequest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: approvalAction === 'approve' ? 'APPROVED' : 'REJECTED',
          comments: approvalComment,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Leave request ${approvalAction}d successfully`)
        setShowApprovalDialog(false)
        setSelectedRequest(null)
        setApprovalComment('')
        fetchLeaveRequests()
      } else {
        toast.error(data.message || `Failed to ${approvalAction} leave request`)
      }
    } catch (error) {
      console.error(`Error ${approvalAction}ing leave request:`, error)
      toast.error(`Failed to ${approvalAction} leave request`)
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/leave/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CANCELLED',
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Leave request cancelled successfully')
        fetchLeaveRequests()
      } else {
        toast.error(data.message || 'Failed to cancel leave request')
      }
    } catch (error) {
      console.error('Error cancelling leave request:', error)
      toast.error('Failed to cancel leave request')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: 'secondary',
      APPROVED: 'default',
      REJECTED: 'destructive',
      CANCELLED: 'outline',
    } as const

    const labels = {
      PENDING: 'Pending',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      CANCELLED: 'Cancelled',
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const getLeaveTypeLabel = (type: string) => {
    const labels = {
      SICK_LEAVE: 'Sick Leave',
      VACATION: 'Vacation',
      PERSONAL_LEAVE: 'Personal Leave',
      MATERNITY_LEAVE: 'Maternity Leave',
      PATERNITY_LEAVE: 'Paternity Leave',
      EMERGENCY_LEAVE: 'Emergency Leave',
    } as const

    return labels[type as keyof typeof labels] || type
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  // Table columns for DataTable
  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (value: any, row: LeaveRequest) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">
              {row.employee.firstName[0]}{row.employee.lastName[0]}
            </span>
          </div>
          <div>
            <div className="font-medium">{row.employee.firstName} {row.employee.lastName}</div>
            <div className="text-sm text-gray-500">{row.employee.employeeId}</div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'leaveType',
      label: 'Leave Type',
      render: (value: any) => getLeaveTypeLabel(value),
      sortable: true,
    },
    {
      key: 'startDate',
      label: 'Start Date',
      render: (value: any, row: LeaveRequest) => (
        <div>
          <div className="font-medium">{formatDate(value)}</div>
          <div className="text-sm text-gray-500">{row.daysRequested} days</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'endDate',
      label: 'End Date',
      render: (value: any) => formatDate(value),
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: any) => getStatusBadge(value),
      sortable: true,
    },
    {
      key: 'createdAt',
      label: 'Requested',
      render: (value: any) => formatDate(value),
      sortable: true,
    },
  ]

  const actions = [
    {
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: (request: LeaveRequest) => {
        setSelectedRequest(request)
        // Show details in a modal or navigate to details page
      },
    },
    ...(session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER' ? [
      {
        label: 'Approve',
        icon: <CheckCircle className="h-4 w-4" />,
        onClick: (request: LeaveRequest) => {
          setSelectedRequest(request)
          setApprovalAction('approve')
          setShowApprovalDialog(true)
        },
        variant: 'default' as const,
      },
      {
        label: 'Reject',
        icon: <XCircle className="h-4 w-4" />,
        onClick: (request: LeaveRequest) => {
          setSelectedRequest(request)
          setApprovalAction('reject')
          setShowApprovalDialog(true)
        },
        variant: 'destructive' as const,
      },
    ] : []),
    {
      label: 'Cancel',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (request: LeaveRequest) => {
        if (request.status === 'PENDING') {
          handleCancelRequest(request.id)
        }
      },
      variant: 'destructive' as const,
    },
  ]

  const canSubmitRequest = session?.user?.role === 'EMPLOYEE' || !employeeId

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600">Manage employee leave requests and approvals</p>
        </div>
        {canSubmitRequest && (
          <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Leave Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Submit Leave Request</DialogTitle>
                <DialogDescription>
                  Fill in the details for your leave request.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newRequest.startDate}
                      onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newRequest.endDate}
                      onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leaveType">Leave Type</Label>
                  <Select value={newRequest.leaveType} onValueChange={(value) => setNewRequest({ ...newRequest, leaveType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SICK_LEAVE">Sick Leave</SelectItem>
                      <SelectItem value="VACATION">Vacation</SelectItem>
                      <SelectItem value="PERSONAL_LEAVE">Personal Leave</SelectItem>
                      <SelectItem value="MATERNITY_LEAVE">Maternity Leave</SelectItem>
                      <SelectItem value="PATERNITY_LEAVE">Paternity Leave</SelectItem>
                      <SelectItem value="EMERGENCY_LEAVE">Emergency Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Enter reason for leave..."
                    value={newRequest.reason}
                    onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  />
                </div>
                {newRequest.startDate && newRequest.endDate && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Duration:</strong> {calculateDays(newRequest.startDate, newRequest.endDate)} days
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewRequestDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitRequest}
                  disabled={!newRequest.startDate || !newRequest.endDate || !newRequest.leaveType || !newRequest.reason}
                >
                  Submit Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Leave Requests Table */}
      <DataTable
        data={leaveRequests}
        columns={columns}
        actions={actions}
        searchable={true}
        searchPlaceholder="Search leave requests..."
        loading={loading}
        emptyMessage="No leave requests found"
      />

      {/* Approval Dialog */}
      <ConfirmationDialog
        open={showApprovalDialog}
        onOpenChange={setShowApprovalDialog}
        title={`${approvalAction === 'approve' ? 'Approve' : 'Reject'} Leave Request`}
        description={`Are you sure you want to ${approvalAction} this leave request?`}
        confirmText={approvalAction === 'approve' ? 'Approve' : 'Reject'}
        cancelText="Cancel"
        variant={approvalAction === 'approve' ? 'default' : 'destructive'}
        onConfirm={handleApproval}
      />
    </div>
  )
}
