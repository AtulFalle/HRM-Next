const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testNullFix() {
  try {
    console.log('🧪 Testing Null Property Fix...\n')

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

    // Step 2: Check employee data
    console.log('\n2️⃣ Checking employee data...')
    
    const employees = await prisma.employee.findMany({
      include: {
        user: true,
        department: true,
        emergencyContact: true
      },
      take: 3
    })
    
    console.log(`   📊 Found ${employees.length} employees:`)
    employees.forEach(emp => {
      console.log(`   - ${emp.firstName} ${emp.lastName}`)
      console.log(`     Department: ${emp.department?.name || 'No Department'}`)
      console.log(`     Emergency Contact: ${emp.emergencyContact?.name || 'None'}`)
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

    // Step 4: Check for null values
    console.log('\n4️⃣ Checking for null values...')
    
    const employeesWithNulls = await prisma.employee.findMany({
      where: {
        OR: [
          { emergencyContact: null },
          { department: null }
        ]
      },
      include: {
        user: true,
        department: true,
        emergencyContact: true
      }
    })
    
    if (employeesWithNulls.length > 0) {
      console.log(`   ⚠️  Found ${employeesWithNulls.length} employees with null values:`)
      employeesWithNulls.forEach(emp => {
        console.log(`   - ${emp.firstName} ${emp.lastName}`)
        console.log(`     Emergency Contact: ${emp.emergencyContact ? 'Has' : 'NULL'}`)
        console.log(`     Department: ${emp.department ? 'Has' : 'NULL'}`)
      })
    } else {
      console.log('   ✅ No employees with null values found')
    }

    // Step 5: Final instructions
    console.log('\n5️⃣ Testing Instructions:')
    console.log('✅ Null property errors should now be fixed!')
    console.log('\n🎯 Test the following:')
    console.log('1. Go to: http://localhost:3000/auth/signin')
    console.log('2. Login with: admin@hrm.com / admin123')
    console.log('3. Navigate to: /dashboard/employees')
    console.log('4. Click on any employee to view their profile')
    console.log('5. Should see employee profile without null property errors')
    
    console.log('\n✅ Fixed issues:')
    console.log('   - Added null checks for employee.emergencyContact.name')
    console.log('   - Added null checks for employee.emergencyContact.phone')
    console.log('   - Added null checks for employee.emergencyContact.relationship')
    console.log('   - Added null checks for employee.department.name')
    console.log('   - Added safe access for employee.firstName[0] and lastName[0]')
    console.log('   - Prevented "Cannot read properties of null" errors')

  } catch (error) {
    console.error('❌ Error testing null fix:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testNullFix()

