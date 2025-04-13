const { Pool } = require('pg');

async function main() {
  console.log('Starting database migration...');
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Add approval_status column to users table
  console.log('Adding approval_status column to users table...');
  await pool.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS approval_status TEXT,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS approved_by INTEGER
  `);
  
  // Add approval_status and other columns to products table
  console.log('Adding approval columns to products table...');
  await pool.query(`
    ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS approval_status TEXT,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS approved_by INTEGER,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT
  `);
  
  console.log('Migration completed successfully!');
  await pool.end();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});