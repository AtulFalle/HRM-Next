import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const updatePayrollSchema = z.object({
  basicSalary: z.number().min(0, 'Basic salary must be positive').optional(),
  allowances: z.number().min(0, 'Allowances must be positive').optional(),
  deductions: z.number().min(0, 'Deductions must be positive').optional(),
  status: z.enum(['PENDING', 'PROCESSED', 'PAID']).optional(),
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
    const payroll = await prisma.payroll.findUnique({
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

    if (!payroll) {
      return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 })
    }

    // Check permissions (disabled for development)
    // if (session.user.role === 'EMPLOYEE' && payroll.employee.userId !== session.user.id) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    return NextResponse.json({
      success: true,
      data: payroll
    })
  } catch (error) {
    console.error('Error fetching payroll:', error)
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

    // Only admin can update payroll records (disabled for development)
    // if (session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    const { id } = await params
    const body = await request.json()
    const validatedData = updatePayrollSchema.parse(body)

    // Check if payroll exists
    const existingPayroll = await prisma.payroll.findUnique({
      where: { id }
    })

    if (!existingPayroll) {
      return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 })
    }

    // Calculate new net salary if salary components are updated
    let netSalary = existingPayroll.netSalary
    if (validatedData.basicSalary !== undefined || validatedData.allowances !== undefined || validatedData.deductions !== undefined) {
      const basicSalary = validatedData.basicSalary ?? Number(existingPayroll.basicSalary)
      const allowances = validatedData.allowances ?? Number(existingPayroll.allowances)
      const deductions = validatedData.deductions ?? Number(existingPayroll.deductions)
      netSalary = new Decimal(basicSalary + allowances - deductions)
    }

    const payroll = await prisma.payroll.update({
      where: { id },
      data: {
        basicSalary: validatedData.basicSalary,
        allowances: validatedData.allowances,
        deductions: validatedData.deductions,
        netSalary: netSalary,
        status: validatedData.status,
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
      message: 'Payroll record updated successfully',
      data: payroll
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating payroll:', error)
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

    // Only admin can delete payroll records
    // if (session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    const { id } = await params
    const payroll = await prisma.payroll.findUnique({
      where: { id }
    })

    if (!payroll) {
      return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 })
    }

    await prisma.payroll.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Payroll record deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting payroll:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
