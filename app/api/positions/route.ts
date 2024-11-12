import { NextResponse } from 'next/server';
import pool from '@/lib/db';



export async function GET() {
  try {
    // Test the connection
    const client = await pool.connect();
    
    try {
      const { rows } = await client.query(
        'SELECT position_id as id, position as name FROM "Position" ORDER BY position'
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
        error: 'Failed to fetch positions', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
