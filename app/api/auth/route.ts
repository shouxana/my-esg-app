// app/api/auth/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error', 'warn']
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('Authentication attempt for:', email);

    // Updated select fields to match your User model schema
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        email: true,
        password: true,
        company: true,
        created_at: true,
        updated_at: true
      }
    });

    console.log('User lookup result:', user ? 'User found' : 'User not found');

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isPasswordValid = password === user.password;
    console.log('Password validation:', isPasswordValid ? 'success' : 'failed');

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Remove sensitive data
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: 'Authentication successful',
      user: {
        ...userWithoutPassword,
        company: user.company.trim() // Ensure no whitespace in company name
      }
    });

  } catch (error) {
    console.error('Authentication error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { error: 'Authentication failed' },
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