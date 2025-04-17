import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function createShiprocketSettingsTable() {
  console.log('Creating Shiprocket settings table...');

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    // Check if table exists
    const result = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'shiprocket_settings'
      );
    `;

    if (result[0] && result[0].exists) {
      console.log('Shiprocket settings table already exists');
      return;
    }

    // Create table
    await client`
      CREATE TABLE shiprocket_settings (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        token TEXT,
        token_expiry TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    console.log('Shiprocket settings table created successfully');
  } catch (error) {
    console.error('Error creating Shiprocket settings table:', error);
  } finally {
    await client.end();
  }
}

async function main() {
  await createShiprocketSettingsTable();
  console.log('Shiprocket schema setup complete');
}

main().catch((error) => {
  console.error('Error in push-shiprocket-schema.js:', error);
  process.exit(1);
});