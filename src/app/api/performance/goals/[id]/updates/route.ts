import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProgressSchema = z.object({
  updateText: z.string().min(1, 'Update text is required'),
  progress: z.number().min(0).max(100, 'Progress must be between 0 and 100')
})

// POST /api/performance/goals/[id]/updates - Add a progress update to a goal
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateProgressSchema.parse(body)

    // Check if goal exists and belongs to user
    const goal = await prisma.performanceGoal.findFirst({
      where: {
        id: params.id,
        employee: {
          userId: session.user.id
        }
      }
    })

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    // Create the update
    const update = await prisma.goalUpdate.create({
      data: {
        goalId: params.id,
        updateText: validatedData.updateText,
        progress: validatedData.progress,
        updatedBy: session.user.id
      },
      include: {
        updater: {
          select: {
            name: true
          }
        }
      }
    })

    // Update the goal's progress
    await prisma.performanceGoal.update({
      where: { id: params.id },
      data: { progress: validatedData.progress }
    })

    return NextResponse.json({ update }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    console.error('Error creating goal update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
