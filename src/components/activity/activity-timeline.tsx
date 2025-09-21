/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  UserPlus, 
  UserMinus, 
  Calendar, 
  Clock, 
  DollarSign,
  CheckCircle,
  XCircle,
  Bell,
  Edit,
  Settings,
  Shield,
  Mail,
} from 'lucide-react'

interface ActivityEvent {
  id: string
  type: 'employee' | 'leave' | 'attendance' | 'payroll' | 'system' | 'notification'
  action: 'created' | 'updated' | 'deleted' | 'approved' | 'rejected' | 'processed' | 'sent'
  entity: string
  description: string
  timestamp: string
  user: {
    name: string
    role: string
    avatar?: string
  }
  metadata?: {
    department?: string
    amount?: number
    status?: string
    priority?: 'low' | 'medium' | 'high'
  }
}

interface ActivityTimelineProps {
  limit?: number
  showFilters?: boolean
  entityType?: string
}

export function ActivityTimeline({ 
  limit = 20, 
  showFilters = true, 
  entityType 
}: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(filter !== 'all' && { type: filter }),
        ...(entityType && { entityType }),
      })
      
      const response = await fetch(`/api/activities?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setActivities(data.data.activities || [])
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }, [limit, filter, entityType])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const getActivityIcon = (type: string, action: string) => {
    const iconMap = {
      employee: {
        created: <UserPlus className="h-4 w-4 text-green-500" />,
        updated: <Edit className="h-4 w-4 text-blue-500" />,
        deleted: <UserMinus className="h-4 w-4 text-red-500" />,
      },
      leave: {
        created: <Calendar className="h-4 w-4 text-orange-500" />,
        approved: <CheckCircle className="h-4 w-4 text-green-500" />,
        rejected: <XCircle className="h-4 w-4 text-red-500" />,
        updated: <Edit className="h-4 w-4 text-blue-500" />,
      },
      attendance: {
        created: <Clock className="h-4 w-4 text-blue-500" />,
        updated: <Edit className="h-4 w-4 text-blue-500" />,
        processed: <CheckCircle className="h-4 w-4 text-green-500" />,
      },
      payroll: {
        created: <DollarSign className="h-4 w-4 text-purple-500" />,
        processed: <CheckCircle className="h-4 w-4 text-green-500" />,
        sent: <Mail className="h-4 w-4 text-blue-500" />,
      },
      system: {
        updated: <Settings className="h-4 w-4 text-gray-500" />,
        created: <Shield className="h-4 w-4 text-green-500" />,
      },
      notification: {
        sent: <Bell className="h-4 w-4 text-yellow-500" />,
      },
    }

    const typeMap = iconMap[type as keyof typeof iconMap] as any
    return typeMap?.[action] || <Bell className="h-4 w-4 text-gray-500" />
  }

  const getActionBadge = (action: string) => {
    const variants = {
      created: 'default',
      updated: 'secondary',
      deleted: 'destructive',
      approved: 'default',
      rejected: 'destructive',
      processed: 'default',
      sent: 'secondary',
    } as const

    const labels = {
      created: 'Created',
      updated: 'Updated',
      deleted: 'Deleted',
      approved: 'Approved',
      rejected: 'Rejected',
      processed: 'Processed',
      sent: 'Sent',
    } as const

    return (
      <Badge variant={variants[action as keyof typeof variants] || 'secondary'} className="text-xs">
        {labels[action as keyof typeof labels] || action}
      </Badge>
    )
  }

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null

    const variants = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
    } as const

    return (
      <Badge variant={variants[priority as keyof typeof variants] || 'secondary'} className="text-xs">
        {priority.toUpperCase()}
      </Badge>
    )
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const filterOptions = [
    { value: 'all', label: 'All Activities' },
    { value: 'employee', label: 'Employee' },
    { value: 'leave', label: 'Leave' },
    { value: 'attendance', label: 'Attendance' },
    { value: 'payroll', label: 'Payroll' },
    { value: 'system', label: 'System' },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          {showFilters && (
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                {/* Timeline line */}
                {index < activities.length - 1 && (
                  <div className="absolute left-6 top-12 w-px h-16 bg-gray-200"></div>
                )}
                
                {/* Activity icon */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                  {getActivityIcon(activity.type, activity.action)}
                </div>

                {/* Activity content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 font-medium">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          by {activity.user.name} ({activity.user.role})
                        </span>
                        {getActionBadge(activity.action)}
                        {getPriorityBadge(activity.metadata?.priority)}
                      </div>
                      {activity.metadata?.department && (
                        <p className="text-xs text-gray-500 mt-1">
                          Department: {activity.metadata.department}
                        </p>
                      )}
                      {activity.metadata?.amount && (
                        <p className="text-xs text-gray-500 mt-1">
                          Amount: {formatCurrency(activity.metadata.amount)}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-xs text-gray-500">
                      {formatTime(activity.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No recent activities</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
