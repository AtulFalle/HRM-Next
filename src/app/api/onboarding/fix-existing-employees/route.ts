import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserContext } from '@/lib/auth-utils'

export async function POST() {
  try {
    // Get user context (handles both dev and prod modes)
    const userContext = await getUserContext()
    
    if (!userContext.success) {
      return NextResponse.json({ error: userContext.error || 'Unauthorized' }, { status: 401 })
    }

    // Only admin can run this fix
    if (userContext.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Find employees without onboarding submissions
    const employeesWithoutOnboarding = await prisma.employee.findMany({
      where: {
        onboardingSubmission: null
      },
      include: {
        user: true,
        department: true
      }
    })

    let createdCount = 0

    for (const employee of employeesWithoutOnboarding) {
      try {
        // Create onboarding submission for existing employee
        const onboardingSubmission = await prisma.onboardingSubmission.create({
          data: {
            email: employee.user.email,
            username: employee.user.username || `${employee.firstName.toLowerCase()}.${employee.lastName.toLowerCase()}`,
            password: employee.user.password || 'temp-password', // Will need to be reset
            employeeId: employee.employeeId,
            departmentId: employee.departmentId,
            position: employee.position,
            employmentType: 'FULL_TIME', // Default value
            dateOfJoining: employee.hireDate,
            salary: employee.salary,
            payFrequency: 'MONTHLY', // Default value
            createdBy: userContext.user.id,
            status: 'CREATED'
          }
        })

        // Create onboarding steps for the existing employee
        const stepTypes = ['PERSONAL_INFORMATION', 'DOCUMENTS', 'PREVIOUS_EMPLOYMENT', 'BANKING_DETAILS', 'BACKGROUND_VERIFICATION']
        
        for (const stepType of stepTypes) {
          await prisma.onboardingStep.create({
            data: {
              submissionId: onboardingSubmission.id,
              stepType: stepType as 'PERSONAL_INFORMATION' | 'BANKING_DETAILS' | 'DOCUMENTS' | 'BACKGROUND_VERIFICATION',
              status: 'PENDING'
            }
          })
        }

        createdCount++
      } catch (error) {
        console.error(`Error creating onboarding for employee ${employee.employeeId}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created onboarding submissions for ${createdCount} employees`,
      data: {
        processed: employeesWithoutOnboarding.length,
        created: createdCount
      }
    })
  } catch (error) {
    console.error('Error fixing existing employees:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
