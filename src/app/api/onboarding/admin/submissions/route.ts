import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    // Get user context - always use proper authentication
    const userContext = await getUserContext()
    
    if (!userContext || !userContext.isManagerOrAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const departmentId = searchParams.get('departmentId')

    // Build where clause
    const where: Record<string, string> = {}
    if (status) {
      where.status = status
    }
    if (departmentId) {
      where.departmentId = departmentId
    }

    // Get all onboarding submissions
    const submissions = await prisma.onboardingSubmission.findMany({
      where,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: submissions
    })
  } catch (error) {
    console.error('Error fetching onboarding submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
