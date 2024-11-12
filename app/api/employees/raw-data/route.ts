import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: 5432,
  database: process.env.POSTGRES_DATABASE
});

// Add this to explicitly allow GET method
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        e.employee_id,
        e.full_name,
        e.employment_date,
        e.termination_date,
        ed.education,
        g.gender,
        mp.managerial_position
      FROM "Employee" e
      JOIN "Education" ed ON e.education_id = ed.education_id
      JOIN "Gender" g ON e.gender_id = g.gender_id
      JOIN "ManagerialPosition" mp ON e.managerial_position_id = mp.managerial_position_id
      ORDER BY e.employee_id;
    `;
    
    const result = await client.query(query);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch employee data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// Add this to handle OPTIONS requests (CORS)
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    }
  );
}