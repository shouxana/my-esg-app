import prisma from '@/lib/db';
import { NextResponse } from 'next/server';

// Define a type for the result rows
interface ManagerialPosition {
  managerial_position_id: number;
  managerial_position: string;
}

export async function GET() {
  try {
    const positions = await prisma.$queryRawUnsafe<ManagerialPosition[]>(`
      SELECT managerial_position_id, managerial_position 
      FROM "ManagerialPosition"
      ORDER BY managerial_position_id;
    `);

    const formattedPositions = positions.map(pos => ({
      id: pos.managerial_position_id,
      name: pos.managerial_position
    }));

    return NextResponse.json(formattedPositions);
  } catch (error) {
    console.error('Error fetching managerial positions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch managerial positions' },
      { status: 500 }
    );
  }
}
