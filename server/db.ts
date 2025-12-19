import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Parse the DATABASE_URL to check if it's Neon
const isNeonDb = process.env.DATABASE_URL.includes('neon.tech');
console.log(`Database type: ${isNeonDb ? 'Neon' : 'Standard PostgreSQL'}`);

// Configure pool with production-ready settings for Railway + Neon
const poolConfig: pg.PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 5, // Lower max for serverless to avoid connection limits
  min: 1, // Keep at least 1 connection alive
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 30000, // 30 second timeout for cold starts
  keepAlive: true, // Keep connections alive
  keepAliveInitialDelayMillis: 10000,
  // SSL configuration for Neon (required in production)
  ssl: isNeonDb ? { rejectUnauthorized: false } : undefined,
};

export const pool = new pg.Pool(poolConfig);

// Handle pool errors gracefully - don't crash the server
pool.on('error', (err) => {
  console.error('Database pool error (non-fatal):', err.message);
});

// Test database connection on startup
pool.connect()
  .then(client => {
    console.log('Database connection successful');
    client.release();
  })
  .catch(err => {
    console.error('Database connection failed on startup:', err.message);
  });

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
