const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createPayslipForEmployee1() {
  try {
    console.log('🔍 Finding employee1...')
    
    // Find employee1
    const employee = await prisma.employee.findFirst({
      where: {
        user: {
          email: 'employee1@hrm.com'
        }
      },
      include: {
        user: true,
        department: true
      }
    })

    if (!employee) {
      console.error('❌ Employee1 not found')
      return
    }

    console.log(`✅ Found employee: ${employee.firstName} ${employee.lastName} (${employee.employeeId})`)

    // Create payroll data for current month
    const currentDate = new Date()
    const month = currentDate.getMonth() + 1
    const year = currentDate.getFullYear()

    console.log(`📅 Creating payroll for ${month}/${year}...`)

    // Create payroll record
    const payroll = await prisma.payroll.upsert({
      where: {
        employeeId_month_year: {
          employeeId: employee.id,
          month,
          year
        }
      },
      update: {},
      create: {
        employeeId: employee.id,
        month,
        year,
        basicSalary: 80000, // From seed data
        allowances: 5000,
        deductions: 8000,
        netSalary: 77000, // 80000 + 5000 - 8000
        status: 'PROCESSED'
      }
    })

    console.log('✅ Payroll record created')

    // Create detailed payroll input
    const payrollInput = await prisma.payrollInput.upsert({
      where: {
        employeeId_month_year: {
          employeeId: employee.id,
          month,
          year
        }
      },
      update: {},
      create: {
        payrollId: payroll.id,
        employeeId: employee.id,
        month,
        year,
        basicSalary: 80000,
        hra: 16000, // 20% of basic salary
        variablePay: 0,
        overtime: 0,
        bonus: 0,
        allowances: 5000,
        totalEarnings: 101000, // 80000 + 16000 + 5000
        pf: 9600, // 12% of basic salary
        esi: 2020, // 2% of total earnings
        tax: 5000, // Estimated tax
        insurance: 2000,
        leaveDeduction: 0,
        otherDeductions: 0,
        totalDeductions: 18620, // 9600 + 2020 + 5000 + 2000
        workingDays: 22,
        presentDays: 22,
        leaveDays: 0,
        status: 'APPROVED'
      }
    })

    console.log('✅ Payroll input created')

    // Generate payslip
    console.log('📄 Generating payslip...')
    
    const payslip = await prisma.payslip.create({
      data: {
        payrollId: payroll.id,
        employeeId: employee.id,
        month,
        year,
        fileName: `payslip-${employee.employeeId}-${year}-${month.toString().padStart(2, '0')}.pdf`,
        filePath: `/payslips/payslip-${employee.employeeId}-${year}-${month.toString().padStart(2, '0')}.pdf`,
        fileSize: 0,
        generatedBy: employee.userId, // Self-generated for testing
        status: 'GENERATED'
      }
    })

    console.log('✅ Payslip generated')

    // Create audit log
    await prisma.payrollAuditLog.create({
      data: {
        payrollId: payroll.id,
        employeeId: employee.id,
        action: 'PAYSLIP_GENERATED',
        details: {
          payslipId: payslip.id,
          fileName: payslip.fileName,
          month,
          year,
          netSalary: payrollInput.totalEarnings - payrollInput.totalDeductions
        },
        performedBy: employee.userId
      }
    })

    console.log('✅ Audit log created')

    console.log('\n🎉 Payslip creation completed!')
    console.log(`📊 Summary:`)
    console.log(`   Employee: ${employee.firstName} ${employee.lastName}`)
    console.log(`   Employee ID: ${employee.employeeId}`)
    console.log(`   Period: ${month}/${year}`)
    console.log(`   Basic Salary: ₹${payrollInput.basicSalary.toLocaleString()}`)
    console.log(`   HRA: ₹${payrollInput.hra.toLocaleString()}`)
    console.log(`   Total Earnings: ₹${payrollInput.totalEarnings.toLocaleString()}`)
    console.log(`   Total Deductions: ₹${payrollInput.totalDeductions.toLocaleString()}`)
    console.log(`   Net Salary: ₹${(payrollInput.totalEarnings - payrollInput.totalDeductions).toLocaleString()}`)
    console.log(`   Payslip ID: ${payslip.id}`)
    console.log(`   File Name: ${payslip.fileName}`)

    console.log('\n🔗 Test the payslip flow:')
    console.log('1. Login as employee1@hrm.com / employee123')
    console.log('2. Go to /dashboard/payslips')
    console.log('3. View and download the payslip')

  } catch (error) {
    console.error('❌ Error creating payslip:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createPayslipForEmployee1()
