'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  FileText, 
  Briefcase, 
  CreditCard, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  ArrowRight,
  Info,
  Calendar,
  Building,
  DollarSign
} from 'lucide-react'
import { toast } from 'sonner'
import { PersonalInformationStep } from './step-forms/personal-information-step'
import { DocumentsStep } from './step-forms/documents-step'
import { PreviousEmploymentStep } from './step-forms/previous-employment-step'
import { BankingDetailsStep } from './step-forms/banking-details-step'
import { BackgroundVerificationStep } from './step-forms/background-verification-step'

interface OnboardingStep {
  id: string
  stepType: string
  stepData: Record<string, unknown>
  status: string
  submittedAt: string | null
  reviewedAt: string | null
  reviewComments: string | null
  rejectionReason: string | null
  reviewer: {
    name: string
    email: string
  } | null
}

interface OnboardingSubmission {
  id: string
  email: string
  username: string
  status: string
  createdAt: string
  completedAt: string | null
  department: {
    name: string
  } | null
  position: string | null
  employmentType: string | null
  dateOfJoining: string | null
  salary: number | null
  payFrequency: string | null
  steps: OnboardingStep[]
  createdByUser: {
    name: string
    email: string
  } | null
}

const stepConfig = {
  PERSONAL_INFORMATION: {
    title: 'Personal Information',
    description: 'Basic personal details and contact information',
    icon: User,
    color: 'blue'
  },
  DOCUMENTS: {
    title: 'Documents',
    description: 'Upload required documents and certificates',
    icon: FileText,
    color: 'green'
  },
  PREVIOUS_EMPLOYMENT: {
    title: 'Previous Employment',
    description: 'Work history and references',
    icon: Briefcase,
    color: 'purple'
  },
  BANKING_DETAILS: {
    title: 'Banking Details',
    description: 'Bank account information for salary payments',
    icon: CreditCard,
    color: 'orange'
  },
  BACKGROUND_VERIFICATION: {
    title: 'Background Verification',
    description: 'Verification status and reports',
    icon: Shield,
    color: 'red'
  }
}

const statusConfig = {
  PENDING: {
    label: 'Pending',
    color: 'secondary',
    icon: Clock
  },
  SUBMITTED: {
    label: 'Under Review',
    color: 'default',
    icon: Clock
  },
  APPROVED: {
    label: 'Approved',
    color: 'default',
    icon: CheckCircle
  },
  REJECTED: {
    label: 'Rejected',
    color: 'destructive',
    icon: XCircle
  },
  CHANGES_REQUESTED: {
    label: 'Changes Requested',
    color: 'destructive',
    icon: AlertCircle
  }
}

export function EmployeeOnboardingDashboard() {
  const [submission, setSubmission] = useState<OnboardingSubmission | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOnboardingStatus()
  }, [])

  const fetchOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/onboarding/my-status')
      const result = await response.json()

      if (result.success) {
        setSubmission(result.data)
      } else {
        toast.error('Failed to fetch onboarding status')
      }
    } catch (error) {
      console.error('Error fetching onboarding status:', error)
      toast.error('An error occurred while fetching status')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!submission) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Onboarding Found</h3>
            <p className="text-gray-600">
              You don&apos;t have an active onboarding process. Please contact HR to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const completedSteps = submission.steps?.filter(step => step.status === 'APPROVED').length || 0
  const totalSteps = submission.steps?.length || 0
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  const getStepStatus = (step: OnboardingStep) => {
    return statusConfig[step.status as keyof typeof statusConfig] || statusConfig.PENDING
  }

  const canEditStep = (step: OnboardingStep) => {
    return step.status === 'PENDING' || step.status === 'REJECTED' || step.status === 'CHANGES_REQUESTED'
  }

  const handleStepSave = async (stepId: string, data: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/onboarding/steps/${stepId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stepData: data })
      })

      if (response.ok) {
        toast.success('Step data saved successfully')
        // Refresh the submission data
        fetchOnboardingStatus()
      } else {
        throw new Error('Failed to save step data')
      }
    } catch (error) {
      console.error('Error saving step data:', error)
      toast.error('Failed to save step data')
    }
  }

  const renderStepForm = (step: OnboardingStep) => {
    // Only enable forms for PENDING and REJECTED statuses
    // Disable for SUBMITTED (under review) and APPROVED statuses
    const isDisabled = step.status === 'SUBMITTED' || step.status === 'APPROVED'
    
    const commonProps = {
      stepId: step.id,
      initialData: step.stepData,
      onSave: handleStepSave,
      onCancel: () => {}, // No cancel needed for inline forms
      disabled: isDisabled
    }

    switch (step.stepType) {
      case 'PERSONAL_INFORMATION':
        return <PersonalInformationStep {...commonProps} />
      case 'DOCUMENTS':
        return <DocumentsStep {...commonProps} />
      case 'PREVIOUS_EMPLOYMENT':
        return <PreviousEmploymentStep {...commonProps} />
      case 'BANKING_DETAILS':
        return <BankingDetailsStep {...commonProps} />
      case 'BACKGROUND_VERIFICATION':
        return <BackgroundVerificationStep {...commonProps} />
      default:
        return <div>Unknown step type</div>
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Employee Onboarding</CardTitle>
              <p className="text-muted-foreground mt-1">Complete your onboarding process to get started</p>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-2xl font-bold text-primary">{completedSteps}/{totalSteps}</div>
              <div className="text-sm text-muted-foreground">Steps Completed</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-semibold text-primary">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
            
            {/* Quick Info - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-muted-foreground">Department</div>
                  <div className="text-sm font-semibold truncate">{submission.department?.name || 'Not assigned'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-muted-foreground">Position</div>
                  <div className="text-sm font-semibold truncate">{submission.position || 'Not assigned'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-muted-foreground">Start Date</div>
                  <div className="text-sm font-semibold">
                    {submission.dateOfJoining ? new Date(submission.dateOfJoining).toLocaleDateString() : 'Not set'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-muted-foreground">Employment Type</div>
                  <div className="text-sm font-semibold">
                    {submission.employmentType?.replace('_', ' ') || 'Not set'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Steps */}
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="overview" className="w-full">
            <div className="flex h-[600px]">
              {/* Vertical Tabs - Left Side */}
              <div className="w-64 bg-muted/30 border-r">
                <div className="p-4">
                  <h4 className="font-medium text-sm text-muted-foreground mb-4">Onboarding Steps</h4>
                  <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 gap-1">
                    <TabsTrigger 
                      value="overview" 
                      className="w-full justify-start p-3 h-auto data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Info className="h-4 w-4" />
                        <div className="text-left flex-1">
                          <div className="font-medium">Overview</div>
                          <div className="text-xs text-muted-foreground">Progress summary</div>
                        </div>
                      </div>
                    </TabsTrigger>
                    {submission.steps?.map((step, index) => {
                      const config = stepConfig[step.stepType as keyof typeof stepConfig]
                      const status = getStepStatus(step)
                      const Icon = config.icon
                      const StatusIcon = status.icon

                      return (
                        <TabsTrigger 
                          key={step.id}
                          value={`step-${step.id}`}
                          className="w-full justify-start p-3 h-auto data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >
                          <div className="flex items-start gap-3 w-full">
                            <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div className="text-left flex-1 min-w-0">
                              <div className="font-medium">{config.title}</div>
                              <div className="mt-1">
                                {/* Status Chip */}
                                <Badge 
                                  variant={status.color as 'default' | 'secondary' | 'destructive' | 'outline'} 
                                  className="flex items-center gap-1 text-xs px-2 py-1 w-fit"
                                >
                                  <StatusIcon className="h-3 w-3" />
                                  {status.label}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>
                </div>
              </div>

              {/* Tab Content - Right Side */}
              <div className="flex-1 overflow-hidden">

                {/* Overview Tab */}
                <TabsContent value="overview" className="h-full p-6 m-0">
                  <div className="h-full flex flex-col">
                    <div className="flex-shrink-0 mb-6">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Onboarding Progress
                      </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Current Status</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant={submission.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                {submission.status.replace('_', ' ')}
                              </Badge>
                              {submission.status === 'IN_PROGRESS' && (
                                <Clock className="h-4 w-4 text-yellow-600" />
                              )}
                              {submission.status === 'COMPLETED' && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                          </div>
                          
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Next Steps</h4>
                            <div className="space-y-2">
                              {submission.steps?.filter(step => canEditStep(step)).slice(0, 3).map((step) => {
                                const config = stepConfig[step.stepType as keyof typeof stepConfig]
                                return (
                                  <div key={step.id} className="flex items-center gap-2 text-sm">
                                    <ArrowRight className="h-3 w-3 text-primary" />
                                    <span className="text-muted-foreground">{config.title}</span>
                                  </div>
                                )
                              })}
                              {submission.steps?.filter(step => canEditStep(step)).length === 0 && (
                                <div className="text-sm text-green-600 flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4" />
                                  All steps completed!
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Quick Actions</h4>
                            {submission.steps?.find(step => canEditStep(step)) && (
                              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <Info className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                <p className="text-sm text-blue-800 font-medium">Select a step from the left to continue</p>
                                <p className="text-xs text-blue-600 mt-1">Click on any pending step to complete it</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Individual Step Tabs */}
                {submission.steps?.map((step) => {
                  const config = stepConfig[step.stepType as keyof typeof stepConfig]
                  const status = getStepStatus(step)
                  const Icon = config.icon
                  const StatusIcon = status.icon

                  return (
                    <TabsContent key={step.id} value={`step-${step.id}`} className="h-full p-6 m-0">
                      <div className="h-full flex flex-col">
                        <div className="flex-shrink-0 mb-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Icon className="h-5 w-5" />
                                {config.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
                            </div>
                            <Badge variant={status.color as 'default' | 'secondary' | 'destructive' | 'outline'} className="flex items-center gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                          {/* Review/Rejection Feedback */}
                          {(step.reviewComments || step.rejectionReason) && (
                            <div className="mb-6">
                              {step.reviewComments && (
                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-3">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <div>
                                      <span className="font-medium text-blue-800">Review Comments</span>
                                      <p className="text-blue-700 mt-1">{step.reviewComments}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {step.rejectionReason && (
                                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                                  <div className="flex items-start gap-2">
                                    <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                                    <div>
                                      <span className="font-medium text-red-800">Rejection Reason</span>
                                      <p className="text-red-700 mt-1">{step.rejectionReason}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Step Form - Always show the form */}
                          <div className="mb-6">
                            {renderStepForm(step)}
                          </div>

                          {/* Status Section */}
                          <div className="pt-4 border-t">
                            {step.status === 'SUBMITTED' && (
                              <div className="text-center">
                                <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                                <p className="text-sm text-yellow-800 font-medium">Under Review</p>
                                <p className="text-xs text-yellow-600 mt-1">Awaiting approval from HR</p>
                              </div>
                            )}
                            {step.status === 'APPROVED' && (
                              <div className="text-center">
                                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                <p className="text-sm text-green-800 font-medium">Approved</p>
                                {step.reviewedAt && (
                                  <p className="text-xs text-green-600 mt-1">
                                    Approved on {new Date(step.reviewedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  )
                })}
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>

    </div>
  )
}
