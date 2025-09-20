import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Development mode toggle - set to true to skip authentication
const DEV_MODE = process.env.SKIP_AUTH === 'true'

// Route protection configuration
const ROUTE_PROTECTION = {
  // Public routes (no auth required)
  public: [
    '/auth/signin',
    '/auth/signup',
    '/api/auth',
  ],
  
  // API routes that require authentication
  apiProtected: [
    '/api/departments',
    '/api/employees',
    '/api/attendance',
    '/api/leave',
    '/api/payroll',
    '/api/dashboard',
    '/api/onboarding',
    '/api/performance',
  ],
  
  // Role-based route access
  roleBased: {
    ADMIN: [
      '/dashboard/admin',
      '/dashboard/manager',
      '/dashboard/employee',
      '/dashboard/payroll',
      '/dashboard/employees',
      '/dashboard/attendance',
      '/dashboard/leave',
      '/dashboard/onboarding',
      '/dashboard/settings',
      '/dashboard/performance',
    ],
    MANAGER: [
      '/dashboard/manager',
      '/dashboard/employee',
      '/dashboard/payroll',
      '/dashboard/employees',
      '/dashboard/attendance',
      '/dashboard/leave',
      '/dashboard/performance',
    ],
    EMPLOYEE: [
      '/dashboard/employee',
      '/dashboard/payroll',
      '/dashboard/attendance',
      '/dashboard/leave',
      '/dashboard/onboarding',
      '/dashboard/payslips',
      '/dashboard/performance',
    ],
  }
}

function isPublicRoute(pathname: string): boolean {
  return ROUTE_PROTECTION.public.some(route => pathname.startsWith(route))
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

function isProtectedApiRoute(pathname: string): boolean {
  return ROUTE_PROTECTION.apiProtected.some(route => pathname.startsWith(route))
}

function hasRoleAccess(pathname: string, role: string): boolean {
  const allowedRoutes = ROUTE_PROTECTION.roleBased[role as keyof typeof ROUTE_PROTECTION.roleBased] || []
  return allowedRoutes.some(route => pathname.startsWith(route))
}

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname
    
    // Skip authentication in development mode
    if (DEV_MODE) {
      console.log('🔓 DEV MODE: Skipping authentication for', pathname)
      return NextResponse.next()
    }

    // Allow public routes
    if (isPublicRoute(pathname)) {
      return NextResponse.next()
    }

    const token = req.nextauth.token
    const isAuth = !!token

    // Handle API routes
    if (isApiRoute(pathname)) {
      if (isProtectedApiRoute(pathname)) {
        if (!isAuth) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        // Check role-based access for specific API routes
        const role = token?.role as string
        
        // Admin-only API routes
        if (pathname.includes('/admin/') && role !== 'ADMIN') {
          return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
        }
        
        // Manager+ API routes
        if (pathname.includes('/manager/') && !['ADMIN', 'MANAGER'].includes(role)) {
          return NextResponse.json({ error: 'Forbidden - Manager access required' }, { status: 403 })
        }
      }
      return NextResponse.next()
    }

    // Handle page routes
    if (!isAuth) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    const role = token?.role as string

    // Check role-based access for dashboard routes
    if (pathname.startsWith('/dashboard/')) {
      if (!hasRoleAccess(pathname, role)) {
        // Redirect to appropriate dashboard based on role
        if (role === 'MANAGER') {
          return NextResponse.redirect(new URL('/dashboard/manager', req.url))
        } else if (role === 'EMPLOYEE') {
          return NextResponse.redirect(new URL('/dashboard/employee', req.url))
        } else {
          return NextResponse.redirect(new URL('/dashboard/admin', req.url))
        }
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname
        
        // Skip auth check in development mode
        if (DEV_MODE) {
          return true
        }
        
        // Allow public routes
        if (isPublicRoute(pathname)) {
          return true
        }
        
        // For API routes, we handle auth in the middleware function
        if (isApiRoute(pathname)) {
          return true
        }
        
        // For page routes, require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
    '/auth/:path*',
  ],
}
