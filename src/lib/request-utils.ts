/**
 * Employee Self Service Request Utilities
 * Handles status transitions, validation, and business logic
 */

export type RequestStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_INFO' | 'RESOLVED' | 'CLOSED'
export type RequestCategory = 'QUERY' | 'IT_SUPPORT' | 'PAYROLL' | 'GENERAL'

export interface StatusTransition {
  from: RequestStatus
  to: RequestStatus
  allowedRoles: ('EMPLOYEE' | 'MANAGER' | 'ADMIN')[]
  description: string
}

/**
 * Valid status transitions with role-based permissions
 */
export const STATUS_TRANSITIONS: StatusTransition[] = [
  // Employee can only close their own resolved requests
  { from: 'RESOLVED', to: 'CLOSED', allowedRoles: ['EMPLOYEE'], description: 'Employee confirms resolution' },
  
  // Managers/Admins can assign and progress requests
  { from: 'OPEN', to: 'IN_PROGRESS', allowedRoles: ['MANAGER', 'ADMIN'], description: 'Start working on request' },
  { from: 'IN_PROGRESS', to: 'WAITING_INFO', allowedRoles: ['MANAGER', 'ADMIN'], description: 'Need more information' },
  { from: 'IN_PROGRESS', to: 'RESOLVED', allowedRoles: ['MANAGER', 'ADMIN'], description: 'Request completed' },
  { from: 'WAITING_INFO', to: 'IN_PROGRESS', allowedRoles: ['MANAGER', 'ADMIN'], description: 'Continue working' },
  { from: 'WAITING_INFO', to: 'RESOLVED', allowedRoles: ['MANAGER', 'ADMIN'], description: 'Request completed' },
  
  // Admins can close any request
  { from: 'RESOLVED', to: 'CLOSED', allowedRoles: ['ADMIN'], description: 'Admin closes request' },
  { from: 'IN_PROGRESS', to: 'CLOSED', allowedRoles: ['ADMIN'], description: 'Admin closes request' },
  { from: 'WAITING_INFO', to: 'CLOSED', allowedRoles: ['ADMIN'], description: 'Admin closes request' },
]

/**
 * Check if a status transition is valid for a given role
 */
export function isValidStatusTransition(
  from: RequestStatus,
  to: RequestStatus,
  userRole: 'EMPLOYEE' | 'MANAGER' | 'ADMIN'
): boolean {
  if (from === to) return false
  
  const transition = STATUS_TRANSITIONS.find(t => t.from === from && t.to === to)
  if (!transition) return false
  
  return transition.allowedRoles.includes(userRole)
}

/**
 * Get all valid next statuses for a given current status and user role
 */
export function getValidNextStatuses(
  currentStatus: RequestStatus,
  userRole: 'EMPLOYEE' | 'MANAGER' | 'ADMIN'
): RequestStatus[] {
  return STATUS_TRANSITIONS
    .filter(t => t.from === currentStatus && t.allowedRoles.includes(userRole))
    .map(t => t.to)
}

/**
 * Get status badge variant for UI
 */
export function getStatusBadgeVariant(status: RequestStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'OPEN':
      return 'outline'
    case 'IN_PROGRESS':
      return 'secondary'
    case 'WAITING_INFO':
      return 'secondary'
    case 'RESOLVED':
      return 'default'
    case 'CLOSED':
      return 'destructive'
    default:
      return 'outline'
  }
}

/**
 * Get status badge color for UI
 */
export function getStatusBadgeColor(status: RequestStatus): string {
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

/**
 * Get status label for UI
 */
export function getStatusLabel(status: RequestStatus): string {
  switch (status) {
    case 'OPEN':
      return 'Open'
    case 'IN_PROGRESS':
      return 'In Progress'
    case 'WAITING_INFO':
      return 'Waiting Info'
    case 'RESOLVED':
      return 'Resolved'
    case 'CLOSED':
      return 'Closed'
    default:
      return status
  }
}

/**
 * Get category label for UI
 */
export function getCategoryLabel(category: RequestCategory): string {
  switch (category) {
    case 'QUERY':
      return 'General Query'
    case 'IT_SUPPORT':
      return 'IT Support'
    case 'PAYROLL':
      return 'Payroll'
    case 'GENERAL':
      return 'General Service'
    default:
      return category
  }
}

/**
 * Check if user can perform action on request
 */
export function canUserPerformAction(
  userRole: 'EMPLOYEE' | 'MANAGER' | 'ADMIN',
  action: 'view' | 'edit' | 'assign' | 'comment' | 'close',
  request: {
    employeeId: string
    assignedTo?: string | null
    status: RequestStatus
  },
  userId: string
): boolean {
  const isOwner = request.employeeId === userId
  const isAssigned = request.assignedTo === userId
  const isManagerOrAdmin = userRole === 'MANAGER' || userRole === 'ADMIN'
  const isAdmin = userRole === 'ADMIN'

  switch (action) {
    case 'view':
      return isOwner || isAssigned || isManagerOrAdmin
    case 'edit':
      if (isOwner) {
        return request.status === 'OPEN' || request.status === 'IN_PROGRESS' || request.status === 'WAITING_INFO'
      }
      return isManagerOrAdmin
    case 'assign':
      return isManagerOrAdmin
    case 'comment':
      return isOwner || isAssigned || isManagerOrAdmin
    case 'close':
      if (isOwner) {
        return request.status === 'RESOLVED'
      }
      return isAdmin || (isAssigned && request.status !== 'OPEN')
    default:
      return false
  }
}
