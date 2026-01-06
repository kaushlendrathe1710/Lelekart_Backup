/**
 * Custom Migration Script for Bulk Orders Feature
 *
 * This script creates only the new bulk order tables without modifying existing tables.
 * It safely checks if tables exist before creating them.
 *
 * Run: node scripts/migrate-bulk-orders.js
 */

import pkg from 'pg';
const { Pool } = pkg;

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  console.log('🚀 Starting Bulk Orders feature migration...\n');

  try {
    // Check if tables already exist
    const checkQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('bulk_items', 'bulk_orders', 'bulk_order_items');
    `;

    const existingTables = await pool.query(checkQuery);

    if (existingTables.rows.length > 0) {
      console.log('⚠️  Warning: Some tables already exist:');
      existingTables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
      console.log('\nSkipping creation of existing tables...\n');
    }

    // Create bulk_items table
    if (!existingTables.rows.some(row => row.table_name === 'bulk_items')) {
      console.log('📦 Creating bulk_items table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS bulk_items (
          id SERIAL PRIMARY KEY,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          allow_pieces BOOLEAN NOT NULL DEFAULT true,
          allow_sets BOOLEAN NOT NULL DEFAULT false,
          pieces_per_set INTEGER,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log('✅ bulk_items table created successfully\n');
    }

    // Create bulk_orders table
    if (!existingTables.rows.some(row => row.table_name === 'bulk_orders')) {
      console.log('📦 Creating bulk_orders table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS bulk_orders (
          id SERIAL PRIMARY KEY,
          distributor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          total_amount DECIMAL(12, 2) NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          notes TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log('✅ bulk_orders table created successfully\n');
    }

    // Create bulk_order_items table
    if (!existingTables.rows.some(row => row.table_name === 'bulk_order_items')) {
      console.log('📦 Creating bulk_order_items table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS bulk_order_items (
          id SERIAL PRIMARY KEY,
          bulk_order_id INTEGER NOT NULL REFERENCES bulk_orders(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          order_type TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price DECIMAL(10, 2) NOT NULL,
          total_price DECIMAL(12, 2) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log('✅ bulk_order_items table created successfully\n');
    }

    // Create indexes for better query performance
    console.log('📊 Creating indexes...');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_bulk_items_product_id
      ON bulk_items(product_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_bulk_orders_distributor_id
      ON bulk_orders(distributor_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_bulk_orders_status
      ON bulk_orders(status);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_bulk_order_items_bulk_order_id
      ON bulk_order_items(bulk_order_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_bulk_order_items_product_id
      ON bulk_order_items(product_id);
    `);

    console.log('✅ Indexes created successfully\n');

    // Verify tables
    console.log('🔍 Verifying table structure...');
    const verifyQuery = `
      SELECT
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name IN ('bulk_items', 'bulk_orders', 'bulk_order_items')
      ORDER BY table_name, ordinal_position;
    `;

    const columns = await pool.query(verifyQuery);

    console.log('\n📋 Table Structure:');
    let currentTable = '';
    columns.rows.forEach(col => {
      if (col.table_name !== currentTable) {
        currentTable = col.table_name;
        console.log(`\n  ${currentTable}:`);
      }
      console.log(`    - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    console.log('\n✨ Migration completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - bulk_items: Configuration for products available for bulk ordering');
    console.log('   - bulk_orders: Master table for distributor bulk order submissions');
    console.log('   - bulk_order_items: Line items for each bulk order');
    console.log('\n🎉 Bulk Orders feature is ready to use!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('🏁 Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });
