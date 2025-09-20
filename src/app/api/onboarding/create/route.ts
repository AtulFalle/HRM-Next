import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { getUserContext } from '@/lib/auth-utils'

const createOnboardingSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  employeeId: z.string().optional(),
  departmentId: z.string(),
  position: z.string(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']),
  dateOfJoining: z.string().transform((str) => new Date(str)),
  salary: z.number().positive(),
  payFrequency: z.enum(['MONTHLY', 'WEEKLY', 'BIWEEKLY', 'ANNUAL']),
  pfNumber: z.string().optional(),
  esicNumber: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Get user context (handles both dev and prod modes)
    const userContext = await getUserContext()
    
    if (!userContext.success) {
      return NextResponse.json({ error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to create onboarding
    if (!userContext.isManagerOrAdmin()) {
      return NextResponse.json({ error: 'Forbidden - Manager or Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createOnboardingSchema.parse(body)

    // Check if email or username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { username: validatedData.username }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user and onboarding submission in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          username: validatedData.username,
          name: validatedData.name,
          password: hashedPassword,
          role: 'EMPLOYEE',
          isActive: false, // Will be activated after onboarding completion
        }
      })

      // Create onboarding submission
      const onboardingSubmission = await tx.onboardingSubmission.create({
        data: {
          email: validatedData.email,
          username: validatedData.username,
          password: hashedPassword,
          // employeeId will be set later after onboarding completion
          departmentId: validatedData.departmentId,
          position: validatedData.position,
          employmentType: validatedData.employmentType,
          dateOfJoining: validatedData.dateOfJoining,
          salary: validatedData.salary,
          payFrequency: validatedData.payFrequency,
          pfNumber: validatedData.pfNumber,
          esicNumber: validatedData.esicNumber,
          createdBy: userContext.user.id,
          status: 'CREATED'
        },
        include: {
          department: true
        }
      })

      // Create onboarding steps separately
      const steps = await tx.onboardingStep.createMany({
        data: [
          {
            submissionId: onboardingSubmission.id,
            stepType: 'PERSONAL_INFORMATION',
            status: 'PENDING'
          },
          {
            submissionId: onboardingSubmission.id,
            stepType: 'DOCUMENTS',
            status: 'PENDING'
          },
          {
            submissionId: onboardingSubmission.id,
            stepType: 'PREVIOUS_EMPLOYMENT',
            status: 'PENDING'
          },
          {
            submissionId: onboardingSubmission.id,
            stepType: 'BANKING_DETAILS',
            status: 'PENDING'
          },
          {
            submissionId: onboardingSubmission.id,
            stepType: 'BACKGROUND_VERIFICATION',
            status: 'PENDING'
          }
        ]
      })

      return { user, onboardingSubmission }
    })

    return NextResponse.json({
      success: true,
      message: 'Onboarding created successfully',
      data: {
        id: result.onboardingSubmission.id,
        email: result.onboardingSubmission.email,
        username: result.onboardingSubmission.username,
        status: result.onboardingSubmission.status,
        department: result.onboardingSubmission.department?.name,
        position: result.onboardingSubmission.position
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating onboarding:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}