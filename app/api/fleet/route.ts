// app/api/fleet/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const requiredFields = ['registration_number', 'vehicle_type_id', 'company'];

    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Check for duplicate registration number
      const regCheck = await client.query(
        `SELECT vehicle_id FROM "Fleet" 
         WHERE lower(registration_number) = lower($1) AND lower(company) = lower($2)`,
        [body.registration_number, body.company]
      );

      if (regCheck.rows.length > 0) {
        return NextResponse.json({
          error: 'Registration number already exists',
          existing: regCheck.rows[0]
        }, { status: 409 });
      }

      const { rows } = await client.query(
        `INSERT INTO "Fleet" (
          registration_number,
          vehicle_type_id,
          production_date,
          purchase_date,
          sale_date,
          company,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3::DATE, $4::DATE, $5::DATE, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          body.registration_number,
          body.vehicle_type_id,
          body.production_date || null,
          body.purchase_date || null,
          body.sale_date || null,
          body.company
        ]
      );

      return NextResponse.json(rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create vehicle', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const company = searchParams.get('company');
    const vehicleId = searchParams.get('id');

    if (!company) {
      return NextResponse.json({ error: 'Company parameter is required' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      if (vehicleId) {
        const query = `
          SELECT 
            vehicle_id,
            registration_number,
            vehicle_type_id,
            production_date::text,
            purchase_date::text,
            sale_date::text,
            company
          FROM "Fleet"
          WHERE vehicle_id = $1 AND lower(company) = lower($2)
        `;
        const { rows } = await client.query(query, [vehicleId, company]);
        return NextResponse.json(rows[0] || null);
      }

      const query = `
        SELECT 
          vehicle_id,
          registration_number,
          vehicle_type_id,
          production_date::text,
          purchase_date::text,
          sale_date::text,
          company
        FROM "Fleet"
        WHERE lower(company) = lower($1)
        ORDER BY registration_number
      `;
      const { rows } = await client.query(query, [company]);
      return NextResponse.json(rows);
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch vehicles', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}