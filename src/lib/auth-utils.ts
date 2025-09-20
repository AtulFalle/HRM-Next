import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './db'

/**
 * Get the current user session for API routes
 * This function always uses proper authentication
 */
export async function getCurrentUser() {
  // Always get the actual session - no development bypass
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
    name: session.user.name
  }
}

/**
 * Check if the current user has the required role
 */
export function hasRole(userRole: string, requiredRoles: string | string[]): boolean {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  return roles.includes(userRole)
}

/**
 * Check if the current user is admin
 */
export function isAdmin(userRole: string): boolean {
  return userRole === 'ADMIN'
}

/**
 * Check if the current user is manager or admin
 */
export function isManagerOrAdmin(userRole: string): boolean {
  return ['ADMIN', 'MANAGER'].includes(userRole)
}

/**
 * Check if the current user is employee
 */
export function isEmployee(userRole: string): boolean {
  return userRole === 'EMPLOYEE'
}

/**
 * Get user context for API routes
 * Returns user info and helper functions
 */
export async function getUserContext() {
  const user = await getCurrentUser()
  
  if (!user) {
    return {
      success: false,
      error: 'Unauthorized'
    }
  }

  // Fetch employee data if user is an employee
  let employee = null
  if (user.role === 'EMPLOYEE') {
    employee = await prisma.employee.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        departmentId: true,
        position: true
      }
    })
  }

  return {
    success: true,
    user: {
      ...user,
      employee
    },
    hasRole: (roles: string | string[]) => hasRole(user.role, roles),
    isAdmin: () => isAdmin(user.role),
    isManagerOrAdmin: () => isManagerOrAdmin(user.role),
    isEmployee: () => isEmployee(user.role),
  }
}
