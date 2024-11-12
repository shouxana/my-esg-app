const { PrismaClient } = require('@prisma/client');
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updatePassword() {
  try {
    const email = 'user1@test1.com';
    const plainPassword = 'password123';

    // First check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!existingUser) {
      console.error(`User with email ${email} not found`);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Update the user's password in the database
    // Note: Using correct types based on your schema
    const updatedUser = await prisma.user.update({
      where: { 
        id: existingUser.id  // Using id as it's an Int in your schema
      },
      data: { 
        password: hashedPassword,
        updated_at: new Date()
      },
    });

    console.log(`Password for user ${email} has been updated successfully.`);
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ensure Prisma is properly initialized before running
prisma.$connect()
  .then(() => {
    updatePassword()
      .catch((error) => {
        console.error('Failed to update password:', error);
      });
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
  });