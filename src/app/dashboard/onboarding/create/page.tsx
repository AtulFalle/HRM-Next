'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CreateOnboardingForm } from '@/components/onboarding/create-onboarding-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Department {
  id: string
  name: string
}

export default function CreateOnboardingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments')
      const result = await response.json()

      if (result.success) {
        setDepartments(result.data)
      } else {
        toast.error('Failed to fetch departments')
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
      toast.error('An error occurred while fetching departments')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    router.push('/dashboard/onboarding')
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

  if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">You don&apos;t have permission to create onboarding.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/onboarding">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Onboarding
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Onboarding</h1>
          <p className="text-gray-600">Create employee credentials and start the onboarding process</p>
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            How it Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p>1. <strong>Create Employee Credentials:</strong> Provide email, username, and password for the new employee</p>
            <p>2. <strong>Set Job Details:</strong> Assign department, position, employment type, and start date</p>
            <p>3. <strong>Configure Compensation:</strong> Set salary, pay frequency, and compliance details</p>
            <p>4. <strong>Employee Login:</strong> The employee will receive their credentials and can login to complete their onboarding</p>
            <p>5. <strong>Review Process:</strong> You can review and approve each step of their onboarding</p>
          </div>
        </CardContent>
      </Card>

      {/* Create Form */}
      <CreateOnboardingForm 
        departments={departments} 
        onSuccess={handleSuccess}
      />
    </div>
  )
}
