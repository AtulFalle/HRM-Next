import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateCycleSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  type: z.enum(['MID_YEAR', 'ANNUAL', 'QUARTERLY', 'PROJECT_BASED']).optional(),
  startDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
})

// GET /api/performance/cycles/[id] - Get a specific review cycle
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cycle = await prisma.reviewCycle.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            name: true,
            email: true
          }
        },
        reviews: {
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
        },
        _count: {
          select: {
            reviews: true
          }
        }
      }
    })

    if (!cycle) {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 })
    }

    return NextResponse.json({ cycle })
  } catch (error) {
    console.error('Error fetching cycle:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/performance/cycles/[id] - Update a review cycle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const body = await request.json()
    const validatedData = updateCycleSchema.parse(body)

    const cycle = await prisma.reviewCycle.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        creator: {
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            reviews: true
          }
        }
      }
    })

    return NextResponse.json({ cycle })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    console.error('Error updating cycle:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/performance/cycles/[id] - Delete a review cycle
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Check if cycle has reviews
    const cycleWithReviews = await prisma.reviewCycle.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            reviews: true
          }
        }
      }
    })

    if (!cycleWithReviews) {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 })
    }

    if (cycleWithReviews._count.reviews > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete cycle with existing reviews' 
      }, { status: 400 })
    }

    await prisma.reviewCycle.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Cycle deleted successfully' })
  } catch (error) {
    console.error('Error deleting cycle:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
