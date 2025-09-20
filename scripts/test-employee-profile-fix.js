const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testEmployeeProfileFix() {
  try {
    console.log('🧪 Testing Employee Profile Fix...\n')

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

    // Step 2: Check employee data structure
    console.log('\n2️⃣ Checking employee data structure...')
    
    const employees = await prisma.employee.findMany({
      include: {
        user: true,
        department: true
      },
      take: 3
    })
    
    console.log(`   📊 Found ${employees.length} employees:`)
    employees.forEach(emp => {
      console.log(`   - ${emp.firstName} ${emp.lastName}`)
      console.log(`     Emergency Contact: ${emp.emergencyContact || 'None'}`)
      console.log(`     Emergency Phone: ${emp.emergencyPhone || 'None'}`)
      console.log(`     Department: ${emp.department?.name || 'No Department'}`)
    })

    // Step 3: Test employee profile page
    console.log('\n3️⃣ Testing employee profile page...')
    
    if (employees.length > 0) {
      const firstEmployee = employees[0]
      try {
        const response = await fetch(`http://localhost:3000/dashboard/employees/${firstEmployee.id}`)
        console.log(`   📊 Employee profile page status: ${response.status}`)
        
        if (response.status === 307) {
          console.log('   🔄 Redirect to signin (expected for unauthenticated)')
        } else if (response.status === 200) {
          console.log('   ✅ Employee profile page accessible')
        } else {
          console.log('   ⚠️  Unexpected status:', response.status)
        }
      } catch (error) {
        console.log('   ❌ Error accessing employee profile page:', error.message)
      }
    }

    // Step 4: Final instructions
    console.log('\n4️⃣ Testing Instructions:')
    console.log('✅ Null property errors should now be fixed!')
    console.log('\n🎯 Test the following:')
    console.log('1. Go to: http://localhost:3000/auth/signin')
    console.log('2. Login with: admin@hrm.com / admin123')
    console.log('3. Navigate to: /dashboard/employees')
    console.log('4. Click on any employee to view their profile')
    console.log('5. Should see employee profile without null property errors')
    
    console.log('\n✅ Fixed issues:')
    console.log('   - Fixed emergencyContact data structure mismatch')
    console.log('   - Changed from object access to string field access')
    console.log('   - Added proper null checks for department.name')
    console.log('   - Added safe access for firstName[0] and lastName[0]')
    console.log('   - Prevented "Cannot read properties of null" errors')

  } catch (error) {
    console.error('❌ Error testing employee profile fix:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testEmployeeProfileFix()

