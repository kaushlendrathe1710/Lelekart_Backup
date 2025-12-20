import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import pg from "pg";
import * as schema from "@shared/schema";
import dotenv from "dotenv";
import dns from "dns";
import ws from "ws";

// Force IPv4 for all DNS lookups (Railway + Neon compatibility)
dns.setDefaultResultOrder('ipv4first');

// Configure Neon to use WebSocket for serverless environments
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Parse the DATABASE_URL to check if it's Neon
const isNeonDb = process.env.DATABASE_URL.includes('neon.tech');
const isPooledConnection = process.env.DATABASE_URL.includes('-pooler');
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Database: ${isNeonDb ? 'Neon' : 'PostgreSQL'}, Pooled: ${isPooledConnection}, Production: ${isProduction}`);

// Ensure sslmode is in the connection string for Neon
let connectionString = process.env.DATABASE_URL;
if (isNeonDb && !connectionString.includes('sslmode=')) {
  connectionString += connectionString.includes('?') ? '&sslmode=require' : '?sslmode=require';
}

// Use Neon serverless driver for Neon databases in production (better for Railway)
// Use regular pg for development or non-Neon databases
let pool: pg.Pool | NeonPool;
let db: ReturnType<typeof drizzlePg> | ReturnType<typeof drizzleNeon>;

if (isNeonDb && isProduction) {
  console.log('Using Neon serverless driver (WebSocket) for production');
  pool = new NeonPool({ 
    connectionString,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
  });
  db = drizzleNeon(pool as NeonPool, { schema });
} else {
  console.log('Using standard pg driver');
  const poolConfig: pg.PoolConfig = {
    connectionString,
    max: 3,
    min: 0,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 60000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 5000,
    ssl: isNeonDb ? { rejectUnauthorized: false } : undefined,
  };
  pool = new pg.Pool(poolConfig);
  db = drizzlePg(pool as pg.Pool, { schema });
}

// Handle pool errors gracefully - don't crash the server
pool.on('error', (err: Error) => {
  console.error('Database pool error (non-fatal):', err.message);
});

// Test database connection on startup with retry
async function testConnection(retries = 3): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log('Database connection successful');
      client.release();
      return;
    } catch (err: any) {
      console.error(`Database connection attempt ${i + 1}/${retries} failed:`, err.message);
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  console.error('All database connection attempts failed - app may have issues');
}

testConnection();

// Connection retry wrapper for queries
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.message?.toLowerCase() || '';
      const isRetryable = 
        error.code === 'ETIMEDOUT' || 
        error.code === 'ENETUNREACH' || 
        error.code === 'ECONNREFUSED' ||
        error.code === 'ECONNRESET' ||
        error.code === 'EPIPE' ||
        error.code === '57P01' ||
        error.code === '57P02' ||
        error.code === '57P03' ||
        errorMessage.includes('connection timeout') ||
        errorMessage.includes('connection terminated') ||
        errorMessage.includes('connection reset') ||
        errorMessage.includes('socket hang up') ||
        errorMessage.includes('client has encountered a connection error');
      
      if (isRetryable && attempt < maxRetries) {
        console.log(`Database connection retry ${attempt}/${maxRetries}: ${error.message || error.code}`);
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      } else {
        throw error;
      }
    }
  }
  
  throw lastError;
}

export { pool, db };
