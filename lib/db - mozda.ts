// lib/db.ts
import { Pool } from 'pg';

const isDevelopment = process.env.NODE_ENV === 'development';
console.log('Environment:', process.env.NODE_ENV);

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

console.log('Using config:', isDevelopment ? 'development' : 'production', {
  host: isDevelopment ? developmentConfig.host : process.env.POSTGRES_HOST,
  port: isDevelopment ? developmentConfig.port : 6543,
  database: isDevelopment ? developmentConfig.database : process.env.POSTGRES_DATABASE,
  user: isDevelopment ? developmentConfig.user : process.env.POSTGRES_USER,
  // Don't log actual password
  hasPassword: isDevelopment ? !!developmentConfig.password : !!process.env.POSTGRES_PASSWORD
});

const pool = new Pool(isDevelopment ? developmentConfig : productionConfig);

// Add error handler
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;