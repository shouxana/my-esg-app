import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: 5432,
  database: process.env.POSTGRES_DATABASE,
});

// Keep only ONE formatDateForPostgres function
function formatDateForPostgres(dateString: string | null) {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: employeeId } = await params;

  try {
    const body = await request.json();
    console.log('Update request body:', body);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const oldEmployeeResult = await client.query(
        'SELECT * FROM "Employee" WHERE employee_id = $1',
        [employeeId]
      );

      if (oldEmployeeResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        );
      }

      const oldEmployee = oldEmployeeResult.rows[0];

      const fieldsToTrack = [
        { name: 'full_name', label: 'Full Name' },
        { name: 'employee_mail', label: 'Email' },
        { name: 'birth_date', label: 'Birth Date' },
        { name: 'employment_date', label: 'Employment Date' },
        { name: 'termination_date', label: 'Termination Date' },
        { name: 'position_id', label: 'Position' },
        { name: 'education_id', label: 'Education' },
        { name: 'marital_status_id', label: 'Marital Status' },
        { name: 'gender_id', label: 'Gender' },
        { name: 'managerial_position_id', label: 'Managerial Position' },
      ];

      // Log changes for each field
      for (const field of fieldsToTrack) {
        let oldValue = oldEmployee[field.name];
        let newValue = body[field.name];

        // Format dates for comparison
        if (field.name.includes('date') && oldValue) {
          oldValue = formatDateForPostgres(oldValue.toString());
          newValue = formatDateForPostgres(newValue);
        }

        // Only log if values are actually different
        if (oldValue?.toString() !== newValue?.toString()) {
          // For logging, get the original values before formatting
          const logOldValue = oldEmployee[field.name]?.toString() || null;
          const logNewValue = body[field.name]?.toString() || null;

          await client.query(
            `INSERT INTO "EmployeeUpdateLog" 
             (employee_id, changed_field, old_value, new_value, updated_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
            [employeeId, field.name, logOldValue, logNewValue]
          );
        }
      }

      // Update the employee record
      const { rows } = await client.query(
        `UPDATE "Employee"
         SET 
           full_name = $1,
           employee_mail = $2,
           birth_date = $3::DATE,
           employment_date = $4::DATE,
           termination_date = $5::DATE,
           position_id = $6,
           education_id = $7,
           marital_status_id = $8,
           gender_id = $9,
           managerial_position_id = $10,
           company = $11,
           updated_at = CURRENT_TIMESTAMP
         WHERE employee_id = $12
         RETURNING *`,
        [
          body.full_name,
          body.employee_mail,
          formatDateForPostgres(body.birth_date),
          formatDateForPostgres(body.employment_date),
          formatDateForPostgres(body.termination_date),
          body.position_id,
          body.education_id,
          body.marital_status_id,
          body.gender_id,
          body.managerial_position_id,
          body.company,
          employeeId,
        ]
      );

      await client.query('COMMIT');
      return NextResponse.json(rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update employee',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE employee
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: employeeId } = await params;

  try {
    const client = await pool.connect();

    try {
      const { rows } = await client.query(
        'DELETE FROM "Employee" WHERE employee_id = $1 RETURNING *',
        [employeeId]
      );

      if (rows.length === 0) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ message: 'Employee deleted successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
}
