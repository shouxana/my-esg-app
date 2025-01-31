import { NextResponse } from 'next/server';
import pool from '@/lib/db';
export const dynamic = 'force-dynamic';

interface QueryRow {
  employee_id: string;
  full_name: string;
  employment_date: string;
  status: string;
  age_in_year: string;
  is_manager: boolean;
  age_category: string;
}

interface TransformedRow extends QueryRow {
  age_at_year: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const category = searchParams.get('category');
    const company = searchParams.get('company');

    if (!company) {
      return NextResponse.json(
        { error: 'Company parameter is required' },
        { status: 400 }
      );
    }
    if (!year || !category) {
      return NextResponse.json(
        { error: 'Year and category parameters are required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      let query: string;
      
      if (category === 'Left Company' || category === 'Joined Company') {
        query = `
          SELECT 
            e.employee_id::text,
            e.full_name,
            e.employment_date::text,
            CASE 
              WHEN e.termination_date IS NULL THEN 'Active'
              ELSE e.termination_date::text
            END as status,
            EXTRACT(YEAR FROM AGE(make_date($1::int, 12, 31), e.birth_date))::text as age_in_year,
            mp.managerial_position = 'Yes' as is_manager,
            $3 as age_category
          FROM "Employee" e
          LEFT JOIN "ManagerialPosition" mp ON e.managerial_position_id = mp.managerial_position_id
          WHERE 
            lower(e.company) = lower($2)
            AND (
              ($3 = 'Left Company' AND EXTRACT(YEAR FROM e.termination_date) = $1::int)
              OR
              ($3 = 'Joined Company' AND EXTRACT(YEAR FROM e.employment_date) = $1::int)
            )
          ORDER BY e.full_name;
        `;
      } else {
        query = `
          WITH employee_ages AS (
            SELECT 
              e.employee_id::text,
              e.full_name,
              e.birth_date,
              e.employment_date::text,
              CASE 
                WHEN e.termination_date IS NULL OR EXTRACT(YEAR FROM e.termination_date) > $1::int THEN 'Active'
                WHEN EXTRACT(YEAR FROM e.termination_date) = $1::int THEN e.termination_date::text
                ELSE NULL
              END as status,
              EXTRACT(YEAR FROM AGE(make_date($1::int, 12, 31), e.birth_date))::integer as age_in_year,
              mp.managerial_position = 'Yes' as is_manager
            FROM "Employee" e
            LEFT JOIN "ManagerialPosition" mp ON e.managerial_position_id = mp.managerial_position_id
            WHERE 
              lower(e.company) = lower($2)
              AND EXTRACT(YEAR FROM e.employment_date) <= $1::int
              AND (
                e.termination_date IS NULL 
                OR EXTRACT(YEAR FROM e.termination_date) >= $1::int
              )
          ),
          categorized_employees AS (
            SELECT *,
              CASE 
                WHEN $3 LIKE 'Managers%' THEN
                  CASE
                    WHEN age_in_year < 30 AND is_manager THEN 'Managers Under 30'
                    WHEN age_in_year BETWEEN 30 AND 50 AND is_manager THEN 'Managers 30-50'
                    WHEN age_in_year > 50 AND is_manager THEN 'Managers Over 50'
                  END
                ELSE
                  CASE
                    WHEN age_in_year < 30 THEN 'Under 30'
                    WHEN age_in_year BETWEEN 30 AND 50 THEN '30-50'
                    WHEN age_in_year > 50 THEN 'Over 50'
                  END
              END as age_category
            FROM employee_ages
            WHERE status IS NOT NULL
          )
          SELECT 
            employee_id,
            full_name,
            employment_date,
            status,
            age_in_year::text as age_in_year,
            is_manager,
            age_category
          FROM categorized_employees
          WHERE age_category = $3
          ORDER BY full_name;
        `;
      }

      const { rows } = await client.query<QueryRow>(query, [year, company, category]);
      
      const transformedRows: TransformedRow[] = rows.map(row => ({
        employee_id: row.employee_id,
        full_name: row.full_name,
        employment_date: row.employment_date,
        status: row.status,
        age_in_year: row.age_in_year,
        is_manager: row.is_manager,
        age_category: row.age_category,
        age_at_year: parseInt(row.age_in_year)
      }));

      return NextResponse.json(transformedRows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch employee details', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}