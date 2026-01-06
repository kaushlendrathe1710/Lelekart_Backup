/**
 * Script to add selling_price column to bulk_items table
 * This adds the selling_price column to support different pricing for bulk orders
 *
 * Run: node scripts/run-bulk-items-migration.js
 */

import pkg from "pg";
const { Pool } = pkg;

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  console.log("🚀 Starting bulk_items selling_price migration...\n");

  try {
    // Check if column already exists
    const checkQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'bulk_items'
      AND column_name = 'selling_price';
    `;

    const checkResult = await pool.query(checkQuery);

    if (checkResult.rows.length > 0) {
      console.log(
        '✅ Column "selling_price" already exists in bulk_items table.'
      );
      console.log("   No migration needed.\n");
      await pool.end();
      process.exit(0);
    }

    console.log("📝 Adding selling_price column to bulk_items table...");

    // Add the column
    const migrationQuery = `
      -- Add selling_price column
      ALTER TABLE bulk_items
      ADD COLUMN IF NOT EXISTS selling_price NUMERIC(10, 2);

      -- Add comment to explain the purpose
      COMMENT ON COLUMN bulk_items.selling_price IS 'Special selling price for bulk orders (can be different from regular product price)';
    `;

    await pool.query(migrationQuery);

    console.log("✅ Successfully added selling_price column!");
    console.log("✅ Migration completed successfully!\n");

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error("\nFull error:", error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
