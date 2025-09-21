'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, User, Shield, Crown } from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  role: string
  employee?: {
    firstName: string
    lastName: string
    employeeId: string
  }
}

interface AssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestId: string
  currentAssignedTo?: string | null
  onAssignmentChange: (assignedTo: string | null) => void
}

export function AssignmentDialog({
  open,
  onOpenChange,
  requestId,
  currentAssignedTo,
  onAssignmentChange,
}: AssignmentDialogProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    if (open) {
      fetchUsers()
      setSelectedUser(currentAssignedTo || '')
    }
  }, [open, currentAssignedTo])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/users/managers-admins')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      } else {
        toast.error('Failed to load users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssign = async () => {
    setIsAssigning(true)
    try {
      const response = await fetch(`/api/employee-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedTo: selectedUser === 'unassigned' ? null : selectedUser,
        }),
      })

      if (response.ok) {
        toast.success('Assignment updated successfully!')
        onAssignmentChange(selectedUser === 'unassigned' ? null : selectedUser)
        onOpenChange(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update assignment')
      }
    } catch (error) {
      console.error('Error updating assignment:', error)
      toast.error('Failed to update assignment')
    } finally {
      setIsAssigning(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Crown className="h-4 w-4 text-purple-600" />
      case 'MANAGER':
        return <Shield className="h-4 w-4 text-blue-600" />
      default:
        return <User className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive'
      case 'MANAGER':
        return 'default'
      default:
        return 'secondary'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Request</DialogTitle>
          <DialogDescription>
            Assign this request to a manager or admin for handling.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-sm font-medium">Assign to</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Unassigned</span>
                    </div>
                  </SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center space-x-2">
                          <span>{user.name}</span>
                          <Badge 
                            variant={getRoleBadgeVariant(user.role)}
                            className="text-xs"
                          >
                            <div className="flex items-center space-x-1">
                              {getRoleIcon(user.role)}
                              <span>{user.role}</span>
                            </div>
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedUser && selectedUser !== 'unassigned' && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Selected Assignee</span>
              </div>
              <div className="mt-2">
                {(() => {
                  const user = users.find(u => u.id === selectedUser)
                  if (!user) return null
                  
                  return (
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          {getRoleIcon(user.role)}
                          <span className="text-xs text-muted-foreground">{user.role}</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={isAssigning || isLoading}
            >
              {isAssigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign Request'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
