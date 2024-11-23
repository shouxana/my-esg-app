import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error', 'warn']
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password, firstName, lastName } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    console.log('Registration attempt for:', email);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive'
        }
      }
    });

    console.log('User lookup result:', existingUser ? 'User exists' : 'User not found');

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Extract company from email domain
    const company = email.split('@')[1].split('.')[0];

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password,
        company,
        user_name: firstName.trim(),
        user_lastname: lastName.trim(),
      },
      select: {
        id: true,
        email: true,
        company: true,
        user_name: true,
        user_lastname: true,
        created_at: true,
        updated_at: true
      }
    });

    console.log('User registration successful:', newUser.id);

    return NextResponse.json({
      message: 'Registration successful',
      user: {
        ...newUser,
        company: newUser.company.trim()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}