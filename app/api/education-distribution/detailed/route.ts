import { NextResponse } from 'next/server';
import { Pool } from 'pg'; // Ensure this is correctly imported

// Initialize the Pool instance correctly
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: 5432,
  database: process.env.POSTGRES_DATABASE,
});

export async function GET(request: Request) {
  const client = await pool.connect(); // Ensure pool is accessible here

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
              CASE 
                  WHEN emp.termination_date IS NULL THEN 'Active'
                  ELSE TO_CHAR(emp.termination_date, 'YYYY-MM-DD')
              END as status,
              year,
              emp.education_id as current_education_id
          FROM "Employee" emp
          CROSS JOIN last_four_years y
          WHERE 
              EXTRACT(YEAR FROM emp.employment_date)::integer <= y.year
              AND (emp.termination_date IS NULL OR EXTRACT(YEAR FROM emp.termination_date)::integer >= y.year)
              AND LOWER(emp.company) = LOWER($2)
          ORDER BY emp.employee_id, year
      ),
      education_updates AS (
          SELECT 
              employee_id,
              EXTRACT(YEAR FROM updated_at)::integer as update_year,
              old_value,
              new_value,
              updated_at
          FROM "EmployeeUpdateLog"
          WHERE changed_field = 'education_id'
          ORDER BY updated_at DESC
      ),
      employee_education_history AS (
          SELECT
              t1.employee_id,
              t1.full_name,
              t1.employment_date,
              t1.status,
              t1.year,
              CASE
                  WHEN EXISTS (SELECT 1 FROM education_updates eu 
                             WHERE eu.employee_id = t1.employee_id 
                             AND eu.update_year > t1.year) 
                  THEN (
                      SELECT eu.old_value
                      FROM education_updates eu
                      WHERE eu.employee_id = t1.employee_id
                      AND eu.update_year > t1.year
                      ORDER BY eu.updated_at ASC
                      LIMIT 1
                  )
                  ELSE t1.current_education_id
              END as effective_education_id
          FROM employee_base t1
      ),
      yearly_education AS (
          SELECT
              eh.employee_id,
              eh.full_name,
              eh.employment_date,
              eh.status,
              eh.year,
              e.education as education_level
          FROM employee_education_history eh
          JOIN "Education" e ON e.education_id = eh.effective_education_id
      ),
      final_data AS (
          SELECT
              employee_id,
              full_name,
              MIN(employment_date) as employment_date,
              MIN(status) as status,
              MAX(CASE WHEN year = $1 THEN education_level END) as education_2021,
              MAX(CASE WHEN year = $1 + 1 THEN education_level END) as education_2022,
              MAX(CASE WHEN year = $1 + 2 THEN education_level END) as education_2023,
              MAX(CASE WHEN year = $1 + 3 THEN education_level END) as education_2024
          FROM yearly_education
          GROUP BY employee_id, full_name
      )
      SELECT *
      FROM final_data
      ORDER BY full_name;
    `;

    const { rows } = await client.query(query, [years[0], company]);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch detailed education distribution', 
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
