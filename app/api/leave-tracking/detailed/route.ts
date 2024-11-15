// app/api/leave-tracking/detailed/route.ts

import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(request: Request) {
  const client = await pool.connect();

  const { searchParams } = new URL(request.url);
  const company = searchParams.get('company');

  if (!company) {
    return NextResponse.json(
      { error: 'Company parameter is required' },
      { status: 400 }
    );
  }

  try {
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear];

    const query = `
      WITH RECURSIVE last_four_years AS (
          SELECT generate_series($1, $1 + 3) AS year
      ),
      employee_base AS (
          SELECT
              emp.employee_id,
              emp.full_name,
              g.gender,
              TO_CHAR(emp.employment_date, 'YYYY-MM-DD') as employment_date,
              CASE 
                  WHEN emp.termination_date IS NULL THEN 'Active'
                  ELSE TO_CHAR(emp.termination_date, 'YYYY-MM-DD')
              END as status,
              year,
              CASE 
                WHEN emp.leave_date_start IS NOT NULL 
                AND EXTRACT(YEAR FROM emp.leave_date_start) = year 
                THEN 
                  CASE 
                    WHEN emp.leave_date_end IS NULL THEN
                      EXTRACT(DAY FROM (CURRENT_DATE - emp.leave_date_start))
                    ELSE
                      EXTRACT(DAY FROM (emp.leave_date_end - emp.leave_date_start))
                  END
                ELSE NULL
              END as leave_duration,
              CASE 
                WHEN emp.leave_date_start IS NOT NULL 
                AND EXTRACT(YEAR FROM emp.leave_date_start) = year
                THEN TRUE
                ELSE FALSE
              END as has_leave,
              CASE 
                WHEN emp.leave_date_start IS NOT NULL 
                AND emp.leave_date_end IS NULL
                AND EXTRACT(YEAR FROM emp.leave_date_start) = year
                THEN TRUE
                ELSE FALSE
              END as is_ongoing
          FROM "Employee" emp
          JOIN "Gender" g ON emp.gender_id = g.gender_id
          CROSS JOIN last_four_years y
          WHERE 
              EXTRACT(YEAR FROM emp.employment_date) <= year
              AND (emp.termination_date IS NULL OR EXTRACT(YEAR FROM emp.termination_date) >= year)
              AND LOWER(emp.company) = LOWER($2)
          ORDER BY emp.employee_id, year
      ),
      yearly_stats AS (
          SELECT
              employee_id,
              full_name,
              employment_date,
              status,
              gender,
              year,
              COUNT(*) FILTER (WHERE has_leave) as leave_count,
              ROUND(AVG(leave_duration) FILTER (WHERE has_leave)::numeric, 1) as avg_duration,
              bool_or(is_ongoing) as has_ongoing_leave
          FROM employee_base
          GROUP BY employee_id, full_name, employment_date, status, gender, year
      ),
      final_data AS (
          SELECT
              employee_id,
              full_name,
              employment_date,
              status,
              gender,
              jsonb_object_agg(
                  'leave_' || year,
                  jsonb_build_object(
                      'duration', COALESCE(avg_duration, 0),
                      'count', leave_count,
                      'ongoing', has_ongoing_leave
                  )
              ) as yearly_data
          FROM yearly_stats
          GROUP BY employee_id, full_name, employment_date, status, gender
      )
      SELECT *
      FROM final_data
      ORDER BY full_name;
    `;

    const { rows } = await client.query(query, [years[0], company]);

    // Transform rows to match the expected format
    const transformedRows = rows.map(row => ({
      ...row,
      leave_2021: row.yearly_data?.leave_2021 || null,
      leave_2022: row.yearly_data?.leave_2022 || null,
      leave_2023: row.yearly_data?.leave_2023 || null,
      leave_2024: row.yearly_data?.leave_2024 || null
    }));

    return NextResponse.json(transformedRows);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch detailed leave data', 
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}