import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'full_name',
      'employee_mail',
      'birth_date',
      'employment_date',
      'position_id',
      'education_id',
      'marital_status_id',
      'gender_id',
      'managerial_position_id',
      'company'
    ];

    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      // Check for existing email
      const emailCheck = await client.query(
        `SELECT employee_id, full_name FROM "Employee" 
         WHERE lower(employee_mail) = lower($1) AND lower(company) = lower($2)`,
        [body.employee_mail, body.company]
      );

      if (emailCheck.rows.length > 0) {
        // Generate email suggestions
        const nameParts = body.full_name.toLowerCase().split(' ');
        const suggestions = [
          `${nameParts[0]}.${nameParts[nameParts.length-1]}@${body.employee_mail.split('@')[1]}`,
          `${nameParts[0]}${nameParts[nameParts.length-1]}@${body.employee_mail.split('@')[1]}`,
          `${nameParts[0]}${nameParts[nameParts.length-1]}1@${body.employee_mail.split('@')[1]}`,
          `${nameParts[0]}.${nameParts[nameParts.length-1]}1@${body.employee_mail.split('@')[1]}`
        ];

        return NextResponse.json({
          type: 'EMAIL_EXISTS',
          message: 'Email already exists',
          existingEmployee: emailCheck.rows[0],
          suggestions
        }, { status: 409 });
      }

      // Check for existing name and birth date
      const nameAndDobCheck = await client.query(
        `SELECT employee_id, employee_mail FROM "Employee" 
         WHERE lower(full_name) = lower($1) 
         AND birth_date = $2::DATE 
         AND lower(company) = lower($3)`,
        [body.full_name, body.birth_date, body.company]
      );

      if (nameAndDobCheck.rows.length > 0) {
        return NextResponse.json({
          type: 'DUPLICATE_PERSON',
          message: 'Employee with same name and birth date exists',
          existingEmployee: nameAndDobCheck.rows[0]
        }, { status: 409 });
      }

      // If no duplicates found, proceed with insertion
      const { rows } = await client.query(
        `INSERT INTO "Employee" (
          full_name,
          employee_mail,
          birth_date,
          employment_date,
          termination_date,
          leave_date_start,
          leave_date_end,
          position_id,
          education_id,
          marital_status_id,
          gender_id,
          managerial_position_id,
          company,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3::DATE, $4::DATE, $5::DATE, $6::DATE, $7::DATE, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          body.full_name,
          body.employee_mail,
          body.birth_date,
          body.employment_date,
          body.termination_date || null,
          body.leave_date_start || null,
          body.leave_date_end || null,
          body.position_id,
          body.education_id,
          body.marital_status_id,
          body.gender_id,
          body.managerial_position_id,
          body.company
        ]
      );

      return NextResponse.json({
        type: 'SUCCESS',
        data: rows[0]
      });
    } catch (error) {
      console.error('SQL Error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to create employee', 
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Request Error:', error);
    return NextResponse.json(
      { 
        error: 'Invalid request data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const educationParam = searchParams.get('education');
    const company = searchParams.get('company');
    const employeeId = searchParams.get('id'); // Add this to get employee ID

    if (!company) {
      return NextResponse.json(
        { error: 'Company parameter is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // If employeeId is provided, fetch single employee details
      if (employeeId) {
        const query = `
          SELECT 
            e.employee_id,
            e.full_name,
            e.employee_mail,
            e.birth_date::text AS birth_date,
            e.employment_date::text AS employment_date,
            e.termination_date::text AS termination_date,
e.leave_date_Start::text AS leave_date_Start,
e.leave_date_end::text AS leave_date_end,
            e.position_id,
            e.education_id,
            e.marital_status_id,
            e.gender_id,
            e.managerial_position_id,
            e.company
          FROM "Employee" e
          WHERE e.employee_id = $1 AND lower(e.company) = lower($2)
        `;
        const { rows } = await client.query(query, [employeeId, company]);
        
        if (rows.length === 0) {
          return NextResponse.json(
            { error: 'Employee not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json(rows[0]);
      }

      // If year and education params are provided, use existing filtered query
      if (yearParam && educationParam) {
        const year = parseInt(yearParam, 10);
        
        const query = `
          WITH employee_base AS (
            SELECT
                emp.employee_id,
                emp.full_name,
                emp.employment_date,
                emp.termination_date,
                emp.education_id as current_education_id
            FROM "Employee" emp
            WHERE 
                EXTRACT(YEAR FROM emp.employment_date)::integer <= $1
                AND (emp.termination_date IS NULL OR EXTRACT(YEAR FROM emp.termination_date)::integer >= $1)
                AND lower(emp.company) = lower($3)
          ),
          education_updates AS (
            SELECT 
                employee_id,
                EXTRACT(YEAR FROM updated_at)::integer as update_year,
                old_value,
                new_value,
                updated_at
            FROM "EmployeeUpdateLog"
            WHERE changed_field = 'education_id'
            ORDER BY updated_at DESC
          ),
          employee_education_history AS (
            SELECT
                t1.employee_id,
                t1.full_name,
                t1.employment_date,
                t1.termination_date,
                CASE
                    WHEN EXISTS (SELECT 1 FROM education_updates eu 
                               WHERE eu.employee_id = t1.employee_id 
                               AND eu.update_year > $1) 
                    THEN (
                        SELECT eu.old_value
                        FROM education_updates eu
                        WHERE eu.employee_id = t1.employee_id
                        AND eu.update_year > $1
                        ORDER BY eu.updated_at ASC
                        LIMIT 1
                    )
                    ELSE t1.current_education_id::text
                END as effective_education_id
            FROM employee_base t1
          )
          SELECT 
            eeh.employee_id,
            eeh.full_name,
            TO_CHAR(eeh.employment_date, 'YYYY-MM-DD') as employment_date,
            CASE 
                WHEN eeh.termination_date IS NULL THEN 'Active'
                ELSE TO_CHAR(eeh.termination_date, 'YYYY-MM-DD')
            END as status
          FROM employee_education_history eeh
          JOIN "Education" e ON e.education_id = eeh.effective_education_id
          WHERE e.education = $2
          ORDER BY eeh.full_name;
        `;

        const { rows } = await client.query(query, [year, educationParam, company]);
        return NextResponse.json(rows);
      }

      // Default: return all employees for the company
      const query = `
        SELECT 
          e.employee_id,
          e.full_name,
          e.employee_mail,
          e.birth_date::text AS birth_date,
          e.employment_date::text AS employment_date,
          e.termination_date::text AS termination_date,
          e.position_id,
          e.education_id,
          e.marital_status_id,
          e.gender_id,
          e.managerial_position_id,
          e.company
        FROM "Employee" e
        WHERE lower(e.company) = lower($1)
        ORDER BY e.full_name;
      `;
      const { rows } = await client.query(query, [company]);
      return NextResponse.json(rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}