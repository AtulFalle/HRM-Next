'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Shield, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

const backgroundVerificationSchema = z.object({
  criminalRecordCheck: z.boolean(),
  educationVerification: z.boolean(),
  employmentVerification: z.boolean(),
  referenceCheck: z.boolean(),
  additionalInformation: z.string().optional(),
  consentForVerification: z.boolean().refine(val => val === true, {
    message: 'You must consent to background verification'
  })
})

type BackgroundVerificationForm = z.infer<typeof backgroundVerificationSchema>

interface BackgroundVerificationStepProps {
  stepId: string
  initialData?: Record<string, unknown>
  onSave: (stepId: string, data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  disabled?: boolean
}

export function BackgroundVerificationStep({ 
  stepId, 
  initialData = {}, 
  onSave, 
  onCancel,
  disabled = false
}: BackgroundVerificationStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<BackgroundVerificationForm>({
    resolver: zodResolver(backgroundVerificationSchema),
    defaultValues: {
      criminalRecordCheck: (initialData?.criminalRecordCheck as boolean) || false,
      educationVerification: (initialData?.educationVerification as boolean) || false,
      employmentVerification: (initialData?.employmentVerification as boolean) || false,
      referenceCheck: (initialData?.referenceCheck as boolean) || false,
      additionalInformation: (initialData?.additionalInformation as string) || '',
      consentForVerification: (initialData?.consentForVerification as boolean) || false
    }
  })

  const onSubmit = async (data: BackgroundVerificationForm) => {
    setIsSubmitting(true)
    try {
      await onSave(stepId, data)
      toast.success('Background verification information saved successfully')
    } catch (error) {
      console.error('Error saving background verification:', error)
      toast.error('Failed to save background verification information')
    } finally {
      setIsSubmitting(false)
    }
  }

  const verificationChecks = [
    {
      id: 'criminalRecordCheck',
      label: 'Criminal Record Check',
      description: 'Verification of criminal background and police records'
    },
    {
      id: 'educationVerification',
      label: 'Education Verification',
      description: 'Verification of educational qualifications and certificates'
    },
    {
      id: 'employmentVerification',
      label: 'Employment Verification',
      description: 'Verification of previous employment history and references'
    },
    {
      id: 'referenceCheck',
      label: 'Reference Check',
      description: 'Contact with provided professional references'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Background Verification
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <p className="text-gray-600">
              As part of our standard hiring process, we conduct background verification checks. 
              Please review and consent to the following verification processes:
            </p>

            <div className="space-y-4">
              {verificationChecks.map((check) => (
                <div key={check.id} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    id={check.id}
                    {...register(check.id as keyof BackgroundVerificationForm)}
                    className="mt-1 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <Label htmlFor={check.id} className="text-sm font-medium">
                      {check.label}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">{check.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalInformation">Additional Information (Optional)</Label>
            <Textarea
              id="additionalInformation"
              {...register('additionalInformation')}
              placeholder="Please provide any additional information that might be relevant for background verification..."
              rows={4}
              disabled={disabled}
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-yellow-900 mb-2">Verification Process</h5>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Background verification typically takes 3-5 business days</li>
                  <li>• You will be notified of the results via email</li>
                  <li>• Any discrepancies will be discussed with you directly</li>
                  <li>• All information is kept confidential and secure</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="consentForVerification"
                {...register('consentForVerification')}
                className="mt-1 rounded border-gray-300"
              />
              <div className="flex-1">
                <Label htmlFor="consentForVerification" className="text-sm font-medium">
                  Consent for Background Verification *
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  I hereby consent to the background verification process as outlined above. 
                  I understand that this is a standard part of the hiring process and that 
                  any false information provided may result in termination of employment.
                </p>
                {errors.consentForVerification && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.consentForVerification.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-green-900 mb-2">Your Rights</h5>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• You have the right to know what information is being verified</li>
                  <li>• You can request a copy of the verification report</li>
                  <li>• You can dispute any incorrect information found</li>
                  <li>• All verification is conducted in compliance with applicable laws</li>
                </ul>
              </div>
            </div>
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
