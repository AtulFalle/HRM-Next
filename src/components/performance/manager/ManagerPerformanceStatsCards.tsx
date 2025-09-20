import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Target, CheckCircle, TrendingUp, Clock, Star, AlertTriangle } from 'lucide-react'

interface ManagerPerformanceStats {
  teamSize: number
  totalGoals: number
  completedGoals: number
  averageProgress: number
  pendingReviews: number
  completedReviews: number
  overdueReviews: number
}

interface ManagerPerformanceStatsCardsProps {
  stats: ManagerPerformanceStats
}

export function ManagerPerformanceStatsCards({ stats }: ManagerPerformanceStatsCardsProps) {
  const cards = [
    {
      title: 'Team Size',
      value: stats.teamSize,
      icon: Users,
      description: 'Team members',
      color: 'text-blue-600'
    },
    {
      title: 'Total Goals',
      value: stats.totalGoals,
      icon: Target,
      description: 'Team goals set',
      color: 'text-purple-600'
    },
    {
      title: 'Completed Goals',
      value: stats.completedGoals,
      icon: CheckCircle,
      description: 'Goals achieved',
      color: 'text-green-600'
    },
    {
      title: 'Average Progress',
      value: `${stats.averageProgress}%`,
      icon: TrendingUp,
      description: 'Team progress',
      color: 'text-orange-600'
    },
    {
      title: 'Pending Reviews',
      value: stats.pendingReviews,
      icon: Clock,
      description: 'Awaiting review',
      color: 'text-yellow-600'
    },
    {
      title: 'Completed Reviews',
      value: stats.completedReviews,
      icon: Star,
      description: 'Reviews done',
      color: 'text-indigo-600'
    },
    {
      title: 'Overdue Reviews',
      value: stats.overdueReviews,
      icon: AlertTriangle,
      description: 'Past due',
      color: 'text-red-600'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
