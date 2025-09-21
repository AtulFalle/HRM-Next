'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { PayrollWithEmployee } from '@/types'

interface CorrectionRequestFormProps {
  isOpen: boolean
  onClose: () => void
  payroll: PayrollWithEmployee | null
  onSubmit: (type: string, description: string) => void
}

export function CorrectionRequestForm({ 
  isOpen, 
  onClose, 
  onSubmit 
}: CorrectionRequestFormProps) {
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (type && description) {
      onSubmit(type, description)
      setType('')
      setDescription('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Payroll Correction</DialogTitle>
          <DialogDescription>
            Submit a correction request for the selected payroll period.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Correction Type</Label>
            <select
              id="type"
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded-md"
              rows={4}
              placeholder="Please describe the issue in detail..."
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!type || !description}>
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

