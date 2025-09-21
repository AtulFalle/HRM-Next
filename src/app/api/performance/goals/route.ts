import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  target: z.string().min(1, 'Target is required'),
  category: z.enum(['PERFORMANCE', 'DEVELOPMENT', 'BEHAVIORAL', 'PROJECT', 'SKILL', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
})


// GET /api/performance/goals - Get all goals for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    const where: { 
      employee: { userId: string }
      status?: string
      category?: string
    } = {
      employee: {
        userId: session.user.id
      }
    }

    if (status) {
      where.status = status
    }

    if (category) {
      where.category = category
    }

    const goals = await prisma.performanceGoal.findMany({
      where: {
        employee: { userId: session.user.id },
        ...(where.status && {
          status: where.status as 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD',
        }),
        ...(where.category && {
          category: where.category as 'PERFORMANCE' | 'DEVELOPMENT' | 'BEHAVIORAL' | 'PROJECT' | 'SKILL' | 'OTHER',
        }),
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            },
            department: {
              select: {
                name: true
              }
            }
          }
        },
        updates: {
          orderBy: {
            updatedAt: 'desc'
          },
          take: 5,
          include: {
            updater: {
              select: {
                name: true
              }
            }
          }
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            reviews: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ goals })
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/performance/goals - Create a new goal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createGoalSchema.parse(body)

    // Get employee record
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const goal = await prisma.performanceGoal.create({
      data: {
        ...validatedData,
        employeeId: employee.id,
        priority: validatedData.priority || 'MEDIUM'
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    console.error('Error creating goal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
