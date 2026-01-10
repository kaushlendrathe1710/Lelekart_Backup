/**
 * Migration Script: Remove foreign key constraint from distributor_ledger.order_id
 *
 * This allows the order_id field to store both:
 * - Regular order IDs (from orders table) when order_type = 'normal'
 * - Bulk order IDs (from bulk_orders table) when order_type = 'bulk'
 *
 * Run: node scripts/remove-ledger-order-fk.js
 */

import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  console.log(
    "🚀 Starting migration: Remove foreign key constraint from distributor_ledger...\n"
  );

  try {
    // Check if constraint exists
    const checkQuery = `
      SELECT conname AS constraint_name
      FROM pg_constraint
      WHERE conrelid = 'distributor_ledger'::regclass
        AND conname = 'distributor_ledger_order_id_orders_id_fk';
    `;

    const existingConstraint = await pool.query(checkQuery);

    if (existingConstraint.rows.length === 0) {
      console.log(
        "⚠️  Foreign key constraint does not exist or already removed."
      );
      console.log("✅ No action needed.\n");
      return;
    }

    console.log(
      "📋 Found foreign key constraint: distributor_ledger_order_id_orders_id_fk"
    );
    console.log("🔧 Dropping constraint...\n");

    // Drop the foreign key constraint
    await pool.query(`
      ALTER TABLE distributor_ledger
      DROP CONSTRAINT IF EXISTS distributor_ledger_order_id_orders_id_fk;
    `);

    console.log("✅ Foreign key constraint removed successfully\n");

    // Add column comment
    await pool.query(`
      COMMENT ON COLUMN distributor_ledger.order_id IS
      'Order ID - references orders.id for normal orders or bulk_orders.id for bulk orders. Check order_type to determine which table.';
    `);

    console.log("📝 Column comment added\n");

    // Verify the constraint was dropped
    const verifyQuery = `
      SELECT
        conname AS constraint_name,
        contype AS constraint_type
      FROM pg_constraint
      WHERE conrelid = 'distributor_ledger'::regclass
        AND conname LIKE '%order_id%';
    `;

    const remainingConstraints = await pool.query(verifyQuery);

    if (remainingConstraints.rows.length === 0) {
      console.log(
        "✅ Verified: No foreign key constraints on order_id column\n"
      );
    } else {
      console.log("⚠️  Warning: Found remaining constraints:");
      remainingConstraints.rows.forEach((row) => {
        console.log(`   - ${row.constraint_name} (${row.constraint_type})`);
      });
    }

    console.log("✨ Migration completed successfully!\n");
    console.log("📝 Summary:");
    console.log(
      "   - Removed FK constraint: distributor_ledger_order_id_orders_id_fk"
    );
    console.log("   - order_id can now store both regular and bulk order IDs");
    console.log(
      "   - order_type field indicates which table the ID references"
    );
    console.log('     • order_type = "normal" → orders.id');
    console.log('     • order_type = "bulk" → bulk_orders.id\n');
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
