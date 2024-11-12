// app/api/auth/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client with logging
const prisma = new PrismaClient({
  log: ['error', 'warn']
});

// Export the handler with correct Next.js 13+ naming
export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('Authentication attempt for:', email);

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive'
        }
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

    const { password: _, ...userWithoutPassword } = user;

    // Return success response
    return NextResponse.json({
      message: 'Authentication successful',
      user: userWithoutPassword
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
  }
}

// Add CORS headers to all responses
export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}