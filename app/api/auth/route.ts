import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client with logging
const prisma = new PrismaClient({
  log: ['error', 'warn']
});

export async function POST(request: Request) {
  try {
    // Validate request method
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('Authentication attempt for:', email);

    // Find user with case-insensitive email search
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive'
        }
      }
    });

    // Log user found status (without sensitive data)
    console.log('User lookup result:', user ? 'User found' : 'User not found');

    // Handle user not found
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Compare passwords (plaintext for now as requested)
    const isPasswordValid = password === user.password;
    console.log('Password validation:', isPasswordValid ? 'success' : 'failed');

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create sanitized user object (remove sensitive data)
    const { password: _, ...userWithoutPassword } = user;

    // Log successful authentication
    console.log('Successful authentication for:', email);

    // Return success response with user data
    return NextResponse.json({
      message: 'Authentication successful',
      user: userWithoutPassword
    });

  } catch (error) {
    // Log the full error details
    console.error('Authentication error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Return generic error to client
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  } finally {
    // Ensure database connection is properly handled
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error('Error disconnecting from database:', error);
    }
  }
}

export async function GET(request: Request) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

// Add OPTIONS handler for CORS if needed
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}