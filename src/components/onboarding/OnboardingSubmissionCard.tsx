'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, CheckCircle, XCircle, Clock } from 'lucide-react'

interface OnboardingStep {
  id: string
  stepType: string
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
  stepData: Record<string, unknown> | null
  submittedAt: string | null
  reviewedAt: string | null
  reviewComments: string | null
  rejectionReason: string | null
}

interface OnboardingSubmission {
  id: string
  email: string
  username: string
  employeeId?: string
  position?: string
  status: 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  department: {
    name: string
  } | null
  steps: OnboardingStep[]
}

interface OnboardingSubmissionCardProps {
  submission: OnboardingSubmission
  onViewDetails: (submission: OnboardingSubmission) => void
}

export function OnboardingSubmissionCard({ 
  submission, 
  onViewDetails 
}: OnboardingSubmissionCardProps) {
  const getStatusBadge = (status: string) => {
    const variants = {
      CREATED: 'secondary',
      IN_PROGRESS: 'default',
      COMPLETED: 'default',
      CANCELLED: 'destructive',
    } as const

    const colors = {
      CREATED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className={colors[status as keyof typeof colors]}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'SUBMITTED':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-medium text-gray-900">{submission.email}</h3>
            {getStatusBadge(submission.status)}
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Username:</strong> {submission.username}</p>
            <p><strong>Position:</strong> {submission.position || 'Not assigned'}</p>
            <p><strong>Department:</strong> {submission.department?.name || 'Not assigned'}</p>
            {submission.employeeId && <p><strong>Employee ID:</strong> {submission.employeeId}</p>}
            <p><strong>Created:</strong> {new Date(submission.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {submission.steps.map((step) => (
              <div key={step.id} className="flex items-center gap-1">
                {getStepStatusIcon(step.status)}
              </div>
            ))}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onViewDetails(submission)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </div>
    </div>
  )
}

