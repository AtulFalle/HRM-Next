'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  UserPlus, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

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

  if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">You don&apos;t have permission to onboard employees.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Onboarding</h1>
          <p className="text-gray-600">Manage the employee onboarding process</p>
        </div>
      </div>

      {/* Onboarding Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Employee Self-Submission */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Employee Self-Submission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Allow new employees to submit their onboarding information through a guided form.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Personal information collection
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Document upload
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Banking details
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Employment history
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/onboarding/submit" target="_blank">
                <Button className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Submission Form
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Admin Review & Management */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Review & Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Review submitted applications, add company-specific data, and manage the approval process.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Review submissions
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Background verification
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Approval workflow
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Employee activation
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/onboarding">
                <Button className="w-full">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Manage Submissions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-orange-600">0</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Under Verification</p>
                <p className="text-2xl font-bold text-blue-600">0</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">0</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">0</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use the Onboarding System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">For New Employees:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Click &quot;View Submission Form&quot; to access the onboarding form</li>
                <li>Fill out all required information in the 4-step process</li>
                <li>Upload required documents (ID, resume, certificates)</li>
                <li>Submit your application for review</li>
                <li>Track your application status</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">For HR/Admin:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Click &quot;Manage Submissions&quot; to review applications</li>
                <li>Review employee-provided information</li>
                <li>Add company-specific data (department, salary, etc.)</li>
                <li>Conduct background verification</li>
                <li>Approve or reject applications</li>
                <li>Activate approved employees in the system</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
