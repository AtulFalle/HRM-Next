import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'
import { z } from 'zod'

const updatePayrollInputSchema = z.object({
  basicSalary: z.number().min(0, 'Basic salary must be positive').optional(),
  hra: z.number().min(0, 'HRA must be positive').optional(),
  variablePay: z.number().min(0, 'Variable pay must be positive').optional(),
  overtime: z.number().min(0, 'Overtime must be positive').optional(),
  bonus: z.number().min(0, 'Bonus must be positive').optional(),
  allowances: z.number().min(0, 'Allowances must be positive').optional(),
  pf: z.number().min(0, 'PF must be positive').optional(),
  esi: z.number().min(0, 'ESI must be positive').optional(),
  tax: z.number().min(0, 'Tax must be positive').optional(),
  insurance: z.number().min(0, 'Insurance must be positive').optional(),
  leaveDeduction: z.number().min(0, 'Leave deduction must be positive').optional(),
  otherDeductions: z.number().min(0, 'Other deductions must be positive').optional(),
  workingDays: z.number().min(0, 'Working days must be positive').optional(),
  presentDays: z.number().min(0, 'Present days must be positive').optional(),
  leaveDays: z.number().min(0, 'Leave days must be positive').optional(),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSED', 'REJECTED']).optional(),
  notes: z.string().optional(),
})

// GET /api/payroll/inputs/[id] - Get specific payroll input
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const payrollInput = await prisma.payrollInput.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: true,
            department: true,
          },
        },
        payroll: true,
        approver: true,
        processor: true,
      },
    })

    if (!payrollInput) {
      return NextResponse.json({ success: false, error: 'Payroll input not found' }, { status: 404 })
    }

    // Check permissions - employees can only view their own payroll inputs
    if (!userContext.isManagerOrAdmin?.() && payrollInput.employeeId !== userContext.user?.employee?.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: { payrollInput },
    })
  } catch (error) {
    console.error('Error fetching payroll input:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payroll input' },
      { status: 500 }
    )
  }
}

// PUT /api/payroll/inputs/[id] - Update payroll input
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updatePayrollInputSchema.parse(body)

    // Get existing payroll input
    const existingInput = await prisma.payrollInput.findUnique({
      where: { id },
      include: { payroll: true },
    })

    if (!existingInput) {
      return NextResponse.json({ success: false, error: 'Payroll input not found' }, { status: 404 })
    }

    // Check permissions - only managers and admins can update payroll inputs
    if (!userContext.isManagerOrAdmin?.()) {
      return NextResponse.json({ success: false, error: 'Forbidden - Manager or Admin access required' }, { status: 403 })
    }

    // Don't allow updates if already processed
    if (existingInput.status === 'PROCESSED') {
      return NextResponse.json({ success: false, error: 'Cannot update processed payroll input' }, { status: 400 })
    }

    // Calculate new totals
    const basicSalary = validatedData.basicSalary ?? existingInput.basicSalary
    const hra = validatedData.hra ?? existingInput.hra
    const variablePay = validatedData.variablePay ?? existingInput.variablePay
    const overtime = validatedData.overtime ?? existingInput.overtime
    const bonus = validatedData.bonus ?? existingInput.bonus
    const allowances = validatedData.allowances ?? existingInput.allowances
    const pf = validatedData.pf ?? existingInput.pf
    const esi = validatedData.esi ?? existingInput.esi
    const tax = validatedData.tax ?? existingInput.tax
    const insurance = validatedData.insurance ?? existingInput.insurance
    const leaveDeduction = validatedData.leaveDeduction ?? existingInput.leaveDeduction
    const otherDeductions = validatedData.otherDeductions ?? existingInput.otherDeductions

    const totalEarnings = Number(basicSalary) + Number(hra) + Number(variablePay) + Number(overtime) + Number(bonus) + Number(allowances)
    const totalDeductions = Number(pf) + Number(esi) + Number(tax) + Number(insurance) + Number(leaveDeduction) + Number(otherDeductions)
    const netSalary = totalEarnings - totalDeductions

    // Update payroll input
    const updatedInput = await prisma.payrollInput.update({
      where: { id },
      data: {
        ...validatedData,
        totalEarnings,
        totalDeductions,
      },
      include: {
        employee: {
          include: {
            user: true,
            department: true,
          },
        },
        payroll: true,
        approver: true,
        processor: true,
      },
    })

    // Update related payroll record
    await prisma.payroll.update({
      where: { id: existingInput.payrollId },
      data: {
        basicSalary,
        allowances,
        deductions: totalDeductions,
        netSalary,
      },
    })

    // Create audit log
    await prisma.payrollAuditLog.create({
      data: {
        payrollId: existingInput.payrollId,
        employeeId: existingInput.employeeId,
        action: 'PAYROLL_INPUT_UPDATED',
        details: {
          changes: validatedData,
          newTotals: {
            totalEarnings,
            totalDeductions,
            netSalary,
          },
        },
        performedBy: userContext.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: { payrollInput: updatedInput },
      message: 'Payroll input updated successfully',
    })
  } catch (error) {
    console.error('Error updating payroll input:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update payroll input' },
      { status: 500 }
    )
  }
}

// DELETE /api/payroll/inputs/[id] - Delete payroll input
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get existing payroll input
    const existingInput = await prisma.payrollInput.findUnique({
      where: { id },
      include: { payroll: true },
    })

    if (!existingInput) {
      return NextResponse.json({ success: false, error: 'Payroll input not found' }, { status: 404 })
    }

    // Check permissions - only admins can delete payroll inputs
    if (userContext.user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Don't allow deletion if already processed
    if (existingInput.status === 'PROCESSED') {
      return NextResponse.json({ success: false, error: 'Cannot delete processed payroll input' }, { status: 400 })
    }

    // Create audit log before deletion
    await prisma.payrollAuditLog.create({
      data: {
        payrollId: existingInput.payrollId,
        employeeId: existingInput.employeeId,
        action: 'PAYROLL_INPUT_DELETED',
        details: {
          deletedInput: {
            month: existingInput.month,
            year: existingInput.year,
            totalEarnings: existingInput.totalEarnings,
            totalDeductions: existingInput.totalDeductions,
          },
        },
        performedBy: userContext.user.id,
      },
    })

    // Delete payroll input
    await prisma.payrollInput.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Payroll input deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting payroll input:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete payroll input' },
      { status: 500 }
    )
  }
}
