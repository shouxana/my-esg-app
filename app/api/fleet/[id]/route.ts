import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';  

interface LogEntry {
  field: string;
  oldValue: string | number | null;
  newValue: string | number | null;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  let client;
  try {
    const vehicleId = params.id;
    const body = await request.json();

    const formatDateForComparison = (date: string | Date | null) => {
      if (!date || date === '') return null;
      // Simply get YYYY-MM-DD part
      return date.toString().split('T')[0].split(' ')[0];
    };

    const formatDateForDB = (dateString: string) => {
      if (!dateString || dateString === '') return null;
      // Ensure consistent date format for DB
      return dateString.split('T')[0].split(' ')[0];
    };
    
    console.log('Update request details:', {
      vehicleId,
      body,
      url: request.url
    });

    client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (!body.company) {
        throw new Error('Company is required');
      }

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

      console.log('Current vehicle data:', currentDataResult.rows[0]);

      if (currentDataResult.rows.length === 0) {
        throw new Error(`Vehicle not found with id ${vehicleId} and company ${body.company}`);
      }

      const currentData = currentDataResult.rows[0];
      const logEntries: LogEntry[] = [];
      const updateValues: (string | number | null)[] = [];
      const updateFields: string[] = [];
      let valueIndex = 1;

      const dateFields = ['production_date', 'purchase_date', 'sale_date'];
      const regularFields = ['registration_number', 'vehicle_type_id'];

      // Handle date fields with improved comparison
      dateFields.forEach((field) => {
        if (body[field] !== undefined) {
          const currentDateStr = formatDateForComparison(currentData[field]);
          const newDateStr = formatDateForComparison(body[field]);

          if (newDateStr !== currentDateStr) {
            updateFields.push(`${field} = $${valueIndex}::date`);
            updateValues.push(formatDateForDB(body[field]));
            valueIndex++;

            logEntries.push({
              field,
              oldValue: currentDateStr,
              newValue: newDateStr,
            });
          }
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
            newValue: body[field],
          });
        }
      });

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      console.log('Update preparation:', {
        updateFields,
        updateValues,
        logEntries
      });

      if (updateFields.length > 1) {
        const updateQuery = `
          UPDATE "Fleet"
          SET ${updateFields.join(', ')}
          WHERE vehicle_id = $${valueIndex} AND company = $${valueIndex + 1}
          RETURNING 
            vehicle_id,
            registration_number,
            vehicle_type_id,
            TO_CHAR(production_date, 'YYYY-MM-DD') as production_date,
            TO_CHAR(purchase_date, 'YYYY-MM-DD') as purchase_date,
            TO_CHAR(sale_date, 'YYYY-MM-DD') as sale_date,
            company,
            created_at,
            updated_at`;

        console.log('Final update query:', {
          query: updateQuery,
          values: [...updateValues, vehicleId, body.company]
        });

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
      console.error('Database operation error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Request processing error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to update vehicle', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}