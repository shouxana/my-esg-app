// app/api/leave-tracking/route.ts

import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get('company');

  if (!company) {
    return NextResponse.json(
      { error: 'Company parameter is required' },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    // Get all genders
    const genderResult = await client.query('SELECT gender FROM "Gender"');
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear];

    const formattedData = {
      categories: genderResult.rows.map(row => row.gender),
      years: years,
      data: {}
    };

    // Initialize data structure
    years.forEach(year => {
      formattedData.data[year] = {};
      genderResult.rows.forEach(row => {
        formattedData.data[year][row.gender] = {
          avgDuration: 0,
          leaveCount: 0,
          ongoingLeaves: 0
        };
      });
    });

    const distributionQuery = `
      WITH last_four_years AS (
          SELECT generate_series($1, $1 + 3) AS year
      ),
      employee_leaves AS (
          SELECT
              e.employee_id,
              g.gender,
              y.year,
              CASE 
                WHEN e.leave_date_start IS NOT NULL 
                AND EXTRACT(YEAR FROM e.leave_date_start::timestamp) = y.year
                THEN 
                  CASE 
                    WHEN e.leave_date_end IS NULL THEN
                      EXTRACT(DAY FROM (CURRENT_DATE - e.leave_date_start::timestamp))::integer
                    ELSE
                      EXTRACT(DAY FROM (e.leave_date_end::timestamp - e.leave_date_start::timestamp))::integer
                  END
                ELSE NULL
              END as leave_duration,
              CASE 
                WHEN e.leave_date_start IS NOT NULL 
                AND EXTRACT(YEAR FROM e.leave_date_start::timestamp) = y.year
                THEN 1
                ELSE 0
              END as has_leave,
              CASE 
                WHEN e.leave_date_start IS NOT NULL 
                AND e.leave_date_end IS NULL
                AND EXTRACT(YEAR FROM e.leave_date_start::timestamp) = y.year
                THEN 1
                ELSE 0
              END as is_ongoing
          FROM "Employee" e
          JOIN "Gender" g ON e.gender_id = g.gender_id
          CROSS JOIN last_four_years y
          WHERE 
              EXTRACT(YEAR FROM e.employment_date::timestamp) <= y.year
              AND (e.termination_date IS NULL OR EXTRACT(YEAR FROM e.termination_date::timestamp) >= y.year)
              AND LOWER(e.company) = LOWER($2)
      ),
      leave_stats AS (
          SELECT
              gender,
              year,
              ROUND(AVG(leave_duration) FILTER (WHERE has_leave = 1)::numeric, 1) as avg_duration,
              SUM(has_leave) as leave_count,
              SUM(is_ongoing) as ongoing_leaves
          FROM employee_leaves
          GROUP BY gender, year
          ORDER BY year, gender
      )
      SELECT 
          ls.year,
          ls.gender,
          COALESCE(ls.avg_duration, 0) as avg_duration,
          COALESCE(ls.leave_count, 0) as leave_count,
          COALESCE(ls.ongoing_leaves, 0) as ongoing_leaves
      FROM leave_stats ls
      ORDER BY ls.year, ls.gender;
    `;

    const distributionResult = await client.query(distributionQuery, [years[0], company]);
    
    distributionResult.rows.forEach(row => {
      if (formattedData.data[row.year] && row.gender) {
        formattedData.data[row.year][row.gender] = {
          avgDuration: parseFloat(row.avg_duration),
          leaveCount: parseInt(row.leave_count),
          ongoingLeaves: parseInt(row.ongoing_leaves)
        };
      }
    });

    return NextResponse.json({
      ...formattedData,
      company
    });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch leave distribution', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}