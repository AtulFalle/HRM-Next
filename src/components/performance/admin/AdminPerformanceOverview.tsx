'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Target, Star, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

interface EmployeePerformance {
  id: string
  name: string
  email: string
  totalGoals: number
  completedGoals: number
  averageProgress: number
  totalReviews: number
  lastReviewDate?: string
  department: string
  position: string
}

interface AdminPerformanceOverviewProps {
  onDataUpdate: () => void
}

export function AdminPerformanceOverview({ onDataUpdate }: AdminPerformanceOverviewProps) {
  const [employees, setEmployees] = useState<EmployeePerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'high-performers' | 'needs-attention'>('all')

  useEffect(() => {
    fetchEmployeePerformance()
  }, [])

  const fetchEmployeePerformance = async () => {
    try {
      setLoading(true)
      
      // Fetch employees
      const employeesResponse = await fetch('/api/employees')
      const employeesData = await employeesResponse.json()
      
      // Fetch goals
      const goalsResponse = await fetch('/api/performance/goals')
      const goalsData = await goalsResponse.json()
      
      // Fetch reviews
      const reviewsResponse = await fetch('/api/performance/reviews')
      const reviewsData = await reviewsResponse.json()
      
      const goals = goalsData.goals || []
      const reviews = reviewsData.reviews || []
      
      // Process employee performance data
      const employeePerformance = employeesData.employees?.map((employee: { id: string; user: { name: string }; department?: { name: string } }) => {
        const employeeGoals = goals.filter((goal: { employeeId: string }) => goal.employeeId === employee.id)
        const employeeReviews = reviews.filter((review: { employeeId: string }) => review.employeeId === employee.id)
        
        const completedGoals = employeeGoals.filter((goal: { status: string }) => goal.status === 'COMPLETED').length
        const averageProgress = employeeGoals.length > 0 
          ? Math.round(employeeGoals.reduce((sum: number, goal: { progress: number }) => sum + goal.progress, 0) / employeeGoals.length)
          : 0
        
        const lastReview = employeeReviews
          .filter((review: { status: string }) => review.status === 'COMPLETED')
          .sort((a: { reviewedAt?: string; createdAt: string }, b: { reviewedAt?: string; createdAt: string }) => new Date(b.reviewedAt || b.createdAt).getTime() - new Date(a.reviewedAt || a.createdAt).getTime())[0]
        
        return {
          id: employee.id,
          name: employee.user.name,
          email: employee.user.email,
          totalGoals: employeeGoals.length,
          completedGoals,
          averageProgress,
          totalReviews: employeeReviews.length,
          lastReviewDate: lastReview?.reviewedAt || lastReview?.createdAt,
          department: employee.department?.name || 'N/A',
          position: employee.position || 'N/A'
        }
      }) || []
      
      setEmployees(employeePerformance)
    } catch (error) {
      console.error('Error fetching employee performance:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPerformanceLevel = (employee: EmployeePerformance) => {
    if (employee.averageProgress >= 80 && employee.completedGoals >= employee.totalGoals * 0.8) {
      return 'high'
    } else if (employee.averageProgress < 50 || employee.completedGoals < employee.totalGoals * 0.3) {
      return 'low'
    }
    return 'medium'
  }

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredEmployees = employees.filter(employee => {
    if (filter === 'all') return true
    
    const performanceLevel = getPerformanceLevel(employee)
    if (filter === 'high-performers') return performanceLevel === 'high'
    if (filter === 'needs-attention') return performanceLevel === 'low'
    
    return true
  })

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Overview</h2>
          <p className="text-muted-foreground">
            Monitor individual and team performance across the organization
          </p>
        </div>
        <Button onClick={fetchEmployeePerformance}>
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(value) => setFilter(value as 'all' | 'high-performers' | 'needs-attention')}>
        <TabsList>
          <TabsTrigger value="all">All Employees</TabsTrigger>
          <TabsTrigger value="high-performers">High Performers</TabsTrigger>
          <TabsTrigger value="needs-attention">Needs Attention</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4">
          {filteredEmployees.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No employees found"
              description={
                filter === 'all'
                  ? "No employee performance data available."
                  : `No employees match the ${filter.replace('-', ' ')} filter.`
              }
            />
          ) : (
            <div className="grid gap-4">
              {filteredEmployees.map((employee) => {
                const performanceLevel = getPerformanceLevel(employee)
                return (
                  <Card key={employee.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{employee.name}</CardTitle>
                          <CardDescription>
                            {employee.position} • {employee.department}
                          </CardDescription>
                        </div>
                        <Badge className={getPerformanceColor(performanceLevel)}>
                          {performanceLevel.toUpperCase()} PERFORMER
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Performance Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Goals</span>
                            </div>
                            <p className="text-2xl font-bold">
                              {employee.completedGoals}/{employee.totalGoals}
                            </p>
                            <p className="text-xs text-muted-foreground">Completed</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Progress</span>
                            </div>
                            <p className="text-2xl font-bold">{employee.averageProgress}%</p>
                            <p className="text-xs text-muted-foreground">Average</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Reviews</span>
                            </div>
                            <p className="text-2xl font-bold">{employee.totalReviews}</p>
                            <p className="text-xs text-muted-foreground">Conducted</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Last Review</span>
                            </div>
                            <p className="text-sm font-bold">
                              {employee.lastReviewDate 
                                ? new Date(employee.lastReviewDate).toLocaleDateString()
                                : 'Never'
                              }
                            </p>
                            <p className="text-xs text-muted-foreground">Date</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Overall Progress</span>
                            <span className="text-sm text-muted-foreground">{employee.averageProgress}%</span>
                          </div>
                          <Progress value={employee.averageProgress} className="h-2" />
                        </div>

                        {/* Performance Indicators */}
                        <div className="flex items-center gap-4 text-sm">
                          {performanceLevel === 'high' && (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>Exceeding expectations</span>
                            </div>
                          )}
                          {performanceLevel === 'low' && (
                            <div className="flex items-center gap-2 text-red-600">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Needs improvement</span>
                            </div>
                          )}
                          {performanceLevel === 'medium' && (
                            <div className="flex items-center gap-2 text-yellow-600">
                              <TrendingUp className="h-4 w-4" />
                              <span>Meeting expectations</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Target className="h-4 w-4 mr-2" />
                            View Goals
                          </Button>
                          <Button variant="outline" size="sm">
                            <Star className="h-4 w-4 mr-2" />
                            View Reviews
                          </Button>
                          <Button variant="outline" size="sm">
                            <Users className="h-4 w-4 mr-2" />
                            Contact Employee
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
