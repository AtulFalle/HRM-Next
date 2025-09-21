import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserContext } from '@/lib/auth-utils'
import { z } from 'zod'

const updateRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_INFO', 'RESOLVED', 'CLOSED']).optional(),
  assignedTo: z.string().optional(),
})

// GET /api/employee-requests/[id] - Get a specific request
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

    // Authorization logic:
    // - Employees can only view their own requests
    // - Managers/Admins can view any request
    const isEmployee = userContext.user.role === 'EMPLOYEE'

    const whereClause: Record<string, unknown> = { id }

    if (isEmployee) {
      // Employees can only view their own requests
      whereClause.employeeId = userContext.user.employee?.id
    }
    // Managers/Admins can view any request (no additional where clause needed)

    const request = await prisma.employeeRequest.findFirst({
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
        comments: {
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
        }
      },
    })

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    return NextResponse.json({ request })
  } catch (error) {
    console.error('Error fetching employee request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch request' },
      { status: 500 }
    )
  }
}

// PUT /api/employee-requests/[id] - Update a request
export async function PUT(
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
    const validatedData = updateRequestSchema.parse(body)

    // Check if request exists
    const existingRequest = await prisma.employeeRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: { id: true }
        }
      }
    })

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Authorization logic:
    // - Employees can only update their own requests (title/description) if status allows
    // - Managers/Admins can update any request (status, assignment, title/description)
    const isEmployee = userContext.user.role === 'EMPLOYEE'
    const isManagerOrAdmin = userContext.user.role === 'MANAGER' || userContext.user.role === 'ADMIN'
    const isOwner = existingRequest.employeeId === userContext.user.employee?.id

    if (isEmployee) {
      // Employees can only update their own requests
      if (!isOwner) {
        return NextResponse.json({ error: 'Unauthorized to update this request' }, { status: 403 })
      }
      
      // Employees can only update title/description, not status or assignment
      const updateData: Record<string, unknown> = {}
      if (validatedData.title !== undefined) updateData.title = validatedData.title
      if (validatedData.description !== undefined) updateData.description = validatedData.description
      
      // Handle status changes for employees
      if (validatedData.status !== undefined) {
        if (validatedData.status === 'CLOSED' && existingRequest.status === 'RESOLVED') {
          // Allow employees to close resolved requests
          updateData.status = 'CLOSED'
        } else if (validatedData.status !== existingRequest.status) {
          return NextResponse.json({ error: 'Employees can only close resolved requests or update title/description' }, { status: 403 })
        }
      }
      
      // Check if trying to edit resolved/closed requests (except for closing)
      if ((existingRequest.status === 'RESOLVED' || existingRequest.status === 'CLOSED') && 
          (validatedData.title !== undefined || validatedData.description !== undefined)) {
        return NextResponse.json(
          { error: 'Cannot edit resolved or closed requests' },
          { status: 400 }
        )
      }
      
      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: 'No valid fields to update' }, { status: 200 })
      }
      
      const updatedRequest = await prisma.employeeRequest.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({ request: updatedRequest })
    } else if (isManagerOrAdmin) {
      // Managers/Admins can update any request
      const updateData: Record<string, unknown> = {}
      if (validatedData.title !== undefined) updateData.title = validatedData.title
      if (validatedData.description !== undefined) updateData.description = validatedData.description
      if (validatedData.status !== undefined) updateData.status = validatedData.status
      if (validatedData.assignedTo !== undefined) {
        updateData.assignedTo = validatedData.assignedTo === '' ? null : validatedData.assignedTo
      }
      
      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: 'No valid fields to update' }, { status: 200 })
      }
      
      const updatedRequest = await prisma.employeeRequest.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({ request: updatedRequest })
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
  } catch (error) {
    console.error('Error updating employee request:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    )
  }
}

// DELETE /api/employee-requests/[id] - Delete a request (only if OPEN)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userContext = await getUserContext()
    
    if (!userContext?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if request exists
    const existingRequest = await prisma.employeeRequest.findUnique({
      where: { id },
    })

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Authorization logic:
    // - Employees can only delete their own requests if status is OPEN
    // - Admins can delete any request
    const isEmployee = userContext.user.role === 'EMPLOYEE'
    const isAdmin = userContext.user.role === 'ADMIN'
    const isOwner = existingRequest.employeeId === userContext.user.employee?.id

    if (isEmployee) {
      // Employees can only delete their own requests
      if (!isOwner) {
        return NextResponse.json({ error: 'Unauthorized to delete this request' }, { status: 403 })
      }
      
      // Only allow deletion if status is OPEN
      if (existingRequest.status !== 'OPEN') {
        return NextResponse.json(
          { error: 'Can only delete open requests' },
          { status: 400 }
        )
      }
    } else if (isAdmin) {
      // Admins can delete any request
      // No additional restrictions
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.employeeRequest.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Request deleted successfully' })
  } catch (error) {
    console.error('Error deleting employee request:', error)
    return NextResponse.json(
      { error: 'Failed to delete request' },
      { status: 500 }
    )
  }
}
