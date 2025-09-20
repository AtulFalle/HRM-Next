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
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const createOnboardingSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  employeeId: z.string().optional(),
  departmentId: z.string().min(1, 'Please select a department'),
  position: z.string().min(1, 'Position is required'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']),
  dateOfJoining: z.date(),
  salary: z.number().positive('Salary must be positive'),
  payFrequency: z.enum(['MONTHLY', 'WEEKLY', 'BIWEEKLY', 'ANNUAL']),
  pfNumber: z.string().optional(),
  esicNumber: z.string().optional(),
})

interface Department {
  id: string
  name: string
}

type CreateOnboardingFormData = z.infer<typeof createOnboardingSchema>

interface CreateOnboardingFormProps {
  departments: Department[]
  onSuccess?: () => void
}

export function CreateOnboardingForm({ departments, onSuccess }: CreateOnboardingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dateOfJoining, setDateOfJoining] = useState<Date | undefined>(undefined)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<CreateOnboardingFormData>({
    resolver: zodResolver(createOnboardingSchema)
  })

  const watchedValues = watch()

  const onSubmit = async (data: CreateOnboardingFormData) => {
    setIsSubmitting(true)
    
    try {
      const formData = {
        ...data,
        dateOfJoining: dateOfJoining?.toISOString()
      }
      
      const response = await fetch('/api/onboarding/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Onboarding created successfully! Employee can now login and complete their details.')
        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to create onboarding')
      }
    } catch (error) {
      console.error('Error creating onboarding:', error)
      toast.error('An error occurred while creating onboarding')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Create New Employee Onboarding
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Employee Credentials */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Employee Credentials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="employee@company.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  {...register('username')}
                  placeholder="johndoe"
                />
                {errors.username && (
                  <p className="text-sm text-red-600 mt-1">{errors.username.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder="Minimum 6 characters"
                />
                {errors.password && (
                  <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  {...register('employeeId')}
                  placeholder="EMP001 (optional)"
                />
                {errors.employeeId && (
                  <p className="text-sm text-red-600 mt-1">{errors.employeeId.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Job Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="departmentId">Department *</Label>
                <Select onValueChange={(value) => setValue('departmentId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departmentId && (
                  <p className="text-sm text-red-600 mt-1">{errors.departmentId.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  {...register('position')}
                  placeholder="Software Engineer"
                />
                {errors.position && (
                  <p className="text-sm text-red-600 mt-1">{errors.position.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="employmentType">Employment Type *</Label>
                <Select onValueChange={(value) => setValue('employmentType', value as 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_TIME">Full Time</SelectItem>
                    <SelectItem value="PART_TIME">Part Time</SelectItem>
                    <SelectItem value="CONTRACT">Contract</SelectItem>
                    <SelectItem value="INTERN">Intern</SelectItem>
                  </SelectContent>
                </Select>
                {errors.employmentType && (
                  <p className="text-sm text-red-600 mt-1">{errors.employmentType.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="dateOfJoining">Date of Joining *</Label>
                <DatePicker
                  value={dateOfJoining}
                  onChange={(date) => {
                    setDateOfJoining(date)
                    setValue('dateOfJoining', date || new Date())
                  }}
                  placeholder="Select date of joining"
                  fromDate={new Date()}
                />
                {errors.dateOfJoining && (
                  <p className="text-sm text-red-600 mt-1">{errors.dateOfJoining.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Compensation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salary">Salary *</Label>
                <Input
                  id="salary"
                  type="number"
                  {...register('salary', { valueAsNumber: true })}
                  placeholder="50000"
                />
                {errors.salary && (
                  <p className="text-sm text-red-600 mt-1">{errors.salary.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="payFrequency">Pay Frequency *</Label>
                <Select onValueChange={(value) => setValue('payFrequency', value as 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY' | 'ANNUAL')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pay frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="BIWEEKLY">Bi-weekly</SelectItem>
                    <SelectItem value="ANNUAL">Annual</SelectItem>
                  </SelectContent>
                </Select>
                {errors.payFrequency && (
                  <p className="text-sm text-red-600 mt-1">{errors.payFrequency.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Compliance */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Compliance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pfNumber">PF Number</Label>
                <Input
                  id="pfNumber"
                  {...register('pfNumber')}
                  placeholder="PF123456789"
                />
                {errors.pfNumber && (
                  <p className="text-sm text-red-600 mt-1">{errors.pfNumber.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="esicNumber">ESIC Number</Label>
                <Input
                  id="esicNumber"
                  {...register('esicNumber')}
                  placeholder="ESIC123456789"
                />
                {errors.esicNumber && (
                  <p className="text-sm text-red-600 mt-1">{errors.esicNumber.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Onboarding
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
