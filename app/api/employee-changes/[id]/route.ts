import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: 5432,
  database: process.env.POSTGRES_DATABASE,
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params to extract the employeeId
    const { id: employeeId } = await params;

    const { searchParams } = new URL(request.url);
    const company = searchParams.get('company');

    if (!company || !employeeId) {
      return NextResponse.json(
        { error: 'Company and employee ID parameters are required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `SELECT 
          id,
          employee_id,
          changed_field,
          old_value,
          new_value,
          updated_at::text
        FROM "EmployeeUpdateLog"
        WHERE employee_id = $1 
        AND EXISTS (
          SELECT 1 FROM "Employee"
          WHERE employee_id = $1
          AND lower(company) = lower($2)
        )
        ORDER BY updated_at DESC`,
        [employeeId, company]
      );

      return NextResponse.json(rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching employee changes:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch employee changes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
