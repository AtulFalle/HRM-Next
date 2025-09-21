'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { RequestFormDialog } from './request-form-dialog'
import { CommentThread } from './comment-thread'
import { AssignmentDialog } from '../manager/assignment-dialog'
import { toast } from 'sonner'
import { 
  getStatusBadgeVariant, 
  getStatusBadgeColor, 
  getStatusLabel,
  getCategoryLabel,
  isValidStatusTransition,
  getValidNextStatuses,
  canUserPerformAction,
  RequestStatus
} from '@/lib/request-utils'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface EmployeeRequest {
  id: string
  category: 'QUERY' | 'IT_SUPPORT' | 'PAYROLL' | 'GENERAL'
  title: string
  description: string
  status: RequestStatus
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
}

interface RequestDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: EmployeeRequest | null
  onUpdateRequest: (id: string, updates: Partial<EmployeeRequest>) => void
  onDeleteRequest: (id: string) => void
  showAssignment?: boolean
  currentUserId?: string
  currentUserRole?: string
}

export function RequestDetailsDialog({
  open,
  onOpenChange,
  request,
  onUpdateRequest,
  onDeleteRequest,
  showAssignment = false,
  currentUserId = '',
  currentUserRole = 'EMPLOYEE',
}: RequestDetailsDialogProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleStatusChange = async (newStatus: RequestStatus) => {
    if (!request) return
    
    // Validate status transition
    if (!isValidStatusTransition(request.status, newStatus, currentUserRole as 'EMPLOYEE' | 'MANAGER' | 'ADMIN')) {
      toast.error('Invalid status transition')
      return
    }

    setIsUpdating(true)
    try {
      await onUpdateRequest(request.id, { status: newStatus })
      toast.success('Status updated successfully!')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAssignmentChange = async (assignedTo: string | null) => {
    if (!request) return
    
    try {
      await onUpdateRequest(request.id, { assignedTo })
      toast.success('Assignment updated successfully!')
    } catch (error) {
      console.error('Error updating assignment:', error)
      toast.error('Failed to update assignment')
    }
  }

  const handleDelete = async () => {
    if (!request) return
    setIsDeleting(true)
    try {
      await onDeleteRequest(request.id)
      onOpenChange(false)
      toast.success('Request deleted successfully!')
    } catch (error) {
      console.error('Error deleting request:', error)
      toast.error('Failed to delete request')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = (data: {
    category: 'QUERY' | 'IT_SUPPORT' | 'PAYROLL' | 'GENERAL'
    title: string
    description: string
  }) => {
    if (!request) return
    onUpdateRequest(request.id, data)
    setShowEditDialog(false)
    toast.success('Request updated successfully!')
  }

  if (!request) return null

  const canEdit = canUserPerformAction(
    currentUserRole as 'EMPLOYEE' | 'MANAGER' | 'ADMIN',
    'edit',
    { employeeId: request.employee?.id || '', assignedTo: request.assignedTo, status: request.status },
    currentUserId
  )

  const canDelete = canUserPerformAction(
    currentUserRole as 'EMPLOYEE' | 'MANAGER' | 'ADMIN',
    'close',
    { employeeId: request.employee?.id || '', assignedTo: request.assignedTo, status: request.status },
    currentUserId
  )

  const canAssign = showAssignment && canUserPerformAction(
    currentUserRole as 'EMPLOYEE' | 'MANAGER' | 'ADMIN',
    'assign',
    { employeeId: request.employee?.id || '', assignedTo: request.assignedTo, status: request.status },
    currentUserId
  )

  const validNextStatuses = getValidNextStatuses(request.status, currentUserRole as 'EMPLOYEE' | 'MANAGER' | 'ADMIN')

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{request.title}</DialogTitle>
            <DialogDescription>
              Request details and management options
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Request Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <Badge variant="outline" className="mt-1">
                    {getCategoryLabel(request.category)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge
                    variant={getStatusBadgeVariant(request.status)}
                    className={getStatusBadgeColor(request.status) + ' mt-1'}
                  >
                    {getStatusLabel(request.status)}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created By</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {request.employee?.user.name} ({request.employee?.employeeId})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {request.employee?.user.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created At</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Assignment Info */}
            {showAssignment && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">
                    Assignment
                  </label>
                  {canAssign && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAssignmentDialog(true)}
                    >
                      {request.assignedUser ? 'Reassign' : 'Assign'}
                    </Button>
                  )}
                </div>
                <div className="mt-2 p-3 bg-muted rounded-md">
                  {request.assignedUser ? (
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {request.assignedUser.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{request.assignedUser.name}</p>
                        <p className="text-sm text-muted-foreground">{request.assignedUser.role}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Unassigned</p>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Description
              </label>
              <div className="mt-2 p-3 bg-muted rounded-md">
                <p className="text-sm whitespace-pre-wrap">{request.description}</p>
              </div>
            </div>

            <Separator />

            {/* Comments Section */}
            <div>
              <CommentThread
                requestId={request.id}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                onCommentAdded={() => {
                  // Optionally refresh request data
                }}
              />
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {canEdit && (
                  <Button
                    variant="outline"
                    onClick={() => setShowEditDialog(true)}
                    disabled={isUpdating || isDeleting}
                  >
                    Edit Request
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting || isUpdating}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Request'}
                  </Button>
                )}
              </div>
              
              {/* Status Change Actions */}
              {validNextStatuses.length > 0 && (
                <div className="flex gap-2">
                  <Select
                    value=""
                    onValueChange={(value) => handleStatusChange(value as RequestStatus)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Change Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {validNextStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {getStatusLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <RequestFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSubmit={handleEdit}
        request={request}
      />

      {/* Assignment Dialog */}
      {showAssignment && (
        <AssignmentDialog
          open={showAssignmentDialog}
          onOpenChange={setShowAssignmentDialog}
          requestId={request.id}
          currentAssignedTo={request.assignedTo}
          onAssignmentChange={handleAssignmentChange}
        />
      )}
    </>
  )
}
