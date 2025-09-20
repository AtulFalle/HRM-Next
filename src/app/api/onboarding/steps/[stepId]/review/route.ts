import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'
import { z } from 'zod'

const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  comments: z.string().optional(),
  rejectionReason: z.string().optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  try {
    // Get user context (handles both dev and prod modes)
    const userContext = await getUserContext()
    
    if (!userContext || !userContext.isManagerOrAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { stepId } = await params
    const body = await request.json()
    const validatedData = reviewSchema.parse(body)

    // Find the step
    const step = await prisma.onboardingStep.findUnique({
      where: { id: stepId },
      include: {
        submission: {
          include: {
            steps: true
          }
        }
      }
    })

    if (!step) {
      return NextResponse.json(
        { error: 'Step not found' },
        { status: 404 }
      )
    }

    if (step.status !== 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Step is not in submitted status' },
        { status: 400 }
      )
    }

    // Update the step
    const updatedStep = await prisma.onboardingStep.update({
      where: { id: stepId },
      data: {
        status: validatedData.status,
        reviewedAt: new Date(),
        reviewedBy: userContext.user.id,
        reviewComments: validatedData.comments,
        rejectionReason: validatedData.rejectionReason
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

    // Check if all steps are approved to mark submission as completed
    const allSteps = step.submission.steps
    const allApproved = allSteps.every(s => s.status === 'APPROVED')
    
    if (allApproved) {
      await prisma.onboardingSubmission.update({
        where: { id: step.submission.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedStep
    })
  } catch (error) {
    console.error('Error reviewing onboarding step:', error)
    
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
