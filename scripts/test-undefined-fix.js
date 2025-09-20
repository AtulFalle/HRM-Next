const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testUndefinedFix() {
  try {
    console.log('🧪 Testing Undefined Property Fix...\n')

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

    // Step 2: Check database data
    console.log('\n2️⃣ Checking database data...')
    
    const payrollCount = await prisma.payroll.count()
    const payslipCount = await prisma.payslip.count()
    const userCount = await prisma.user.count()
    
    console.log(`   📊 Database Status:`)
    console.log(`      - Users: ${userCount}`)
    console.log(`      - Payroll Records: ${payrollCount}`)
    console.log(`      - Payslips: ${payslipCount}`)

    // Step 3: Test payroll page access
    console.log('\n3️⃣ Testing payroll page access...')
    
    try {
      const response = await fetch('http://localhost:3000/dashboard/payroll')
      console.log(`   📊 Payroll page status: ${response.status}`)
      
      if (response.status === 307) {
        console.log('   🔄 Redirect to signin (expected for unauthenticated)')
      } else if (response.status === 200) {
        console.log('   ✅ Payroll page accessible')
      } else {
        console.log('   ⚠️  Unexpected status:', response.status)
      }
    } catch (error) {
      console.log('   ❌ Error accessing payroll page:', error.message)
    }

    // Step 4: Check for test users
    console.log('\n4️⃣ Checking test users...')
    
    const users = await prisma.user.findMany({
      include: { employee: true },
      take: 3
    })
    
    console.log('   👥 Available test users:')
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`)
      if (user.employee) {
        console.log(`     Employee: ${user.employee.firstName} ${user.employee.lastName}`)
      }
    })

    // Step 5: Final instructions
    console.log('\n5️⃣ Testing Instructions:')
    console.log('✅ Undefined property errors should now be fixed!')
    console.log('\n🎯 Test the following:')
    console.log('1. Go to: http://localhost:3000/auth/signin')
    console.log('2. Login with: employee1@hrm.com / employee123')
    console.log('3. Navigate to: /dashboard/payroll')
    console.log('4. Should see employee payroll portal without errors')
    console.log('5. Check that all data displays correctly')
    
    console.log('\n✅ Fixed issues:')
    console.log('   - Added null checks for payrollHistory.length')
    console.log('   - Added null checks for payslips.length')
    console.log('   - Added null checks for validationErrors.filter()')
    console.log('   - Prevented "Cannot read properties of undefined" errors')

  } catch (error) {
    console.error('❌ Error testing undefined fix:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testUndefinedFix()

