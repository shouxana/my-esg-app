import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: 5432,
  database: process.env.POSTGRES_DATABASE
});

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
