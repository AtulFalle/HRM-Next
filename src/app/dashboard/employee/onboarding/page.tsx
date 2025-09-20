'use client'

import { useSession } from 'next-auth/react'
import { EmployeeOnboardingDashboard } from '@/components/onboarding/employee-onboarding-dashboard'

export default function EmployeeOnboardingPage() {
  const { data: session } = useSession()

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

  if (session.user.role !== 'EMPLOYEE') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">This page is only accessible to employees.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Onboarding</h1>
        <p className="text-gray-600">Complete your onboarding process and track your progress</p>
      </div>

      <EmployeeOnboardingDashboard />
    </div>
  )
}
