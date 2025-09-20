'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { EmployeeForm } from '@/components/forms/employee-form'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function NewEmployeePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Check if user has permission to create employees
  if (session?.user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            You don&apos;t have permission to create employees. Only administrators can add new employees.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleSubmit = async (data: Record<string, unknown>) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        router.push('/dashboard/employees')
      } else {
        setError(result.error || 'Failed to create employee')
      }
    } catch (error) {
      console.error('Error creating employee:', error)
      setError('An error occurred while creating the employee')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Employee</h1>
        <p className="text-gray-600">Create a new employee profile in the system</p>
      </div>

      <EmployeeForm
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      />
    </div>
  )
}
