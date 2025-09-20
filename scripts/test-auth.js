const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAuth() {
  try {
    console.log('🔐 Testing Authentication System...\n')

    // Check if we have users
    const users = await prisma.user.findMany({
      include: { employee: true }
    })
    
    console.log(`✅ Found ${users.length} users:`)
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`)
      if (user.employee) {
        console.log(`     Employee: ${user.employee.firstName} ${user.employee.lastName} (${user.employee.employeeId})`)
      }
    })

    // Check payroll data
    const payrollCount = await prisma.payroll.count()
    const payslipCount = await prisma.payslip.count()
    
    console.log(`\n📊 Database Status:`)
    console.log(`   - Payroll records: ${payrollCount}`)
    console.log(`   - Payslips: ${payslipCount}`)

    if (payrollCount === 0) {
      console.log('\n🔧 Creating test payroll data...')
      
      const employees = await prisma.employee.findMany()
      const currentDate = new Date()
      const month = currentDate.getMonth() + 1
      const year = currentDate.getFullYear()

      for (const employee of employees.slice(0, 2)) { // Only create for first 2 employees
        // Create payroll
        const payroll = await prisma.payroll.create({
          data: {
            employeeId: employee.id,
            month,
            year,
            basicSalary: Number(employee.salary),
            allowances: 5000,
            deductions: 8000,
            netSalary: Number(employee.salary) + 5000 - 8000,
            status: 'PROCESSED'
          }
        })

        // Create payroll input
        await prisma.payrollInput.create({
          data: {
            payrollId: payroll.id,
            employeeId: employee.id,
            month,
            year,
            basicSalary: Number(employee.salary),
            hra: Number(employee.salary) * 0.4,
            variablePay: 0,
            overtime: 0,
            bonus: 0,
            allowances: 5000,
            totalEarnings: Number(employee.salary) + (Number(employee.salary) * 0.4) + 5000,
            pf: Number(employee.salary) * 0.12,
            esi: Number(employee.salary) * 0.0075,
            tax: 5000,
            insurance: 2000,
            leaveDeduction: 0,
            otherDeductions: 0,
            totalDeductions: (Number(employee.salary) * 0.12) + (Number(employee.salary) * 0.0075) + 5000 + 2000,
            workingDays: 22,
            presentDays: 22,
            leaveDays: 0,
            status: 'PROCESSED'
          }
        })

        // Create payslip
        await prisma.payslip.create({
          data: {
            payrollId: payroll.id,
            employeeId: employee.id,
            month,
            year,
            fileName: `payslip-${employee.employeeId}-${year}-${month.toString().padStart(2, '0')}.pdf`,
            filePath: `/payslips/payslip-${employee.employeeId}-${year}-${month.toString().padStart(2, '0')}.pdf`,
            fileSize: 0,
            generatedBy: employee.userId,
            status: 'GENERATED'
          }
        })

        console.log(`   ✅ Created payroll data for ${employee.firstName} ${employee.lastName}`)
      }
    }

    console.log('\n🎯 Ready to test!')
    console.log('1. Go to http://localhost:3000/auth/signin')
    console.log('2. Login with:')
    console.log('   - Admin: admin@hrm.com / admin123')
    console.log('   - Employee: employee1@hrm.com / employee123')
    console.log('3. Test the payroll flow:')
    console.log('   - Admin: /dashboard/payroll')
    console.log('   - Employee: /dashboard/payslips')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAuth()
