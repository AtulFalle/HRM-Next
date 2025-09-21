import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserContext } from '@/lib/auth-utils'
import { z } from 'zod'

const createCommentSchema = z.object({
  comment: z.string().min(1, 'Comment is required'),
})

// GET /api/employee-requests/[id]/comments - Get all comments for a request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userContext = await getUserContext()
    
    if (!userContext?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this request
    const requestRecord = await prisma.employeeRequest.findFirst({
      where: {
        id,
        OR: [
          { employeeId: userContext.user.employee?.id },
          { assignedTo: userContext.user.id },
          { assignedTo: null } // Unassigned requests visible to managers/admins
        ]
      }
    })

    if (!requestRecord) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const comments = await prisma.requestComment.findMany({
      where: { requestId: id },
      include: {
        author: {
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
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/employee-requests/[id]/comments - Add a comment to a request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userContext = await getUserContext()
    
    if (!userContext?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createCommentSchema.parse(body)

    // Check if user has access to this request
    const requestRecord = await prisma.employeeRequest.findFirst({
      where: {
        id,
        OR: [
          { employeeId: userContext.user.employee?.id },
          { assignedTo: userContext.user.id },
          { assignedTo: null } // Unassigned requests visible to managers/admins
        ]
      }
    })

    if (!requestRecord) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const newComment = await prisma.requestComment.create({
      data: {
        requestId: id,
        authorId: userContext.user.id,
        comment: validatedData.comment,
      },
      include: {
        author: {
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
        }
      }
    })

    // Update the request's updatedAt timestamp
    await prisma.employeeRequest.update({
      where: { id },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({ comment: newComment }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
