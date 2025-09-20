'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Target, Calendar, TrendingUp, User, Search } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

interface TeamGoal {
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
  employee: {
    user: {
      name: string
      email: string
    }
  }
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

interface ManagerTeamGoalsProps {
  onGoalUpdate: () => void
}

export function ManagerTeamGoals({ onGoalUpdate }: ManagerTeamGoalsProps) {
  const [goals, setGoals] = useState<TeamGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  useEffect(() => {
    fetchTeamGoals()
  }, [])

  const fetchTeamGoals = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/performance/goals')
      const data = await response.json()
      setGoals(data.goals || [])
    } catch (error) {
      console.error('Error fetching team goals:', error)
    } finally {
      setLoading(false)
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
    const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         goal.employee.user.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || goal.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || goal.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Goals</h2>
          <p className="text-muted-foreground">
            Monitor and track your team&apos;s performance goals
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search goals or team members..."
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
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="PERFORMANCE">Performance</SelectItem>
            <SelectItem value="DEVELOPMENT">Development</SelectItem>
            <SelectItem value="BEHAVIORAL">Behavioral</SelectItem>
            <SelectItem value="PROJECT">Project</SelectItem>
            <SelectItem value="SKILL">Skill</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No team goals found"
          description={
            searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
              ? "No goals match your current filters. Try adjusting your search criteria."
              : "Your team hasn't set any goals yet. Encourage team members to create their first goals."
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
                    <CardDescription className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {goal.employee.user.name}
                    </CardDescription>
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

                  {/* Goal Details */}
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Target:</span>
                      <span className="text-sm">{goal.target}</span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
                      onClick={async () => {
                        try {
                          // Fetch detailed goal information
                          const response = await fetch(`/api/performance/goals/${goal.id}`)
                          const data = await response.json()
                          
                          if (data.goal) {
                            const goalData = data.goal
                            const details = `
Goal: ${goalData.title}
Description: ${goalData.description}
Progress: ${goalData.progress}%
Status: ${goalData.status}
Target: ${goalData.target}
Start: ${new Date(goalData.startDate).toLocaleDateString()}
End: ${new Date(goalData.endDate).toLocaleDateString()}
Employee: ${goalData.employee.user.name}
Department: ${goalData.employee.department?.name || 'N/A'}
Recent Updates: ${goalData.updates.length}
Reviews: ${goalData.reviews.length}
                            `
                            alert(details)
                          }
                        } catch (error) {
                          console.error('Error fetching goal details:', error)
                        }
                      }}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Open email client or contact form
                        window.open(`mailto:${goal.employee.user.email}?subject=Goal Discussion: ${goal.title}`)
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
                          // First, get available review cycles
                          const cyclesResponse = await fetch('/api/performance/cycles')
                          const cyclesData = await cyclesResponse.json()
                          
                          if (cyclesData.cycles && cyclesData.cycles.length > 0) {
                            const activeCycle = cyclesData.cycles.find((cycle: { status: string }) => cycle.status === 'ACTIVE')
                            
                            if (activeCycle) {
                              // Create a review for this goal
                              const reviewData = {
                                employeeId: goal.employeeId,
                                goalId: goal.id,
                                cycleId: activeCycle.id,
                                reviewType: activeCycle.type,
                                rating: goal.progress >= 80 ? 'EXCEEDS_EXPECTATIONS' : 
                                        goal.progress >= 60 ? 'MEETS_EXPECTATIONS' : 
                                        goal.progress >= 40 ? 'BELOW_EXPECTATIONS' : 'NEEDS_IMPROVEMENT',
                                comments: `Performance review for goal: ${goal.title}. Current progress: ${goal.progress}%`,
                                strengths: goal.progress >= 60 ? 
                                  `Strong progress on ${goal.title}. Employee has shown dedication.` :
                                  `Employee is working on ${goal.title} but needs more focus.`,
                                improvements: goal.progress < 60 ? 
                                  `Need to increase focus on ${goal.title}. Consider additional support.` :
                                  `Continue current approach for ${goal.title}.`
                              }
                              
                              const response = await fetch('/api/performance/reviews', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(reviewData),
                              })
                              
                              if (response.ok) {
                                alert('Review created successfully!')
                                // Refresh the goals list
                                window.location.reload()
                              } else {
                                alert('Failed to create review')
                              }
                            } else {
                              alert('No active review cycle found. Please create a review cycle first.')
                            }
                          } else {
                            alert('No review cycles found. Please create a review cycle first.')
                          }
                        } catch (error) {
                          console.error('Error creating review:', error)
                          alert('Error creating review')
                        }
                      }}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Create Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
