import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, password, company } = await request.json();
    
    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Create the user with the plaintext password
    const newUser = await prisma.user.create({
      data: {
        email,
        password, // In production, use bcrypt.hash(password, 10)
        company,
      },
    });

    // Exclude the password from the response
    const { password: _, ...userWithoutPassword } = newUser;
    
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}