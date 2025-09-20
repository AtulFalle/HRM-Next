/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'
import { z } from 'zod'

const stepDataSchema = z.object({
  stepData: z.record(z.string(), z.unknown())
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  try {
    // Get user context - always use proper authentication
    const userContext = await getUserContext()
    
    if (!userContext.success) {
      return NextResponse.json({ error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    const { stepId } = await params
    const body = await request.json()
    const validatedData = stepDataSchema.parse(body)

    // Find the step for the authenticated user
    const step = await prisma.onboardingStep.findFirst({
      where: {
        id: stepId,
        submission: {
          email: userContext.user.email
        }
      },
      include: {
        submission: true
      }
    })

    if (!step) {
      return NextResponse.json(
        { error: 'Step not found or access denied' },
        { status: 404 }
      )
    }

    if (step.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'This step has already been approved and cannot be modified' },
        { status: 400 }
      )
    }

    // Update the step with new data
    const updatedStep = await prisma.onboardingStep.update({
      where: { id: stepId },
      data: {
        stepData: validatedData.stepData as any,
        status: 'SUBMITTED',
        submittedAt: new Date()
      },
      include: {
        submission: {
          include: {
            department: true
          }
        }
      }
    })

    // Update overall submission status to IN_PROGRESS if it was CREATED
    if (step.submission.status === 'CREATED') {
      await prisma.onboardingSubmission.update({
        where: { id: step.submission.id },
        data: { status: 'IN_PROGRESS' }
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedStep
    })
  } catch (error) {
    console.error('Error updating onboarding step:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { stepId } = await params

    // Find the step and verify it belongs to the current user
    const step = await prisma.onboardingStep.findFirst({
      where: {
        id: stepId,
        submission: {
          email: session.user.email
        }
      },
      include: {
        submission: {
          include: {
            department: true
          }
        },
        reviewer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!step) {
      return NextResponse.json(
        { error: 'Step not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: step
    })
  } catch (error) {
    console.error('Error fetching onboarding step:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
