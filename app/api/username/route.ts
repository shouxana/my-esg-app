// app/api/username/route.ts
import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  try {
    const username = os.userInfo().username;
    return NextResponse.json({ username }, { status: 200 });
  } catch (error) {
    console.error('Error getting username:', error);
    return NextResponse.json(
      { error: 'Failed to get username' },
      { status: 500 }
    );
  }
}