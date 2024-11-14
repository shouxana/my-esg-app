// app/api/employee-fluctuation/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

type FluctuationData = {
  categories: string[];
  years: number[];
  data: {
    [year: number]: {
      [category: string]: number;
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
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear];

    // These are our fixed categories that we're tracking
    const categories = [
      'Under 30',
      '30-50',
      'Over 50',
      'Managers Under 30',
      'Managers 30-50',
      'Managers Over 50',
      'Left Company',
      'Joined Company'
    ];

    const formattedData: FluctuationData = {
      categories: categories,
      years: years,
      data: {}
    };

    years.forEach(year => {
      formattedData.data[year] = {};
      categories.forEach(category => {
        formattedData.data[year][category] = 0;
      });
    });

    const fluctuationQuery = `
      WITH last_four_years AS (
          SELECT generate_series($1, $1 + 3) AS year
      ),
      employee_base AS (
          SELECT
              emp.employee_id,
              EXTRACT(YEAR FROM AGE(MAKE_DATE(y.year, 12, 31), emp.birth_date)) as age_at_year,
              mp.managerial_position = 'Y' as is_manager,
              EXTRACT(YEAR FROM emp.employment_date)::integer = y.year as joined_in_year,
              EXTRACT(YEAR FROM emp.termination_date)::integer = y.year as left_in_year,
              y.year
          FROM "Employee" emp
          CROSS JOIN last_four_years y
          LEFT JOIN "ManagerialPosition" mp ON emp.managerial_position_id = mp.managerial_position_id
          WHERE 
              EXTRACT(YEAR FROM emp.employment_date)::integer <= y.year
              AND (emp.termination_date IS NULL OR EXTRACT(YEAR FROM emp.termination_date)::integer >= y.year)
              AND LOWER(emp.company) = LOWER($2)
      ),
      yearly_counts AS (
          SELECT
              year,
              COUNT(*) as total_employees,
              COUNT(CASE WHEN age_at_year < 30 THEN 1 END) as under_30,
              COUNT(CASE WHEN age_at_year >= 30 AND age_at_year < 50 THEN 1 END) as between_30_50,
              COUNT(CASE WHEN age_at_year >= 50 THEN 1 END) as over_50,
              COUNT(CASE WHEN is_manager AND age_at_year < 30 THEN 1 END) as managers_under_30,
              COUNT(CASE WHEN is_manager AND age_at_year >= 30 AND age_at_year < 50 THEN 1 END) as managers_30_50,
              COUNT(CASE WHEN is_manager AND age_at_year >= 50 THEN 1 END) as managers_over_50,
              COUNT(CASE WHEN left_in_year THEN 1 END) as left_company,
              COUNT(CASE WHEN joined_in_year THEN 1 END) as joined_company
          FROM employee_base
          GROUP BY year
      )
      SELECT
          year,
          ROUND((under_30 * 100.0 / NULLIF(total_employees, 0))::numeric, 1) as under_30_pct,
          ROUND((between_30_50 * 100.0 / NULLIF(total_employees, 0))::numeric, 1) as between_30_50_pct,
          ROUND((over_50 * 100.0 / NULLIF(total_employees, 0))::numeric, 1) as over_50_pct,
          ROUND((managers_under_30 * 100.0 / NULLIF(total_employees, 0))::numeric, 1) as managers_under_30_pct,
          ROUND((managers_30_50 * 100.0 / NULLIF(total_employees, 0))::numeric, 1) as managers_30_50_pct,
          ROUND((managers_over_50 * 100.0 / NULLIF(total_employees, 0))::numeric, 1) as managers_over_50_pct,
          ROUND((left_company * 100.0 / NULLIF(total_employees, 0))::numeric, 1) as left_company_pct,
          ROUND((joined_company * 100.0 / NULLIF(total_employees, 0))::numeric, 1) as joined_company_pct
      FROM yearly_counts
      ORDER BY year;
    `;

    const fluctuationResult = await client.query(fluctuationQuery, [years[0], company]);
    
    fluctuationResult.rows.forEach(row => {
      formattedData.data[row.year] = {
        'Under 30': parseFloat(row.under_30_pct || 0),
        '30-50': parseFloat(row.between_30_50_pct || 0),
        'Over 50': parseFloat(row.over_50_pct || 0),
        'Managers Under 30': parseFloat(row.managers_under_30_pct || 0),
        'Managers 30-50': parseFloat(row.managers_30_50_pct || 0),
        'Managers Over 50': parseFloat(row.managers_over_50_pct || 0),
        'Left Company': parseFloat(row.left_company_pct || 0),
        'Joined Company': parseFloat(row.joined_company_pct || 0)
      };
    });

    return NextResponse.json({
      ...formattedData,
      company
    });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch employee fluctuation data', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}