'use client'

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { UserCheck, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ManagerStatsCards } from './manager/ManagerStatsCards'
import { VariablePayApprovalTable } from './manager/VariablePayApprovalTable'
import { TeamPayrollSummaryComponent } from './manager/TeamPayrollSummary'
import { ApprovalHistoryTable } from './manager/ApprovalHistoryTable'
import type { 
  VariablePayEntryWithEmployee,
  PayrollCorrectionRequestWithEmployee,
  PayrollDashboardStats,
  PayrollInputWithEmployee
} from '@/types'

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

interface TeamPayrollSummary {
  employeeId: string
  employeeName: string
  department: string
  basicSalary: number
  allowances: number
  deductions: number
  netSalary: number
  status: 'PROCESSED' | 'PENDING' | 'APPROVED'
}

export function ManagerPayrollInterface() {
  const [variablePayEntries, setVariablePayEntries] = useState<VariablePayEntryWithEmployee[]>([])
  const [correctionRequests, setCorrectionRequests] = useState<PayrollCorrectionRequestWithEmployee[]>([])
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>([])
  const [teamPayrollSummary, setTeamPayrollSummary] = useState<TeamPayrollSummary[]>([])
  const [stats, setStats] = useState<PayrollDashboardStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<VariablePayEntryWithEmployee | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<PayrollCorrectionRequestWithEmployee | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [showRejectionDialog, setShowRejectionDialog] = useState(false)
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false)
  const [showSalaryBreakdownDialog, setShowSalaryBreakdownDialog] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<TeamPayrollSummary | null>(null)

  useEffect(() => {
    fetchManagerData()
  }, [])

  const fetchManagerData = async () => {
    setLoading(true)
    try {
      const [variablePayRes, correctionsRes, statsRes] = await Promise.all([
        fetch('/api/payroll/variable-pay?status=PENDING'),
        fetch('/api/payroll/corrections?status=PENDING'),
        fetch('/api/payroll/dashboard'),
      ])

      const [variablePayData, correctionsData, statsData] = await Promise.all([
        variablePayRes.json(),
        correctionsRes.json(),
        statsRes.json(),
      ])

      if (variablePayData.success) setVariablePayEntries(variablePayData.data.variablePayEntries)
      if (correctionsData.success) setCorrectionRequests(correctionsData.data.correctionRequests)
      if (statsData.success) setStats(statsData.data.dashboardStats)

      // Fetch additional data
      fetchApprovalHistory()
      fetchTeamPayrollSummary()
    } catch (error) {
      console.error('Error fetching manager data:', error)
      toast.error('Failed to fetch payroll data')
    } finally {
      setLoading(false)
    }
  }

  const fetchApprovalHistory = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockHistory: ApprovalHistory[] = [
        {
          id: '1',
          type: 'VARIABLE_PAY',
          employeeId: 'EMP001',
          employeeName: 'John Doe',
          action: 'APPROVED',
          value: 50000,
          date: '2024-12-10T10:30:00Z'
        },
        {
          id: '2',
          type: 'CORRECTION_REQUEST',
          employeeId: 'EMP002',
          employeeName: 'Jane Smith',
          action: 'REJECTED',
          value: 0,
          date: '2024-12-09T14:20:00Z',
          reason: 'Insufficient documentation'
        }
      ]
      setApprovalHistory(mockHistory)
    } catch (error) {
      console.error('Error fetching approval history:', error)
    }
  }

  const fetchTeamPayrollSummary = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockSummary: TeamPayrollSummary[] = [
        {
          employeeId: 'EMP001',
          employeeName: 'John Doe',
          department: 'Engineering',
          basicSalary: 80000,
          allowances: 15000,
          deductions: 12000,
          netSalary: 83000,
          status: 'PROCESSED'
        },
        {
          employeeId: 'EMP002',
          employeeName: 'Jane Smith',
          department: 'Engineering',
          basicSalary: 75000,
          allowances: 12000,
          deductions: 11000,
          netSalary: 76000,
          status: 'PENDING'
        }
      ]
      setTeamPayrollSummary(mockSummary)
    } catch (error) {
      console.error('Error fetching team payroll summary:', error)
    }
  }

  const handleApproveVariablePay = async (entryId: string) => {
    try {
      const response = await fetch(`/api/payroll/variable-pay/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Variable pay entry approved')
        fetchManagerData()
        setShowApprovalDialog(false)
        setSelectedEntry(null)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error approving variable pay:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to approve variable pay')
    }
  }

  const handleRejectVariablePay = async (entryId: string, reason: string) => {
    try {
      const response = await fetch(`/api/payroll/variable-pay/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'REJECTED',
          rejectionReason: reason,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Variable pay entry rejected')
        fetchManagerData()
        setShowRejectionDialog(false)
        setSelectedEntry(null)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error rejecting variable pay:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to reject variable pay')
    }
  }

  const handleUpdateCorrectionRequest = async (requestId: string, status: string, comments?: string) => {
    try {
      const response = await fetch(`/api/payroll/corrections/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status,
          reviewComments: comments,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`Correction request ${status.toLowerCase()}`)
        fetchManagerData()
        setShowCorrectionDialog(false)
        setSelectedRequest(null)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error updating correction request:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update correction request')
    }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600">Review and approve variable pay entries and correction requests</p>
        </div>
        <div className="flex items-center space-x-2">
          <UserCheck className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">Manager Access</span>
        </div>
      </div>

      {/* Stats Cards */}
      <ManagerStatsCards stats={stats} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="pending-approvals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending-approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="approval-history">Approval History</TabsTrigger>
          <TabsTrigger value="team-summary">Team Payroll Summary</TabsTrigger>
        </TabsList>

        {/* Pending Approvals */}
        <TabsContent value="pending-approvals" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VariablePayApprovalTable
              entries={variablePayEntries}
              loading={loading}
              onApprove={(entry) => {
                setSelectedEntry(entry)
                setShowApprovalDialog(true)
              }}
              onReject={(entry) => {
                setSelectedEntry(entry)
                setShowRejectionDialog(true)
              }}
            />
          </div>
        </TabsContent>

        {/* Approval History */}
        <TabsContent value="approval-history" className="space-y-6">
          <ApprovalHistoryTable
            history={approvalHistory}
            loading={loading}
          />
        </TabsContent>

        {/* Team Payroll Summary */}
        <TabsContent value="team-summary" className="space-y-6">
          <TeamPayrollSummaryComponent
            summary={teamPayrollSummary}
            onViewDetails={(employee) => {
              setSelectedEmployee(employee)
              setShowSalaryBreakdownDialog(true)
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Variable Pay Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this variable pay entry?
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Employee:</span>
                    <p>{selectedEntry.employee.firstName} {selectedEntry.employee.lastName}</p>
                  </div>
                  <div>
                    <span className="font-medium">Amount:</span>
                    <p className="text-green-600 font-bold">₹{Number(selectedEntry.amount).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Type:</span>
                    <p>{selectedEntry.type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="font-medium">Description:</span>
                    <p>{selectedEntry.description}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => selectedEntry && handleApproveVariablePay(selectedEntry.id)}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Variable Pay Entry</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this variable pay entry.
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntry && (
            <RejectionForm
              entry={selectedEntry}
              onSubmit={(reason) => {
                handleRejectVariablePay(selectedEntry.id, reason)
              }}
              onCancel={() => setShowRejectionDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Correction Review Dialog */}
      <Dialog open={showCorrectionDialog} onOpenChange={setShowCorrectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Correction Request</DialogTitle>
            <DialogDescription>
              Review and take action on this correction request.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <CorrectionReviewForm
              request={selectedRequest}
              onSubmit={(status, comments) => {
                handleUpdateCorrectionRequest(selectedRequest.id, status, comments)
              }}
              onCancel={() => setShowCorrectionDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Salary Breakdown Dialog */}
      <SalaryBreakdownDialog 
        isOpen={showSalaryBreakdownDialog}
        onClose={() => setShowSalaryBreakdownDialog(false)}
        employee={selectedEmployee}
      />
    </div>
  )
}

// Rejection Form Component
function RejectionForm({ 
  entry, 
  onSubmit, 
  onCancel 
}: { 
  entry: VariablePayEntryWithEmployee
  onSubmit: (reason: string) => void
  onCancel: () => void
}) {
  const [reason, setReason] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (reason.trim()) {
      onSubmit(reason.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Employee:</span>
            <p>{entry.employee.firstName} {entry.employee.lastName}</p>
          </div>
          <div>
            <span className="font-medium">Amount:</span>
            <p className="text-green-600 font-bold">₹{Number(entry.amount).toLocaleString()}</p>
          </div>
          <div>
            <span className="font-medium">Type:</span>
            <p>{entry.type.replace('_', ' ')}</p>
          </div>
          <div>
            <span className="font-medium">Description:</span>
            <p>{entry.description}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Rejection Reason</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-2 border rounded-md"
          rows={3}
          placeholder="Please provide a reason for rejection..."
          required
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive" disabled={!reason.trim()}>
          <XCircle className="w-4 h-4 mr-2" />
          Reject
        </Button>
      </DialogFooter>
    </form>
  )
}

// Correction Review Form Component
function CorrectionReviewForm({ 
  request, 
  onSubmit, 
  onCancel 
}: { 
  request: PayrollCorrectionRequestWithEmployee
  onSubmit: (status: string, comments?: string) => void
  onCancel: () => void
}) {
  const [status, setStatus] = useState('')
  const [comments, setComments] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (status) {
      onSubmit(status, comments.trim() || undefined)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Employee:</span>
            <p>{request.employee.firstName} {request.employee.lastName}</p>
          </div>
          <div>
            <span className="font-medium">Type:</span>
            <p>{request.type.replace('_', ' ')}</p>
          </div>
          <div className="col-span-2">
            <span className="font-medium">Description:</span>
            <p>{request.description}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Action</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full p-2 border rounded-md"
          required
        >
          <option value="">Select action</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Approve</option>
          <option value="REJECTED">Reject</option>
          <option value="RESOLVED">Resolve</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Review Comments (Optional)</label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="w-full p-2 border rounded-md"
          rows={3}
          placeholder="Add your review comments..."
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!status}>
          Update Request
        </Button>
      </DialogFooter>
    </form>
  )
}

// Salary Breakdown Dialog
function SalaryBreakdownDialog({ 
  isOpen, 
  onClose, 
  employee 
}: { 
  isOpen: boolean
  onClose: () => void
  employee: TeamPayrollSummary | null
}) {
  if (!employee) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Salary Breakdown - {employee.employeeName}</DialogTitle>
          <DialogDescription>
            Detailed breakdown of earnings, deductions, and net salary.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Employee Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Employee ID:</span>
                <p>{employee.employeeId}</p>
              </div>
              <div>
                <span className="font-medium">Department:</span>
                <p>{employee.department}</p>
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div>
            <h3 className="font-medium mb-3 text-green-600">Earnings</h3>
            <div className="space-y-2">
              <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                <span>Basic Salary</span>
                <span className="font-medium">₹{employee.basicSalary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                <span>Allowances</span>
                <span className="font-medium">₹{employee.allowances.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-green-100 rounded-lg border-2 border-green-200">
                <span className="font-medium">Total Earnings</span>
                <span className="font-bold">₹{(employee.basicSalary + employee.allowances).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h3 className="font-medium mb-3 text-red-600">Deductions</h3>
            <div className="space-y-2">
              <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                <span>Total Deductions</span>
                <span className="font-medium">₹{employee.deductions.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Net Salary */}
          <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-blue-900">Net Salary</span>
              <span className="text-2xl font-bold text-blue-600">
                ₹{employee.netSalary.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
