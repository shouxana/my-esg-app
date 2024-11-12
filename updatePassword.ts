// updatePassword.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: { 
        password: hashedPassword,
        updated_at: new Date() // Update the updated_at timestamp
      },
    });

    console.log(`Password for user ${email} has been updated successfully.`);
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePassword();