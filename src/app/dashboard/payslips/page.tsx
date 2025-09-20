'use client'

import { useSession } from 'next-auth/react'
import { EmployeePayrollPortal } from '@/components/payroll/employee-payroll-portal'

export default function PayslipsPage() {
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

  // Only employees can access this page
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Payslips</h1>
          <p className="text-gray-600">View and download your salary slips</p>
        </div>
      </div>
      
      <EmployeePayrollPortal />
    </div>
  )
}
