import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: 5432,
  database: process.env.POSTGRES_DATABASE,
});

type FormattedData = {
  labels: string[];
  years: number[];
  data: {
    [year: number]: {
      [education: string]: number;
    };
  };
};

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
    const result = await client.query(
      'SELECT education, education_id FROM "Education"'
    );
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear];

    const formattedData: FormattedData = {
      labels: result.rows.map(row => row.education),
      years: years,
      data: {}
    };

    years.forEach(year => {
      formattedData.data[year] = {};
      result.rows.forEach(row => {
        formattedData.data[year][row.education] = 0;
      });
    });

    const distributionQuery = `
      WITH last_four_years AS (
          SELECT generate_series($1, $1 + 3) AS year
      ),
      employee_base AS (
          SELECT
              emp.employee_id,
              year,
              emp.education_id as current_education_id
          FROM "Employee" emp
          CROSS JOIN last_four_years y
          WHERE 
              EXTRACT(YEAR FROM emp.employment_date)::integer <= y.year
              AND (emp.termination_date IS NULL OR EXTRACT(YEAR FROM emp.termination_date)::integer >= y.year)
              AND emp.company = $2  -- Add company filter here
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
          AND employee_id IN (SELECT employee_id FROM "Employee" WHERE company = $2)  -- Filter logs by company
          ORDER BY updated_at DESC
      ),
      employee_education_history AS (
          SELECT
              t1.employee_id,
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
      education_counts AS (
          SELECT 
              e.education,
              eeh.year,
              COUNT(eeh.employee_id) AS count
          FROM employee_education_history eeh
          JOIN "Education" e ON e.education_id = eeh.effective_education_id
          GROUP BY e.education, eeh.year
      ),
      yearly_totals AS (
          SELECT 
              year,
              SUM(count) AS total
          FROM education_counts
          GROUP BY year
      )
      SELECT
          ec.education,
          ec.year,
          ROUND((ec.count * 100.0 / NULLIF(yt.total, 0))::numeric, 1) AS percentage,
          ec.count
      FROM education_counts ec
      JOIN yearly_totals yt ON ec.year = yt.year
      ORDER BY ec.year, ec.education;
    `;

    const distributionResult = await client.query(distributionQuery, [years[0], company]);
    
    distributionResult.rows.forEach(row => {
      if (formattedData.data[row.year] && row.education) {
        formattedData.data[row.year][row.education] = parseFloat(row.percentage || 0);
      }
    });

    return NextResponse.json({
      ...formattedData,
      company // Include company in response
    });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch education distribution', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}