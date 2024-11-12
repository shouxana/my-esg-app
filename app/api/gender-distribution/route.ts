import { NextResponse } from 'next/server';
import pool from '@/lib/db';

type FormattedData = {
  years: number[];
  data: {
    [year: number]: {
      Male: number;
      Female: number;
      FemaleManagers: number;
      MaleCount: number;
      FemaleCount: number;
      FemaleManagerCount: number;
    };
  };
  managerData: {
    [year: number]: {
      Male: number;
      Female: number;
      MaleCount: number;
      FemaleCount: number;
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
    // First get current year and years array
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear];

    // Initialize the formatted data structure
    const formattedData: FormattedData = {
      years: years,
      data: {},
      managerData: {}
    };

    // Initialize default values
    years.forEach(year => {
      formattedData.data[year] = {
        Male: 0,
        Female: 0,
        FemaleManagers: 0,
        MaleCount: 0,
        FemaleCount: 0,
        FemaleManagerCount: 0
      };
      formattedData.managerData[year] = {
        Male: 0,
        Female: 0,
        MaleCount: 0,
        FemaleCount: 0
      };
    });

    // Modified query to ensure company filtering is applied at each step
    const distributionQuery = `
      WITH last_four_years AS (
          SELECT generate_series($1, $1 + 3) AS year
      ),
      company_employees AS (
          SELECT employee_id, gender_id, managerial_position_id
          FROM "Employee"
          WHERE company = $2
      ),
      employee_base AS (
          SELECT
              ce.employee_id,
              year,
              ce.gender_id as current_gender_id,
              ce.managerial_position_id as current_managerial_position_id
          FROM company_employees ce
          CROSS JOIN last_four_years y
          WHERE EXISTS (
              SELECT 1 FROM "Employee" e
              WHERE e.employee_id = ce.employee_id
              AND EXTRACT(YEAR FROM e.employment_date)::integer <= y.year
              AND (e.termination_date IS NULL OR EXTRACT(YEAR FROM e.termination_date)::integer >= y.year)
          )
          ORDER BY ce.employee_id, year
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
          AND employee_id IN (SELECT employee_id FROM company_employees)
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
          AND employee_id IN (SELECT employee_id FROM company_employees)
          ORDER BY updated_at DESC
      ),
      employee_history AS (
          SELECT
              t1.employee_id,
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
      gender_counts AS (
          SELECT 
              g.gender,
              eh.year,
              COUNT(eh.employee_id) AS count,
              SUM(CASE WHEN mp.managerial_position = 'Yes' THEN 1 ELSE 0 END) AS manager_count
          FROM employee_history eh
          JOIN "Gender" g ON g.gender_id = eh.effective_gender_id
          LEFT JOIN "ManagerialPosition" mp ON eh.effective_managerial_position_id = mp.managerial_position_id
          GROUP BY g.gender, eh.year
      ),
      yearly_totals AS (
          SELECT year, SUM(count) AS total 
          FROM gender_counts 
          GROUP BY year
      )
      SELECT
          gc.gender,
          gc.year,
          gc.count,
          gc.manager_count,
          ROUND((gc.count * 100.0 / NULLIF(yt.total, 0))::numeric, 1) AS percentage,
          ROUND((gc.manager_count * 100.0 / NULLIF(gc.count, 0))::numeric, 1) AS manager_percentage
      FROM gender_counts gc
      JOIN yearly_totals yt ON gc.year = yt.year
      ORDER BY gc.year, gc.gender;
    `;

    console.log('Executing query for company:', company);
    const result = await client.query(distributionQuery, [years[0], company]);
    console.log('Query result rows:', result.rows.length);

    result.rows.forEach(row => {
      if (formattedData.data[row.year] && row.gender) {
        const genderKey = row.gender as 'Male' | 'Female';
        formattedData.data[row.year][genderKey] = parseFloat(row.percentage || 0);

        if (genderKey === 'Male') {
          formattedData.data[row.year].MaleCount = parseInt(row.count);
        } else if (genderKey === 'Female') {
          formattedData.data[row.year].FemaleCount = parseInt(row.count);
          formattedData.data[row.year].FemaleManagers = parseFloat(row.manager_percentage || 0);
          formattedData.data[row.year].FemaleManagerCount = parseInt(row.manager_count);
        }

        if (row.manager_count > 0) {
          const totalManagers = result.rows
            .filter(r => r.year === row.year)
            .reduce((sum, r) => sum + (r.manager_count || 0), 0);

          formattedData.managerData[row.year][genderKey] = parseFloat(
            ((row.manager_count / totalManagers) * 100).toFixed(1)
          );

          if (genderKey === 'Male') {
            formattedData.managerData[row.year].MaleCount = parseInt(row.manager_count);
          } else if (genderKey === 'Female') {
            formattedData.managerData[row.year].FemaleCount = parseInt(row.manager_count);
          }
        }
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
        error: 'Failed to fetch gender distribution', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}