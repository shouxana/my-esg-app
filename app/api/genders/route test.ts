// app/api/genders/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const genders = [
      { id: '1', name: 'Male' },
      { id: '2', name: 'Female' },
    ];

    return new NextResponse(JSON.stringify(genders), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch genders' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}