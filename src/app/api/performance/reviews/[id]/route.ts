import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateReviewSchema = z.object({
  rating: z.enum(['EXCEEDS_EXPECTATIONS', 'MEETS_EXPECTATIONS', 'BELOW_EXPECTATIONS', 'NEEDS_IMPROVEMENT']).optional(),
  comments: z.string().optional(),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
})

// GET /api/performance/reviews/[id] - Get a specific review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const review = await prisma.performanceReview.findUnique({
      where: { id },
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

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Check if user has access to this review
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { employee: true }
    })

    if (user?.role === 'EMPLOYEE' && review.employeeId !== user.employee?.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Error fetching review:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/performance/reviews/[id] - Update a review
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateReviewSchema.parse(body)

    // Check if review exists and user has access
    const existingReview = await prisma.performanceReview.findUnique({
      where: { id },
      select: { 
        id: true,
        employeeId: true,
        reviewedBy: true
      }
    })

    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Check permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { employee: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only the reviewer, employee (for self-review), or admin can update
    const canUpdate = 
      user.role === 'ADMIN' ||
      existingReview.reviewedBy === session.user.id ||
      (user.role === 'EMPLOYEE' && existingReview.employeeId === user.employee?.id)

    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const review = await prisma.performanceReview.update({
      where: { id },
      data: {
        ...validatedData,
        reviewedAt: validatedData.status === 'COMPLETED' ? new Date() : undefined
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

    return NextResponse.json({ review })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    console.error('Error updating review:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/performance/reviews/[id] - Delete a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.performanceReview.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Review deleted successfully' })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
