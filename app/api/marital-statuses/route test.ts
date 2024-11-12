// app/api/marital-statuses/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const maritalStatuses = [
      { id: '1', name: 'Single' },
      { id: '2', name: 'Married' },
      { id: '3', name: 'Divorced' }
    ];

    return new NextResponse(JSON.stringify(maritalStatuses), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch marital statuses' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}