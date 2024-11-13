// lib/db.ts
import { Pool } from 'pg';

const isDevelopment = process.env.NODE_ENV === 'development';

const developmentConfig = {
  user: 'postgres',
  password: 'admin',
  host: 'localhost',
  port: 5432,
  database: 'postgres'
};

// Use a more dynamic way to handle SSL in production
const productionConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
};

const pool = new Pool(isDevelopment ? developmentConfig : productionConfig);

// Optional: Add error logging
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;
