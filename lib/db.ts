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

const productionConfig = {
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: 6543,
  database: process.env.POSTGRES_DATABASE,
  ssl: {
    rejectUnauthorized: false
  }
};

const pool = new Pool(isDevelopment ? developmentConfig : productionConfig);

export default pool;