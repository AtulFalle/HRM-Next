import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'

export async function GET() {
  try {
    // Get user context - always use proper authentication
    const userContext = await getUserContext()
    
    if (!userContext.success) {
      return NextResponse.json({ error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    // Use the actual logged-in user's email
    const userEmail = userContext.user.email
    
    const submission = await prisma.onboardingSubmission.findUnique({
      where: { email: userEmail },
      include: {
        department: true,
        steps: {
          include: {
            reviewer: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        createdByUser: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No onboarding submission found'
      })
    }

    return NextResponse.json({
      success: true,
      data: submission
    })
  } catch (error) {
    console.error('Error fetching onboarding status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
