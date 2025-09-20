'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Calculator,
  DollarSign,
  Minus,
  Plus,
  Save,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CreatePayrollInputData } from '@/types'

const payrollInputSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  month: z.number().min(1).max(12, 'Month must be between 1 and 12'),
  year: z.number().min(2020).max(2030, 'Year must be between 2020 and 2030'),
  basicSalary: z.number().min(0, 'Basic salary must be positive'),
  hra: z.number().min(0, 'HRA must be positive').default(0),
  variablePay: z.number().min(0, 'Variable pay must be positive').default(0),
  overtime: z.number().min(0, 'Overtime must be positive').default(0),
  bonus: z.number().min(0, 'Bonus must be positive').default(0),
  allowances: z.number().min(0, 'Allowances must be positive').default(0),
  pf: z.number().min(0, 'PF must be positive').default(0),
  esi: z.number().min(0, 'ESI must be positive').default(0),
  tax: z.number().min(0, 'Tax must be positive').default(0),
  insurance: z.number().min(0, 'Insurance must be positive').default(0),
  leaveDeduction: z.number().min(0, 'Leave deduction must be positive').default(0),
  otherDeductions: z.number().min(0, 'Other deductions must be positive').default(0),
  workingDays: z.number().min(0, 'Working days must be positive').default(0),
  presentDays: z.number().min(0, 'Present days must be positive').default(0),
  leaveDays: z.number().min(0, 'Leave days must be positive').default(0),
  notes: z.string().optional(),
})

type PayrollInputFormData = z.infer<typeof payrollInputSchema>

interface PayrollInputFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  employeeId?: string
  month?: number
  year?: number
  initialData?: Partial<CreatePayrollInputData>
}

export function PayrollInputForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  employeeId,
  month = new Date().getMonth() + 1,
  year = new Date().getFullYear(),
  initialData 
}: PayrollInputFormProps) {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [calculations, setCalculations] = useState({
    totalEarnings: 0,
    totalDeductions: 0,
    netSalary: 0,
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PayrollInputFormData>({
    resolver: zodResolver(payrollInputSchema),
    defaultValues: {
      employeeId: employeeId || '',
      month,
      year,
      basicSalary: initialData?.basicSalary || 0,
      hra: initialData?.hra || 0,
      variablePay: initialData?.variablePay || 0,
      overtime: initialData?.overtime || 0,
      bonus: initialData?.bonus || 0,
      allowances: initialData?.allowances || 0,
      pf: initialData?.pf || 0,
      esi: initialData?.esi || 0,
      tax: initialData?.tax || 0,
      insurance: initialData?.insurance || 0,
      leaveDeduction: initialData?.leaveDeduction || 0,
      otherDeductions: initialData?.otherDeductions || 0,
      workingDays: initialData?.workingDays || 0,
      presentDays: initialData?.presentDays || 0,
      leaveDays: initialData?.leaveDays || 0,
      notes: initialData?.notes || '',
    },
  })

  const watchedValues = watch()

  // Memoize the specific fields we need for calculations
  const calculationFields = useMemo(() => ({
    basicSalary: watchedValues.basicSalary || 0,
    hra: watchedValues.hra || 0,
    variablePay: watchedValues.variablePay || 0,
    overtime: watchedValues.overtime || 0,
    bonus: watchedValues.bonus || 0,
    allowances: watchedValues.allowances || 0,
    pf: watchedValues.pf || 0,
    esi: watchedValues.esi || 0,
    tax: watchedValues.tax || 0,
    insurance: watchedValues.insurance || 0,
    leaveDeduction: watchedValues.leaveDeduction || 0,
    otherDeductions: watchedValues.otherDeductions || 0,
  }), [
    watchedValues.basicSalary,
    watchedValues.hra,
    watchedValues.variablePay,
    watchedValues.overtime,
    watchedValues.bonus,
    watchedValues.allowances,
    watchedValues.pf,
    watchedValues.esi,
    watchedValues.tax,
    watchedValues.insurance,
    watchedValues.leaveDeduction,
    watchedValues.otherDeductions,
  ])

  useEffect(() => {
    if (isOpen) {
      fetchEmployees()
    }
  }, [isOpen])

  useEffect(() => {
    calculateTotals()
  }, [calculationFields])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      const data = await response.json()
      if (data.success) {
        setEmployees(data.data.employees || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const calculateTotals = () => {
    const { basicSalary, hra, variablePay, overtime, bonus, allowances, pf, esi, tax, insurance, leaveDeduction, otherDeductions } = calculationFields

    const totalEarnings = basicSalary + hra + variablePay + overtime + bonus + allowances
    const totalDeductions = pf + esi + tax + insurance + leaveDeduction + otherDeductions
    const netSalary = totalEarnings - totalDeductions

    setCalculations({ totalEarnings, totalDeductions, netSalary })
  }

  const onSubmit = async (data: PayrollInputFormData) => {
    try {
      setLoading(true)
      const response = await fetch('/api/payroll/inputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Payroll input created successfully')
        onSuccess()
        onClose()
        reset()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error creating payroll input:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create payroll input')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Payroll Input</DialogTitle>
          <DialogDescription>
            Enter payroll details for the selected employee and period.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Employee and Period Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Employee & Period</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee</Label>
                <Select
                  value={watchedValues.employeeId}
                  onValueChange={(value) => setValue('employeeId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName} ({employee.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.employeeId && (
                  <p className="text-sm text-red-600">{errors.employeeId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="month">Month</Label>
                <Select
                  value={watchedValues.month.toString()}
                  onValueChange={(value) => setValue('month', parseInt(value))}
                >
                  <SelectTrigger>
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
                {errors.month && (
                  <p className="text-sm text-red-600">{errors.month.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  type="number"
                  {...register('year', { valueAsNumber: true })}
                  min="2020"
                  max="2030"
                />
                {errors.year && (
                  <p className="text-sm text-red-600">{errors.year.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Earnings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-green-700">Earnings</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basicSalary">Basic Salary</Label>
                <Input
                  type="number"
                  {...register('basicSalary', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.basicSalary && (
                  <p className="text-sm text-red-600">{errors.basicSalary.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hra">HRA</Label>
                <Input
                  type="number"
                  {...register('hra', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.hra && (
                  <p className="text-sm text-red-600">{errors.hra.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="variablePay">Variable Pay</Label>
                <Input
                  type="number"
                  {...register('variablePay', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.variablePay && (
                  <p className="text-sm text-red-600">{errors.variablePay.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="overtime">Overtime</Label>
                <Input
                  type="number"
                  {...register('overtime', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.overtime && (
                  <p className="text-sm text-red-600">{errors.overtime.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bonus">Bonus</Label>
                <Input
                  type="number"
                  {...register('bonus', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.bonus && (
                  <p className="text-sm text-red-600">{errors.bonus.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowances">Allowances</Label>
                <Input
                  type="number"
                  {...register('allowances', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.allowances && (
                  <p className="text-sm text-red-600">{errors.allowances.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Deductions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-red-700">Deductions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pf">Provident Fund (PF)</Label>
                <Input
                  type="number"
                  {...register('pf', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.pf && (
                  <p className="text-sm text-red-600">{errors.pf.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="esi">ESI</Label>
                <Input
                  type="number"
                  {...register('esi', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.esi && (
                  <p className="text-sm text-red-600">{errors.esi.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax">Income Tax (TDS)</Label>
                <Input
                  type="number"
                  {...register('tax', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.tax && (
                  <p className="text-sm text-red-600">{errors.tax.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance">Insurance</Label>
                <Input
                  type="number"
                  {...register('insurance', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.insurance && (
                  <p className="text-sm text-red-600">{errors.insurance.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaveDeduction">Leave Deduction</Label>
                <Input
                  type="number"
                  {...register('leaveDeduction', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.leaveDeduction && (
                  <p className="text-sm text-red-600">{errors.leaveDeduction.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherDeductions">Other Deductions</Label>
                <Input
                  type="number"
                  {...register('otherDeductions', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.otherDeductions && (
                  <p className="text-sm text-red-600">{errors.otherDeductions.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attendance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attendance</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workingDays">Working Days</Label>
                <Input
                  type="number"
                  {...register('workingDays', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.workingDays && (
                  <p className="text-sm text-red-600">{errors.workingDays.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="presentDays">Present Days</Label>
                <Input
                  type="number"
                  {...register('presentDays', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.presentDays && (
                  <p className="text-sm text-red-600">{errors.presentDays.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaveDays">Leave Days</Label>
                <Input
                  type="number"
                  {...register('leaveDays', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.leaveDays && (
                  <p className="text-sm text-red-600">{errors.leaveDays.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {formatCurrency(calculations.totalEarnings)}
                  </div>
                  <div className="text-sm text-green-600">Total Earnings</div>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">
                    {formatCurrency(calculations.totalDeductions)}
                  </div>
                  <div className="text-sm text-red-600">Total Deductions</div>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">
                    {formatCurrency(calculations.netSalary)}
                  </div>
                  <div className="text-sm text-blue-600">Net Salary</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              {...register('notes')}
              placeholder="Add any additional notes..."
              rows={3}
            />
            {errors.notes && (
              <p className="text-sm text-red-600">{errors.notes.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Payroll Input
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
