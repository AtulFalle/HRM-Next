'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface EmployeeRequest {
  id: string
  category: 'QUERY' | 'IT_SUPPORT' | 'PAYROLL' | 'GENERAL'
  title: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_INFO' | 'RESOLVED' | 'CLOSED'
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
}

interface RequestTableProps {
  requests: EmployeeRequest[]
  onViewRequest: (request: EmployeeRequest) => void
  onUpdateRequest: (id: string, updates: Partial<EmployeeRequest>) => void
  onDeleteRequest: (id: string) => void
  showEmployeeInfo?: boolean
}

const categoryLabels = {
  QUERY: 'General Query',
  IT_SUPPORT: 'IT Support',
  PAYROLL: 'Payroll',
  GENERAL: 'General Service',
}

const statusLabels = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  WAITING_INFO: 'Waiting Info',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
}

export function RequestTable({
  requests,
  onViewRequest,
  onUpdateRequest,
  onDeleteRequest,
  showEmployeeInfo = false,
}: RequestTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'outline'
      case 'IN_PROGRESS':
        return 'secondary'
      case 'RESOLVED':
        return 'default'
      case 'CLOSED':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-gray-100 text-gray-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'WAITING_INFO':
        return 'bg-blue-100 text-blue-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
      case 'CLOSED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await onDeleteRequest(id)
    } finally {
      setDeletingId(null)
    }
  }

  const handleStatusChange = async (id: string, newStatus: 'OPEN' | 'IN_PROGRESS' | 'WAITING_INFO' | 'RESOLVED' | 'CLOSED') => {
    await onUpdateRequest(id, { status: newStatus })
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No requests found.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first request to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            {showEmployeeInfo && <TableHead>Employee</TableHead>}
            <TableHead>Assigned To</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">
                <div className="max-w-[200px] truncate" title={request.title}>
                  {request.title}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {categoryLabels[request.category]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={getStatusBadgeVariant(request.status)}
                  className={getStatusBadgeColor(request.status)}
                >
                  {statusLabels[request.status]}
                </Badge>
              </TableCell>
              {showEmployeeInfo && (
                <TableCell>
                  <div>
                    <p className="font-medium">{request.employee?.firstName} {request.employee?.lastName}</p>
                    <p className="text-sm text-muted-foreground">{request.employee?.employeeId}</p>
                  </div>
                </TableCell>
              )}
              <TableCell>
                {request.assignedUser ? (
                  <div>
                    <p className="font-medium">{request.assignedUser.name}</p>
                    <p className="text-sm text-muted-foreground">{request.assignedUser.role}</p>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </TableCell>
              <TableCell>
                {format(new Date(request.createdAt), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewRequest(request)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {request.status === 'OPEN' && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(request.id, 'IN_PROGRESS')}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Mark as In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(request.id, 'CLOSED')}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Close Request
                        </DropdownMenuItem>
                      </>
                    )}
                    {request.status === 'IN_PROGRESS' && (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(request.id, 'RESOLVED')}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Mark as Resolved
                      </DropdownMenuItem>
                    )}
                    {request.status === 'OPEN' && (
                      <DropdownMenuItem
                        onClick={() => handleDelete(request.id)}
                        className="text-red-600"
                        disabled={deletingId === request.id}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deletingId === request.id ? 'Deleting...' : 'Delete'}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
