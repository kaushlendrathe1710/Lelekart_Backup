import { config } from "dotenv";
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config();

const { Pool } = pg;

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("🔄 Running ledger order type migration...");

    // Read the SQL file
    const sqlFilePath = path.join(
      __dirname,
      "..",
      "migrations",
      "add-ledger-order-type.sql"
    );
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // Execute the migration
    await pool.query(sql);

    console.log("✅ Migration completed successfully!");
    console.log("📋 Changes made:");
    console.log(
      '   - Added distributor_ledger.order_type column (TEXT, default: "normal")'
    );
    console.log(
      '   - Updated existing bulk order entries to order_type = "bulk"'
    );
    console.log("");
    console.log("📝 Note: Now ledger entries will track:");
    console.log('   - Normal orders: orderId = order.id, orderType = "normal"');
    console.log(
      '   - Bulk orders: orderId = bulk_order.id, orderType = "bulk"'
    );
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
