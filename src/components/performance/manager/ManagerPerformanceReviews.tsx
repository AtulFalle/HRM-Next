'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, Star, Calendar, User, Target, Search, Filter, Plus } from 'lucide-react'
import { CreateReviewDialog } from './CreateReviewDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

interface TeamReview {
  id: string
  employeeId: string
  goalId?: string
  cycleId: string
  reviewType: string
  rating: string
  comments?: string
  strengths?: string
  improvements?: string
  status: string
  reviewedBy?: string
  reviewedAt?: string
  createdAt: string
  employee: {
    user: {
      name: string
      email: string
    }
    department?: {
      name: string
    }
  }
  goal?: {
    title: string
    description: string
    progress: number
    status: string
    target: string
    startDate: string
    endDate: string
    updates: Array<{
      id: string
      updateText: string
      progress: number
      updatedAt: string
      updater: {
        name: string
      }
    }>
  }
  cycle: {
    name: string
    type: string
  }
  reviewer?: {
    name: string
    email: string
  }
}

interface ManagerPerformanceReviewsProps {
  onReviewUpdate: () => void
}

export function ManagerPerformanceReviews({ onReviewUpdate }: ManagerPerformanceReviewsProps) {
  const [reviews, setReviews] = useState<TeamReview[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [ratingFilter, setRatingFilter] = useState<string>('all')

  useEffect(() => {
    fetchTeamReviews()
  }, [])

  const fetchTeamReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/performance/reviews')
      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Error fetching team reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReview = async (reviewData: any) => {
    try {
      const response = await fetch('/api/performance/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      })

      if (response.ok) {
        await fetchTeamReviews()
        onReviewUpdate()
        setShowCreateDialog(false)
      }
    } catch (error) {
      console.error('Error creating review:', error)
    }
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'EXCEEDS_EXPECTATIONS':
        return 'bg-green-100 text-green-800'
      case 'MEETS_EXPECTATIONS':
        return 'bg-blue-100 text-blue-800'
      case 'BELOW_EXPECTATIONS':
        return 'bg-yellow-100 text-yellow-800'
      case 'NEEDS_IMPROVEMENT':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.employee.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.cycle.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter
    const matchesRating = ratingFilter === 'all' || review.rating === ratingFilter
    
    return matchesSearch && matchesStatus && matchesRating
  })

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Performance Reviews</h2>
          <p className="text-muted-foreground">
            Conduct and manage performance reviews for your team
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Review
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search reviews or team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="EXCEEDS_EXPECTATIONS">Exceeds Expectations</SelectItem>
            <SelectItem value="MEETS_EXPECTATIONS">Meets Expectations</SelectItem>
            <SelectItem value="BELOW_EXPECTATIONS">Below Expectations</SelectItem>
            <SelectItem value="NEEDS_IMPROVEMENT">Needs Improvement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No team reviews found"
          description={
            searchTerm || statusFilter !== 'all' || ratingFilter !== 'all'
              ? "No reviews match your current filters. Try adjusting your search criteria."
              : "You haven't conducted any performance reviews yet. Create your first review to get started."
          }
          onAction={() => setShowCreateDialog(true)}
          actionLabel="Create Review"
        />
      ) : (
        <div className="grid gap-4">
          {filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {review.employee.user.name}
                    </CardTitle>
                    <CardDescription>
                      {review.employee.department?.name} • {review.cycle.name} - {review.cycle.type}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getRatingColor(review.rating)}>
                      {review.rating.replace('_', ' ')}
                    </Badge>
                    <Badge className={getStatusColor(review.status)}>
                      {review.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Goal Information */}
                  {review.goal && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Related Goal:</span>
                      </div>
                      <div className="pl-6 space-y-2">
                        <div>
                          <p className="text-sm font-medium">{review.goal.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {review.goal.description}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-muted-foreground">Progress:</span>
                            <span className="ml-1 font-medium">{review.goal.progress}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status:</span>
                            <span className="ml-1 font-medium">{review.goal.status}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Target:</span>
                            <span className="ml-1 font-medium">{review.goal.target}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Due:</span>
                            <span className="ml-1 font-medium">
                              {new Date(review.goal.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {review.goal.updates && review.goal.updates.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground">Recent Updates:</span>
                            {review.goal.updates.slice(0, 2).map((update, index) => (
                              <div key={index} className="text-xs text-muted-foreground pl-2">
                                <span className="font-medium">{update.updater.name}:</span> {update.updateText}
                                <span className="ml-1 text-xs">
                                  ({new Date(update.updatedAt).toLocaleDateString()})
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Review Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {review.comments && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Comments</span>
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">
                          {review.comments}
                        </p>
                      </div>
                    )}

                    {review.strengths && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Strengths</span>
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">
                          {review.strengths}
                        </p>
                      </div>
                    )}

                    {review.improvements && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Areas for Improvement</span>
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">
                          {review.improvements}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Review Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Created:</span>
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    {review.reviewedAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Reviewed:</span>
                        <span>{new Date(review.reviewedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {review.reviewer && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Reviewer:</span>
                        <span>{review.reviewer.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        try {
                          // Fetch detailed review information
                          const response = await fetch(`/api/performance/reviews/${review.id}`)
                          const data = await response.json()
                          
                          if (data.review) {
                            const reviewData = data.review
                            const details = `
Review Details:
Employee: ${reviewData.employee.user.name}
Department: ${reviewData.employee.department?.name || 'N/A'}
Rating: ${reviewData.rating}
Status: ${reviewData.status}
Cycle: ${reviewData.cycle.name} (${reviewData.cycle.type})
Created: ${new Date(reviewData.createdAt).toLocaleDateString()}
${reviewData.reviewedAt ? `Reviewed: ${new Date(reviewData.reviewedAt).toLocaleDateString()}` : 'Not reviewed yet'}
${reviewData.reviewer ? `Reviewer: ${reviewData.reviewer.name}` : 'No reviewer assigned'}

Comments: ${reviewData.comments || 'No comments'}
Strengths: ${reviewData.strengths || 'No strengths noted'}
Improvements: ${reviewData.improvements || 'No improvements noted'}

${reviewData.goal ? `
Related Goal: ${reviewData.goal.title}
Goal Progress: ${reviewData.goal.progress}%
Goal Status: ${reviewData.goal.status}
Goal Target: ${reviewData.goal.target}
` : 'No related goal'}
                            `
                            alert(details)
                          }
                        } catch (error) {
                          console.error('Error fetching review details:', error)
                        }
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {review.status === 'PENDING' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={async () => {
                          try {
                            // Complete the review
                            const response = await fetch(`/api/performance/reviews/${review.id}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                status: 'COMPLETED',
                                reviewedAt: new Date().toISOString()
                              }),
                            })
                            
                            if (response.ok) {
                              await fetchTeamReviews()
                              onReviewUpdate()
                            }
                          } catch (error) {
                            console.error('Error completing review:', error)
                          }
                        }}
                      >
                        Complete Review
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Open email client to contact employee
                        window.open(`mailto:${review.employee.user.email}?subject=Performance Review Discussion`)
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Contact Employee
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        try {
                          // Update review status
                          const response = await fetch(`/api/performance/reviews/${review.id}`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              status: review.status === 'PENDING' ? 'IN_PROGRESS' : 'PENDING'
                            }),
                          })
                          
                          if (response.ok) {
                            await fetchTeamReviews()
                            onReviewUpdate()
                          }
                        } catch (error) {
                          console.error('Error updating review status:', error)
                        }
                      }}
                    >
                      {review.status === 'PENDING' ? 'Start Review' : 'Reopen Review'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Review Dialog */}
      <CreateReviewDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateReview}
      />
    </div>
  )
}
