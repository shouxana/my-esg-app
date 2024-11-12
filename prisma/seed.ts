const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    // Clear existing data (optional)
    console.log('Clearing existing data...')
    await prisma.$transaction([
      prisma.employee.deleteMany(),
      prisma.gender.deleteMany(),
      prisma.education.deleteMany(),
      prisma.maritalStatus.deleteMany(),
      prisma.position.deleteMany(),
      prisma.managerialPosition.deleteMany(),
      prisma.user.deleteMany(),
    ])

    // Seed Gender data
    console.log('Seeding genders...')
    await prisma.gender.createMany({
      data: [
        { gender_id: '1', gender: 'Male' },
        { gender_id: '2', gender: 'Female' },
        { gender_id: '3', gender: 'Other' }
      ]
    })

    // Seed Education data
    console.log('Seeding education levels...')
    await prisma.education.createMany({
      data: [
        { education_id: '1', education: 'High School' },
        { education_id: '2', education: 'Bachelor\'s Degree' },
        { education_id: '3', education: 'Master\'s Degree' },
        { education_id: '4', education: 'PhD' }
      ]
    })

    // Seed MaritalStatus data
    console.log('Seeding marital statuses...')
    await prisma.maritalStatus.createMany({
      data: [
        { marital_status_id: '1', marital_status: 'Single' },
        { marital_status_id: '2', marital_status: 'Married' },
        { marital_status_id: '3', marital_status: 'Divorced' },
        { marital_status_id: '4', marital_status: 'Widowed' }
      ]
    })

    // Seed Position data
    console.log('Seeding positions...')
    await prisma.position.createMany({
      data: [
        { position_id: '1', position: 'Software Engineer' },
        { position_id: '2', position: 'Project Manager' },
        { position_id: '3', position: 'Business Analyst' },
        { position_id: '4', position: 'Data Scientist' }
      ]
    })

    // Seed ManagerialPosition data
    console.log('Seeding managerial positions...')
    await prisma.managerialPosition.createMany({
      data: [
        { managerial_position_id: '1', managerial_position: 'Yes' },
        { managerial_position_id: '2', managerial_position: 'No' }
      ]
    })

    // Seed Users data
    console.log('Seeding users...')
    await prisma.user.createMany({
      data: [
        { 
          email: 'user1@test1.com', 
          password: 'password123',
          company: 'test1' 
        },
        { 
          email: 'user1@test2.com', 
          password: 'password123',
          company: 'test2' 
        }
      ]
    })

    // Seed Employee data
    console.log('Seeding employees...')
    await prisma.employee.createMany({
      data: [
        {
          full_name: 'John Doe',
          employee_mail: 'john.doe@test1.com',
          birth_date: new Date('1990-01-15'),
          employment_date: new Date('2020-03-15'),
          termination_date: null,
          position_id: '1',
          education_id: '2',
          marital_status_id: '2',
          gender_id: '1',
          managerial_position_id: '2',
          company: 'test1',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          full_name: 'Jane Smith',
          employee_mail: 'jane.smith@test1.com',
          birth_date: new Date('1985-05-20'),
          employment_date: new Date('2019-06-01'),
          termination_date: null,
          position_id: '2',
          education_id: '3',
          marital_status_id: '1',
          gender_id: '2',
          managerial_position_id: '1',
          company: 'test1',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          full_name: 'Bob Wilson',
          employee_mail: 'bob.wilson@test2.com',
          birth_date: new Date('1992-08-10'),
          employment_date: new Date('2021-01-10'),
          termination_date: null,
          position_id: '1',
          education_id: '2',
          marital_status_id: '1',
          gender_id: '1',
          managerial_position_id: '2',
          company: 'test2',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          full_name: 'Sarah Johnson',
          employee_mail: 'sarah.johnson@test2.com',
          birth_date: new Date('1988-11-30'),
          employment_date: new Date('2018-09-15'),
          termination_date: null,
          position_id: '4',
          education_id: '4',
          marital_status_id: '2',
          gender_id: '2',
          managerial_position_id: '1',
          company: 'test2',
          created_at: new Date(),
          updated_at: new Date()
        }
      ]
    })

console.log('Seeding employee update logs...')
await prisma.employeeUpdateLog.createMany({
  data: [
    {
      employee_id: 1, // Make sure this matches an existing employee_id
      full_name: 'John Doe',
      changed_field: 'position_id',
      old_value: '2',
      new_value: '1',
      updated_at: new Date('2024-01-15')
    },
    {
      employee_id: 1,
      full_name: 'John Doe',
      changed_field: 'salary',
      old_value: '70000',
      new_value: '75000',
      updated_at: new Date('2024-02-01')
    },
    {
      employee_id: 2,
      full_name: 'Jane Smith',
      changed_field: 'marital_status_id',
      old_value: '1',
      new_value: '2',
      updated_at: new Date('2024-01-20')
    }
  ]
})

    console.log('Seeding completed successfully')
  } catch (error) {
    console.error('Error during seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })