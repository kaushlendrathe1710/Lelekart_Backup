import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import dotenv from "dotenv";
import dns from "dns";

// Force IPv4 for all DNS lookups (Railway + Neon compatibility)
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Parse the DATABASE_URL to check if it's Neon
const isNeonDb = process.env.DATABASE_URL.includes('neon.tech');
const isPooledConnection = process.env.DATABASE_URL.includes('-pooler');
console.log(`Database: ${isNeonDb ? 'Neon' : 'PostgreSQL'}, Pooled: ${isPooledConnection}`);

// Ensure sslmode is in the connection string for Neon
let connectionString = process.env.DATABASE_URL;
if (isNeonDb && !connectionString.includes('sslmode=')) {
  connectionString += connectionString.includes('?') ? '&sslmode=require' : '?sslmode=require';
}

// Configure pool with production-ready settings for Railway + Neon
const poolConfig: pg.PoolConfig = {
  connectionString,
  max: 3, // Very low for Neon pooler (it handles pooling)
  min: 0, // Allow pool to be empty when idle
  idleTimeoutMillis: 10000, // Release connections quickly
  connectionTimeoutMillis: 60000, // 60 second timeout for cold starts
  keepAlive: true,
  keepAliveInitialDelayMillis: 5000,
  // SSL configuration for Neon
  ssl: isNeonDb ? { rejectUnauthorized: false } : undefined,
};

export const pool = new pg.Pool(poolConfig);

// Handle pool errors gracefully - don't crash the server
pool.on('error', (err) => {
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
        await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
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
        error.code === '57P01' || // admin shutdown
        error.code === '57P02' || // crash shutdown
        error.code === '57P03' || // cannot connect now
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

export const db = drizzle(pool, { schema });
