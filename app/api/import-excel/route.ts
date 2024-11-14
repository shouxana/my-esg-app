import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx-js-style';
import pool from '@/lib/db';

// Define interface for Excel row data
interface ExcelRow {
  full_name: string;
  employee_mail: string;
  birth_date?: string | number | Date;
  employment_date?: string | number | Date;
  termination_date?: string | number | Date | null;
  position_id?: string | number;
  education_id?: string | number;
  marital_status_id?: string | number;
  gender_id?: string | number;
  managerial_position_id?: string | number | 'Yes' | 'No';
}

function extractCompanyFromEmail(email: string): string | null {
  try {
    const match = email.match(/@([^.]+)\./);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting company from email:', error);
    return null;
  }
}

function formatDateForPostgres(dateValue: number | string | Date | null): string | null {
  if (!dateValue) return null;
  
  try {
    // If it's an ISO date string or already has the correct format
    if (typeof dateValue === 'string') {
      // If it's already an ISO string
      if (dateValue.includes('T')) {
        return dateValue.split('T')[0];
      }
      // If it's already in YYYY-MM-DD format
      if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateValue;
      }
    }
    
    // If it's a number (Excel serial number)
    if (typeof dateValue === 'number') {
      const date = new Date(Date.UTC(1899, 11, 30 + Math.floor(dateValue)));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    // If it's a Date object
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0];
    }
    
    // For any other format, try to create a date object
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    console.error('Invalid date value:', dateValue);
    return null;
  } catch (error) {
    console.error('Date parsing error:', { dateValue, error });
    return null;
  }
}

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    console.log('Starting file import process');
    
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read the Excel file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(buffer), {
      type: 'array',
      cellDates: true,
      dateNF: 'yyyy-mm-dd',
      raw: true
    });

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
      raw: true,
      dateNF: 'yyyy-mm-dd',
      defval: null
    });

    // Start transaction
    await client.query('BEGIN');

    const insertedEmployees = [];
    for (const row of jsonData) {
      // Basic validation
      if (!row.full_name || !row.employee_mail) {
        throw new Error(`Missing required fields for row: ${JSON.stringify(row)}`);
      }

      // Extract company from email
      const company = extractCompanyFromEmail(row.employee_mail);
      if (!company) {
        throw new Error(`Could not extract company from email: ${row.employee_mail}`);
      }

      // Format dates
      const birthDate = formatDateForPostgres(row.birth_date);
      const employmentDate = formatDateForPostgres(row.employment_date);
      const terminationDate = formatDateForPostgres(row.termination_date);

      if (!birthDate || !employmentDate) {
        throw new Error(`Invalid or missing required dates for employee ${row.full_name}. Birth date and employment date are required.`);
      }
      
      // Handle managerial position
      let managerialPosition = '2'; // Default to 'No'
      if (row.managerial_position_id) {
        managerialPosition = typeof row.managerial_position_id === 'string' 
          ? (row.managerial_position_id.toLowerCase() === 'yes' ? '1' : '2')
          : (row.managerial_position_id === 1 ? '1' : '2');
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
          company,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          row.full_name,
          row.employee_mail,
          birthDate,
          employmentDate,
          terminationDate,
          row.position_id || null,
          row.education_id || null,
          row.marital_status_id || null,
          row.gender_id || null,
          managerialPosition,
          company
        ]
      );
      
      insertedEmployees.push(rows[0]);
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertedEmployees.length} employees`,
      count: insertedEmployees.length
    });

  } catch (error) {
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
    client.release();
  }
}