'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Plus, Users, Clock, CheckCircle } from 'lucide-react'
import { CreateCycleDialog } from './CreateCycleDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

interface ReviewCycle {
  id: string
  name: string
  type: string
  startDate: string
  endDate: string
  status: string
  createdBy: string
  createdAt: string
  creator: {
    name: string
    email: string
  }
  _count: {
    reviews: number
  }
}

export function ReviewCycles() {
  const [cycles, setCycles] = useState<ReviewCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    fetchCycles()
  }, [])

  const fetchCycles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/performance/cycles')
      const data = await response.json()
      setCycles(data.cycles || [])
    } catch (error) {
      console.error('Error fetching cycles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCycle = async (cycleData: any) => {
    try {
      const response = await fetch('/api/performance/cycles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cycleData),
      })

      if (response.ok) {
        await fetchCycles()
        setShowCreateDialog(false)
      }
    } catch (error) {
      console.error('Error creating cycle:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ANNUAL':
        return 'bg-purple-100 text-purple-800'
      case 'MID_YEAR':
        return 'bg-blue-100 text-blue-800'
      case 'QUARTERLY':
        return 'bg-green-100 text-green-800'
      case 'PROJECT_BASED':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isCurrentCycle = (cycle: ReviewCycle) => {
    const now = new Date()
    const startDate = new Date(cycle.startDate)
    const endDate = new Date(cycle.endDate)
    return now >= startDate && now <= endDate && cycle.status === 'ACTIVE'
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Review Cycles</h2>
          <p className="text-muted-foreground">
            Manage performance review cycles and schedules
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Cycle
        </Button>
      </div>

      {/* Cycles List */}
      {cycles.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No review cycles found"
          description="Create your first review cycle to get started with performance management."
          onAction={() => setShowCreateDialog(true)}
          actionLabel="Create Cycle"
        />
      ) : (
        <div className="grid gap-4">
          {cycles.map((cycle) => (
            <Card key={cycle.id} className={isCurrentCycle(cycle) ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {cycle.name}
                      {isCurrentCycle(cycle) && (
                        <Badge variant="outline" className="text-primary">
                          Current
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Created by {cycle.creator.name} on{' '}
                      {new Date(cycle.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getTypeColor(cycle.type)}>
                      {cycle.type.replace('_', ' ')}
                    </Badge>
                    <Badge className={getStatusColor(cycle.status)}>
                      {cycle.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Cycle Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Start Date</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(cycle.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">End Date</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(cycle.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Reviews</p>
                        <p className="text-sm text-muted-foreground">
                          {cycle._count.reviews} completed
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Cycle Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {(() => {
                          const now = new Date()
                          const startDate = new Date(cycle.startDate)
                          const endDate = new Date(cycle.endDate)
                          const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                          const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                          const progress = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100)
                          return `${Math.round(progress)}%`
                        })()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(() => {
                            const now = new Date()
                            const startDate = new Date(cycle.startDate)
                            const endDate = new Date(cycle.endDate)
                            const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                            const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                            return Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100)
                          })()}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        try {
                          // Fetch reviews for this cycle
                          const response = await fetch(`/api/performance/reviews?cycleId=${cycle.id}`)
                          const data = await response.json()
                          console.log('Reviews for cycle:', data.reviews)
                          alert(`Found ${data.reviews.length} reviews for this cycle`)
                        } catch (error) {
                          console.error('Error fetching reviews:', error)
                        }
                      }}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      View Reviews ({cycle._count.reviews})
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // For employees, they can't edit cycles, but they can view details
                        const details = `
Cycle: ${cycle.name}
Type: ${cycle.type}
Status: ${cycle.status}
Start: ${new Date(cycle.startDate).toLocaleDateString()}
End: ${new Date(cycle.endDate).toLocaleDateString()}
Reviews: ${cycle._count.reviews}
Created by: ${cycle.creator.name}
                        `
                        alert(details)
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {cycle.status === 'ACTIVE' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          alert('Only administrators can complete review cycles.')
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete Cycle
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Cycle Dialog */}
      <CreateCycleDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateCycle}
      />
    </div>
  )
}
