'use client'

import { useSession } from 'next-auth/react'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserPlus, FileText, ArrowRight, CheckCircle, AlertCircle, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default function ManagerDashboard() {
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

  if (session.user.role !== 'MANAGER') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">You don&apos;t have permission to access the manager dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Onboarding Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Employee Onboarding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/onboarding/submit" target="_blank">
              <Button className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <UserPlus className="h-6 w-6" />
                <span>Start New Onboarding</span>
              </Button>
            </Link>
            <Link href="/dashboard/onboarding">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <FileText className="h-6 w-6" />
                <span>Manage Submissions</span>
              </Button>
            </Link>
            <Link href="/dashboard/employees/onboarding">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <ArrowRight className="h-6 w-6" />
                <span>Onboarding Overview</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Payroll Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/dashboard/payroll">
              <Button className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <CheckCircle className="h-6 w-6" />
                <span>Variable Pay Approvals</span>
              </Button>
            </Link>
            <Link href="/dashboard/payroll">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <AlertCircle className="h-6 w-6" />
                <span>Correction Requests</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <DashboardOverview role="MANAGER" />
    </div>
  )
}
