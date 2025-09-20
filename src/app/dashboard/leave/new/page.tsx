'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const leaveRequestSchema = z.object({
  leaveType: z.enum(['SICK_LEAVE', 'VACATION', 'PERSONAL_LEAVE', 'MATERNITY_LEAVE', 'PATERNITY_LEAVE', 'EMERGENCY_LEAVE']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
}).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
  message: "End date must be after start date",
  path: ["endDate"],
})

type LeaveRequestData = z.infer<typeof leaveRequestSchema>

export default function NewLeaveRequestPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [employeeId, setEmployeeId] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LeaveRequestData>({
    resolver: zodResolver(leaveRequestSchema),
  })

  useEffect(() => {
    // Get employee ID for the current user
    const fetchEmployeeId = async () => {
      try {
        const response = await fetch('/api/employees')
        const data = await response.json()
        
        if (data.success) {
          // Find the employee record for the current user
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const employee = data.data.employees.find((emp: any) => emp.user.id === session?.user.id)
          if (employee) {
            setEmployeeId(employee.id)
          }
        }
      } catch (error) {
        console.error('Error fetching employee ID:', error)
      }
    }

    if (session?.user.id) {
      fetchEmployeeId()
    }
  }, [session?.user.id])

  const handleFormSubmit = async (data: LeaveRequestData) => {
    if (!employeeId) {
      setError('Employee record not found')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          employeeId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        router.push('/dashboard/leave')
      } else {
        setError(result.error || 'Failed to submit leave request')
      }
    } catch (error) {
      console.error('Error submitting leave request:', error)
      setError('An error occurred while submitting the leave request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/leave">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Request Leave</h1>
          <p className="text-gray-600">Submit a new leave request</p>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Leave Request Form</CardTitle>
          <CardDescription>
            Fill in the details to submit your leave request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type *</Label>
              <Select
                value={watch('leaveType')}
                onValueChange={(value) => setValue('leaveType', value as 'SICK_LEAVE' | 'VACATION' | 'PERSONAL_LEAVE' | 'MATERNITY_LEAVE' | 'PATERNITY_LEAVE' | 'EMERGENCY_LEAVE')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SICK_LEAVE">Sick Leave</SelectItem>
                  <SelectItem value="VACATION">Vacation</SelectItem>
                  <SelectItem value="PERSONAL_LEAVE">Personal Leave</SelectItem>
                  <SelectItem value="MATERNITY_LEAVE">Maternity Leave</SelectItem>
                  <SelectItem value="PATERNITY_LEAVE">Paternity Leave</SelectItem>
                  <SelectItem value="EMERGENCY_LEAVE">Emergency Leave</SelectItem>
                </SelectContent>
              </Select>
              {errors.leaveType && (
                <p className="text-sm text-red-600">{errors.leaveType.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register('endDate')}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-600">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a detailed reason for your leave request..."
                {...register('reason')}
                rows={4}
              />
              {errors.reason && (
                <p className="text-sm text-red-600">{errors.reason.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <Link href="/dashboard/leave">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
