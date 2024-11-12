// app/api/employees/[id]/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employeeId = params.id;
    const body = await request.json();

    const formatDate = (dateString: string) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };s

    const client = await pool.connect();
    try {
      // Start transaction
      await client.query('BEGIN');

      // Get current employee data
      const currentDataResult = await client.query(
        'SELECT * FROM "Employee" WHERE employee_id = $1 AND company = $2',
        [employeeId, session.user.company]
      );

      if (currentDataResult.rows.length === 0) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }

      const currentData = currentDataResult.rows[0];
      const updates = [];
      const logEntries = [];

      // Format dates
      if (body.birth_date) body.birth_date = formatDate(body.birth_date);
      if (body.employment_date) body.employment_date = formatDate(body.employment_date);
      if (body.termination_date) body.termination_date = formatDate(body.termination_date);

      // Check each field for changes and build update query
      const fields = [
        'full_name', 'employee_mail', 'birth_date', 'employment_date',
        'termination_date', 'position_id', 'education_id', 'marital_status_id',
        'gender_id', 'managerial_position_id'
      ];

      const updateValues = [];
      const updateFields = [];
      let valueIndex = 1;

      fields.forEach(field => {
        if (body[field] !== undefined && body[field] !== currentData[field]) {
          updateFields.push(`${field} = $${valueIndex}`);
          updateValues.push(body[field]);
          valueIndex++;

          // Log the change
          logEntries.push({
            field,
            oldValue: currentData[field],
            newValue: body[field]
          });
        }
      });

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      if (updateFields.length > 1) { // > 1 because we always add updated_at
        const updateQuery = `
          UPDATE "Employee"
          SET ${updateFields.join(', ')}
          WHERE employee_id = $${valueIndex} AND company = $${valueIndex + 1}
          RETURNING *
        `;

        const { rows } = await client.query(
          updateQuery,
          [...updateValues, employeeId, session.user.company]
        );

        // Insert log entries
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
              entry.oldValue?.toString(),
              entry.newValue?.toString()
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