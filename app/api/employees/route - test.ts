import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock data
    const employees = [
      {
        employee_id: '1',
        full_name: 'John Doe',
        employee_mail: 'john@example.com',
        birth_date: '1990-01-01',
        employment_date: '2020-01-01',
        termination_date: null,
        position_id: '1',
        education_id: '2',
        marital_status_id: '1',
        gender_id: '1',
        managerial_position_id: 'no'
      }
    ];

    return new NextResponse(JSON.stringify(employees), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch employees' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}