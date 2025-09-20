const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testPayrollFlow() {
  try {
    console.log('🧪 Testing Complete Payroll Flow...\n')

    // Step 1: Check if we have test data
    console.log('1️⃣ Checking test data...')
    
    const employees = await prisma.employee.findMany({
      include: { user: true, department: true }
    })
    
    console.log(`✅ Found ${employees.length} employees`)
    employees.forEach(emp => {
      console.log(`   - ${emp.firstName} ${emp.lastName} (${emp.employeeId}) - ${emp.user.email}`)
    })

    // Step 2: Create payroll data for current month
    console.log('\n2️⃣ Creating payroll data...')
    
    const currentDate = new Date()
    const month = currentDate.getMonth() + 1
    const year = currentDate.getFullYear()

    for (const employee of employees) {
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
          basicSalary: Number(employee.salary),
          allowances: 5000,
          deductions: 8000,
          netSalary: Number(employee.salary) + 5000 - 8000,
          status: 'PROCESSED'
        }
      })

      // Create detailed payroll input
      await prisma.payrollInput.upsert({
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
          basicSalary: Number(employee.salary),
          hra: Number(employee.salary) * 0.4, // 40% HRA
          variablePay: 0,
          overtime: 0,
          bonus: 0,
          allowances: 5000,
          totalEarnings: Number(employee.salary) + (Number(employee.salary) * 0.4) + 5000,
          pf: Number(employee.salary) * 0.12, // 12% PF
          esi: Number(employee.salary) * 0.0075, // 0.75% ESI
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

      console.log(`   ✅ Created payroll for ${employee.firstName} ${employee.lastName}`)
    }

    // Step 3: Generate payslips
    console.log('\n3️⃣ Generating payslips...')
    
    for (const employee of employees) {
      const payroll = await prisma.payroll.findUnique({
        where: {
          employeeId_month_year: {
            employeeId: employee.id,
            month,
            year
          }
        }
      })

      if (payroll) {
        const payslip = await prisma.payslip.create({
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

        console.log(`   ✅ Generated payslip for ${employee.firstName} ${employee.lastName}`)
      }
    }

    // Step 4: Test API endpoints
    console.log('\n4️⃣ Testing API endpoints...')
    
    const baseUrl = 'http://localhost:3000'
    
    // Test payroll dashboard (requires admin login)
    console.log('   Testing payroll dashboard API...')
    try {
      const response = await fetch(`${baseUrl}/api/payroll/dashboard`)
      if (response.ok) {
        const data = await response.json()
        console.log('   ✅ Payroll dashboard API working')
        console.log(`      - Total payroll cycles: ${data.data?.dashboardStats?.totalPayrollCycles || 0}`)
        console.log(`      - Processed this month: ${data.data?.dashboardStats?.processedThisMonth || 0}`)
      } else {
        console.log('   ⚠️  Payroll dashboard API requires authentication')
      }
    } catch (error) {
      console.log('   ⚠️  Payroll dashboard API not accessible (server may not be running)')
    }

    // Test payroll cycles API
    console.log('   Testing payroll cycles API...')
    try {
      const response = await fetch(`${baseUrl}/api/payroll/cycles`)
      if (response.ok) {
        const data = await response.json()
        console.log('   ✅ Payroll cycles API working')
        console.log(`      - Found ${data.data?.cycles?.length || 0} cycles`)
      } else {
        console.log('   ⚠️  Payroll cycles API requires authentication')
      }
    } catch (error) {
      console.log('   ⚠️  Payroll cycles API not accessible (server may not be running)')
    }

    // Step 5: Summary
    console.log('\n5️⃣ Summary...')
    
    const payrollCount = await prisma.payroll.count()
    const payslipCount = await prisma.payslip.count()
    const payrollInputCount = await prisma.payrollInput.count()
    
    console.log(`✅ Database contains:`)
    console.log(`   - ${payrollCount} payroll records`)
    console.log(`   - ${payslipCount} payslips`)
    console.log(`   - ${payrollInputCount} payroll inputs`)
    
    console.log('\n🎯 Test Instructions:')
    console.log('1. Start the development server: npm run dev')
    console.log('2. Login as admin: admin@hrm.com / admin123')
    console.log('3. Go to /dashboard/payroll to see the admin dashboard')
    console.log('4. Login as employee: employee1@hrm.com / employee123')
    console.log('5. Go to /dashboard/payslips to see employee payslips')
    console.log('6. Test the complete flow:')
    console.log('   - Admin: Process payroll, generate payslips, finalize cycles')
    console.log('   - Employee: View and download payslips')

  } catch (error) {
    console.error('❌ Error testing payroll flow:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPayrollFlow()
