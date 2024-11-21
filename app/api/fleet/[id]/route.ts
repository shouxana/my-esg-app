// app/api/fleet/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';  

interface LogEntry {
  field: string;
  oldValue: string | number | null;
  newValue: string | number | null;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const vehicleId = params.id;
    const body = await request.json();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const currentDataResult = await client.query(
        `SELECT 
          vehicle_id,
          registration_number,
          vehicle_type_id,
          TO_CHAR(production_date, 'YYYY-MM-DD') as production_date,
          TO_CHAR(purchase_date, 'YYYY-MM-DD') as purchase_date,
          TO_CHAR(sale_date, 'YYYY-MM-DD') as sale_date,
          company
        FROM "Fleet" 
        WHERE vehicle_id = $1 AND company = $2`,
        [vehicleId, body.company]
      );

      if (currentDataResult.rows.length === 0) {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      }

      const currentData = currentDataResult.rows[0];
      const logEntries: LogEntry[] = [];
      const updateValues: (string | number | null)[] = [];
      const updateFields: string[] = [];
      let valueIndex = 1;

      const dateFields = ['production_date', 'purchase_date', 'sale_date'];
      const regularFields = ['registration_number', 'vehicle_type_id'];

      // Handle date fields
      dateFields.forEach((field) => {
        if (body[field] !== undefined && body[field] !== currentData[field]) {
          updateFields.push(`${field} = $${valueIndex}::date`);
          updateValues.push(body[field] || null);
          valueIndex++;

          logEntries.push({
            field,
            oldValue: currentData[field],
            newValue: body[field]
          });
        }
      });

      // Handle regular fields
      regularFields.forEach((field) => {
        if (body[field] !== undefined && body[field] !== currentData[field]) {
          updateFields.push(`${field} = $${valueIndex}`);
          updateValues.push(body[field]);
          valueIndex++;

          logEntries.push({
            field,
            oldValue: currentData[field],
            newValue: body[field]
          });
        }
      });

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      if (updateFields.length > 1) {
        const updateQuery = `
          UPDATE "Fleet"
          SET ${updateFields.join(', ')}
          WHERE vehicle_id = $${valueIndex} AND company = $${valueIndex + 1}
          RETURNING *`;

        const { rows } = await client.query(updateQuery, [
          ...updateValues,
          vehicleId,
          body.company,
        ]);

        // Log the changes
        for (const entry of logEntries) {
          await client.query(
            `INSERT INTO "FleetUpdateLog" (
              vehicle_id,
              changed_field,
              old_value,
              new_value,
              updated_at
            ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
            [
              vehicleId,
              entry.field,
              entry.oldValue?.toString() || '',
              entry.newValue?.toString() || '',
            ]
          );
        }

        await client.query('COMMIT');
        return NextResponse.json(rows[0]);
      }

      await client.query('COMMIT');
      return NextResponse.json(currentData);
    } catch (error) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Failed to update vehicle', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}