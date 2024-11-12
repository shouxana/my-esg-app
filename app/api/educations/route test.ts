// app/api/educations/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const educations = [
      { id: '1', name: 'High School' },
      { id: '2', name: "Bachelor's Degree" },
      { id: '3', name: "Master's Degree" }
    ];

    return new NextResponse(JSON.stringify(educations), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch educations' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}