import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: 5432,
  database: process.env.POSTGRES_DATABASE
});

export async function GET() {
  const client = await pool.connect();
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
        emp.gender_id as current_gender_id,
        emp.managerial_position_id as current_managerial_position_id
    FROM "Employee" emp
    CROSS JOIN last_four_years y
    WHERE 
        EXTRACT(YEAR FROM emp.employment_date)::integer <= y.year
        AND (emp.termination_date IS NULL OR EXTRACT(YEAR FROM emp.termination_date)::integer >= y.year)
    ORDER BY emp.employee_id, year
),
gender_updates AS (
    SELECT 
        employee_id,
        EXTRACT(YEAR FROM updated_at)::integer as update_year,
        old_value,
        new_value,
        updated_at
    FROM "EmployeeUpdateLog"
    WHERE changed_field = 'gender_id'
    ORDER BY updated_at DESC
),
manager_updates AS (
    SELECT 
        employee_id,
        EXTRACT(YEAR FROM updated_at)::integer as update_year,
        old_value,
        new_value,
        updated_at
    FROM "EmployeeUpdateLog"
    WHERE changed_field = 'managerial_position_id'
    ORDER BY updated_at DESC
),
employee_history AS (
    SELECT
        t1.employee_id,
        t1.full_name,
        t1.employment_date,
        t1.status,
        t1.year,
        CASE
            WHEN EXISTS (SELECT 1 FROM gender_updates gu 
                        WHERE gu.employee_id = t1.employee_id 
                        AND gu.update_year > t1.year) 
            THEN (
                SELECT gu.old_value
                FROM gender_updates gu
                WHERE gu.employee_id = t1.employee_id
                AND gu.update_year > t1.year
                ORDER BY gu.updated_at ASC
                LIMIT 1
            )
            ELSE t1.current_gender_id
        END as effective_gender_id,
        CASE
            WHEN EXISTS (SELECT 1 FROM manager_updates mu 
                        WHERE mu.employee_id = t1.employee_id 
                        AND mu.update_year > t1.year) 
            THEN (
                SELECT mu.old_value
                FROM manager_updates mu
                WHERE mu.employee_id = t1.employee_id
                AND mu.update_year > t1.year
                ORDER BY mu.updated_at ASC
                LIMIT 1
            )
            ELSE t1.current_managerial_position_id
        END as effective_managerial_position_id
    FROM employee_base t1
),
yearly_data AS (
    SELECT
        eh.employee_id,
        eh.full_name,
        eh.employment_date,
        eh.status,
        eh.year,
        g.gender as gender_value,
        CASE 
            WHEN mp.managerial_position = 'Yes' THEN 'Manager'
            ELSE 'Employee'
        END as position_value
    FROM employee_history eh
    JOIN "Gender" g ON g.gender_id = eh.effective_gender_id
    JOIN "ManagerialPosition" mp ON mp.managerial_position_id = eh.effective_managerial_position_id
),
final_data AS (
    SELECT
        employee_id,
        full_name,
        MIN(employment_date) as employment_date,
        MIN(status) as status,
        MAX(CASE WHEN year = $1 THEN gender_value || ' / ' || position_value END) as gender_2021,
        MAX(CASE WHEN year = $1 + 1 THEN gender_value || ' / ' || position_value END) as gender_2022,
        MAX(CASE WHEN year = $1 + 2 THEN gender_value || ' / ' || position_value END) as gender_2023,
        MAX(CASE WHEN year = $1 + 3 THEN gender_value || ' / ' || position_value END) as gender_2024
    FROM yearly_data
    GROUP BY employee_id, full_name
)
SELECT *
FROM final_data
ORDER BY full_name;
    `;

    const { rows } = await client.query(query, [years[0]]);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch detailed gender distribution', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}