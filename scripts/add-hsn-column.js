/**
 * Manual migration script to add HSN column to products table
 * Run this script with: node scripts/add-hsn-column.js
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
  const client = await pool.connect();

  try {
    console.log("Starting HSN column migration...");

    // Begin transaction
    await client.query("BEGIN");

    // Add hsn column to products table
    await client.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn TEXT;
    `);
    console.log("✓ HSN column added to products table");

    // Create index on hsn column for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_hsn ON products(hsn);
    `);
    console.log("✓ Index created on HSN column");

    // Add comment to document the column
    await client.query(`
      COMMENT ON COLUMN products.hsn IS 'HSN (Harmonized System of Nomenclature) code for product classification and taxation';
    `);
    console.log("✓ Column comment added");

    // Commit transaction
    await client.query("COMMIT");

    console.log("\n✅ Migration completed successfully!");
    console.log("HSN column has been added to the products table.");
  } catch (error) {
    // Rollback on error
    await client.query("ROLLBACK");
    console.error("\n❌ Migration failed:", error);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
}

runMigration().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
