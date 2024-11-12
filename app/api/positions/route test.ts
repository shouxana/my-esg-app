// app/api/positions/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const positions = [
      { id: '1', name: 'Software Engineer' },
      { id: '2', name: 'Project Manager' },
      { id: '3', name: 'HR Manager' }
    ];

    return new NextResponse(JSON.stringify(positions), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch positions' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}