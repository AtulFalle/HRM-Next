'use client'

import { useSession } from 'next-auth/react'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'
import { ModernCard, StatCard, FeatureCard } from '@/components/ui/modern-card'
import { ModernButton, ActionButton } from '@/components/ui/modern-button'
import { UserPlus, FileText, ArrowRight, DollarSign, Calculator, Receipt, Users, Calendar, Settings, TrendingUp, Activity, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function AdminDashboardPage() {
  const { data: session } = useSession()

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">You need to be logged in to access this page.</p>
        </div>
      </div>
    )
  }

  if (session.user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">You don&apos;t have permission to access the admin dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Welcome back, {session.user.name}!
        </h1>
        <p className="text-lg text-muted-foreground">
          Here's what's happening with your HRM system today
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value="156"
          description="+12 this month"
          icon={<Users className="h-5 w-5" />}
          trend={{ value: 8.2, isPositive: true }}
          animation="slide-up"
        />
        <StatCard
          title="Active Onboardings"
          value="8"
          description="3 pending review"
          icon={<FileText className="h-5 w-5" />}
          trend={{ value: 15.3, isPositive: true }}
          animation="slide-up"
        />
        <StatCard
          title="Payroll Processed"
          value="₹2.4M"
          description="This month"
          icon={<DollarSign className="h-5 w-5" />}
          trend={{ value: 5.7, isPositive: true }}
          animation="slide-up"
        />
        <StatCard
          title="System Health"
          value="99.9%"
          description="All systems operational"
          icon={<Activity className="h-5 w-5" />}
          trend={{ value: 0.1, isPositive: true }}
          animation="slide-up"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Employee Management */}
        <ModernCard
          title="Employee Management"
          description="Manage your workforce efficiently"
          variant="gradient"
          animation="scale-in"
          className="p-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FeatureCard
              title="Add Employee"
              description="Create new employee profiles"
              icon={<UserPlus className="h-6 w-6" />}
              onClick={() => window.location.href = '/dashboard/employees/new'}
            />
            <FeatureCard
              title="View All"
              description="Browse employee directory"
              icon={<Users className="h-6 w-6" />}
              onClick={() => window.location.href = '/dashboard/employees'}
            />
            <FeatureCard
              title="Onboarding"
              description="Manage new hire process"
              icon={<FileText className="h-6 w-6" />}
              onClick={() => window.location.href = '/dashboard/onboarding'}
            />
            <FeatureCard
              title="Reports"
              description="Generate employee reports"
              icon={<TrendingUp className="h-6 w-6" />}
              onClick={() => window.location.href = '/dashboard/employees'}
            />
          </div>
        </ModernCard>

        {/* Payroll Management */}
        <ModernCard
          title="Payroll Management"
          description="Process and manage payroll efficiently"
          variant="gradient"
          animation="scale-in"
          className="p-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FeatureCard
              title="Process Payroll"
              description="Calculate monthly payroll"
              icon={<Calculator className="h-6 w-6" />}
              onClick={() => window.location.href = '/dashboard/payroll'}
            />
            <FeatureCard
              title="Generate Payslips"
              description="Create employee payslips"
              icon={<Receipt className="h-6 w-6" />}
              onClick={() => window.location.href = '/dashboard/payroll'}
            />
            <FeatureCard
              title="Payroll Reports"
              description="View payroll analytics"
              icon={<DollarSign className="h-6 w-6" />}
              onClick={() => window.location.href = '/dashboard/payroll'}
            />
            <FeatureCard
              title="Settings"
              description="Configure payroll settings"
              icon={<Settings className="h-6 w-6" />}
              onClick={() => window.location.href = '/dashboard/settings'}
            />
          </div>
        </ModernCard>
      </div>

      {/* Recent Activity */}
      <ModernCard
        title="Recent Activity"
        description="Latest updates and notifications"
        animation="slide-up"
        className="p-6"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-success/5 border border-success/20 rounded-lg">
            <div className="h-2 w-2 bg-success rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">Payroll processed successfully</p>
              <p className="text-xs text-muted-foreground">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-warning/5 border border-warning/20 rounded-lg">
            <div className="h-2 w-2 bg-warning rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">3 onboarding applications pending review</p>
              <p className="text-xs text-muted-foreground">4 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-info/5 border border-info/20 rounded-lg">
            <div className="h-2 w-2 bg-info rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">New employee John Doe added</p>
              <p className="text-xs text-muted-foreground">1 day ago</p>
            </div>
          </div>
        </div>
      </ModernCard>

      <DashboardOverview role="ADMIN" />
    </div>
  )
}