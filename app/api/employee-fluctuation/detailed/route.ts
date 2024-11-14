import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Add these export configurations
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
      WITH last_four_years AS (
          SELECT generate_series($1, $1 + 3) AS year
      ),
      employee_base AS (
          SELECT
              emp.employee_id,
              emp.full_name,
              TO_CHAR(emp.employment_date, 'YYYY-MM-DD') as employment_date,
              TO_CHAR(emp.termination_date, 'YYYY-MM-DD') as termination_date,
              CASE 
                  WHEN emp.termination_date IS NULL THEN 'Active'
                  ELSE TO_CHAR(emp.termination_date, 'YYYY-MM-DD')
              END as status,
              emp.birth_date,
              mp.managerial_position = 'Y' as is_manager,
              year
          FROM "Employee" emp
          CROSS JOIN last_four_years y
          LEFT JOIN "ManagerialPosition" mp ON emp.managerial_position_id = mp.managerial_position_id
          WHERE 
              EXTRACT(YEAR FROM emp.employment_date)::integer <= y.year
              AND (emp.termination_date IS NULL OR EXTRACT(YEAR FROM emp.termination_date)::integer >= y.year)
              AND LOWER(emp.company) = LOWER($2)
      ),
      age_categories AS (
          SELECT
              eb.*,
              CASE
                  WHEN eb.is_manager AND EXTRACT(YEAR FROM AGE(MAKE_DATE(eb.year, 12, 31), eb.birth_date)) < 30 
                    THEN 'Managers Under 30'
                  WHEN eb.is_manager AND EXTRACT(YEAR FROM AGE(MAKE_DATE(eb.year, 12, 31), eb.birth_date)) BETWEEN 30 AND 49 
                    THEN 'Managers 30-50'
                  WHEN eb.is_manager AND EXTRACT(YEAR FROM AGE(MAKE_DATE(eb.year, 12, 31), eb.birth_date)) >= 50 
                    THEN 'Managers Over 50'
                  WHEN EXTRACT(YEAR FROM AGE(MAKE_DATE(eb.year, 12, 31), eb.birth_date)) < 30 
                    THEN 'Under 30'
                  WHEN EXTRACT(YEAR FROM AGE(MAKE_DATE(eb.year, 12, 31), eb.birth_date)) BETWEEN 30 AND 49 
                    THEN '30-50'
                  ELSE 'Over 50'
              END as age_category
          FROM employee_base eb
      ),
      final_data AS (
          SELECT
              employee_id,
              full_name,
              MIN(employment_date) as employment_date,
              MIN(termination_date) as termination_date,
              MIN(status) as status,
              MAX(CASE WHEN year = $1 THEN age_category END) as age_group_2021,
              MAX(CASE WHEN year = $1 + 1 THEN age_category END) as age_group_2022,
              MAX(CASE WHEN year = $1 + 2 THEN age_category END) as age_group_2023,
              MAX(CASE WHEN year = $1 + 3 THEN age_category END) as age_group_2024
          FROM age_categories
          GROUP BY employee_id, full_name
      )
      SELECT 
          *,
          $2 as company
      FROM final_data
      ORDER BY full_name;
    `;

    const { rows } = await client.query(query, [years[0], company]);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch detailed fluctuation data', 
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}