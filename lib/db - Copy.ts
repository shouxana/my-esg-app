import { createPool } from '@vercel/postgres';

export const pool = createPool({
  connectionString: process.env.POSTGRES_URL
});