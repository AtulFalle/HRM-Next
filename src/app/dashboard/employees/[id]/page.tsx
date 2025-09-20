'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { EmployeeProfile } from '@/components/employee/employee-profile'
import { ArrowLeft, Edit } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  position: string
  department: {
    id: string
    name: string
  }
  user: {
    role: string
    email: string
  }
  status: string
  hireDate: string
  salary: number
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
}

export default function EmployeeDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchEmployee(params.id as string)
    }
  }, [params.id])

  const fetchEmployee = async (id: string) => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`/api/employees/${id}`)
      const data = await response.json()

      if (data.success) {
        setEmployee(data.data)
      } else {
        setError(data.message || 'Failed to fetch employee')
        toast.error('Failed to fetch employee details')
      }
    } catch (error) {
      console.error('Error fetching employee:', error)
      setError('An error occurred while fetching employee details')
      toast.error('Failed to fetch employee details')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    if (employee) {
      router.push(`/dashboard/employees/${employee.id}/edit`)
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">You need to be logged in to access this page.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employee details...</p>
        </div>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Employee Not Found</h2>
          <p className="text-gray-600 mb-4">
            {error || 'The employee you&apos;re looking for doesn&apos;t exist.'}
          </p>
          <Link href="/dashboard/employees">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Employees
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/employees">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Employees
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Profile</h1>
            <p className="text-gray-600">View and manage employee information</p>
          </div>
        </div>
        {(session.user.role === 'ADMIN' || session.user.role === 'MANAGER') && (
          <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Employee Profile */}
      <EmployeeProfile 
        employee={employee} 
        onEdit={session.user.role === 'ADMIN' || session.user.role === 'MANAGER' ? handleEdit : undefined}
      />
    </div>
  )
}