'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { User, Plus, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { PayslipViewer } from './payslip-viewer'
import { EmployeeStatsCards } from './employee/EmployeeStatsCards'
import { PayslipHistoryTable } from './employee/PayslipHistoryTable'
import { SalaryBreakdownTable } from './employee/SalaryBreakdownTable'
import { CorrectionRequestForm } from './employee/CorrectionRequestForm'
import type { 
  PayslipWithEmployee,
  PayrollCorrectionRequestWithEmployee,
  PayrollWithEmployee
} from '@/types'

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

export function EmployeePayrollPortal() {
  const { data: session } = useSession()
  const [payslips, setPayslips] = useState<PayslipWithEmployee[]>([])
  const [correctionRequests, setCorrectionRequests] = useState<PayrollCorrectionRequestWithEmployee[]>([])
  const [payrollHistory, setPayrollHistory] = useState<PayrollWithEmployee[]>([])
  const [salaryBreakdowns, setSalaryBreakdowns] = useState<SalaryBreakdown[]>([])
  const [loading, setLoading] = useState(false)
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false)
  const [showSalaryBreakdownDialog, setShowSalaryBreakdownDialog] = useState(false)
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollWithEmployee | null>(null)
  const [selectedSalaryBreakdown, setSelectedSalaryBreakdown] = useState<SalaryBreakdown | null>(null)

  useEffect(() => {
    fetchEmployeeData()
  }, [])

  const fetchEmployeeData = async () => {
    if (!session?.user?.employee?.id) return

    setLoading(true)
    try {
      const [payslipsRes, correctionsRes, payrollRes] = await Promise.all([
        fetch('/api/payroll/payslips'),
        fetch('/api/payroll/corrections'),
        fetch('/api/payroll'),
      ])

      const [payslipsData, correctionsData, payrollData] = await Promise.all([
        payslipsRes.json(),
        correctionsRes.json(),
        payrollRes.json(),
      ])

      if (payslipsData.success) setPayslips(payslipsData.data.payslips)
      if (correctionsData.success) setCorrectionRequests(correctionsData.data.correctionRequests)
      if (payrollData.success) setPayrollHistory(payrollData.data.payrollRecords)

      // Fetch salary breakdowns
      fetchSalaryBreakdowns()
    } catch (error) {
      console.error('Error fetching employee data:', error)
      toast.error('Failed to fetch payroll data')
    } finally {
      setLoading(false)
    }
  }

  const fetchSalaryBreakdowns = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockBreakdowns: SalaryBreakdown[] = [
        {
          id: '1',
          month: 12,
          year: 2024,
          basicSalary: 80000,
          hra: 24000,
          allowances: 15000,
          variablePay: 10000,
          totalEarnings: 129000,
          pf: 9600,
          esi: 1935,
          tax: 15000,
          insurance: 2000,
          otherDeductions: 1000,
          totalDeductions: 29535,
          netSalary: 99465
        },
        {
          id: '2',
          month: 11,
          year: 2024,
          basicSalary: 80000,
          hra: 24000,
          allowances: 12000,
          variablePay: 5000,
          totalEarnings: 121000,
          pf: 9600,
          esi: 1815,
          tax: 12000,
          insurance: 2000,
          otherDeductions: 1000,
          totalDeductions: 26415,
          netSalary: 94585
        }
      ]
      setSalaryBreakdowns(mockBreakdowns)
    } catch (error) {
      console.error('Error fetching salary breakdowns:', error)
    }
  }

  const handleCreateCorrectionRequest = async (payrollId: string, type: string, description: string) => {
    try {
      const response = await fetch('/api/payroll/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payrollId,
          type,
          description,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Correction request submitted successfully')
        fetchEmployeeData()
        setShowCorrectionDialog(false)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error creating correction request:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit correction request')
    }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Payroll</h1>
          <p className="text-gray-600">View your payslips and manage payroll-related requests</p>
        </div>
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">
            {session?.user?.employee?.employeeId}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <EmployeeStatsCards
        payslipsCount={payslips ? payslips.length : 0}
        pendingRequestsCount={correctionRequests.filter(r => r.status === 'PENDING' || r.status === 'UNDER_REVIEW').length}
        latestNetSalary={payrollHistory && payrollHistory.length > 0 
          ? `₹${Number(payrollHistory[0].netSalary).toLocaleString()}`
          : 'N/A'
        }
      />

      {/* Main Content Tabs */}
      <Tabs defaultValue="payslips" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payslips">Payslip History</TabsTrigger>
          <TabsTrigger value="salary-breakdown">Salary Breakdown</TabsTrigger>
          <TabsTrigger value="corrections">Correction Requests</TabsTrigger>
        </TabsList>

        {/* Payslip History */}
        <TabsContent value="payslips" className="space-y-6">
          <PayslipHistoryTable
            payslips={payslips}
            loading={loading}
            onDownload={async (payslip) => {
              try {
                const response = await fetch(`/api/payroll/payslips/${payslip.id}/download`)
                if (!response.ok) {
                  throw new Error('Failed to download payslip')
                }
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
              } catch (error) {
                console.error('Error downloading payslip:', error)
                toast.error('Failed to download payslip')
              }
            }}
          />
        </TabsContent>

        {/* Salary Breakdown */}
        <TabsContent value="salary-breakdown" className="space-y-6">
          <SalaryBreakdownTable
            breakdowns={salaryBreakdowns}
            loading={loading}
            onViewDetails={(breakdown) => {
              setSelectedSalaryBreakdown(breakdown)
              setShowSalaryBreakdownDialog(true)
            }}
          />
        </TabsContent>

        {/* Correction Requests */}
        <TabsContent value="corrections" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Correction Requests
              </CardTitle>
              <Button onClick={() => setShowCorrectionDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                data={correctionRequests}
                columns={correctionRequestColumns}
                loading={loading}
                emptyMessage="No correction requests found"
                searchable={true}
                searchPlaceholder="Search by type or description..."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Correction Request Dialog */}
      <CorrectionRequestForm
        isOpen={showCorrectionDialog}
        onClose={() => setShowCorrectionDialog(false)}
        payroll={selectedPayroll}
        onSubmit={(type, description) => {
          if (selectedPayroll) {
            handleCreateCorrectionRequest(selectedPayroll.id, type, description)
          }
        }}
      />

      {/* Salary Breakdown Dialog */}
      <SalaryBreakdownDialog 
        isOpen={showSalaryBreakdownDialog}
        onClose={() => setShowSalaryBreakdownDialog(false)}
        breakdown={selectedSalaryBreakdown}
      />
    </div>
  )
}

// Correction Request Form Component
function CorrectionRequestForm({ 
  payroll, 
  onSubmit, 
  onCancel 
}: { 
  payroll: PayrollWithEmployee
  onSubmit: (type: string, description: string) => void
  onCancel: () => void
}) {
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (type && description) {
      onSubmit(type, description)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Correction Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full p-2 border rounded-md"
          required
        >
          <option value="">Select type</option>
          <option value="SALARY_DISPUTE">Salary Dispute</option>
          <option value="ATTENDANCE_DISPUTE">Attendance Dispute</option>
          <option value="DEDUCTION_ERROR">Deduction Error</option>
          <option value="ALLOWANCE_MISSING">Allowance Missing</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded-md"
          rows={4}
          placeholder="Please describe the issue in detail..."
          required
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!type || !description}>
          Submit Request
        </Button>
      </DialogFooter>
    </form>
  )
}

// Salary Breakdown Dialog
function SalaryBreakdownDialog({ 
  isOpen, 
  onClose, 
  breakdown 
}: { 
  isOpen: boolean
  onClose: () => void
  breakdown: SalaryBreakdown | null
}) {
  if (!breakdown) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-96">
        <SheetHeader>
          <SheetTitle>Salary Breakdown</SheetTitle>
          <SheetDescription>
            Detailed breakdown for {new Date(breakdown.year, breakdown.month - 1).toLocaleDateString('en-IN', {
              month: 'long',
              year: 'numeric',
            })}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Earnings */}
          <div>
            <h3 className="font-medium mb-3 text-green-600 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Earnings
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between p-2 bg-green-50 rounded">
                <span className="text-sm">Basic Salary</span>
                <span className="font-medium">₹{breakdown.basicSalary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 bg-green-50 rounded">
                <span className="text-sm">HRA</span>
                <span className="font-medium">₹{breakdown.hra.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 bg-green-50 rounded">
                <span className="text-sm">Allowances</span>
                <span className="font-medium">₹{breakdown.allowances.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 bg-green-50 rounded">
                <span className="text-sm">Variable Pay</span>
                <span className="font-medium">₹{breakdown.variablePay.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 bg-green-100 rounded border-2 border-green-200">
                <span className="font-medium">Total Earnings</span>
                <span className="font-bold">₹{breakdown.totalEarnings.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h3 className="font-medium mb-3 text-red-600 flex items-center">
              <TrendingDown className="w-4 h-4 mr-2" />
              Deductions
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between p-2 bg-red-50 rounded">
                <span className="text-sm">PF</span>
                <span className="font-medium">₹{breakdown.pf.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 bg-red-50 rounded">
                <span className="text-sm">ESI</span>
                <span className="font-medium">₹{breakdown.esi.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 bg-red-50 rounded">
                <span className="text-sm">Tax</span>
                <span className="font-medium">₹{breakdown.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 bg-red-50 rounded">
                <span className="text-sm">Insurance</span>
                <span className="font-medium">₹{breakdown.insurance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 bg-red-50 rounded">
                <span className="text-sm">Other Deductions</span>
                <span className="font-medium">₹{breakdown.otherDeductions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 bg-red-100 rounded border-2 border-red-200">
                <span className="font-medium">Total Deductions</span>
                <span className="font-bold">₹{breakdown.totalDeductions.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Net Salary */}
          <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-blue-900">Net Salary</span>
              <span className="text-2xl font-bold text-blue-600">
                ₹{breakdown.netSalary.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}