import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateAttendanceSchema = z.object({
  checkIn: z.string().transform((str) => new Date(str)).optional(),
  checkOut: z.string().transform((str) => new Date(str)).optional(),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'HOLIDAY']).optional(),
  notes: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Temporarily disabled auth for development
    // const session = await getServerSession(authOptions)
    
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { id } = await params
    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      }
    })

    if (!attendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
    }

    // Check permissions (disabled for development)
    // if (session.user.role === 'EMPLOYEE' && attendance.employee.userId !== session.user.id) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    return NextResponse.json({
      success: true,
      data: attendance
    })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Temporarily disabled auth for development
    // const session = await getServerSession(authOptions)
    
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateAttendanceSchema.parse(body)

    // Check if attendance exists
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id },
      include: { employee: true }
    })

    if (!existingAttendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
    }

    // Check permissions (disabled for development)
    // const isAdmin = session.user.role === 'ADMIN'
    // const isManager = session.user.role === 'MANAGER'
    // const isOwnRecord = existingAttendance.employee.userId === session.user.id

    // if (!isAdmin && !isManager && !isOwnRecord) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    // Employees can only update their own check-in/out times
    // if (session.user.role === 'EMPLOYEE' && !isOwnRecord) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        checkIn: validatedData.checkIn,
        checkOut: validatedData.checkOut,
        status: validatedData.status,
        notes: validatedData.notes,
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating attendance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Temporarily disabled auth for development
    // const session = await getServerSession(authOptions)
    
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Only admin can delete attendance records (disabled for development)
    // if (session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    const { id } = await params
    const attendance = await prisma.attendance.findUnique({
      where: { id }
    })

    if (!attendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
    }

    await prisma.attendance.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Attendance record deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting attendance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
