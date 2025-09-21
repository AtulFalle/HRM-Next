import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateEmployeeSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  username: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  departmentId: z.string().min(1, 'Department is required').optional(),
  position: z.string().min(1, 'Position is required').optional(),
  salary: z.number().min(0, 'Salary must be positive').optional(),
  isActive: z.boolean().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']).optional(),
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
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            isActive: true,
          }
        },
        department: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check permissions - users can only view their own profile unless they're admin/manager
    // if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER' && employee.userId !== session.user.id) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    return NextResponse.json({
      success: true,
      data: employee
    })
  } catch (error) {
    console.error('Error fetching employee:', error)
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
    const validatedData = updateEmployeeSchema.parse(body)

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!existingEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check permissions (disabled for development)
    // const isAdmin = session.user.role === 'ADMIN'
    // const isManager = session.user.role === 'MANAGER'
    // const isOwnProfile = existingEmployee.userId === session.user.id

    // if (!isAdmin && !isManager && !isOwnProfile) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    // Non-admin users can only update limited fields
    // if (!isAdmin && !isOwnProfile) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    // If updating department, check if it exists
    if (validatedData.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: validatedData.departmentId }
      })

      if (!department) {
        return NextResponse.json(
          { error: 'Department not found' },
          { status: 400 }
        )
      }
    }

    // If updating email, check if it's already taken
    if (validatedData.email && validatedData.email !== existingEmployee.user.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          id: { not: existingEmployee.userId }
        }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        )
      }
    }

    // Update employee and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user fields
      const userUpdateData: Record<string, unknown> = {}
      if (validatedData.email) userUpdateData.email = validatedData.email
      if (validatedData.username) userUpdateData.username = validatedData.username
      if (validatedData.role) userUpdateData.role = validatedData.role // isAdmin check disabled for development
      if (validatedData.isActive !== undefined) userUpdateData.isActive = validatedData.isActive // isAdmin check disabled for development

      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: existingEmployee.userId },
          data: userUpdateData
        })
      }

      // Update employee fields
      const employeeUpdateData: Record<string, unknown> = {}
      if (validatedData.firstName) employeeUpdateData.firstName = validatedData.firstName
      if (validatedData.lastName) employeeUpdateData.lastName = validatedData.lastName
      if (validatedData.phoneNumber) employeeUpdateData.phoneNumber = validatedData.phoneNumber
      if (validatedData.address) employeeUpdateData.address = validatedData.address
      if (validatedData.emergencyContact) employeeUpdateData.emergencyContact = validatedData.emergencyContact
      if (validatedData.emergencyPhone) employeeUpdateData.emergencyPhone = validatedData.emergencyPhone
      if (validatedData.departmentId) employeeUpdateData.departmentId = validatedData.departmentId
      if (validatedData.position) employeeUpdateData.position = validatedData.position
      if (validatedData.salary !== undefined) employeeUpdateData.salary = validatedData.salary // isAdmin check disabled for development

      if (Object.keys(employeeUpdateData).length > 0) {
        await tx.employee.update({
          where: { id },
          data: employeeUpdateData
        })
      }

      // Return updated employee
      return await tx.employee.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              role: true,
              isActive: true,
            }
          },
          department: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully',
      data: result
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating employee:', error)
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

    // Only admin can delete employees (disabled for development)
    // if (session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    const { id } = await params
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Soft delete by setting isActive to false
    await prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id },
        data: { isActive: false }
      })

      await tx.user.update({
        where: { id: employee.userId },
        data: { isActive: false }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Employee deactivated successfully'
    })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
