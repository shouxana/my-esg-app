import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Test the connection
    const client = await pool.connect();

    try {
      const { rows } = await client.query(
        'SELECT education_id as id, education as name FROM "Education" ORDER BY education'
      );

      return NextResponse.json(rows);
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);

    return NextResponse.json(
      { 
        error: 'Failed to fetch educations', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
