import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'
import { z } from 'zod'

const createCorrectionRequestSchema = z.object({
  payrollId: z.string().min(1, 'Payroll ID is required'),
  type: z.enum(['SALARY_DISPUTE', 'ATTENDANCE_DISPUTE', 'DEDUCTION_ERROR', 'ALLOWANCE_MISSING', 'OTHER']),
  description: z.string().min(1, 'Description is required'),
  requestedAmount: z.number().min(0, 'Requested amount must be positive').optional(),
})

// GET /api/payroll/corrections - Get payroll correction requests
export async function GET(request: NextRequest) {
  try {
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const employeeId = searchParams.get('employeeId')
    const payrollId = searchParams.get('payrollId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}

    // If not admin/manager, only show own correction requests
    if (!userContext.isManagerOrAdmin?.()) {
      if (!userContext.user?.employee?.id) {
        return NextResponse.json({ success: false, error: 'Employee record not found' }, { status: 404 })
      }
      where.employeeId = userContext.user?.employee?.id
    } else if (employeeId) {
      where.employeeId = employeeId
    }

    if (payrollId) {
      where.payrollId = payrollId
    }
    if (status) {
      where.status = status
    }
    if (type) {
      where.type = type
    }

    const [correctionRequests, total] = await Promise.all([
      prisma.payrollCorrectionRequest.findMany({
        where,
        include: {
          employee: {
            include: {
              user: true,
              department: true,
            },
          },
          payroll: true,
          requester: true,
          reviewer: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payrollCorrectionRequest.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        correctionRequests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching correction requests:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch correction requests' },
      { status: 500 }
    )
  }
}

// POST /api/payroll/corrections - Create payroll correction request
export async function POST(request: NextRequest) {
  try {
    const userContext = await getUserContext()
    if (!userContext.success) {
      return NextResponse.json({ success: false, error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createCorrectionRequestSchema.parse(body)

    // Get payroll details
    const payroll = await prisma.payroll.findUnique({
      where: { id: validatedData.payrollId },
      include: { employee: { include: { user: true } } },
    })

    if (!payroll) {
      return NextResponse.json({ success: false, error: 'Payroll not found' }, { status: 404 })
    }

    // Check permissions - employees can only request corrections for their own payroll
    if (!userContext.isManagerOrAdmin?.() && payroll.employeeId !== userContext.user?.employee?.id) {
      return NextResponse.json({ success: false, error: 'Forbidden - You can only request corrections for your own payroll' }, { status: 403 })
    }

    // Check if correction request already exists for this payroll and type
    const existingRequest = await prisma.payrollCorrectionRequest.findFirst({
      where: {
        payrollId: validatedData.payrollId,
        type: validatedData.type,
        status: { in: ['PENDING', 'UNDER_REVIEW'] },
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Correction request already exists for this payroll and type' },
        { status: 400 }
      )
    }

    // Create correction request
    const correctionRequest = await prisma.payrollCorrectionRequest.create({
      data: {
        employeeId: payroll.employeeId,
        payrollId: validatedData.payrollId,
        month: payroll.month,
        year: payroll.year,
        type: validatedData.type,
        description: validatedData.description,
        requestedAmount: validatedData.requestedAmount,
        status: 'PENDING',
        requestedBy: userContext.user?.id || '',
      },
      include: {
        employee: {
          include: {
            user: true,
            department: true,
          },
        },
        payroll: true,
        requester: true,
      },
    })

    // Create audit log
    await prisma.payrollAuditLog.create({
      data: {
        payrollId: validatedData.payrollId,
        employeeId: payroll.employeeId,
        action: 'CORRECTION_REQUEST_CREATED',
        details: {
          requestId: correctionRequest.id,
          type: validatedData.type,
          description: validatedData.description,
          requestedAmount: validatedData.requestedAmount,
        },
        performedBy: userContext.user?.id || '',
      },
    })

    return NextResponse.json({
      success: true,
      data: { correctionRequest },
      message: 'Correction request created successfully',
    })
  } catch (error) {
    console.error('Error creating correction request:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create correction request' },
      { status: 500 }
    )
  }
}
