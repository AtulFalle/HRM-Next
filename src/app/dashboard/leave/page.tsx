'use client'

import { useSession } from 'next-auth/react'
import { LeaveManager } from '@/components/leave/leave-manager'

export default function LeavePage() {
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

  return (
    <div className="space-y-6">
      <LeaveManager />
    </div>
  )
}