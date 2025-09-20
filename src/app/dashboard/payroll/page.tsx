'use client'

import { useSession } from 'next-auth/react'
import { PayrollAdminDashboard } from '@/components/payroll/payroll-admin-dashboard'
import { EmployeePayrollPortal } from '@/components/payroll/employee-payroll-portal'
import { ManagerPayrollInterface } from '@/components/payroll/manager-payroll-interface'

export default function PayrollPage() {
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

  // Role-based rendering
  if (session.user.role === 'ADMIN') {
    return (
      <div className="space-y-6">
        <PayrollAdminDashboard />
      </div>
    )
  }

  if (session.user.role === 'MANAGER') {
    return (
      <div className="space-y-6">
        <ManagerPayrollInterface />
      </div>
    )
  }

  if (session.user.role === 'EMPLOYEE') {
    return (
      <div className="space-y-6">
        <EmployeePayrollPortal />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    </div>
  )
}