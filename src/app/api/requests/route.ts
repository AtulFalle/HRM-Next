import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserContext } from '@/lib/auth-utils'

// GET /api/requests - Get all requests for managers/admins
export async function GET(request: NextRequest) {
  try {
    const userContext = await getUserContext()
    
    if (!userContext?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only managers and admins can access this endpoint
    if (userContext.user.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const assignedTo = searchParams.get('assignedTo')

    const whereClause: Record<string, unknown> = {}

    if (status) {
      whereClause.status = status
    }

    if (category) {
      whereClause.category = category
    }

    if (assignedTo === 'me') {
      whereClause.assignedTo = userContext.user.id
    } else if (assignedTo === 'unassigned') {
      whereClause.assignedTo = null
    } else if (assignedTo) {
      whereClause.assignedTo = assignedTo
    }

    const requests = await prisma.employeeRequest.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        assignedUser: {
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
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}
