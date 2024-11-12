import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx-js-style';
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: 5432,
  database: process.env.POSTGRES_DATABASE
});

function formatDateForPostgres(dateString: string | null): string | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch (error) {
    return null;
  }
}

// Define the expected structure of Excel rows
interface EmployeeRow {
  full_name: string;
  employee_mail: string;
  birth_date?: string;
  employment_date?: string;
  termination_date?: string;
  position_id?: string;
  education_id?: string;
  marital_status_id?: string;
  gender_id?: string;
  managerial_position_id?: string;
}

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const data = await request.formData();
    const file = data.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Invalid file uploaded' }, { status: 400 });
    }

    // Convert Blob to ArrayBuffer
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });

    if (!workbook.SheetNames.length) {
      return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 });
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json<EmployeeRow>(worksheet); // Type the sheet rows

    if (!Array.isArray(jsonData) || !jsonData.length) {
      return NextResponse.json({ error: 'No data found in Excel file' }, { status: 400 });
    }

    // Start a transaction
    await client.query('BEGIN');

    const insertedEmployees = [];
    for (const row of jsonData) {
      // Validate required fields
      if (!row.full_name || !row.employee_mail) {
        throw new Error('Missing required fields: Employee Name or Employee Email');
      }

      // Insert employee
      const { rows } = await client.query(
        `INSERT INTO "Employee" (
          full_name,
          employee_mail,
          birth_date,
          employment_date,
          termination_date,
          position_id,
          education_id,
          marital_status_id,
          gender_id,
          managerial_position_id,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          row.full_name,
          row.employee_mail,
          formatDateForPostgres(row.birth_date || null),
          formatDateForPostgres(row.employment_date || null),
          formatDateForPostgres(row.termination_date || null),
          row.position_id || null,
          row.education_id || null,
          row.marital_status_id || null,
          row.gender_id || null,
          row.managerial_position_id === '1' ? '1' : '2'
        ]
      );

      insertedEmployees.push(rows[0]);
    }

    // Commit the transaction
    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertedEmployees.length} employees`,
      count: insertedEmployees.length
    });

  } catch (error: any) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    
    console.error('Import error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to import data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  } finally {
    // Always release the client back to the pool
    client.release();
  }
}
