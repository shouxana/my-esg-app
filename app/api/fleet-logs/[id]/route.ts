import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const vehicleId = params.id;
    const client = await pool.connect();
    
    try {
      const { rows } = await client.query(
        `SELECT 
          id,
          changed_field,
          old_value,
          new_value,
          TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
        FROM "FleetUpdateLog"
        WHERE vehicle_id = $1
        ORDER BY updated_at DESC`,
        [vehicleId]
      );
      
      return NextResponse.json(rows);
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch update logs' },
      { status: 500 }
    );
  }
}