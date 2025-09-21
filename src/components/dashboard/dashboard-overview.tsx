'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Calendar, 
  FileText, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Bell,
  Settings,
  UserPlus,
  CalendarDays,
  Receipt
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  totalDepartments: number
  pendingLeaveRequests: number
  totalPayroll: number
  attendanceRate: number
  onboardingStats: {
    created: number
    inProgress: number
    completed: number
    cancelled: number
  }
  recentActivities: Array<{
    id: string
    type: 'employee' | 'leave' | 'attendance' | 'payroll'
    message: string
    timestamp: string
    status?: string
  }>
}

interface DashboardOverviewProps {
  role?: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
}

export function DashboardOverview({ role }: DashboardOverviewProps) {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalDepartments: 0,
    pendingLeaveRequests: 0,
    totalPayroll: 0,
    attendanceRate: 0,
    onboardingStats: {
      created: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0
    },
    recentActivities: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      toast.error('Failed to fetch dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'employee':
        return <UserPlus className="h-4 w-4 text-blue-500" />
      case 'leave':
        return <CalendarDays className="h-4 w-4 text-orange-500" />
      case 'attendance':
        return <Clock className="h-4 w-4 text-green-500" />
      case 'payroll':
        return <Receipt className="h-4 w-4 text-purple-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
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

  const userRole = role || session?.user?.role

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening in your organization.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      {userRole === 'ADMIN' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/dashboard/employees/onboarding">
                <Button className="w-full h-20 flex flex-col items-center justify-center gap-2">
                  <UserPlus className="h-6 w-6" />
                  <span>Onboard Employee</span>
                </Button>
              </Link>
              <Link href="/dashboard/leave">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                  <CalendarDays className="h-6 w-6" />
                  <span>Manage Leaves</span>
                </Button>
              </Link>
              <Link href="/dashboard/payroll">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                  <Receipt className="h-6 w-6" />
                  <span>Process Payroll</span>
                </Button>
              </Link>
              <Link href="/dashboard/attendance">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                  <Clock className="h-6 w-6" />
                  <span>View Attendance</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalEmployees}</p>
                <p className="text-xs text-gray-500">
                  {stats.activeEmployees} active
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalDepartments}</p>
                <p className="text-xs text-gray-500">
                  Active departments
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Leaves</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingLeaveRequests}</p>
                <p className="text-xs text-gray-500">
                  Awaiting approval
                </p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payroll</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalPayroll)}</p>
                <p className="text-xs text-gray-500">
                  This month
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onboarding Statistics - Admin/Manager Only */}
      {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Onboarding Status</h2>
            <Link href="/dashboard/onboarding">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Manage Onboarding
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Created</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.onboardingStats.created}</p>
                  </div>
                  <UserPlus className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.onboardingStats.inProgress}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{stats.onboardingStats.completed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cancelled</p>
                    <p className="text-2xl font-bold text-red-600">{stats.onboardingStats.cancelled}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-green-600">{stats.attendanceRate}%</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +2.5%
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.attendanceRate}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                Average attendance rate for this month
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : stats.recentActivities && stats.recentActivities.length > 0 ? (
                stats.recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{formatTime(activity.timestamp)}</span>
                        {getStatusIcon(activity.status)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No recent activities</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Overview */}
      {userRole === 'ADMIN' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employee Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalEmployees}</div>
                <div className="text-sm text-gray-600">Total Employees</div>
                <div className="text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +12% from last month
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{stats.activeEmployees}</div>
                <div className="text-sm text-gray-600">Active Employees</div>
                <div className="text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +8% from last month
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">{stats.pendingLeaveRequests}</div>
                <div className="text-sm text-gray-600">Pending Leaves</div>
                <div className="text-xs text-red-600 mt-1">
                  <TrendingDown className="h-3 w-3 inline mr-1" />
                  -3% from last month
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
