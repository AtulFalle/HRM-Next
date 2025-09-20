'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Calendar,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface RegularizationRequest {
  id: string
  date: string
  reason: string
  status: string
  requestedAt: string
  reviewedBy: string | null
  reviewedAt: string | null
  reviewComments: string | null
  employee: {
    user: {
      name: string
      email: string
    }
  }
  reviewer: {
    name: string
    email: string
  } | null
}

export function RegularizationRequests() {
  const [requests, setRequests] = useState<RegularizationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<RegularizationRequest | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewComments, setReviewComments] = useState('')
  const [reviewing, setReviewing] = useState(false)

  // Fetch regularization requests
  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/attendance/regularization')
      const result = await response.json()
      
      if (result.success) {
        setRequests(result.data)
      }
    } catch (error) {
      console.error('Error fetching regularization requests:', error)
      toast.error('Failed to fetch regularization requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  // Review request
  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedRequest) return

    setReviewing(true)
    try {
      const response = await fetch(`/api/attendance/regularization/${selectedRequest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          reviewComments: reviewComments.trim() || null
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Request ${status.toLowerCase()} successfully`)
        setReviewDialogOpen(false)
        setSelectedRequest(null)
        setReviewComments('')
        await fetchRequests()
      } else {
        toast.error(result.error || 'Failed to review request')
      }
    } catch (error) {
      console.error('Error reviewing request:', error)
      toast.error('Failed to review request')
    } finally {
      setReviewing(false)
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
      APPROVED: { label: 'Approved', variant: 'default' as const, icon: CheckCircle },
      REJECTED: { label: 'Rejected', variant: 'destructive' as const, icon: XCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading requests...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Attendance Regularization Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No regularization requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{request.employee.user.name}</div>
                        <div className="text-sm text-gray-600">{request.employee.user.email}</div>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        <strong>Date:</strong> {format(new Date(request.date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        <strong>Requested:</strong> {format(new Date(request.requestedAt), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <strong className="text-sm">Reason:</strong>
                    <p className="text-sm text-gray-700 mt-1">{request.reason}</p>
                  </div>

                  {request.reviewComments && (
                    <div>
                      <strong className="text-sm">Review Comments:</strong>
                      <p className="text-sm text-gray-700 mt-1">{request.reviewComments}</p>
                    </div>
                  )}

                  {request.status === 'PENDING' && (
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request)
                          setReviewDialogOpen(true)
                        }}
                      >
                        Review Request
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Regularization Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm">
                  <strong>Employee:</strong> {selectedRequest.employee.user.name}
                </div>
                <div className="text-sm">
                  <strong>Date:</strong> {format(new Date(selectedRequest.date), 'MMM dd, yyyy')}
                </div>
                <div className="text-sm">
                  <strong>Reason:</strong> {selectedRequest.reason}
                </div>
              </div>

              <div>
                <Label htmlFor="comments">Review Comments (Optional)</Label>
                <Textarea
                  id="comments"
                  placeholder="Add any comments about your decision..."
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setReviewDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReview('REJECTED')}
                  disabled={reviewing}
                >
                  {reviewing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Reject
                </Button>
                <Button
                  onClick={() => handleReview('APPROVED')}
                  disabled={reviewing}
                >
                  {reviewing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
