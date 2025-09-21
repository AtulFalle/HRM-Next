'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Eye, Star, Calendar, User, Target } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

interface Review {
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
  }
  goal?: {
    title: string
    description: string
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


export function PerformanceReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/performance/reviews')
      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
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
    if (filter === 'all') return true
    return review.status.toLowerCase() === filter
  })

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Reviews</h2>
          <p className="text-muted-foreground">
            View and manage performance reviews
          </p>
        </div>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(value) => setFilter(value as 'all' | 'pending' | 'completed')}>
        <TabsList>
          <TabsTrigger value="all">All Reviews</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4">
          {filteredReviews.length === 0 ? (
            <EmptyState
              icon={Star}
              title="No reviews found"
              description={
                filter === 'all'
                  ? "You don't have any performance reviews yet."
                  : `No ${filter} reviews found.`
              }
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
                          {review.cycle.name} - {review.cycle.type}
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
                          <div className="pl-6">
                            <p className="text-sm font-medium">{review.goal.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {review.goal.description}
                            </p>
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
Your Performance Review:
Rating: ${reviewData.rating}
Status: ${reviewData.status}
Cycle: ${reviewData.cycle.name} (${reviewData.cycle.type})
Created: ${new Date(reviewData.createdAt).toLocaleDateString()}
${reviewData.reviewedAt ? `Reviewed: ${new Date(reviewData.reviewedAt).toLocaleDateString()}` : 'Not reviewed yet'}
${reviewData.reviewer ? `Reviewer: ${reviewData.reviewer.name}` : 'No reviewer assigned'}

Comments: ${reviewData.comments || 'No comments'}
Strengths: ${reviewData.strengths || 'No strengths noted'}
Areas for Improvement: ${reviewData.improvements || 'No improvements noted'}

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
                                // Employees can't complete reviews, but they can acknowledge them
                                const response = await fetch(`/api/performance/reviews/${review.id}`, {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    status: 'IN_PROGRESS'
                                  }),
                                })
                                
                                if (response.ok) {
                                  alert('Review acknowledged. You can now provide feedback.')
                                  window.location.reload()
                                }
                              } catch (error) {
                                console.error('Error updating review status:', error)
                              }
                            }}
                          >
                            Acknowledge Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
