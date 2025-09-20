'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Plus, Target, Calendar, TrendingUp, Edit, Trash2, MessageSquare } from 'lucide-react'
import { CreateGoalDialog } from './CreateGoalDialog'
import { UpdateGoalDialog } from './UpdateGoalDialog'
import { GoalProgressDialog } from './GoalProgressDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

interface Goal {
  id: string
  title: string
  description: string
  target: string
  category: string
  priority: string
  status: string
  startDate: string
  endDate: string
  progress: number
  completionDate?: string
  createdAt: string
  updatedAt: string
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

interface GoalSettingInterfaceProps {
  onGoalUpdate: () => void
}

export function GoalSettingInterface({ onGoalUpdate }: GoalSettingInterfaceProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all')

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/performance/goals')
      const data = await response.json()
      setGoals(data.goals || [])
    } catch (error) {
      console.error('Error fetching goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGoal = async (goalData: any) => {
    try {
      const response = await fetch('/api/performance/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData),
      })

      if (response.ok) {
        await fetchGoals()
        onGoalUpdate()
        setShowCreateDialog(false)
      }
    } catch (error) {
      console.error('Error creating goal:', error)
    }
  }

  const handleUpdateGoal = async (goalData: any) => {
    if (!selectedGoal) return

    try {
      const response = await fetch(`/api/performance/goals/${selectedGoal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData),
      })

      if (response.ok) {
        await fetchGoals()
        onGoalUpdate()
        setShowUpdateDialog(false)
        setSelectedGoal(null)
      }
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return

    try {
      const response = await fetch(`/api/performance/goals/${goalId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchGoals()
        onGoalUpdate()
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
    }
  }

  const handleUpdateProgress = async (updateData: any) => {
    if (!selectedGoal) return

    try {
      const response = await fetch(`/api/performance/goals/${selectedGoal.id}/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        await fetchGoals()
        onGoalUpdate()
        setShowProgressDialog(false)
        setSelectedGoal(null)
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredGoals = goals.filter(goal => {
    if (filter === 'all') return true
    return goal.status.toLowerCase() === filter.toUpperCase()
  })

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Goals</h2>
          <p className="text-muted-foreground">
            Set and track your performance goals
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'active', 'completed', 'cancelled'] as const).map((filterType) => (
          <Button
            key={filterType}
            variant={filter === filterType ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(filterType)}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </Button>
        ))}
      </div>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals found"
          description={
            filter === 'all'
              ? "You haven't set any goals yet. Create your first goal to get started."
              : `No ${filter} goals found.`
          }
          action={
            filter === 'all' ? (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredGoals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                    <CardDescription>{goal.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(goal.priority)}>
                      {goal.priority}
                    </Badge>
                    <Badge className={getStatusColor(goal.status)}>
                      {goal.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>

                  {/* Target and Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Target:</span>
                      <span>{goal.target}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Start:</span>
                      <span>{new Date(goal.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">End:</span>
                      <span>{new Date(goal.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Recent Updates */}
                  {goal.updates.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Recent Updates</span>
                      </div>
                      <div className="space-y-1">
                        {goal.updates.slice(0, 2).map((update) => (
                          <div key={update.id} className="text-sm text-muted-foreground">
                            <span className="font-medium">{update.updater.name}:</span> {update.updateText}
                            <span className="ml-2 text-xs">
                              ({new Date(update.updatedAt).toLocaleDateString()})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedGoal(goal)
                        setShowProgressDialog(true)
                      }}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Update Progress
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedGoal(goal)
                        setShowUpdateDialog(true)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteGoal(goal.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateGoalDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateGoal}
      />

      <UpdateGoalDialog
        isOpen={showUpdateDialog}
        onClose={() => {
          setShowUpdateDialog(false)
          setSelectedGoal(null)
        }}
        onSubmit={handleUpdateGoal}
        goal={selectedGoal}
      />

      <GoalProgressDialog
        isOpen={showProgressDialog}
        onClose={() => {
          setShowProgressDialog(false)
          setSelectedGoal(null)
        }}
        onSubmit={handleUpdateProgress}
        goal={selectedGoal}
      />
    </div>
  )
}
