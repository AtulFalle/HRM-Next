'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Users, Calendar, DollarSign, Settings, LogOut, User, FileText, CheckCircle, Menu, X, Bell, Search, Target, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) router.push('/auth/signin')
  }, [session, status, router])

  if (!mounted) {
    return null
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10">
        <div className="text-center animate-fade-in">
          <LoadingSpinner size="xl" text="Loading your dashboard..." />
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const navigation = [
    { name: 'Dashboard', href: `/dashboard/${session.user.role.toLowerCase()}`, icon: User },
    ...(session.user.role === 'EMPLOYEE' ? 
      [
        { name: 'My Onboarding', href: '/dashboard/employee/onboarding', icon: FileText },
        { name: 'My Requests', href: '/dashboard/employee/requests', icon: MessageSquare }
      ] : []),
    ...(session.user.role === 'MANAGER' || session.user.role === 'ADMIN' ? 
      [
        { name: 'All Requests', href: '/dashboard/requests', icon: MessageSquare }
      ] : []),
    { name: 'Employees', href: '/dashboard/employees', icon: Users },
    { 
      name: 'Attendance', 
      href: session.user.role === 'EMPLOYEE' ? '/dashboard/attendance' : '/dashboard/attendance/admin', 
      icon: Calendar 
    },
    { name: 'Payroll', href: '/dashboard/payroll', icon: DollarSign },
    { 
      name: 'Performance', 
      href: session.user.role === 'EMPLOYEE' ? '/dashboard/performance' : 
            session.user.role === 'MANAGER' ? '/dashboard/performance/manager' : 
            '/dashboard/performance/admin', 
      icon: Target 
    },
    ...(session.user.role === 'MANAGER' ? 
      [{ name: 'Approvals', href: '/dashboard/payroll', icon: CheckCircle }] : []),
    ...(session.user.role === 'ADMIN' || session.user.role === 'MANAGER' ? 
      [{ name: 'Onboarding', href: '/dashboard/onboarding', icon: FileText }] : []),
    ...(session.user.role === 'ADMIN' ? [{ name: 'Settings', href: '/dashboard/settings', icon: Settings }] : [])
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-white font-bold text-sm">H</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  HRM System
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 w-64 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full"></span>
              </Button>
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-auto px-3 rounded-lg hover:bg-accent/50 transition-all">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                          {session.user.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden sm:block text-left">
                        <p className="text-sm font-medium">{session.user.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{session.user.role.toLowerCase()}</p>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                      <p className="text-xs leading-none text-primary capitalize">
                        {session.user.role.toLowerCase()}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Modern Sidebar */}
        <nav className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card/95 backdrop-blur-md border-r border-border/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-muted-foreground">Navigation</h2>
            </div>
            <div className="flex-1 px-4 pb-4">
              <ul className="space-y-2">
                {navigation.map((item, index) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group",
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-1"
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon className={cn(
                          "mr-3 h-5 w-5 transition-transform duration-200",
                          isActive ? "scale-110" : "group-hover:scale-105"
                        )} />
                        <span className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                          {item.name}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </nav>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 lg:ml-0">
          <div className="p-6">
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
