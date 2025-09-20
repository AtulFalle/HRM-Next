import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create departments
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { name: 'Engineering' },
      update: {},
      create: {
        name: 'Engineering',
        description: 'Software development and technical operations',
      },
    }),
    prisma.department.upsert({
      where: { name: 'Human Resources' },
      update: {},
      create: {
        name: 'Human Resources',
        description: 'Employee relations and organizational development',
      },
    }),
    prisma.department.upsert({
      where: { name: 'Marketing' },
      update: {},
      create: {
        name: 'Marketing',
        description: 'Brand management and customer acquisition',
      },
    }),
    prisma.department.upsert({
      where: { name: 'Sales' },
      update: {},
      create: {
        name: 'Sales',
        description: 'Customer acquisition and revenue generation',
      },
    }),
    prisma.department.upsert({
      where: { name: 'Finance' },
      update: {},
      create: {
        name: 'Finance',
        description: 'Financial planning and accounting',
      },
    }),
  ])

  console.log('✅ Departments created')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hrm.com' },
    update: {},
    create: {
      email: 'admin@hrm.com',
      username: 'admin',
      name: 'System Administrator',
      password: hashedPassword,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  })

  // Create admin employee record
  await prisma.employee.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      employeeId: 'EMP001',
      firstName: 'System',
      lastName: 'Administrator',
      dateOfBirth: new Date('1985-01-01'),
      phoneNumber: '+1-555-0100',
      address: '123 Admin Street, City, State 12345',
      emergencyContact: 'Emergency Contact',
      emergencyPhone: '+1-555-0101',
      departmentId: departments[1].id, // HR Department
      position: 'System Administrator',
      hireDate: new Date('2020-01-01'),
      salary: 100000,
    },
  })

  console.log('✅ Admin user created')

  // Create manager users
  const managers = [
    {
      email: 'manager1@hrm.com',
      username: 'manager1',
      name: 'John Manager',
      firstName: 'John',
      lastName: 'Manager',
      department: departments[0].id, // Engineering
      position: 'Engineering Manager',
      salary: 95000,
    },
    {
      email: 'manager2@hrm.com',
      username: 'manager2',
      name: 'Jane Manager',
      firstName: 'Jane',
      lastName: 'Manager',
      department: departments[2].id, // Marketing
      position: 'Marketing Manager',
      salary: 90000,
    },
  ]

  for (const managerData of managers) {
    const hashedPassword = await bcrypt.hash('manager123', 12)
    
    const managerUser = await prisma.user.upsert({
      where: { email: managerData.email },
      update: {},
      create: {
        email: managerData.email,
        username: managerData.username,
        name: managerData.name,
        password: hashedPassword,
        role: UserRole.MANAGER,
        emailVerified: new Date(),
      },
    })

    await prisma.employee.upsert({
      where: { userId: managerUser.id },
      update: {},
      create: {
        userId: managerUser.id,
        employeeId: `EMP${String(Date.now()).slice(-6)}`,
        firstName: managerData.firstName,
        lastName: managerData.lastName,
        dateOfBirth: new Date('1980-01-01'),
        phoneNumber: '+1-555-0200',
        address: '123 Manager Street, City, State 12345',
        emergencyContact: 'Emergency Contact',
        emergencyPhone: '+1-555-0201',
        departmentId: managerData.department,
        position: managerData.position,
        hireDate: new Date('2021-01-01'),
        salary: managerData.salary,
      },
    })
  }

  console.log('✅ Manager users created')

  // Create employee users
  const employees = [
    {
      email: 'employee1@hrm.com',
      username: 'employee1',
      name: 'Alice Developer',
      firstName: 'Alice',
      lastName: 'Developer',
      department: departments[0].id, // Engineering
      position: 'Senior Developer',
      salary: 80000,
    },
    {
      email: 'employee2@hrm.com',
      username: 'employee2',
      name: 'Bob Designer',
      firstName: 'Bob',
      lastName: 'Designer',
      department: departments[0].id, // Engineering
      position: 'UI/UX Designer',
      salary: 75000,
    },
    {
      email: 'employee3@hrm.com',
      username: 'employee3',
      name: 'Carol Marketer',
      firstName: 'Carol',
      lastName: 'Marketer',
      department: departments[2].id, // Marketing
      position: 'Marketing Specialist',
      salary: 65000,
    },
    {
      email: 'employee4@hrm.com',
      username: 'employee4',
      name: 'David Sales',
      firstName: 'David',
      lastName: 'Sales',
      department: departments[3].id, // Sales
      position: 'Sales Representative',
      salary: 60000,
    },
  ]

  for (const employeeData of employees) {
    const hashedPassword = await bcrypt.hash('employee123', 12)
    
    const employeeUser = await prisma.user.upsert({
      where: { email: employeeData.email },
      update: {},
      create: {
        email: employeeData.email,
        username: employeeData.username,
        name: employeeData.name,
        password: hashedPassword,
        role: UserRole.EMPLOYEE,
        emailVerified: new Date(),
      },
    })

    await prisma.employee.upsert({
      where: { userId: employeeUser.id },
      update: {},
      create: {
        userId: employeeUser.id,
        employeeId: `EMP${String(Date.now()).slice(-6)}`,
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        dateOfBirth: new Date('1990-01-01'),
        phoneNumber: '+1-555-0300',
        address: '123 Employee Street, City, State 12345',
        emergencyContact: 'Emergency Contact',
        emergencyPhone: '+1-555-0301',
        departmentId: employeeData.department,
        position: employeeData.position,
        hireDate: new Date('2022-01-01'),
        salary: employeeData.salary,
      },
    })
  }

  console.log('✅ Employee users created')

  console.log('🎉 Database seed completed successfully!')
  console.log('\n📋 Test Accounts:')
  console.log('Admin: admin@hrm.com / admin123')
  console.log('Manager: manager1@hrm.com / manager123')
  console.log('Employee: employee1@hrm.com / employee123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
