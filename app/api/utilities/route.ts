import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const company = searchParams.get('company');
    
    if (!company) {
      return NextResponse.json({ error: 'Company parameter is required' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      // First, verify utility types in the database
      const utilityTypesQuery = `
        SELECT utility_type_id, utility_type 
        FROM public."Utilities"
        ORDER BY utility_type_id;
      `;

      const utilityTypes = await client.query(utilityTypesQuery);
      console.log('Available utility types:', utilityTypes.rows);

      // Get monthly consumption data
      const consumptionQuery = `
        WITH date_series AS (
          SELECT generate_series(
            '2021-01-01'::date,
            CURRENT_DATE,
            '1 month'::interval
          )::date as month
        ),
        consumption_data AS (
          SELECT 
            date_trunc('month', b.bill_date)::date as month,
            u.utility_type,
            SUM(b.consumption_amt) as consumption,
            SUM(b.value_amt) as cost
          FROM public."Bills" b
          JOIN public."Utilities" u ON b.utility_type_id = u.utility_type_id
          WHERE b.bill_date >= '2021-01-01'
          GROUP BY date_trunc('month', b.bill_date), u.utility_type
        )
        SELECT 
          to_char(ds.month, 'YYYY-MM') as month,
          ut.utility_type,
          COALESCE(cd.consumption, 0) as consumption,
          COALESCE(cd.cost, 0) as cost
        FROM date_series ds
        CROSS JOIN (
          SELECT DISTINCT utility_type 
          FROM public."Utilities"
        ) ut
        LEFT JOIN consumption_data cd 
          ON date_trunc('month', ds.month) = cd.month 
          AND cd.utility_type = ut.utility_type
        ORDER BY ds.month, ut.utility_type;
      `;

      // Get employee count per month
      const employeeCountQuery = `
        WITH date_series AS (
          SELECT generate_series(
            '2021-01-01'::date,
            CURRENT_DATE,
            '1 month'::interval
          )::date as month
        )
        SELECT 
          date_trunc('month', ds.month)::date as month,
          COUNT(DISTINCT e.employee_id) as employee_count
        FROM date_series ds
        LEFT JOIN "Employee" e ON 
          e.company = $1 AND
          e.employment_date <= ds.month AND
          (e.termination_date IS NULL OR e.termination_date > ds.month)
        GROUP BY date_trunc('month', ds.month)
        ORDER BY month;
      `;

      // Execute queries in parallel
      const [consumptionResult, employeeCountResult] = await Promise.all([
        client.query(consumptionQuery),
        client.query(employeeCountQuery, [company])
      ]);

      // Create employee count lookup
      const employeeCounts = employeeCountResult.rows.reduce((acc, row) => {
        acc[row.month] = parseInt(row.employee_count) || 0;
        return acc;
      }, {});

      // Get the latest employee count
      const latestEmployeeCount = employeeCountResult.rows
        .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())[0]?.employee_count || 0;

      // Transform data for the frontend
      const utilityData = {
        electricity: [],
        water: [],
        gas: [],
        employeeCount: latestEmployeeCount
      };

      // Group consumption data by month first
      const groupedData = consumptionResult.rows.reduce((acc, row) => {
        if (!acc[row.month]) {
          acc[row.month] = {};
        }
        acc[row.month][row.utility_type] = {
          consumption: parseFloat(row.consumption) || 0,
          cost: parseFloat(row.cost) || 0
        };
        return acc;
      }, {});

      // Create data points for each month
      Object.entries(groupedData)
        .sort(([monthA], [monthB]) => new Date(monthA).getTime() - new Date(monthB).getTime())
        .forEach(([month, utilities]) => {
          const employeeCount = employeeCounts[month] || latestEmployeeCount;

          // Process each utility type
          Object.entries(utilities).forEach(([utilityType, data]) => {
            const dataPoint = {
              month,
              value: data.consumption,
              cost: data.cost,
              costPerEmployee: employeeCount > 0 ? data.cost / employeeCount : 0
            };

            switch (utilityType) {
              case 'Electricity':
                utilityData.electricity.push(dataPoint);
                break;
              case 'Water':
                utilityData.water.push(dataPoint);
                break;
              case 'Gas\\Heating':
              case 'Gas':
                utilityData.gas.push(dataPoint);
                break;
            }
          });
        });

      // Log data counts for debugging
      console.log('Data points per utility:', {
        electricity: utilityData.electricity.length,
        water: utilityData.water.length,
        gas: utilityData.gas.length,
        employeeCount: utilityData.employeeCount
      });

      return NextResponse.json(utilityData);

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch utility data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}