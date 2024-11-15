import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

interface LogEntry {
  field: string;
  oldValue: string | number | null;
  newValue: string | number | null;
}

type Props = {
  params: {
    id: string;
  };
};

export async function PUT(request: NextRequest, props: Props) {
  try {
    const employeeId = props.params.id;
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

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Use TO_CHAR for consistent date formatting in the SELECT
      const currentDataResult = await client.query(
        `SELECT 
          employee_id,
          full_name,
          employee_mail,
          TO_CHAR(birth_date, 'YYYY-MM-DD') as birth_date,
          TO_CHAR(employment_date, 'YYYY-MM-DD') as employment_date,
          TO_CHAR(termination_date, 'YYYY-MM-DD') as termination_date,
          TO_CHAR(leave_date_start, 'YYYY-MM-DD') as leave_date_start,
          TO_CHAR(leave_date_end, 'YYYY-MM-DD') as leave_date_end,
          position_id,
          education_id,
          marital_status_id,
          gender_id,
          managerial_position_id,
          company,
          created_at,
          updated_at
        FROM "Employee" 
        WHERE employee_id = $1 AND company = $2`,
        [employeeId, body.company]
      );

      if (currentDataResult.rows.length === 0) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }

      const currentData = currentDataResult.rows[0];

      const logEntries: LogEntry[] = [];
      const updateValues: (string | number | null)[] = [];
      const updateFields: string[] = [];
      let valueIndex = 1;

      const dateFields = ['birth_date', 'employment_date', 'termination_date', 'leave_date_start', 'leave_date_end'];
      const regularFields = [
        'full_name',
        'employee_mail',
        'position_id',
        'education_id',
        'marital_status_id',
        'gender_id',
        'managerial_position_id',
      ];

      // Handle date fields
      dateFields.forEach((field) => {
        if (body[field] !== undefined) {
          const currentDateStr = formatDateForComparison(currentData[field]);
          const newDateStr = formatDateForComparison(body[field]);

          if (newDateStr !== currentDateStr) {
            // For dates, use PostgreSQL's date type casting
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

      if (updateFields.length > 1) {
        // Use TO_CHAR in the RETURNING clause for consistent date formatting
        const updateQuery = `
          UPDATE "Employee"
          SET ${updateFields.join(', ')}
          WHERE employee_id = $${valueIndex} AND company = $${valueIndex + 1}
          RETURNING 
            employee_id,
            full_name,
            employee_mail,
            TO_CHAR(birth_date, 'YYYY-MM-DD') as birth_date,
            TO_CHAR(employment_date, 'YYYY-MM-DD') as employment_date,
            TO_CHAR(termination_date, 'YYYY-MM-DD') as termination_date,
            TO_CHAR(leave_date_start, 'YYYY-MM-DD') as leave_date_start,
            TO_CHAR(leave_date_end, 'YYYY-MM-DD') as leave_date_end,
            position_id,
            education_id,
            marital_status_id,
            gender_id,
            managerial_position_id,
            company,
            created_at,
            updated_at
        `;

        const { rows } = await client.query(updateQuery, [
          ...updateValues,
          employeeId,
          body.company,
        ]);

        // Log the changes
        for (const entry of logEntries) {
          await client.query(
            `INSERT INTO "EmployeeUpdateLog" (
              employee_id,
              changed_field,
              old_value,
              new_value,
              updated_at
            ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
            [
              employeeId,
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
      console.error('Database error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to update employee', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Request error:', error);
    return NextResponse.json(
      { 
        error: 'Invalid request', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 400 }
    );
  }
}