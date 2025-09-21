import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createEmployeeSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  dateOfBirth: z.string().transform((str) => new Date(str)),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  profilePhoto: z.string().optional(),
  
  // Job Details
  departmentId: z.string().min(1, 'Department is required'),
  position: z.string().min(1, 'Position is required'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'INTERN', 'CONTRACT']).optional(),
  hireDate: z.string().transform((str) => new Date(str)),
  reportingManager: z.string().optional(),
  workLocation: z.string().optional(),
  probationPeriod: z.string().optional(),
  
  // Credentials & Access
  employeeId: z.string().optional(),
  username: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']).default('EMPLOYEE'),
  
  // Compensation & Banking
  salary: z.number().min(0, 'Salary must be positive'),
  payFrequency: z.enum(['MONTHLY', 'WEEKLY', 'BIWEEKLY', 'ANNUAL']).optional(),
  currency: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  accountHolderName: z.string().optional(),
  panNumber: z.string().optional(),
  taxId: z.string().optional(),
  benefits: z.array(z.string()).optional(),
  
  // Documents (stored as JSON)
  documents: z.object({
    identityProof: z.string().optional(),
    resume: z.string().optional(),
    educationalCertificates: z.array(z.string()).optional(),
    previousOfferLetter: z.string().optional(),
    relievingLetter: z.string().optional(),
    panProof: z.string().optional(),
    otherDocuments: z.array(z.string()).optional(),
  }).optional(),
})

export async function GET(request: NextRequest) {
  try {
    // Get user context - always use proper authentication
    const userContext = await getUserContext()
    
    if (!userContext.success) {
      return NextResponse.json({ error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    // Only admin and managers can view all employees
    if (!userContext.isManagerOrAdmin?.()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const departmentId = searchParams.get('departmentId')

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {
      isActive: true,
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (departmentId) {
      where.departmentId = departmentId
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
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
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.employee.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        employees,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user context - always use proper authentication
    const userContext = await getUserContext()
    
    if (!userContext.success) {
      return NextResponse.json({ error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    // Only admin can create employees
    if (!userContext.isAdmin?.()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) 
    }

    const body = await request.json()
    const validatedData = createEmployeeSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          ...(validatedData.username ? [{ username: validatedData.username }] : [])
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      )
    }

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: validatedData.departmentId }
    })

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user, employee, and onboarding submission in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          username: validatedData.username || `${validatedData.firstName.toLowerCase()}.${validatedData.lastName.toLowerCase()}`,
          name: `${validatedData.firstName} ${validatedData.lastName}`,
          password: hashedPassword,
          role: validatedData.role,
        }
      })

      // Create employee with comprehensive onboarding data
      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          employeeId: validatedData.employeeId || `EMP${Date.now()}`,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          dateOfBirth: validatedData.dateOfBirth,
          phoneNumber: validatedData.phone,
          address: validatedData.workLocation || '',
          emergencyContact: validatedData.accountHolderName || '',
          emergencyPhone: validatedData.accountNumber || '',
          departmentId: validatedData.departmentId,
          position: validatedData.position,
          hireDate: validatedData.hireDate,
          salary: validatedData.salary,
          // Store additional onboarding data as JSON
          metadata: {
            gender: validatedData.gender,
            profilePhoto: validatedData.profilePhoto,
            employmentType: validatedData.employmentType,
            reportingManager: validatedData.reportingManager,
            workLocation: validatedData.workLocation,
            probationPeriod: validatedData.probationPeriod,
            payFrequency: validatedData.payFrequency,
            currency: validatedData.currency,
            bankName: validatedData.bankName,
            accountNumber: validatedData.accountNumber,
            ifscCode: validatedData.ifscCode,
            accountHolderName: validatedData.accountHolderName,
            panNumber: validatedData.panNumber,
            taxId: validatedData.taxId,
            benefits: validatedData.benefits,
            documents: validatedData.documents,
          }
        },
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

      // Create onboarding submission for the new employee
      const onboardingSubmission = await tx.onboardingSubmission.create({
        data: {
          email: validatedData.email,
          username: user.username || `${validatedData.firstName.toLowerCase()}.${validatedData.lastName.toLowerCase()}`,
          password: hashedPassword,
          employeeId: employee.employeeId,
          departmentId: validatedData.departmentId,
          position: validatedData.position,
          employmentType: validatedData.employmentType,
          dateOfJoining: validatedData.hireDate,
          salary: validatedData.salary,
          payFrequency: validatedData.payFrequency,
          createdBy: userContext.user.id, // Use the admin who created the employee
          status: 'CREATED'
        }
      })

      // Create onboarding steps for the new employee
      const stepTypes = ['PERSONAL_INFORMATION', 'DOCUMENTS', 'PREVIOUS_EMPLOYMENT', 'BANKING_DETAILS', 'BACKGROUND_VERIFICATION']
      
      for (const stepType of stepTypes) {
        await tx.onboardingStep.create({
          data: {
            submissionId: onboardingSubmission.id,
            stepType: stepType as 'PERSONAL_INFORMATION' | 'BANKING_DETAILS' | 'DOCUMENTS' | 'BACKGROUND_VERIFICATION',
            status: 'PENDING'
          }
        })
      }

      return employee
    })

    return NextResponse.json(
      { 
        success: true,
        message: 'Employee created successfully',
        data: result
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating employee:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
