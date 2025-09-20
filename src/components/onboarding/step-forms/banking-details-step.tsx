'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCard } from 'lucide-react'
import { toast } from 'sonner'

const bankingDetailsSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  ifscCode: z.string().min(1, 'IFSC code is required'),
  accountHolderName: z.string().min(1, 'Account holder name is required'),
  accountType: z.enum(['SAVINGS', 'CURRENT']),
  branchName: z.string().min(1, 'Branch name is required'),
  panNumber: z.string().min(10, 'PAN number is required').max(10, 'PAN number must be 10 characters'),
  aadhaarNumber: z.string().min(12, 'Aadhaar number must be 12 digits').max(12, 'Aadhaar number must be 12 digits')
})

type BankingDetailsForm = z.infer<typeof bankingDetailsSchema>

interface BankingDetailsStepProps {
  stepId: string
  initialData?: Record<string, unknown>
  onSave: (stepId: string, data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  disabled?: boolean
}

export function BankingDetailsStep({ 
  stepId, 
  initialData = {}, 
  onSave, 
  onCancel,
  disabled = false
}: BankingDetailsStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<BankingDetailsForm>({
    resolver: zodResolver(bankingDetailsSchema),
    defaultValues: {
      bankName: (initialData?.bankName as string) || '',
      accountNumber: (initialData?.accountNumber as string) || '',
      ifscCode: (initialData?.ifscCode as string) || '',
      accountHolderName: (initialData?.accountHolderName as string) || '',
      accountType: (initialData?.accountType as 'SAVINGS' | 'CURRENT') || undefined,
      branchName: (initialData?.branchName as string) || '',
      panNumber: (initialData?.panNumber as string) || '',
      aadhaarNumber: (initialData?.aadhaarNumber as string) || ''
    }
  })

  const onSubmit = async (data: BankingDetailsForm) => {
    setIsSubmitting(true)
    try {
      await onSave(stepId, data)
      toast.success('Banking details saved successfully')
    } catch (error) {
      console.error('Error saving banking details:', error)
      toast.error('Failed to save banking details')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Banking Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-lg font-medium">Bank Account Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  {...register('bankName')}
                  placeholder="Enter bank name"
                  disabled={disabled}
                />
                {errors.bankName && (
                  <p className="text-sm text-red-600">{errors.bankName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="branchName">Branch Name *</Label>
                <Input
                  id="branchName"
                  {...register('branchName')}
                  placeholder="Enter branch name"
                  disabled={disabled}
                />
                {errors.branchName && (
                  <p className="text-sm text-red-600">{errors.branchName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input
                  id="accountNumber"
                  {...register('accountNumber')}
                  placeholder="Enter account number"
                  type="text"
                  disabled={disabled}
                />
                {errors.accountNumber && (
                  <p className="text-sm text-red-600">{errors.accountNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code *</Label>
                <Input
                  id="ifscCode"
                  {...register('ifscCode')}
                  placeholder="Enter IFSC code"
                  style={{ textTransform: 'uppercase' }}
                  disabled={disabled}
                />
                {errors.ifscCode && (
                  <p className="text-sm text-red-600">{errors.ifscCode.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                <Input
                  id="accountHolderName"
                  {...register('accountHolderName')}
                  placeholder="Enter account holder name"
                  disabled={disabled}
                />
                {errors.accountHolderName && (
                  <p className="text-sm text-red-600">{errors.accountHolderName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountType">Account Type *</Label>
                <select
                  id="accountType"
                  {...register('accountType')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={disabled}
                >
                  <option value="">Select account type</option>
                  <option value="SAVINGS">Savings</option>
                  <option value="CURRENT">Current</option>
                </select>
                {errors.accountType && (
                  <p className="text-sm text-red-600">{errors.accountType.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-medium">Tax Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="panNumber">PAN Number *</Label>
                <Input
                  id="panNumber"
                  {...register('panNumber')}
                  placeholder="Enter PAN number"
                  style={{ textTransform: 'uppercase' }}
                  maxLength={10}
                  disabled={disabled}
                />
                {errors.panNumber && (
                  <p className="text-sm text-red-600">{errors.panNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadhaarNumber">Aadhaar Number *</Label>
                <Input
                  id="aadhaarNumber"
                  {...register('aadhaarNumber')}
                  placeholder="Enter Aadhaar number"
                  type="text"
                  maxLength={12}
                  disabled={disabled}
                />
                {errors.aadhaarNumber && (
                  <p className="text-sm text-red-600">{errors.aadhaarNumber.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-2">Important Notes:</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Ensure all banking details are accurate for salary processing</li>
              <li>• PAN and Aadhaar numbers are required for tax compliance</li>
              <li>• Account holder name should match your legal name</li>
              <li>• IFSC code format: ABCD0123456 (4 letters + 7 alphanumeric)</li>
            </ul>
          </div>

          {!disabled && (
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save & Continue'}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
