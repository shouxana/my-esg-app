import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

type FormattedData = {
  years: number[];
  fleetData: any[];
  emissionsData: {
    [year: number]: {
      name: string;
      value: number;
    }[];
  };
  yearlyEmissions: YearlyEmission[];
  vehicleTypes: string[];
  distanceData: {
    [year: number]: {
      [vehicleType: string]: number;
    };
  };
};

interface YearlyEmission {
  year: number;
  Total: number;
  [key: string]: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const company = searchParams.get('company');
    
    if (!company) {
      return NextResponse.json({ error: 'Company parameter is required' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const currentYear = new Date().getFullYear();
      const years = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear];

      const vehicleTypesQuery = `
        SELECT vehicle_type 
        FROM public."Vehicle_Type" 
        ORDER BY vehicle_type_id;
      `;

      const fleetQuery = `
        WITH last_four_years AS (
          SELECT generate_series($1, $1 + 3) AS year
        ),
        vehicle_types AS (
          SELECT vehicle_type_id, vehicle_type
          FROM public."Vehicle_Type"
        ),
        fleet_base AS (
          SELECT 
            vt.vehicle_type,
            lfy.year,
            COUNT(f.*) as count
          FROM last_four_years lfy
          CROSS JOIN vehicle_types vt
          LEFT JOIN public."Fleet" f ON 
            EXTRACT(YEAR FROM f.purchase_date)::integer <= lfy.year
            AND f.vehicle_type_id = vt.vehicle_type_id
            AND lower(f.company) = lower($2)
            AND (f.sale_date IS NULL OR EXTRACT(YEAR FROM f.sale_date)::integer >= lfy.year)
          GROUP BY vt.vehicle_type, lfy.year
          ORDER BY lfy.year, vt.vehicle_type
        )
        SELECT *
        FROM fleet_base;
      `;

      const emissionsQuery = `
        WITH last_four_years AS (
          SELECT generate_series($1, $1 + 3) AS year
        ),
        vehicle_types AS (
          SELECT vehicle_type_id, vehicle_type
          FROM public."Vehicle_Type"
        ),
        route_emissions AS (
          SELECT 
            EXTRACT(YEAR FROM r.information_dt)::integer as year,
            vt.vehicle_type,
            SUM(r.fuel_used * CASE 
              WHEN vt.vehicle_type = 'Diesel' THEN 2.68
              WHEN vt.vehicle_type = 'Petrol' THEN 2.31
              WHEN vt.vehicle_type = 'LNG' THEN 1.89
              ELSE 0
            END) as emissions
          FROM public."Routes" r
          JOIN public."Fleet" f ON r.vehicle_id = cast(f.vehicle_id as text)
          JOIN vehicle_types vt ON f.vehicle_type_id = vt.vehicle_type_id
          WHERE lower(f.company) = lower($2)
          GROUP BY EXTRACT(YEAR FROM r.information_dt), vt.vehicle_type
        )
        SELECT 
          lfy.year,
          vt.vehicle_type,
          COALESCE(ROUND(re.emissions::numeric, 2), 0) as emissions
        FROM last_four_years lfy
        CROSS JOIN vehicle_types vt
        LEFT JOIN route_emissions re ON re.year = lfy.year AND re.vehicle_type = vt.vehicle_type
        ORDER BY lfy.year, vt.vehicle_type;
      `;

      const distanceQuery = `
        WITH last_four_years AS (
          SELECT generate_series($1, $1 + 3) AS year
        ),
        vehicle_types AS (
          SELECT vehicle_type_id, vehicle_type
          FROM public."Vehicle_Type"
        ),
        yearly_distances AS (
          SELECT 
            EXTRACT(YEAR FROM r.information_dt)::integer as year,
            vt.vehicle_type,
            COALESCE(SUM(r.route_distance), 0) as total_distance
          FROM public."Routes" r
          JOIN public."Fleet" f ON r.vehicle_id = cast(f.vehicle_id as text)
          JOIN vehicle_types vt ON f.vehicle_type_id = vt.vehicle_type_id
          WHERE 
            lower(f.company) = lower($2)
            AND r.information_dt IS NOT NULL
            AND r.route_distance IS NOT NULL
          GROUP BY 
            EXTRACT(YEAR FROM r.information_dt),
            vt.vehicle_type
        )
        SELECT 
          lfy.year,
          vt.vehicle_type,
          COALESCE(ROUND(yd.total_distance::numeric, 2), 0) as distance
        FROM last_four_years lfy
        CROSS JOIN vehicle_types vt
        LEFT JOIN yearly_distances yd 
          ON yd.year = lfy.year 
          AND yd.vehicle_type = vt.vehicle_type
        ORDER BY lfy.year, vt.vehicle_type;
      `;

      console.log('Company:', company);
      console.log('Years:', years);

      const [vehicleTypesResult, fleetResult, emissionsResult, distanceResult] = await Promise.all([
        client.query(vehicleTypesQuery),
        client.query(fleetQuery, [years[0], company]),
        client.query(emissionsQuery, [years[0], company]),
        client.query(distanceQuery, [years[0], company])
      ]);

      console.log('Distance Result Rows:', distanceResult.rows);

      const formattedData: FormattedData = {
        years,
        fleetData: [],
        emissionsData: {},
        yearlyEmissions: [],
        vehicleTypes: vehicleTypesResult.rows.map(row => row.vehicle_type),
        distanceData: {}
      };

      // Format fleet data
      years.forEach(year => {
        const yearData = { year };
        formattedData.vehicleTypes.forEach(type => yearData[type] = 0);
        
        fleetResult.rows
          .filter(row => row.year === year)
          .forEach(row => {
            yearData[row.vehicle_type] = parseInt(row.count);
          });
        formattedData.fleetData.push(yearData);
      });

      // Format emissions data
      years.forEach(year => {
        formattedData.emissionsData[year] = formattedData.vehicleTypes.map(type => ({
          name: type,
          value: 0
        }));

        emissionsResult.rows
          .filter(row => row.year === year)
          .forEach(row => {
            const index = formattedData.vehicleTypes.indexOf(row.vehicle_type);
            if (index !== -1) {
              formattedData.emissionsData[year][index].value = parseFloat(row.emissions);
            }
          });
      });

      // Format yearly emissions
      years.forEach(year => {
        const yearData: YearlyEmission = { 
          year,
          Total: 0
        };
        
        formattedData.vehicleTypes.forEach(type => yearData[type] = 0);
        
        emissionsResult.rows
          .filter(row => row.year === year)
          .forEach(row => {
            yearData[row.vehicle_type] = parseFloat(row.emissions);
          });
        
        yearData.Total = Object.values(yearData)
          .filter(value => typeof value === 'number' && value !== year)
          .reduce((sum: number, value: number) => sum + value, 0);
        
        formattedData.yearlyEmissions.push(yearData);
      });

      // Format distance data
      years.forEach(year => {
        formattedData.distanceData[year] = {};
        
        // Initialize all vehicle types with zero
        vehicleTypesResult.rows.forEach(({ vehicle_type }) => {
          formattedData.distanceData[year][vehicle_type] = 0;
        });
        
        // Update with actual values
        distanceResult.rows
          .filter(row => row.year === year)
          .forEach(row => {
            formattedData.distanceData[year][row.vehicle_type] = parseFloat(row.distance) || 0;
          });
      });

      console.log('Formatted Distance Data:', formattedData.distanceData);

      return NextResponse.json(formattedData);

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emissions data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}