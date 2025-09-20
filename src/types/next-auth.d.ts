import { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      role: UserRole
      employee?: {
        id: string
        employeeId: string
        firstName: string
        lastName: string
        department: string | null
      }
    }
  }

  interface User {
    id: string
    email: string
    name: string
    image?: string
    role: UserRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
  }
}
