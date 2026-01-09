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
    console.log("🔄 Running delivery charges migration...");

    // Read the SQL file
    const sqlFilePath = path.join(
      __dirname,
      "..",
      "migrations",
      "add-bulk-orders-delivery-charges.sql"
    );
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // Execute the migration
    await pool.query(sql);

    console.log("✅ Migration completed successfully!");
    console.log("📋 Added columns:");
    console.log(
      "   - bulk_orders.delivery_charges (NUMERIC(10, 2), default: 0)"
    );
    console.log(
      "   - bulk_orders.delivery_charges_gst_rate (NUMERIC(5, 2), default: 18)"
    );
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
