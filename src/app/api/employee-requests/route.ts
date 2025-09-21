import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserContext } from '@/lib/auth-utils'
import { z } from 'zod'

const createRequestSchema = z.object({
  category: z.enum(['QUERY', 'IT_SUPPORT', 'PAYROLL', 'GENERAL']),
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().min(1, 'Description is required'),
})

// GET /api/employee-requests - Get all requests for the logged-in employee
export async function GET() {
  try {
    const userContext = await getUserContext()
    
    if (!userContext?.user?.employee?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requests = await prisma.employeeRequest.findMany({
      where: {
        employeeId: userContext.user.employee.id,
      },
      include: {
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
    console.error('Error fetching employee requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}

// POST /api/employee-requests - Create a new request
export async function POST(request: NextRequest) {
  try {
    const userContext = await getUserContext()
    
    if (!userContext?.user?.employee?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createRequestSchema.parse(body)

    const newRequest = await prisma.employeeRequest.create({
      data: {
        employeeId: userContext.user.employee.id,
        category: validatedData.category,
        title: validatedData.title,
        description: validatedData.description,
        status: 'OPEN',
      },
    })

    return NextResponse.json({ request: newRequest }, { status: 201 })
  } catch (error) {
    console.error('Error creating employee request:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    )
  }
}
