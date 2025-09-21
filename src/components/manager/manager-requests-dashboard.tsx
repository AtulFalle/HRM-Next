'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MessageSquare, Clock, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { RequestDetailsDialog } from '@/components/employee/request-details-dialog'
import { RequestTable } from '@/components/employee/request-table'
import { useSession } from 'next-auth/react'

interface RequestStats {
  total: number
  open: number
  inProgress: number
  waitingInfo: number
  resolved: number
  closed: number
  assignedToMe: number
}

interface EmployeeRequest {
  id: string
  category: 'QUERY' | 'IT_SUPPORT' | 'PAYROLL' | 'GENERAL'
  title: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_INFO' | 'RESOLVED' | 'CLOSED'
  assignedTo?: string | null
  createdAt: string
  updatedAt: string
  employee?: {
    id: string
    firstName: string
    lastName: string
    employeeId: string
    user: {
      name: string
      email: string
    }
  }
  assignedUser?: {
    id: string
    name: string
    email: string
    role: string
    employee?: {
      firstName: string
      lastName: string
      employeeId: string
    }
  } | null
  _count?: {
    comments: number
  }
}

export function ManagerRequestsDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<RequestStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    waitingInfo: 0,
    resolved: 0,
    closed: 0,
    assignedToMe: 0,
  })
  const [requests, setRequests] = useState<EmployeeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<EmployeeRequest | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    assignedTo: '',
    search: ''
  })

  const fetchRequests = useCallback(async () => {
    try {
    const params = new URLSearchParams()
    if (filters.status && filters.status !== 'all') params.append('status', filters.status)
    if (filters.category && filters.category !== 'all') params.append('category', filters.category)
    if (filters.assignedTo && filters.assignedTo !== 'all') params.append('assignedTo', filters.assignedTo)

      const response = await fetch(`/api/requests?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
        
        // Calculate stats
        const stats = {
          total: data.requests.length,
          open: data.requests.filter((r: EmployeeRequest) => r.status === 'OPEN').length,
          inProgress: data.requests.filter((r: EmployeeRequest) => r.status === 'IN_PROGRESS').length,
          waitingInfo: data.requests.filter((r: EmployeeRequest) => r.status === 'WAITING_INFO').length,
          resolved: data.requests.filter((r: EmployeeRequest) => r.status === 'RESOLVED').length,
          closed: data.requests.filter((r: EmployeeRequest) => r.status === 'CLOSED').length,
          assignedToMe: data.requests.filter((r: EmployeeRequest) => r.assignedTo).length,
        }
        setStats(stats)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    }
  }, [filters])

  useEffect(() => {
    setLoading(true)
    fetchRequests().finally(() => setLoading(false))
  }, [fetchRequests])

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
        await fetchRequests()
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
        await fetchRequests()
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
          <h1 className="text-3xl font-bold">All Requests</h1>
          <p className="text-muted-foreground">
            Manage and review all employee requests
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="WAITING_INFO">Waiting Info</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="QUERY">Query</SelectItem>
                  <SelectItem value="IT_SUPPORT">IT Support</SelectItem>
                  <SelectItem value="PAYROLL">Payroll</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Assignment</label>
              <Select value={filters.assignedTo} onValueChange={(value) => setFilters(prev => ({ ...prev, assignedTo: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All assignments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All assignments</SelectItem>
                  <SelectItem value="me">Assigned to me</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search requests..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>
            Review and manage all employee requests
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
            showEmployeeInfo={true}
          />
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      <RequestDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        request={selectedRequest}
        onUpdateRequest={handleUpdateRequest}
        onDeleteRequest={handleDeleteRequest}
        showAssignment={true}
        currentUserId={session?.user?.id || ''}
        currentUserRole={session?.user?.role || 'MANAGER'}
      />
    </div>
  )
}
