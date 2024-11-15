// app/api/leave-tracking-popup/route.ts

import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const category = searchParams.get('category');
  const company = searchParams.get('company');

  if (!year || !category || !company) {
    return NextResponse.json(
      { error: 'Year, category, and company parameters are required' },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    const query = `
      WITH employee_leaves AS (
        SELECT
          e.employee_id,
          e.full_name,
          TO_CHAR(e.employment_date, 'YYYY-MM-DD') as employment_date,
          CASE 
            WHEN e.termination_date IS NULL THEN 'Active'
            ELSE TO_CHAR(e.termination_date, 'YYYY-MM-DD')
          END as status,
          TO_CHAR(e.leave_date_start, 'YYYY-MM-DD') as leave_start_date,
          CASE 
            WHEN e.leave_date_end IS NULL THEN NULL
            ELSE TO_CHAR(e.leave_date_end, 'YYYY-MM-DD')
          END as leave_end_date,
          ROUND(
            CASE 
              WHEN e.leave_date_end IS NULL THEN
                EXTRACT(DAY FROM (CURRENT_DATE - e.leave_date_start))::numeric
              ELSE
                EXTRACT(DAY FROM (e.leave_date_end - e.leave_date_start))::numeric
            END,
            1
          ) as leave_duration,
          e.leave_date_end IS NULL as is_ongoing
        FROM "Employee" e
        JOIN "Gender" g ON e.gender_id = g.gender_id
        WHERE 
          LOWER(e.company) = LOWER($1)
          AND g.gender = $2
          AND EXTRACT(YEAR FROM e.leave_date_start) = $3::integer
          AND e.leave_date_start IS NOT NULL
        ORDER BY e.leave_date_start DESC
      )
      SELECT * FROM employee_leaves;
    `;

    const { rows } = await client.query(query, [company, category, year]);
    
    // Transform the rows to ensure leave_duration is a number
    const transformedRows = rows.map(row => ({
      ...row,
      leave_duration: Number(row.leave_duration) || 0
    }));

    return NextResponse.json(transformedRows);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee leave details' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}