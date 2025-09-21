'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, TrendingUp, Target, Star, Award } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

interface PerformanceAnalytics {
  goalCompletionRate: number
  averageProgress: number
  reviewCompletionRate: number
  topPerformers: Array<{
    name: string
    department: string
    progress: number
    goalsCompleted: number
  }>
  departmentStats: Array<{
    department: string
    totalEmployees: number
    averageProgress: number
    goalCompletionRate: number
  }>
  reviewStats: {
    total: number
    completed: number
    pending: number
    overdue: number
  }
  goalStats: {
    total: number
    completed: number
    active: number
    overdue: number
  }
}

export function AdminPerformanceAnalytics() {
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      // Fetch all data
      const [goalsResponse, reviewsResponse, employeesResponse] = await Promise.all([
        fetch('/api/performance/goals'),
        fetch('/api/performance/reviews'),
        fetch('/api/employees')
      ])
      
      const goalsData = await goalsResponse.json()
      const reviewsData = await reviewsResponse.json()
      const employeesData = await employeesResponse.json()
      
      const goals = goalsData.goals || []
      const reviews = reviewsData.reviews || []
      const employees = employeesData.employees || []
      
      // Calculate analytics
      const completedGoals = goals.filter((goal: { status: string }) => goal.status === 'COMPLETED').length
      const goalCompletionRate = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0
      const averageProgress = goals.length > 0 
        ? Math.round(goals.reduce((sum: number, goal: { progress: number }) => sum + goal.progress, 0) / goals.length)
        : 0
      
      const completedReviews = reviews.filter((review: { status: string }) => review.status === 'COMPLETED').length
      const reviewCompletionRate = reviews.length > 0 ? Math.round((completedReviews / reviews.length) * 100) : 0
      
      // Top performers
      const employeePerformance = employees.map((employee: { id: string; user: { name: string }; department?: { name: string } }) => {
        const employeeGoals = goals.filter((goal: { employeeId: string }) => goal.employeeId === employee.id)
        const completedGoals = employeeGoals.filter((goal: { status: string }) => goal.status === 'COMPLETED').length
        const averageProgress = employeeGoals.length > 0 
          ? Math.round(employeeGoals.reduce((sum: number, goal: { progress: number }) => sum + goal.progress, 0) / employeeGoals.length)
          : 0
        
        return {
          name: employee.user.name,
          department: employee.department?.name || 'N/A',
          progress: averageProgress,
          goalsCompleted: completedGoals,
          totalGoals: employeeGoals.length
        }
      }).filter((emp: { totalGoals: number }) => emp.totalGoals > 0)
      
      const topPerformers = employeePerformance
        .sort((a: { progress: number }, b: { progress: number }) => b.progress - a.progress)
        .slice(0, 5)
      
      // Department stats
      const departmentMap = new Map()
      employees.forEach((employee: { id: string; department?: { name: string } }) => {
        const dept = employee.department?.name || 'N/A'
        if (!departmentMap.has(dept)) {
          departmentMap.set(dept, {
            department: dept,
            totalEmployees: 0,
            totalProgress: 0,
            totalGoals: 0,
            completedGoals: 0
          })
        }
        
        const deptStats = departmentMap.get(dept)
        deptStats.totalEmployees++
        
        const employeeGoals = goals.filter((goal: { employeeId: string }) => goal.employeeId === employee.id)
        const completedGoals = employeeGoals.filter((goal: { status: string }) => goal.status === 'COMPLETED').length
        const averageProgress = employeeGoals.length > 0 
          ? Math.round(employeeGoals.reduce((sum: number, goal: { progress: number }) => sum + goal.progress, 0) / employeeGoals.length)
          : 0
        
        deptStats.totalProgress += averageProgress
        deptStats.totalGoals += employeeGoals.length
        deptStats.completedGoals += completedGoals
      })
      
      const departmentStats = Array.from(departmentMap.values()).map(dept => ({
        department: dept.department,
        totalEmployees: dept.totalEmployees,
        averageProgress: dept.totalEmployees > 0 ? Math.round(dept.totalProgress / dept.totalEmployees) : 0,
        goalCompletionRate: dept.totalGoals > 0 ? Math.round((dept.completedGoals / dept.totalGoals) * 100) : 0
      }))
      
      // Review stats
      const pendingReviews = reviews.filter((review: { status: string }) => review.status === 'PENDING').length
      const overdueReviews = reviews.filter((review: { status: string; createdAt: string }) => {
        const reviewDate = new Date(review.createdAt)
        const now = new Date()
        const daysDiff = Math.ceil((now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24))
        return review.status === 'PENDING' && daysDiff > 14
      }).length
      
      // Goal stats
      const activeGoals = goals.filter((goal: { status: string }) => goal.status === 'ACTIVE').length
      const overdueGoals = goals.filter((goal: { status: string; endDate: string }) => {
        const endDate = new Date(goal.endDate)
        const now = new Date()
        return goal.status === 'ACTIVE' && now > endDate
      }).length
      
      setAnalytics({
        goalCompletionRate,
        averageProgress,
        reviewCompletionRate,
        topPerformers,
        departmentStats,
        reviewStats: {
          total: reviews.length,
          completed: completedReviews,
          pending: pendingReviews,
          overdue: overdueReviews
        },
        goalStats: {
          total: goals.length,
          completed: completedGoals,
          active: activeGoals,
          overdue: overdueGoals
        }
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!analytics) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No analytics data available"
        description="Analytics data will appear once performance data is available."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive performance insights and trends
          </p>
        </div>
        <Button onClick={fetchAnalytics}>
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh Analytics
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goal Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.goalCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Goals completed successfully
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageProgress}%</div>
            <p className="text-xs text-muted-foreground">
              Overall team progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Review Completion</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.reviewCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Reviews completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.topPerformers.length}</div>
            <p className="text-xs text-muted-foreground">
              High achievers identified
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="top-performers">Top Performers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Goal Statistics</CardTitle>
                <CardDescription>Current goal status breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Completed</span>
                    <span className="text-sm font-medium">{analytics.goalStats.completed}</span>
                  </div>
                  <Progress value={(analytics.goalStats.completed / analytics.goalStats.total) * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Active</span>
                    <span className="text-sm font-medium">{analytics.goalStats.active}</span>
                  </div>
                  <Progress value={(analytics.goalStats.active / analytics.goalStats.total) * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Overdue</span>
                    <span className="text-sm font-medium text-red-600">{analytics.goalStats.overdue}</span>
                  </div>
                  <Progress value={(analytics.goalStats.overdue / analytics.goalStats.total) * 100} className="bg-red-100" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Review Statistics</CardTitle>
                <CardDescription>Performance review status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Completed</span>
                    <span className="text-sm font-medium">{analytics.reviewStats.completed}</span>
                  </div>
                  <Progress value={(analytics.reviewStats.completed / analytics.reviewStats.total) * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Pending</span>
                    <span className="text-sm font-medium">{analytics.reviewStats.pending}</span>
                  </div>
                  <Progress value={(analytics.reviewStats.pending / analytics.reviewStats.total) * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Overdue</span>
                    <span className="text-sm font-medium text-red-600">{analytics.reviewStats.overdue}</span>
                  </div>
                  <Progress value={(analytics.reviewStats.overdue / analytics.reviewStats.total) * 100} className="bg-red-100" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <div className="grid gap-4">
            {analytics.departmentStats.map((dept, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{dept.department}</CardTitle>
                  <CardDescription>{dept.totalEmployees} employees</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Average Progress</span>
                        <span className="text-sm font-medium">{dept.averageProgress}%</span>
                      </div>
                      <Progress value={dept.averageProgress} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Goal Completion</span>
                        <span className="text-sm font-medium">{dept.goalCompletionRate}%</span>
                      </div>
                      <Progress value={dept.goalCompletionRate} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="top-performers" className="space-y-4">
          <div className="grid gap-4">
            {analytics.topPerformers.map((performer, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-500" />
                        #{index + 1} {performer.name}
                      </CardTitle>
                      <CardDescription>{performer.department}</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      {performer.progress}% Progress
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Goals Completed</span>
                      <span className="text-sm font-medium">{performer.goalsCompleted}</span>
                    </div>
                    <Progress value={performer.progress} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
