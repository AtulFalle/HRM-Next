'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserPlus, FileText, Users, Clock, CheckCircle, XCircle } from 'lucide-react'
import { ImagePreview } from '@/components/ui/image-preview'
import Link from 'next/link'
import { toast } from 'sonner'
import { OnboardingSubmissionCard } from '@/components/onboarding/OnboardingSubmissionCard'
import { OnboardingDetailModal } from '@/components/onboarding/OnboardingDetailModal'

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
  steps: Array<{
    id: string
    stepType: string
    status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
    stepData: Record<string, unknown> | null
    submittedAt: string | null
    reviewedAt: string | null
    reviewComments: string | null
    rejectionReason: string | null
  }>
}

export default function OnboardingManagementPage() {
  const { data: session } = useSession()
  const [submissions, setSubmissions] = useState<OnboardingSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<OnboardingSubmission | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedStep, setSelectedStep] = useState<{
    id: string
    stepType: string
    status: string
    stepData: Record<string, unknown> | null
    submittedAt: string | null
    reviewedAt: string | null
    reviewComments: string | null
    rejectionReason: string | null
  } | null>(null)
  const [isStepReviewModalOpen, setIsStepReviewModalOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED' | null>(null)
  const [reviewComments, setReviewComments] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  useEffect(() => {
    if (session) {
      fetchSubmissions()
    }
  }, [session])

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/onboarding/admin/submissions')
      const result = await response.json()
      
      if (result.success) {
        setSubmissions(result.data)
      } else {
        toast.error('Failed to fetch onboarding submissions')
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
      toast.error('An error occurred while fetching submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (submission: OnboardingSubmission) => {
    setSelectedSubmission(submission)
    setIsDetailModalOpen(true)
  }

  const handleReviewStep = (step: {
    id: string
    stepType: string
    status: string
    stepData: Record<string, unknown> | null
    submittedAt: string | null
    reviewedAt: string | null
    reviewComments: string | null
    rejectionReason: string | null
  }) => {
    setSelectedStep(step)
    setReviewAction(null)
    setReviewComments('')
    setRejectionReason('')
    setIsStepReviewModalOpen(true)
  }

  const handleStepApproval = async () => {
    if (!selectedStep || !reviewAction) return

    setIsSubmittingReview(true)
    try {
      const response = await fetch(`/api/onboarding/steps/${selectedStep.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: reviewAction,
          comments: reviewComments,
          rejectionReason: reviewAction === 'REJECTED' ? rejectionReason : undefined
        })
      })

      if (response.ok) {
        toast.success(`Step ${reviewAction.toLowerCase()} successfully`)
        setIsStepReviewModalOpen(false)
        setSelectedStep(null)
        setReviewAction(null)
        setReviewComments('')
        setRejectionReason('')
        // Refresh the submissions data
        fetchSubmissions()
      } else {
        throw new Error('Failed to update step status')
      }
    } catch (error) {
      console.error('Error updating step status:', error)
      toast.error('Failed to update step status')
    } finally {
      setIsSubmittingReview(false)
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

  if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">You don&apos;t have permission to manage onboarding.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Onboarding Management</h1>
          <p className="text-gray-600 mt-2">
            Create and manage employee onboarding processes
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/onboarding/create">
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Create New Onboarding
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/onboarding/create">
              <Button className="w-full h-16 flex flex-col items-center justify-center gap-2">
                <UserPlus className="h-5 w-5" />
                <span>Create New Onboarding</span>
              </Button>
            </Link>
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-2" disabled>
              <FileText className="h-5 w-5" />
              <span>Export Reports</span>
            </Button>
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-2" disabled>
              <Users className="h-5 w-5" />
              <span>Bulk Import</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Onboarding Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No onboarding submissions</h3>
              <p className="text-gray-600 mb-4">Get started by creating a new onboarding process.</p>
              <Link href="/dashboard/onboarding/create">
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create First Onboarding
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <OnboardingSubmissionCard
                  key={submission.id}
                  submission={submission}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <OnboardingDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        submission={selectedSubmission}
      />

      {/* Step Review Modal */}
      <Dialog open={isStepReviewModalOpen} onOpenChange={setIsStepReviewModalOpen}>
        <DialogContent 
          className="max-h-[95vh] overflow-hidden flex flex-col"
          style={{ maxWidth: '95vw', width: '95vw' }}
        >
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl font-bold">
              Review Onboarding Step: {selectedStep?.stepType?.replace(/_/g, ' ')}
            </DialogTitle>
          </DialogHeader>
          
          {selectedStep && (
            <div className="flex-1 overflow-hidden flex flex-col space-y-6">
              {/* Basic Information - Horizontal Layout */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-600">Step Type</div>
                    <div className="text-lg font-semibold">{selectedStep.stepType.replace(/_/g, ' ')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-600">Current Status</div>
                    <div className="flex justify-center mt-1">
                      {getStatusBadge(selectedStep.status)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-600">Submitted</div>
                    <div className="text-lg font-semibold">
                      {selectedStep.submittedAt ? new Date(selectedStep.submittedAt).toLocaleDateString() : 'Not submitted'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-600">Last Reviewed</div>
                    <div className="text-lg font-semibold">
                      {selectedStep.reviewedAt ? new Date(selectedStep.reviewedAt).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabbed Interface */}
              <div className="flex-1 overflow-hidden">
                <Tabs defaultValue="submitted-data" className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="submitted-data">Submitted Data</TabsTrigger>
                    <TabsTrigger value="review-history">Review History</TabsTrigger>
                    <TabsTrigger value="review-decision">Review Decision</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex-1 overflow-y-auto mt-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6' }}>
                    {/* Submitted Data Tab */}
                    <TabsContent value="submitted-data" className="h-full">
                      <Card className="h-full flex flex-col">
                        <CardHeader className="flex-shrink-0">
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Submitted Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto max-h-[60vh]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6' }}>
                          {selectedStep.stepData ? (
                            <div className="space-y-4">
                              {Object.entries(selectedStep.stepData).map(([key, value]) => {
                                const fieldName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                                const isFileField = key !== 'identityProofNumber' && 
                                  (key.includes('Proof') || key.includes('Certificate') || key.includes('Resume') || 
                                   key.includes('Card') || key.includes('Letter'))
                                
                                return (
                                  <div key={key} className="bg-gray-50 p-4 rounded-md">
                                    <div className="text-sm font-medium text-gray-600 mb-2">
                                      {fieldName}
                                    </div>
                                    {isFileField && value && typeof value === 'string' && value.startsWith('data:') ? (
                                      <div className="space-y-3">
                                        <div className="text-sm text-gray-500">File uploaded successfully</div>
                                        <ImagePreview
                                          src={value}
                                          alt={fieldName}
                                          fileName={fieldName}
                                          size="md"
                                          showActions={true}
                                        />
                                      </div>
                                    ) : (
                                      <div className="text-sm font-semibold">
                                        {String(value) || 'Not provided'}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-500">No data submitted yet</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Review History Tab */}
                    <TabsContent value="review-history" className="h-full">
                      <Card className="h-full flex flex-col">
                        <CardHeader className="flex-shrink-0">
                          <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Review History
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto max-h-[60vh]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6' }}>
                          {(selectedStep.reviewComments || selectedStep.rejectionReason) ? (
                            <div className="space-y-4">
                              {selectedStep.reviewComments && (
                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-blue-800">Review Comments</span>
                                  </div>
                                  <p className="text-blue-700">{selectedStep.reviewComments}</p>
                                </div>
                              )}
                              {selectedStep.rejectionReason && (
                                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <XCircle className="h-4 w-4 text-red-600" />
                                    <span className="font-medium text-red-800">Rejection Reason</span>
                                  </div>
                                  <p className="text-red-700">{selectedStep.rejectionReason}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-500">No review history available</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Review Decision Tab */}
                    <TabsContent value="review-decision" className="h-full">
                      <Card className="h-full flex flex-col">
                        <CardHeader className="flex-shrink-0">
                          <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Make Review Decision
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-6 max-h-[60vh]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6' }}>
                          {/* Action Selection */}
                          <div className="space-y-3">
                            <Label className="text-base font-medium">Select Action:</Label>
                            <div className="flex gap-4">
                              <Button
                                variant={reviewAction === 'APPROVED' ? 'default' : 'outline'}
                                onClick={() => setReviewAction('APPROVED')}
                                className="flex-1 h-12 text-base"
                                size="lg"
                              >
                                <CheckCircle className="h-5 w-5 mr-2" />
                                Approve Step
                              </Button>
                              <Button
                                variant={reviewAction === 'REJECTED' ? 'destructive' : 'outline'}
                                onClick={() => setReviewAction('REJECTED')}
                                className="flex-1 h-12 text-base"
                                size="lg"
                              >
                                <XCircle className="h-5 w-5 mr-2" />
                                Reject Step
                              </Button>
                            </div>
                          </div>

                          {/* Comments */}
                          <div className="space-y-2">
                            <Label htmlFor="comments" className="text-base font-medium">
                              Comments {reviewAction === 'REJECTED' ? '(Required)' : '(Optional)'}
                            </Label>
                            <Textarea
                              id="comments"
                              placeholder={reviewAction === 'REJECTED' 
                                ? "Please provide a detailed reason for rejection..." 
                                : "Add any comments about this step..."
                              }
                              value={reviewComments}
                              onChange={(e) => setReviewComments(e.target.value)}
                              className="min-h-[100px] text-base"
                            />
                          </div>

                          {/* Rejection Reason (only for rejections) */}
                          {reviewAction === 'REJECTED' && (
                            <div className="space-y-2">
                              <Label htmlFor="rejectionReason" className="text-base font-medium">
                                Rejection Reason (Required)
                              </Label>
                              <Input
                                id="rejectionReason"
                                placeholder="Brief reason for rejection..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="text-base h-12"
                              />
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button 
                              variant="outline" 
                              onClick={() => setIsStepReviewModalOpen(false)}
                              disabled={isSubmittingReview}
                              size="lg"
                              className="px-8"
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleStepApproval}
                              disabled={!reviewAction || isSubmittingReview || (reviewAction === 'REJECTED' && !rejectionReason.trim())}
                              size="lg"
                              className="px-8 min-w-[140px]"
                            >
                              {isSubmittingReview ? (
                                <>
                                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  {reviewAction === 'APPROVED' ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </>
                                  )}
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
