import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, CheckCircle, TrendingUp, Users, Clock, Star } from 'lucide-react'

interface PerformanceStats {
  totalGoals: number
  completedGoals: number
  activeGoals: number
  averageProgress: number
  pendingReviews: number
  completedReviews: number
}

interface PerformanceStatsCardsProps {
  stats: PerformanceStats
}

export function PerformanceStatsCards({ stats }: PerformanceStatsCardsProps) {
  const cards = [
    {
      title: 'Total Goals',
      value: stats.totalGoals,
      icon: Target,
      description: 'Goals set',
      color: 'text-blue-600'
    },
    {
      title: 'Completed Goals',
      value: stats.completedGoals,
      icon: CheckCircle,
      description: 'Goals achieved',
      color: 'text-green-600'
    },
    {
      title: 'Active Goals',
      value: stats.activeGoals,
      icon: TrendingUp,
      description: 'In progress',
      color: 'text-orange-600'
    },
    {
      title: 'Average Progress',
      value: `${stats.averageProgress}%`,
      icon: Target,
      description: 'Overall progress',
      color: 'text-purple-600'
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
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
