'use client'

import { Button } from '@/components/ui/button'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DataTable } from '@/components/ui/data-table'
import type { PayrollInputWithEmployee } from '@/types'

interface PayrollPreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  payrollData: PayrollInputWithEmployee[]
}

export function PayrollPreviewDialog({ 
  isOpen, 
  onClose, 
  payrollData 
}: PayrollPreviewDialogProps) {
  const columns = [
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
      key: 'earnings',
      label: 'Earnings',
      render: (value: unknown, input: PayrollInputWithEmployee) => (
        <div className="text-green-600 font-medium">
          ₹{Number(input.totalEarnings).toLocaleString()}
        </div>
      ),
    },
    {
      key: 'deductions',
      label: 'Deductions',
      render: (value: unknown, input: PayrollInputWithEmployee) => (
        <div className="text-red-600 font-medium">
          ₹{Number(input.totalDeductions).toLocaleString()}
        </div>
      ),
    },
    {
      key: 'netSalary',
      label: 'Net Salary',
      render: (value: unknown, input: PayrollInputWithEmployee) => (
        <div className="text-blue-600 font-bold">
          ₹{Number(Number(input.totalEarnings) - Number(input.totalDeductions)).toLocaleString()}
        </div>
      ),
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Payroll Preview</DialogTitle>
          <DialogDescription>
            Review payroll calculations before finalization.
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-96 overflow-y-auto">
          <DataTable
            data={payrollData}
            columns={columns}
            loading={false}
            emptyMessage="No payroll data to preview"
            searchable={true}
            searchPlaceholder="Search by employee name..."
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button>
            Proceed to Finalization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

