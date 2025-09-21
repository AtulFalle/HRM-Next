'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { User } from 'lucide-react'
import { toast } from 'sonner'

const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.date(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(1, 'Address is required'),
  emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().min(10, 'Emergency contact phone must be at least 10 digits'),
  emergencyContactRelation: z.string().min(1, 'Emergency contact relation is required')
})

type PersonalInfoForm = z.infer<typeof personalInfoSchema>

interface PersonalInformationStepProps {
  stepId: string
  initialData?: Record<string, unknown>
  onSave: (stepId: string, data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  disabled?: boolean
}

export function PersonalInformationStep({ 
  stepId, 
  initialData = {}, 
  onSave, 
  onCancel,
  disabled = false
}: PersonalInformationStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(
    initialData?.dateOfBirth ? new Date(initialData.dateOfBirth as string) : undefined
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<PersonalInfoForm>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: (initialData?.firstName as string) || '',
      lastName: (initialData?.lastName as string) || '',
      gender: (initialData?.gender as 'MALE' | 'FEMALE' | 'OTHER') || undefined,
      phoneNumber: (initialData?.phoneNumber as string) || '',
      address: (initialData?.address as string) || '',
      emergencyContactName: (initialData?.emergencyContactName as string) || '',
      emergencyContactPhone: (initialData?.emergencyContactPhone as string) || '',
      emergencyContactRelation: (initialData?.emergencyContactRelation as string) || ''
    }
  })

  const onSubmit = async (data: PersonalInfoForm) => {
    setIsSubmitting(true)
    try {
      const formData = {
        ...data,
        dateOfBirth: dateOfBirth?.toISOString()
      }
      await onSave(stepId, formData)
      toast.success('Personal information saved successfully')
    } catch (error) {
      console.error('Error saving personal information:', error)
      toast.error('Failed to save personal information')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                placeholder="Enter your first name"
                disabled={disabled}
              />
              {errors.firstName && (
                <p className="text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                placeholder="Enter your last name"
                disabled={disabled}
              />
              {errors.lastName && (
                <p className="text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date of Birth *</Label>
              <DatePicker
                value={dateOfBirth}
                onChange={(date) => {
                  setDateOfBirth(date)
                  setValue('dateOfBirth', date || new Date())
                }}
                placeholder="Select date of birth"
                disabled={disabled}
                toDate={new Date()}
                fromDate={new Date('1900-01-01')}
              />
              {errors.dateOfBirth && (
                <p className="text-sm text-red-600">{errors.dateOfBirth.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select 
                onValueChange={(value) => setValue('gender', value as 'MALE' | 'FEMALE' | 'OTHER')}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-sm text-red-600">{errors.gender.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <Input
              id="phoneNumber"
              {...register('phoneNumber')}
              placeholder="Enter your phone number"
              type="tel"
              disabled={disabled}
            />
            {errors.phoneNumber && (
              <p className="text-sm text-red-600">{errors.phoneNumber.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="Enter your address"
              disabled={disabled}
            />
            {errors.address && (
              <p className="text-sm text-red-600">{errors.address.message}</p>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-medium">Emergency Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Name *</Label>
                <Input
                  id="emergencyContactName"
                  {...register('emergencyContactName')}
                  placeholder="Emergency contact name"
                  disabled={disabled}
                />
                {errors.emergencyContactName && (
                  <p className="text-sm text-red-600">{errors.emergencyContactName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">Phone *</Label>
                <Input
                  id="emergencyContactPhone"
                  {...register('emergencyContactPhone')}
                  placeholder="Emergency contact phone"
                  type="tel"
                  disabled={disabled}
                />
                {errors.emergencyContactPhone && (
                  <p className="text-sm text-red-600">{errors.emergencyContactPhone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactRelation">Relation *</Label>
                <Input
                  id="emergencyContactRelation"
                  {...register('emergencyContactRelation')}
                  placeholder="e.g., Spouse, Parent, Sibling"
                  disabled={disabled}
                />
                {errors.emergencyContactRelation && (
                  <p className="text-sm text-red-600">{errors.emergencyContactRelation.message}</p>
                )}
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
