// lib/db.ts
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma; // Make sure `prisma` is exported

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: 5432,
  database: process.env.POSTGRES_DATABASE,
  ssl: process.env.DATABASE_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
});

export const db = {
  query: async (text: string, params: any[] = []) => {
    const client = await pool.connect();
    try {
      return await client.query(text, params);
    } finally {
      client.release();
    }
  }
};