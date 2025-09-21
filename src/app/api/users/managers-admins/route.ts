import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserContext } from '@/lib/auth-utils'

// GET /api/users/managers-admins - Get all managers and admins for assignment
export async function GET() {
  try {
    const userContext = await getUserContext()

    if (!userContext?.user?.id || (userContext.user.role !== 'MANAGER' && userContext.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['MANAGER', 'ADMIN']
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        }
      },
      orderBy: [
        { role: 'asc' }, // ADMIN first, then MANAGER
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching managers and admins:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
