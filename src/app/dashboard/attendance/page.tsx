'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AttendanceCheckin } from '@/components/attendance/attendance-checkin'
import { AttendanceTable } from '@/components/attendance/attendance-table'
import { Clock, Calendar, Loader2 } from 'lucide-react'

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState('checkin')
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading
    
    if (session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') {
      // Redirect admin/manager to admin attendance page
      router.push('/dashboard/attendance/admin')
    }
  }, [session, status, router])

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    )
  }

  // Don't render anything if redirecting
  if (session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') {
    return null
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-gray-600 mt-1">
            Track your daily check-ins and view your attendance history
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="checkin" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Daily Check-in
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Attendance History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkin" className="mt-6">
          <AttendanceCheckin />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <AttendanceTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}