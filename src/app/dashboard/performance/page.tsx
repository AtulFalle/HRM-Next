'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Target, TrendingUp, Calendar } from 'lucide-react'
import { GoalSettingInterface } from '@/components/performance/GoalSettingInterface'
import { PerformanceReviews } from '@/components/performance/PerformanceReviews'
import { ReviewCycles } from '@/components/performance/ReviewCycles'
import { PerformanceStatsCards } from '@/components/performance/PerformanceStatsCards'

interface PerformanceStats {
  totalGoals: number
  completedGoals: number
  activeGoals: number
  averageProgress: number
  pendingReviews: number
  completedReviews: number
}

export default function PerformancePage() {
  const [stats, setStats] = useState<PerformanceStats>({
    totalGoals: 0,
    completedGoals: 0,
    activeGoals: 0,
    averageProgress: 0,
    pendingReviews: 0,
    completedReviews: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPerformanceStats()
  }, [])

  const fetchPerformanceStats = async () => {
    try {
      setLoading(true)
      
      // Fetch goals
      const goalsResponse = await fetch('/api/performance/goals')
      const goalsData = await goalsResponse.json()
      
      // Fetch reviews
      const reviewsResponse = await fetch('/api/performance/reviews')
      const reviewsData = await reviewsResponse.json()
      
      const goals = goalsData.goals || []
      const reviews = reviewsData.reviews || []
      
      const completedGoals = goals.filter((goal: { status: string }) => goal.status === 'COMPLETED').length
      const activeGoals = goals.filter((goal: { status: string }) => goal.status === 'ACTIVE').length
      const averageProgress = goals.length > 0 
        ? Math.round(goals.reduce((sum: number, goal: { progress: number }) => sum + goal.progress, 0) / goals.length)
        : 0
      
      const pendingReviews = reviews.filter((review: { status: string }) => review.status === 'PENDING').length
      const completedReviews = reviews.filter((review: { status: string }) => review.status === 'COMPLETED').length
      
      setStats({
        totalGoals: goals.length,
        completedGoals,
        activeGoals,
        averageProgress,
        pendingReviews,
        completedReviews
      })
    } catch (error) {
      console.error('Error fetching performance stats:', error)
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
          <h1 className="text-3xl font-bold tracking-tight">Performance Management</h1>
          <p className="text-muted-foreground">
            Set goals, track progress, and manage performance reviews
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <PerformanceStatsCards stats={stats} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="goals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Reviews
          </TabsTrigger>
          <TabsTrigger value="cycles" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Review Cycles
          </TabsTrigger>
        </TabsList>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <GoalSettingInterface onGoalUpdate={fetchPerformanceStats} />
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <PerformanceReviews />
        </TabsContent>

        {/* Review Cycles Tab */}
        <TabsContent value="cycles" className="space-y-6">
          <ReviewCycles />
        </TabsContent>
      </Tabs>
    </div>
  )
}
