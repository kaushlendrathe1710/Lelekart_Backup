/**
 * Migration Script: Add cash handling fees and payment type to bulk orders
 *
 * This script adds two new columns to the bulk_orders table:
 * 1. cash_handling_fees - Optional decimal field for COD orders
 * 2. payment_type - Text field with default 'prepaid' (allowed values: 'prepaid', 'cod')
 *
 * Run: node scripts/add-cash-handling-fees-payment-type.js
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
  console.log(
    "🚀 Starting migration: Add cash handling fees and payment type to bulk orders...\n"
  );

  try {
    // Check if columns already exist
    const checkQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'bulk_orders'
        AND column_name IN ('cash_handling_fees', 'payment_type');
    `;

    const existingColumns = await pool.query(checkQuery);

    if (existingColumns.rows.length > 0) {
      console.log("⚠️  Warning: Some columns already exist:");
      existingColumns.rows.forEach((row) => {
        console.log(`   - ${row.column_name}`);
      });
      console.log("\nSkipping creation of existing columns...\n");
    }

    // Add cash_handling_fees column
    if (
      !existingColumns.rows.some(
        (row) => row.column_name === "cash_handling_fees"
      )
    ) {
      console.log("📦 Adding cash_handling_fees column...");
      await pool.query(`
        ALTER TABLE bulk_orders
        ADD COLUMN IF NOT EXISTS cash_handling_fees DECIMAL(10, 2);
      `);
      console.log("✅ cash_handling_fees column added successfully\n");
    }

    // Add payment_type column
    if (
      !existingColumns.rows.some((row) => row.column_name === "payment_type")
    ) {
      console.log("📦 Adding payment_type column...");
      await pool.query(`
        ALTER TABLE bulk_orders
        ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'prepaid';
      `);
      console.log("✅ payment_type column added successfully\n");
    }

    // Add comments for documentation
    console.log("📝 Adding column comments...");
    await pool.query(`
      COMMENT ON COLUMN bulk_orders.cash_handling_fees IS 'Optional cash handling fees for COD orders';
    `);
    await pool.query(`
      COMMENT ON COLUMN bulk_orders.payment_type IS 'Payment type: prepaid or cod';
    `);
    console.log("✅ Column comments added successfully\n");

    // Verify the columns
    console.log("🔍 Verifying column structure...");
    const verifyQuery = `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'bulk_orders'
        AND column_name IN ('cash_handling_fees', 'payment_type')
      ORDER BY column_name;
    `;

    const columns = await pool.query(verifyQuery);

    console.log("\n📋 Column Structure:");
    columns.rows.forEach((col) => {
      console.log(`   ${col.column_name}:`);
      console.log(`     - Type: ${col.data_type}`);
      console.log(`     - Nullable: ${col.is_nullable}`);
      console.log(`     - Default: ${col.column_default || "None"}`);
    });

    console.log("\n✨ Migration completed successfully!");
    console.log("\n📝 Summary:");
    console.log(
      "   - cash_handling_fees: Optional field for COD cash handling charges"
    );
    console.log(
      "   - payment_type: Indicates prepaid or COD payment (default: prepaid)"
    );
    console.log(
      "\n🎉 Bulk orders can now support cash handling fees and payment types!\n"
    );
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log("🏁 Migration script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration script failed:", error);
    process.exit(1);
  });
