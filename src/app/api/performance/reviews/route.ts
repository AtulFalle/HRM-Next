import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createReviewSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  goalId: z.string().optional(),
  cycleId: z.string().min(1, 'Cycle ID is required'),
  reviewType: z.enum(['MID_YEAR', 'ANNUAL', 'QUARTERLY', 'PROJECT_BASED']),
  rating: z.enum(['EXCEEDS_EXPECTATIONS', 'MEETS_EXPECTATIONS', 'BELOW_EXPECTATIONS', 'NEEDS_IMPROVEMENT']),
  comments: z.string().optional(),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
})

const updateReviewSchema = z.object({
  rating: z.enum(['EXCEEDS_EXPECTATIONS', 'MEETS_EXPECTATIONS', 'BELOW_EXPECTATIONS', 'NEEDS_IMPROVEMENT']).optional(),
  comments: z.string().optional(),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
})

// GET /api/performance/reviews - Get reviews (filtered by role)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const cycleId = searchParams.get('cycleId')
    const status = searchParams.get('status')

    // Get user role and employee info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        employee: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const where: { 
      employeeId?: string
      cycleId?: string
      status?: string
    } = {}

    // Filter by role
    if (user.role === 'EMPLOYEE') {
      // Employees can only see their own reviews
      where.employeeId = user.employee?.id
    } else if (user.role === 'MANAGER') {
      // Managers can see reviews for their team members
      if (employeeId) {
        where.employeeId = employeeId
      }
    }
    // Admins can see all reviews

    if (cycleId) {
      where.cycleId = cycleId
    }

    if (status) {
      where.status = status
    }

    const reviews = await prisma.performanceReview.findMany({
      where,
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
        goal: {
          select: {
            title: true,
            description: true,
            progress: true,
            status: true,
            target: true,
            startDate: true,
            endDate: true,
            updates: {
              orderBy: {
                updatedAt: 'desc'
              },
              take: 3,
              include: {
                updater: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        cycle: {
          select: {
            name: true,
            type: true,
            startDate: true,
            endDate: true
          }
        },
        reviewer: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/performance/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createReviewSchema.parse(body)

    // Check if user is manager or admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!['MANAGER', 'ADMIN'].includes(user?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const review = await prisma.performanceReview.create({
      data: {
        ...validatedData,
        reviewedBy: session.user.id
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
        },
        goal: {
          select: {
            title: true,
            description: true
          }
        },
        cycle: {
          select: {
            name: true,
            type: true
          }
        },
        reviewer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
