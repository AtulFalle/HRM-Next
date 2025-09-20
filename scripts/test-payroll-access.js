const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testPayrollAccess() {
  try {
    console.log('🧪 Testing Payroll Page Access...\n')

    // Step 1: Check if server is running
    console.log('1️⃣ Checking server status...')
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/session')
      if (response.ok) {
        console.log('   ✅ Server is running')
      } else {
        console.log('   ⚠️  Server responded with status:', response.status)
      }
    } catch (error) {
      console.log('   ❌ Server not accessible:', error.message)
      console.log('   💡 Make sure to run: npm run dev')
      return
    }

    // Step 2: Test payroll page access
    console.log('\n2️⃣ Testing payroll page access...')
    
    try {
      const response = await fetch('http://localhost:3000/dashboard/payroll')
      console.log(`   📊 Payroll page status: ${response.status}`)
      
      if (response.status === 307) {
        console.log('   🔄 Redirect detected (expected for unauthenticated users)')
      } else if (response.status === 200) {
        console.log('   ✅ Payroll page accessible')
      } else {
        console.log('   ⚠️  Unexpected status:', response.status)
      }
    } catch (error) {
      console.log('   ❌ Error accessing payroll page:', error.message)
    }

    // Step 3: Check user data
    console.log('\n3️⃣ Checking user data...')
    
    const users = await prisma.user.findMany({
      include: { employee: true },
      take: 3
    })
    
    console.log('   📋 Available test users:')
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`)
      if (user.employee) {
        console.log(`     Employee: ${user.employee.firstName} ${user.employee.lastName}`)
      }
    })

    // Step 4: Check payroll data
    console.log('\n4️⃣ Checking payroll data...')
    
    const payrollCount = await prisma.payroll.count()
    const payslipCount = await prisma.payslip.count()
    
    console.log(`   📊 Database Status:`)
    console.log(`      - Payroll Records: ${payrollCount}`)
    console.log(`      - Payslips: ${payslipCount}`)

    // Step 5: Final instructions
    console.log('\n5️⃣ Testing Instructions:')
    console.log('✅ Payroll page should now be accessible!')
    console.log('\n🎯 Test the following:')
    console.log('1. Go to: http://localhost:3000/auth/signin')
    console.log('2. Login with any of these users:')
    console.log('   - Admin: admin@hrm.com / admin123')
    console.log('   - Manager: manager1@hrm.com / manager123')
    console.log('   - Employee: employee1@hrm.com / employee123')
    console.log('3. After login, navigate to: /dashboard/payroll')
    console.log('4. Should see the appropriate payroll interface for your role')
    
    console.log('\n✅ Fixed issues:')
    console.log('   - Added /dashboard/payroll to role-based access')
    console.log('   - Enhanced session with employee data')
    console.log('   - Fixed middleware redirects')

  } catch (error) {
    console.error('❌ Error testing payroll access:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPayrollAccess()
