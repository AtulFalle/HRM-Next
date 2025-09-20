'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { EmployeeForm } from '@/components/forms/employee-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Employee {
  firstName: string
  lastName: string
  userId: string
}

export default function EditEmployeePage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchEmployee(params.id as string)
    }
  }, [params.id])

  const fetchEmployee = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/employees/${id}`)
      const data = await response.json()

      if (data.success) {
        setEmployee(data.data)
      } else {
        setError(data.error || 'Employee not found')
      }
    } catch (error) {
      console.error('Error fetching employee:', error)
      setError('Error loading employee details')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: Record<string, unknown>) => {
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/employees/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        router.push(`/dashboard/employees/${params.id}`)
      } else {
        setError(result.error || 'Failed to update employee')
      }
    } catch (error) {
      console.error('Error updating employee:', error)
      setError('An error occurred while updating the employee')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading employee details...</p>
        </div>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Employee Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/dashboard/employees">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Employees
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Check permissions
  const isAdmin = session?.user.role === 'ADMIN'
  const isManager = session?.user.role === 'MANAGER'
  const isOwnProfile = employee.userId === session?.user.id

  if (!isAdmin && !isManager && !isOwnProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            You don&apos;t have permission to edit this employee.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/dashboard/employees/${params.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Employee</h1>
          <p className="text-gray-600">Update {employee.firstName} {employee.lastName}&apos;s information</p>
        </div>
      </div>

      <EmployeeForm
        employee={employee}
        onSubmit={handleSubmit}
        loading={submitting}
        error={error}
      />
    </div>
  )
}
