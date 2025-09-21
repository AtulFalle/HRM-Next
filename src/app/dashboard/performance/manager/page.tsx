'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Target, TrendingUp, Calendar } from 'lucide-react'
import { ManagerTeamGoals } from '@/components/performance/manager/ManagerTeamGoals'
import { ManagerPerformanceReviews } from '@/components/performance/manager/ManagerPerformanceReviews'
import { ManagerReviewCycles } from '@/components/performance/manager/ManagerReviewCycles'
import { ManagerPerformanceStatsCards } from '@/components/performance/manager/ManagerPerformanceStatsCards'

interface ManagerPerformanceStats {
  teamSize: number
  totalGoals: number
  completedGoals: number
  averageProgress: number
  pendingReviews: number
  completedReviews: number
  overdueReviews: number
}

export default function ManagerPerformancePage() {
  const [stats, setStats] = useState<ManagerPerformanceStats>({
    teamSize: 0,
    totalGoals: 0,
    completedGoals: 0,
    averageProgress: 0,
    pendingReviews: 0,
    completedReviews: 0,
    overdueReviews: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchManagerPerformanceStats()
  }, [])

  const fetchManagerPerformanceStats = async () => {
    try {
      setLoading(true)
      
      // Fetch team goals
      const goalsResponse = await fetch('/api/performance/goals')
      const goalsData = await goalsResponse.json()
      
      // Fetch team reviews
      const reviewsResponse = await fetch('/api/performance/reviews')
      const reviewsData = await reviewsResponse.json()
      
      const goals = goalsData.goals || []
      const reviews = reviewsData.reviews || []
      
      const completedGoals = goals.filter((goal: { status: string }) => goal.status === 'COMPLETED').length
      const averageProgress = goals.length > 0 
        ? Math.round(goals.reduce((sum: number, goal: { progress: number }) => sum + goal.progress, 0) / goals.length)
        : 0
      
      const pendingReviews = reviews.filter((review: { status: string }) => review.status === 'PENDING').length
      const completedReviews = reviews.filter((review: { status: string }) => review.status === 'COMPLETED').length
      const overdueReviews = reviews.filter((review: { status: string; createdAt: string }) => {
        const reviewDate = new Date(review.createdAt)
        const now = new Date()
        const daysDiff = Math.ceil((now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24))
        return review.status === 'PENDING' && daysDiff > 7
      }).length
      
      setStats({
        teamSize: goals.length > 0 ? new Set(goals.map((goal: { employeeId: string }) => goal.employeeId)).size : 0,
        totalGoals: goals.length,
        completedGoals,
        averageProgress,
        pendingReviews,
        completedReviews,
        overdueReviews
      })
    } catch (error) {
      console.error('Error fetching manager performance stats:', error)
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
          <h1 className="text-3xl font-bold tracking-tight">Team Performance Management</h1>
          <p className="text-muted-foreground">
            Monitor team goals, conduct performance reviews, and track progress
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <ManagerPerformanceStatsCards stats={stats} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="team-goals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="team-goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Team Goals
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance Reviews
          </TabsTrigger>
          <TabsTrigger value="cycles" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Review Cycles
          </TabsTrigger>
        </TabsList>

        {/* Team Goals Tab */}
        <TabsContent value="team-goals" className="space-y-6">
          <ManagerTeamGoals />
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <ManagerPerformanceReviews onReviewUpdate={fetchManagerPerformanceStats} />
        </TabsContent>

        {/* Review Cycles Tab */}
        <TabsContent value="cycles" className="space-y-6">
          <ManagerReviewCycles />
        </TabsContent>
      </Tabs>
    </div>
  )
}
