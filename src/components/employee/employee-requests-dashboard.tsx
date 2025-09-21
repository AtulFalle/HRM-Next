'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Clock, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { RequestFormDialog } from './request-form-dialog'
import { RequestDetailsDialog } from './request-details-dialog'
import { useSession } from 'next-auth/react'
import { RequestTable } from './request-table'

interface RequestStats {
  total: number
  open: number
  inProgress: number
  resolved: number
  closed: number
}

interface EmployeeRequest {
  id: string
  category: 'QUERY' | 'IT_SUPPORT' | 'PAYROLL' | 'GENERAL'
  title: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_INFO' | 'RESOLVED' | 'CLOSED'
  createdAt: string
  updatedAt: string
}

export function EmployeeRequestsDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<RequestStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  })
  const [requests, setRequests] = useState<EmployeeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<EmployeeRequest | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/employee-requests/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/employee-requests')
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchStats(), fetchRequests()])
    setLoading(false)
  }, [fetchStats, fetchRequests])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateRequest = async (requestData: {
    category: 'QUERY' | 'IT_SUPPORT' | 'PAYROLL' | 'GENERAL'
    title: string
    description: string
  }) => {
    try {
      const response = await fetch('/api/employee-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        toast.success('Request created successfully')
        setShowCreateDialog(false)
        await loadData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create request')
      }
    } catch (error) {
      console.error('Error creating request:', error)
      toast.error('Failed to create request')
    }
  }

  const handleUpdateRequest = async (id: string, updates: Partial<EmployeeRequest>) => {
    try {
      const response = await fetch(`/api/employee-requests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        toast.success('Request updated successfully')
        await loadData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update request')
      }
    } catch (error) {
      console.error('Error updating request:', error)
      toast.error('Failed to update request')
    }
  }

  const handleDeleteRequest = async (id: string) => {
    try {
      const response = await fetch(`/api/employee-requests/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Request deleted successfully')
        await loadData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete request')
      }
    } catch (error) {
      console.error('Error deleting request:', error)
      toast.error('Failed to delete request')
    }
  }


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Requests</h1>
          <p className="text-muted-foreground">
            Manage your support requests and queries
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open</p>
                <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>
            View and manage all your support requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RequestTable
            requests={requests}
            onViewRequest={(request) => {
              setSelectedRequest(request)
              setShowDetailsDialog(true)
            }}
            onUpdateRequest={handleUpdateRequest}
            onDeleteRequest={handleDeleteRequest}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <RequestFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateRequest}
      />

           <RequestDetailsDialog
             open={showDetailsDialog}
             onOpenChange={setShowDetailsDialog}
             request={selectedRequest}
             onUpdateRequest={handleUpdateRequest}
             onDeleteRequest={handleDeleteRequest}
             currentUserId={session?.user?.id || ''}
             currentUserRole={session?.user?.role || 'EMPLOYEE'}
           />
    </div>
  )
}
