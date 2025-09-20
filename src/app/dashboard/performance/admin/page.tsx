'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Users, Target, TrendingUp, Calendar, Settings, BarChart3 } from 'lucide-react'
import { AdminReviewCycles } from '@/components/performance/admin/AdminReviewCycles'
import { AdminPerformanceOverview } from '@/components/performance/admin/AdminPerformanceOverview'
import { AdminPerformanceAnalytics } from '@/components/performance/admin/AdminPerformanceAnalytics'
import { AdminPerformanceStatsCards } from '@/components/performance/admin/AdminPerformanceStatsCards'

interface AdminPerformanceStats {
  totalEmployees: number
  totalGoals: number
  completedGoals: number
  averageProgress: number
  totalReviews: number
  completedReviews: number
  activeCycles: number
  overdueReviews: number
}

export default function AdminPerformancePage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<AdminPerformanceStats>({
    totalEmployees: 0,
    totalGoals: 0,
    completedGoals: 0,
    averageProgress: 0,
    totalReviews: 0,
    completedReviews: 0,
    activeCycles: 0,
    overdueReviews: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminPerformanceStats()
  }, [])

  const fetchAdminPerformanceStats = async () => {
    try {
      setLoading(true)
      
      // Fetch all goals
      const goalsResponse = await fetch('/api/performance/goals')
      const goalsData = await goalsResponse.json()
      
      // Fetch all reviews
      const reviewsResponse = await fetch('/api/performance/reviews')
      const reviewsData = await reviewsResponse.json()
      
      // Fetch cycles
      const cyclesResponse = await fetch('/api/performance/cycles')
      const cyclesData = await cyclesResponse.json()
      
      const goals = goalsData.goals || []
      const reviews = reviewsData.reviews || []
      const cycles = cyclesData.cycles || []
      
      const completedGoals = goals.filter((goal: any) => goal.status === 'COMPLETED').length
      const averageProgress = goals.length > 0 
        ? Math.round(goals.reduce((sum: number, goal: any) => sum + goal.progress, 0) / goals.length)
        : 0
      
      const completedReviews = reviews.filter((review: any) => review.status === 'COMPLETED').length
      const activeCycles = cycles.filter((cycle: any) => cycle.status === 'ACTIVE').length
      const overdueReviews = reviews.filter((review: any) => {
        const reviewDate = new Date(review.createdAt)
        const now = new Date()
        const daysDiff = Math.ceil((now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24))
        return review.status === 'PENDING' && daysDiff > 14
      }).length
      
      setStats({
        totalEmployees: new Set(goals.map((goal: any) => goal.employeeId)).size,
        totalGoals: goals.length,
        completedGoals,
        averageProgress,
        totalReviews: reviews.length,
        completedReviews,
        activeCycles,
        overdueReviews
      })
    } catch (error) {
      console.error('Error fetching admin performance stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading performance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Management Admin</h1>
          <p className="text-muted-foreground">
            Oversee organization-wide performance management and analytics
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <AdminPerformanceStatsCards stats={stats} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="cycles" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Review Cycles
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <AdminPerformanceOverview onDataUpdate={fetchAdminPerformanceStats} />
        </TabsContent>

        {/* Review Cycles Tab */}
        <TabsContent value="cycles" className="space-y-6">
          <AdminReviewCycles onCycleUpdate={fetchAdminPerformanceStats} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <AdminPerformanceAnalytics />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="text-center py-8">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Performance Settings</h3>
            <p className="text-muted-foreground">
              Configure performance management settings and policies.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
