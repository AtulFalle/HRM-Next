'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, FileText, CheckCircle } from 'lucide-react'

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

interface OnboardingDetailModalProps {
  isOpen: boolean
  onClose: () => void
  submission: OnboardingSubmission | null
}

export function OnboardingDetailModal({ 
  isOpen, 
  onClose, 
  submission 
}: OnboardingDetailModalProps) {
  if (!submission) return null

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-h-[95vh] overflow-hidden flex flex-col"
        style={{ maxWidth: '95vw', width: '95vw' }}
      >
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold">
            Onboarding Submission Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col space-y-6">
          {/* Basic Information - Horizontal Layout */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600">Employee</div>
                <div className="text-lg font-semibold">{submission.email}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600">Status</div>
                <div className="flex justify-center mt-1">
                  {getStatusBadge(submission.status)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600">Department</div>
                <div className="text-lg font-semibold">
                  {submission.department?.name || 'Not assigned'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600">Created</div>
                <div className="text-lg font-semibold">
                  {new Date(submission.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Tabbed Interface */}
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="basic-info" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic-info">Basic Information</TabsTrigger>
                <TabsTrigger value="onboarding-steps">Onboarding Steps</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-y-auto mt-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6' }}>
                {/* Basic Information Tab */}
                <TabsContent value="basic-info" className="h-full">
                  <Card className="h-full flex flex-col">
                    <CardHeader className="flex-shrink-0">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Employee Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto max-h-[60vh]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6' }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="bg-gray-50 p-3 rounded-md">
                            <div className="text-sm font-medium text-gray-600 mb-1">Email Address</div>
                            <div className="text-sm font-semibold">{submission.email}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <div className="text-sm font-medium text-gray-600 mb-1">Username</div>
                            <div className="text-sm font-semibold">{submission.username}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <div className="text-sm font-medium text-gray-600 mb-1">Employee ID</div>
                            <div className="text-sm font-semibold">
                              {submission.employeeId || 'Not assigned'}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="bg-gray-50 p-3 rounded-md">
                            <div className="text-sm font-medium text-gray-600 mb-1">Position</div>
                            <div className="text-sm font-semibold">
                              {submission.position || 'Not assigned'}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <div className="text-sm font-medium text-gray-600 mb-1">Department</div>
                            <div className="text-sm font-semibold">
                              {submission.department?.name || 'Not assigned'}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <div className="text-sm font-medium text-gray-600 mb-1">Submission Status</div>
                            <div className="flex justify-center mt-1">
                              {getStatusBadge(submission.status)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Onboarding Steps Tab */}
                <TabsContent value="onboarding-steps" className="h-full">
                  <Card className="h-full flex flex-col">
                    <CardHeader className="flex-shrink-0">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Onboarding Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto max-h-[60vh]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6' }}>
                      <div className="space-y-3">
                        {submission.steps.map((step) => (
                          <div 
                            key={step.id} 
                            className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                              (step.status === 'SUBMITTED' || step.status === 'APPROVED' || step.status === 'REJECTED') ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-base font-semibold">{step.stepType.replace(/_/g, ' ')}</span>
                                <div className="flex items-center gap-2">
                                  {step.status === 'APPROVED' ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : step.status === 'REJECTED' ? (
                                    <CheckCircle className="h-4 w-4 text-red-600" />
                                  ) : step.status === 'SUBMITTED' ? (
                                    <CheckCircle className="h-4 w-4 text-yellow-600" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 text-gray-400" />
                                  )}
                                  <span className="text-sm text-gray-600">{step.status}</span>
                                </div>
                              </div>
                              {step.submittedAt && (
                                <p className="text-sm text-gray-500">
                                  Submitted: {new Date(step.submittedAt).toLocaleDateString()}
                                </p>
                              )}
                              {step.reviewComments && (
                                <p className="text-sm text-blue-600 mt-1">
                                  Comments: {step.reviewComments}
                                </p>
                              )}
                              {step.rejectionReason && (
                                <p className="text-sm text-red-600 mt-1">
                                  Rejection: {step.rejectionReason}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {(step.status === 'SUBMITTED' || step.status === 'APPROVED' || step.status === 'REJECTED') && (
                                <span className="text-sm text-blue-600 font-medium">Click to view details</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Actions Tab */}
                <TabsContent value="actions" className="h-full">
                  <Card className="h-full flex flex-col">
                    <CardHeader className="flex-shrink-0">
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Available Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto space-y-6 max-h-[60vh]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6' }}>
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Onboarding Management</h3>
                        <p className="text-gray-600 mb-6">
                          Review individual steps by clicking on them in the &quot;Onboarding Steps&quot; tab.
                        </p>
                        <div className="flex justify-center gap-3">
                          <Button 
                            variant="outline" 
                            onClick={onClose}
                            size="lg"
                            className="px-8"
                          >
                            Close Details
                          </Button>
                          <Button 
                            onClick={() => {
                              onClose()
                              // You can add navigation to review steps here
                            }}
                            size="lg"
                            className="px-8"
                          >
                            Review All Steps
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

