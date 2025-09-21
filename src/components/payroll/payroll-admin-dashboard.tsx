'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/ui/data-table'
import type { PayrollCorrectionRequestWithEmployee } from '@/types'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { 
  Plus, 
  Upload,
  AlertCircle,
  ChevronRight,
  FileSpreadsheet,
  FileDown,
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Lock
} from 'lucide-react'
import { toast } from 'sonner'
import { PayrollInputForm } from './payroll-input-form'
import { PayrollStatsCards } from './admin/PayrollStatsCards'
import { PayrollCycleTable } from './admin/PayrollCycleTable'
import { NewPayrollCycleDialog } from './admin/NewPayrollCycleDialog'
import { PayrollPreviewDialog } from './admin/PayrollPreviewDialog'
import { ValidationErrorDrawer } from './admin/ValidationErrorDrawer'
import type { 
  PayrollDashboardStats, 
  PayrollInputWithEmployee, 
  VariablePayEntryWithEmployee
} from '@/types'

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

interface PayrollValidationError {
  id: string
  type: 'ERROR' | 'WARNING'
  message: string
  employeeId?: string
  field?: string
  details?: string
}

interface PayrollAdminDashboardProps {
  initialStats?: PayrollDashboardStats
}

export function PayrollAdminDashboard({ initialStats }: PayrollAdminDashboardProps) {
  const [stats, setStats] = useState<PayrollDashboardStats | null>(initialStats || null)
  const [payrollInputs, setPayrollInputs] = useState<PayrollInputWithEmployee[]>([])
  const [variablePayEntries, setVariablePayEntries] = useState<VariablePayEntryWithEmployee[]>([])
  const [correctionRequests, setCorrectionRequests] = useState<PayrollCorrectionRequestWithEmployee[]>([])
  const [payslips, setPayslips] = useState<unknown[]>([])
  const [payrollCycles, setPayrollCycles] = useState<PayrollCycle[]>([])
  const [validationErrors, setValidationErrors] = useState<PayrollValidationError[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Form states
  const [showPayrollInputDialog, setShowPayrollInputDialog] = useState(false)
  const [showNewCycleDialog, setShowNewCycleDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showValidationDrawer, setShowValidationDrawer] = useState(false)
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false)
  const [selectedCycle, setSelectedCycle] = useState<PayrollCycle | null>(null)
  const [selectedError, setSelectedError] = useState<PayrollValidationError | null>(null)

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, inputsRes, variablePayRes, correctionsRes, payslipsRes] = await Promise.all([
        fetch(`/api/payroll/dashboard?month=${selectedMonth}&year=${selectedYear}`),
        fetch(`/api/payroll/inputs?month=${selectedMonth}&year=${selectedYear}`),
        fetch('/api/payroll/variable-pay?status=PENDING'),
        fetch('/api/payroll/corrections?status=PENDING'),
        fetch(`/api/payroll/payslips?month=${selectedMonth}&year=${selectedYear}`),
      ])

      const [statsData, inputsData, variablePayData, correctionsData, payslipsData] = await Promise.all([
        statsRes.json(),
        inputsRes.json(),
        variablePayRes.json(),
        correctionsRes.json(),
        payslipsRes.json(),
      ])

      if (statsData.success) setStats(statsData.data.dashboardStats)
      if (inputsData.success) setPayrollInputs(inputsData.data.payrollInputs)
      if (variablePayData.success) setVariablePayEntries(variablePayData.data.variablePayEntries)
      if (correctionsData.success) setCorrectionRequests(correctionsData.data.correctionRequests)
      if (payslipsData.success) setPayslips(payslipsData.data.payslips)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    fetchDashboardData()
    fetchPayrollCycles()
    fetchValidationErrors()
  }, [fetchDashboardData])

  const fetchPayrollCycles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/payroll/cycles')
      const data = await response.json()
      
      if (data.success) {
        setPayrollCycles(data.data.cycles)
      } else {
        console.error('Error fetching payroll cycles:', data.error)
        toast.error('Failed to fetch payroll cycles')
      }
    } catch (error) {
      console.error('Error fetching payroll cycles:', error)
      toast.error('Failed to fetch payroll cycles')
    } finally {
      setLoading(false)
    }
  }

  const fetchValidationErrors = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockErrors: PayrollValidationError[] = [
        {
          id: '1',
          type: 'ERROR',
          message: 'Missing attendance data for employee EMP001',
          employeeId: 'EMP001',
          field: 'attendance',
          details: 'Employee John Doe has no attendance records for December 2024'
        },
        {
          id: '2',
          type: 'WARNING',
          message: 'Variable pay exceeds 50% of basic salary',
          employeeId: 'EMP002',
          field: 'variablePay',
          details: 'Variable pay of ₹50,000 exceeds 50% of basic salary ₹80,000'
        }
      ]
      setValidationErrors(mockErrors)
    } catch (error) {
      console.error('Error fetching validation errors:', error)
    }
  }


  const handleCreateNewCycle = async (month: number, year: number, notes?: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/payroll/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year, notes }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setPayrollCycles(prev => [data.data, ...prev])
        toast.success('New payroll cycle created successfully')
        setShowNewCycleDialog(false)
      } else {
        console.error('Error creating payroll cycle:', data.error)
        toast.error(data.error || 'Failed to create payroll cycle')
      }
    } catch (error) {
      console.error('Error creating payroll cycle:', error)
      toast.error('Failed to create payroll cycle')
    } finally {
      setLoading(false)
    }
  }

  const handleFinalizePayroll = async (cycleId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/payroll/cycles/${cycleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'FINALIZED' }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setPayrollCycles(prev => prev.map(cycle => 
          cycle.id === cycleId 
            ? { ...cycle, status: 'FINALIZED' as const, finalizedAt: new Date().toISOString() }
            : cycle
        ))
        toast.success('Payroll cycle finalized successfully')
      } else {
        console.error('Error finalizing payroll:', data.error)
        toast.error(data.error || 'Failed to finalize payroll')
      }
    } catch (error) {
      console.error('Error finalizing payroll:', error)
      toast.error('Failed to finalize payroll')
    } finally {
      setLoading(false)
    }
  }

  const handleExportPayroll = async (format: 'CSV' | 'EXCEL' | 'PDF') => {
    try {
      setLoading(true)
      const response = await fetch('/api/payroll/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: format.toLowerCase(),
          format: 'payroll-summary',
          month: selectedMonth,
          year: selectedYear,
        }),
      })
      
      if (format === 'CSV') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `payroll-summary-${selectedMonth}-${selectedYear}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Payroll data exported as CSV')
      } else {
        const data = await response.json()
        if (data.success) {
          // Handle Excel/PDF export
          toast.success(`Payroll data exported as ${format}`)
        } else {
          toast.error(data.error || 'Failed to export payroll data')
        }
      }
    } catch (error) {
      console.error('Error exporting payroll:', error)
      toast.error('Failed to export payroll data')
    } finally {
      setLoading(false)
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
        fetchDashboardData()
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
        fetchDashboardData()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error rejecting variable pay:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to reject variable pay')
    }
  }


  const payrollInputColumns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (value: unknown, input: PayrollInputWithEmployee) => (
        <div>
          <div className="font-medium">{input.employee.firstName} {input.employee.lastName}</div>
          <div className="text-sm text-gray-500">{input.employee.employeeId}</div>
        </div>
      ),
    },
    {
      key: 'period',
      label: 'Period',
      render: (value: unknown, input: PayrollInputWithEmployee) => (
        <div className="text-sm">
          {new Date(input.year, input.month - 1).toLocaleDateString('en-IN', {
            month: 'long',
            year: 'numeric',
          })}
        </div>
      ),
    },
    {
      key: 'earnings',
      label: 'Total Earnings',
      render: (value: unknown, input: PayrollInputWithEmployee) => (
        <div className="font-medium text-green-600">
          ₹{Number(input.totalEarnings).toLocaleString()}
        </div>
      ),
    },
    {
      key: 'deductions',
      label: 'Total Deductions',
      render: (value: unknown, input: PayrollInputWithEmployee) => (
        <div className="font-medium text-red-600">
          ₹{Number(input.totalDeductions).toLocaleString()}
        </div>
      ),
    },
    {
      key: 'netSalary',
      label: 'Net Salary',
      render: (value: unknown, input: PayrollInputWithEmployee) => (
        <div className="font-bold text-blue-600">
          ₹{Number(Number(input.totalEarnings) - Number(input.totalDeductions)).toLocaleString()}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: unknown, input: PayrollInputWithEmployee) => (
        <Badge variant={
          input.status === 'PROCESSED' ? 'default' :
          input.status === 'APPROVED' ? 'secondary' :
          input.status === 'REJECTED' ? 'destructive' : 'outline'
        }>
          {input.status}
        </Badge>
      ),
    },
  ]

  const variablePayColumns = [
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

  const variablePayActions = [
    {
      label: 'Approve',
      icon: <CheckCircle className="w-4 h-4" />,
      onClick: (entry: VariablePayEntryWithEmployee) => handleApproveVariablePay(entry.id),
      variant: 'default' as const,
    },
    {
      label: 'Reject',
      icon: <XCircle className="w-4 h-4" />,
      onClick: (entry: VariablePayEntryWithEmployee) => {
        const reason = prompt('Enter rejection reason:')
        if (reason) handleRejectVariablePay(entry.id, reason)
      },
      variant: 'destructive' as const,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Administration</h1>
          <p className="text-gray-600">Comprehensive payroll management and processing</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="month">Month:</Label>
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {new Date(0, i).toLocaleDateString('en-IN', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="year">Year:</Label>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setShowNewCycleDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Cycle
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <PayrollStatsCards stats={stats} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="payroll-cycles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="payroll-cycles">Payroll Cycles</TabsTrigger>
          <TabsTrigger value="input-collection">Input Collection</TabsTrigger>
          <TabsTrigger value="validation">Validation & Errors</TabsTrigger>
          <TabsTrigger value="preview-finalize">Preview & Finalize</TabsTrigger>
          <TabsTrigger value="reports">Reports & Exports</TabsTrigger>
        </TabsList>

        {/* Payroll Cycle Overview */}
        <TabsContent value="payroll-cycles" className="space-y-6">
          <PayrollCycleTable
            cycles={payrollCycles}
            loading={loading}
            onView={(cycle) => {
              setSelectedCycle(cycle)
              // Handle view action
            }}
            onEdit={(cycle) => {
              setSelectedCycle(cycle)
              // Handle edit action
            }}
            onFinalize={handleFinalizePayroll}
          />
        </TabsContent>

        {/* Input Collection */}
        <TabsContent value="input-collection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Input Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="attendance" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                  <TabsTrigger value="leave">Leave</TabsTrigger>
                  <TabsTrigger value="variable-pay">Variable Pay</TabsTrigger>
                  <TabsTrigger value="deductions">Deductions</TabsTrigger>
                </TabsList>

                <TabsContent value="attendance" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Attendance Data</h3>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Bulk Upload
                      </Button>
                      <Button size="sm" onClick={() => setShowPayrollInputDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Entry
                      </Button>
                    </div>
                  </div>
                  <DataTable
                    data={payrollInputs}
                    columns={payrollInputColumns}
                    loading={loading}
                    emptyMessage="No attendance data found"
                    searchable={true}
                    searchPlaceholder="Search by employee name..."
                  />
                </TabsContent>

                <TabsContent value="leave" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Leave Data</h3>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Bulk Upload
                      </Button>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Entry
                      </Button>
                    </div>
                  </div>
                  <DataTable
                    data={[]}
                    columns={[]}
                    loading={loading}
                    emptyMessage="No leave data found"
                    searchable={true}
                    searchPlaceholder="Search by employee name..."
                  />
                </TabsContent>

                <TabsContent value="variable-pay" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Variable Pay Entries</h3>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Bulk Upload
                      </Button>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Entry
                      </Button>
                    </div>
                  </div>
                  <DataTable
                    data={variablePayEntries}
                    columns={variablePayColumns}
                    actions={variablePayActions}
                    loading={loading}
                    emptyMessage="No variable pay entries found"
                    searchable={true}
                    searchPlaceholder="Search by employee name or type..."
                  />
                </TabsContent>

                <TabsContent value="deductions" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Deductions</h3>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Bulk Upload
                      </Button>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Entry
                      </Button>
                    </div>
                  </div>
                  <DataTable
                    data={[]}
                    columns={[]}
                    loading={loading}
                    emptyMessage="No deductions found"
                    searchable={true}
                    searchPlaceholder="Search by employee name..."
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation & Errors */}
        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Validation & Errors</CardTitle>
              <Button variant="outline" onClick={() => setShowValidationDrawer(true)}>
                <AlertCircle className="w-4 h-4 mr-2" />
                View All Errors
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <h3 className="font-medium text-red-900">Errors</h3>
                  </div>
                  <p className="text-2xl font-bold text-red-600 mt-2">
                    {validationErrors ? validationErrors.filter(e => e.type === 'ERROR').length : 0}
                  </p>
                  <p className="text-sm text-red-600 mt-1">Critical issues that must be resolved</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <h3 className="font-medium text-yellow-900">Warnings</h3>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600 mt-2">
                    {validationErrors ? validationErrors.filter(e => e.type === 'WARNING').length : 0}
                  </p>
                  <p className="text-sm text-yellow-600 mt-1">Issues that should be reviewed</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="font-medium mb-4">Recent Validation Issues</h3>
                <div className="space-y-2">
                  {validationErrors.slice(0, 5).map((error) => (
                    <div 
                      key={error.id}
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setSelectedError(error)
                        setShowValidationDrawer(true)
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        {error.type === 'ERROR' ? (
                          <XCircle className="w-4 h-4 text-red-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                        )}
                        <div>
                          <p className="font-medium">{error.message}</p>
                          {error.employeeId && (
                            <p className="text-sm text-gray-500">Employee: {error.employeeId}</p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview & Finalize */}
        <TabsContent value="preview-finalize" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Payroll Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Preview payroll calculations before finalization.
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => setShowPreviewDialog(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Payroll
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  Finalize Payroll
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Finalize and lock the payroll cycle.
                </p>
                <ConfirmationDialog
                  open={showFinalizeDialog}
                  onOpenChange={setShowFinalizeDialog}
                  title="Finalize Payroll"
                  description="Are you sure you want to finalize this payroll cycle? This action cannot be undone."
                  onConfirm={() => selectedCycle && handleFinalizePayroll(selectedCycle.id)}
                  variant="destructive"
                />
                <Button 
                  className="w-full" 
                  variant="destructive"
                  onClick={() => setShowFinalizeDialog(true)}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Finalize Payroll
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports & Exports */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reports & Exports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleExportPayroll('CSV')}
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <FileSpreadsheet className="w-6 h-6" />
                  <span>Export CSV</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExportPayroll('EXCEL')}
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <FileDown className="w-6 h-6" />
                  <span>Export Excel</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExportPayroll('PDF')}
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <FileText className="w-6 h-6" />
                  <span>Export PDF</span>
                </Button>
              </div>
              
              <div className="mt-6">
                <h3 className="font-medium mb-4">Filter Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department-filter">Department</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="hr">Human Resources</SelectItem>
                        <SelectItem value="it">Information Technology</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date-range">Date Range</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current-month">Current Month</SelectItem>
                        <SelectItem value="last-month">Last Month</SelectItem>
                        <SelectItem value="quarter">This Quarter</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs and Modals */}
      <NewPayrollCycleDialog 
        isOpen={showNewCycleDialog}
        onClose={() => setShowNewCycleDialog(false)}
        onSubmit={handleCreateNewCycle}
      />
      
      <PayrollPreviewDialog 
        isOpen={showPreviewDialog}
        onClose={() => setShowPreviewDialog(false)}
        payrollData={payrollInputs}
      />
      
      <ValidationErrorDrawer 
        isOpen={showValidationDrawer}
        onClose={() => setShowValidationDrawer(false)}
        errors={validationErrors}
        selectedError={selectedError}
        onSelectError={setSelectedError}
      />

      <PayrollInputForm
        isOpen={showPayrollInputDialog}
        onClose={() => setShowPayrollInputDialog(false)}
        onSuccess={fetchDashboardData}
        month={selectedMonth}
        year={selectedYear}
      />
    </div>
  )
}

