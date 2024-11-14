import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get('company');
  const year = searchParams.get('year');
  const category = searchParams.get('category');

  if (!company || !year || !category) {
    return NextResponse.json(
      { error: 'Company, year, and category parameters are required' },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    let query;
    
    if (category === 'Left Company') {
      // Special query for employees who left in the specified year
      query = `
        SELECT
          employee_id,
          full_name,
          TO_CHAR(employment_date, 'YYYY-MM-DD') as employment_date,
          CASE 
            WHEN termination_date IS NULL THEN 'Active'
            ELSE termination_date -- Always return 'Active' regardless of termination status
          END as status
        FROM "Employee"
        WHERE 
          LOWER(company) = LOWER($1)
          AND EXTRACT(YEAR FROM termination_date)::integer = $2::integer
        ORDER BY full_name;
      `;
      
      const { rows } = await client.query(query, [company, year]);
      return NextResponse.json(rows);
    } 
    else if (category === 'Joined Company') {
      // Special query for employees who joined in the specified year
      query = `
        SELECT
          employee_id,
          full_name,
          TO_CHAR(employment_date, 'YYYY-MM-DD') as employment_date,
          CASE 
            WHEN termination_date IS NULL THEN 'Active'
            ELSE TO_CHAR(termination_date, 'YYYY-MM-DD')
          END as status
        FROM "Employee"
        WHERE 
          LOWER(company) = LOWER($1)
          AND EXTRACT(YEAR FROM employment_date)::integer = $2::integer
        ORDER BY full_name;
      `;
      
      const { rows } = await client.query(query, [company, year]);
      return NextResponse.json(rows);
    }
    else {
      // Regular age-based categories
      query = `
        WITH employee_base AS (
          SELECT
            emp.employee_id,
            emp.full_name,
            TO_CHAR(emp.employment_date, 'YYYY-MM-DD') as employment_date,
            CASE 
              WHEN emp.termination_date IS NULL THEN 'Active'
              ELSE TO_CHAR(emp.termination_date, 'YYYY-MM-DD')
            END as status,
            emp.birth_date,
            mp.managerial_position = 'Y' as is_manager
          FROM "Employee" emp
          LEFT JOIN "ManagerialPosition" mp ON emp.managerial_position_id = mp.managerial_position_id
          WHERE 
            LOWER(emp.company) = LOWER($1)
            AND EXTRACT(YEAR FROM emp.employment_date)::integer <= $2
            AND (emp.termination_date IS NULL OR EXTRACT(YEAR FROM emp.termination_date)::integer >= $2)
        ),
        categorized_employees AS (
          SELECT
            employee_id,
            full_name,
            employment_date,
            status,
            CASE
              WHEN is_manager AND EXTRACT(YEAR FROM AGE(MAKE_DATE($2::integer, 12, 31), birth_date)) < 30 
                THEN 'Managers Under 30'
              WHEN is_manager AND EXTRACT(YEAR FROM AGE(MAKE_DATE($2::integer, 12, 31), birth_date)) BETWEEN 30 AND 49 
                THEN 'Managers 30-50'
              WHEN is_manager AND EXTRACT(YEAR FROM AGE(MAKE_DATE($2::integer, 12, 31), birth_date)) >= 50 
                THEN 'Managers Over 50'
              WHEN EXTRACT(YEAR FROM AGE(MAKE_DATE($2::integer, 12, 31), birth_date)) < 30 
                THEN 'Under 30'
              WHEN EXTRACT(YEAR FROM AGE(MAKE_DATE($2::integer, 12, 31), birth_date)) BETWEEN 30 AND 49 
                THEN '30-50'
              ELSE 'Over 50'
            END as category
          FROM employee_base
        )
        SELECT 
          employee_id,
          full_name,
          employment_date,
          status
        FROM categorized_employees
        WHERE category = $3
        ORDER BY full_name;
      `;
      
      const { rows } = await client.query(query, [company, year, category]);
      return NextResponse.json(rows);
    }
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch detailed fluctuation data' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}