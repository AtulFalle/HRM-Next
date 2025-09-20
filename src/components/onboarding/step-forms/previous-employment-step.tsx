'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Briefcase, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const employmentHistorySchema = z.object({
  companies: z.array(z.object({
    companyName: z.string().min(1, 'Company name is required'),
    jobTitle: z.string().min(1, 'Job title is required'),
    startDate: z.date(),
    endDate: z.date().optional(),
    isCurrentJob: z.boolean(),
    reasonForLeaving: z.string().min(1, 'Reason for leaving is required'),
    salary: z.string().optional(),
    supervisorName: z.string().optional(),
    supervisorContact: z.string().optional(),
    responsibilities: z.string().optional()
  })).min(1, 'At least one employment record is required')
})

type EmploymentHistoryForm = z.infer<typeof employmentHistorySchema>

interface PreviousEmploymentStepProps {
  stepId: string
  initialData?: Record<string, unknown>
  onSave: (stepId: string, data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  disabled?: boolean
}

export function PreviousEmploymentStep({ 
  stepId, 
  initialData = {}, 
  onSave, 
  onCancel,
  disabled = false
}: PreviousEmploymentStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch
  } = useForm<EmploymentHistoryForm>({
    resolver: zodResolver(employmentHistorySchema),
    defaultValues: {
      companies: initialData?.companies ? (initialData.companies as Array<{
        companyName: string
        jobTitle: string
        startDate: Date
        endDate: Date | undefined
        isCurrentJob: boolean
        reasonForLeaving: string
        salary: string
        supervisorName: string
        supervisorContact: string
        responsibilities: string
      }>) : [{
        companyName: '',
        jobTitle: '',
        startDate: new Date(),
        endDate: undefined,
        isCurrentJob: false,
        reasonForLeaving: '',
        salary: '',
        supervisorName: '',
        supervisorContact: '',
        responsibilities: ''
      }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'companies'
  })

  const watchedCompanies = watch('companies')

  const onSubmit = async (data: EmploymentHistoryForm) => {
    setIsSubmitting(true)
    try {
      const formData = {
        ...data,
        companies: data.companies.map(company => ({
          ...company,
          startDate: company.startDate?.toISOString(),
          endDate: company.endDate?.toISOString()
        }))
      }
      await onSave(stepId, formData)
      toast.success('Employment history saved successfully')
    } catch (error) {
      console.error('Error saving employment history:', error)
      toast.error('Failed to save employment history')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addCompany = () => {
    append({
      companyName: '',
      jobTitle: '',
      startDate: new Date(),
      endDate: undefined,
      isCurrentJob: false,
      reasonForLeaving: '',
      salary: '',
      supervisorName: '',
      supervisorContact: '',
      responsibilities: ''
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Previous Employment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {fields.map((field, index) => (
            <Card key={field.id} className="border border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Employment #{index + 1}</CardTitle>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`companies.${index}.companyName`}>Company Name *</Label>
                    <Input
                      {...register(`companies.${index}.companyName`)}
                      placeholder="Enter company name"
                      disabled={disabled}
                    />
                    {errors.companies?.[index]?.companyName && (
                      <p className="text-sm text-red-600">
                        {errors.companies[index]?.companyName?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`companies.${index}.jobTitle`}>Job Title *</Label>
                    <Input
                      {...register(`companies.${index}.jobTitle`)}
                      placeholder="Enter job title"
                      disabled={disabled}
                    />
                    {errors.companies?.[index]?.jobTitle && (
                      <p className="text-sm text-red-600">
                        {errors.companies[index]?.jobTitle?.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <DatePicker
                      value={watchedCompanies[index]?.startDate}
                      onChange={(date) => {
                        setValue(`companies.${index}.startDate`, date || new Date())
                      }}
                      placeholder="Select start date"
                      disabled={disabled}
                      toDate={new Date()}
                    />
                    {errors.companies?.[index]?.startDate && (
                      <p className="text-sm text-red-600">
                        {errors.companies[index]?.startDate?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <DatePicker
                      value={watchedCompanies[index]?.endDate}
                      onChange={(date) => {
                        setValue(`companies.${index}.endDate`, date || undefined)
                      }}
                      placeholder={watchedCompanies[index]?.isCurrentJob ? 'Current Job' : 'Select end date'}
                      disabled={disabled || watchedCompanies[index]?.isCurrentJob}
                      toDate={new Date()}
                      fromDate={watchedCompanies[index]?.startDate}
                    />
                    {errors.companies?.[index]?.endDate && (
                      <p className="text-sm text-red-600">
                        {errors.companies[index]?.endDate?.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`companies.${index}.isCurrentJob`}
                    {...register(`companies.${index}.isCurrentJob`)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={`companies.${index}.isCurrentJob`} className="text-sm">
                    This is my current job
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`companies.${index}.reasonForLeaving`}>Reason for Leaving *</Label>
                  <Textarea
                    {...register(`companies.${index}.reasonForLeaving`)}
                    placeholder="Enter reason for leaving"
                    rows={3}
                    disabled={disabled}
                  />
                  {errors.companies?.[index]?.reasonForLeaving && (
                    <p className="text-sm text-red-600">
                      {errors.companies[index]?.reasonForLeaving?.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`companies.${index}.salary`}>Salary (Optional)</Label>
                    <Input
                      {...register(`companies.${index}.salary`)}
                      placeholder="Enter salary"
                      disabled={disabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`companies.${index}.supervisorName`}>Supervisor Name (Optional)</Label>
                    <Input
                      {...register(`companies.${index}.supervisorName`)}
                      placeholder="Enter supervisor name"
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`companies.${index}.supervisorContact`}>Supervisor Contact (Optional)</Label>
                  <Input
                    {...register(`companies.${index}.supervisorContact`)}
                    placeholder="Enter supervisor contact"
                    type="tel"
                    disabled={disabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`companies.${index}.responsibilities`}>Key Responsibilities (Optional)</Label>
                  <Textarea
                    {...register(`companies.${index}.responsibilities`)}
                    placeholder="Describe your key responsibilities"
                    rows={3}
                    disabled={disabled}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {!disabled && (
            <Button
              type="button"
              variant="outline"
              onClick={addCompany}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Employment
            </Button>
          )}

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
