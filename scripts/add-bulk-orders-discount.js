/**
 * Migration Script: Add discount column to bulk orders
 *
 * This script adds a new column to the bulk_orders table:
 * - discount - Optional decimal field for discount amount (not percentage)
 *
 * Run: node scripts/add-bulk-orders-discount.js
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
  console.log("🚀 Starting migration: Add discount column to bulk orders...\n");

  try {
    // Check if column already exists
    const checkQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'bulk_orders'
        AND column_name = 'discount';
    `;

    const existingColumns = await pool.query(checkQuery);

    if (existingColumns.rows.length > 0) {
      console.log("⚠️  Warning: discount column already exists!");
      console.log("   Skipping column creation...\n");
    } else {
      // Add discount column
      console.log("📦 Adding discount column...");
      await pool.query(`
        ALTER TABLE bulk_orders
        ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2);
      `);
      console.log("✅ discount column added successfully\n");
    }

    // Add comment for documentation
    console.log("📝 Adding column comment...");
    await pool.query(`
      COMMENT ON COLUMN bulk_orders.discount IS 'Optional discount amount to be deducted from the total';
    `);
    console.log("✅ Column comment added successfully\n");

    // Verify the column
    console.log("🔍 Verifying column structure...");
    const verifyQuery = `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns
      WHERE table_name = 'bulk_orders'
        AND column_name = 'discount';
    `;

    const columns = await pool.query(verifyQuery);

    if (columns.rows.length > 0) {
      console.log("\n📋 Column Structure:");
      const col = columns.rows[0];
      console.log(`   ${col.column_name}:`);
      console.log(`     - Type: ${col.data_type}`);
      console.log(`     - Precision: ${col.numeric_precision}`);
      console.log(`     - Scale: ${col.numeric_scale}`);
      console.log(`     - Nullable: ${col.is_nullable}`);
      console.log(`     - Default: ${col.column_default || "None"}`);
    }

    // Check current bulk orders
    console.log("\n📊 Checking existing bulk orders...");
    const countQuery = `
      SELECT COUNT(*) as total
      FROM bulk_orders;
    `;
    const countResult = await pool.query(countQuery);
    const totalOrders = countResult.rows[0].total;

    console.log(`   Total bulk orders in database: ${totalOrders}`);
    console.log(
      `   Note: Existing orders will have NULL discount (no discount applied)`
    );

    console.log("\n✨ Migration completed successfully!");
    console.log("\n📝 Summary:");
    console.log(
      "   - discount: Optional field for discount amount (deducted from total)"
    );
    console.log("   - Type: DECIMAL(10, 2) - supports up to ₹99,999,999.99");
    console.log(
      "   - Usage: Enter discount amount (not percentage) in custom invoice form"
    );
    console.log(
      "\n🎉 Bulk orders can now support optional discount amounts!\n"
    );
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error("\nError details:", error);
    throw error;
  } finally {
    // Close the pool
    await pool.end();
    console.log("🔌 Database connection closed");
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log("\n✅ Migration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration script failed");
    process.exit(1);
  });
