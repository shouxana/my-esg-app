import { NextResponse } from 'next/server';
import pool from '@/lib/db';  

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        'SELECT * FROM "Vehicle_Type" ORDER BY vehicle_type_id'
      );
      return NextResponse.json(rows);
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch vehicle types' },
      { status: 500 }
    );
  }
}