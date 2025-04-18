import { db, pool } from './db';
import { shiprocketSettings, ShiprocketSettings, InsertShiprocketSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

// These functions will be added to the DatabaseStorage class
export const shiprocketStorageMethods = {
  // Get Shiprocket settings
  async getShiprocketSettings(): Promise<ShiprocketSettings | undefined> {
    try {
      // Check if settings are cached
      if (this.shiprocketSettings) {
        return this.shiprocketSettings;
      }

      // Check if the shiprocket_settings table exists
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'shiprocket_settings'
        );
      `);

      if (!result.rows[0].exists) {
        // Create the table if it doesn't exist
        await pool.query(`
          CREATE TABLE IF NOT EXISTS shiprocket_settings (
            id SERIAL PRIMARY KEY,
            email TEXT NOT NULL,
            password TEXT NOT NULL,
            token TEXT,
            token_expiry TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `);
        
        return undefined;
      }

      // Get the settings from the database
      const [settings] = await db.select().from(shiprocketSettings);
      
      // Cache the settings
      if (settings) {
        this.shiprocketSettings = settings;
      }
      
      return settings;
    } catch (error) {
      console.error('Error getting Shiprocket settings:', error);
      return undefined;
    }
  },

  // Update Shiprocket settings
  async updateShiprocketSettings(settings: InsertShiprocketSettings): Promise<ShiprocketSettings> {
    try {
      // Check if the table exists and create it if it doesn't
      await pool.query(`
        CREATE TABLE IF NOT EXISTS shiprocket_settings (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL,
          password TEXT NOT NULL,
          token TEXT,
          token_expiry TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // Check if settings already exist
      const existingSettings = await this.getShiprocketSettings();
      
      if (existingSettings) {
        // Update existing settings
        const [updatedSettings] = await db.update(shiprocketSettings)
          .set({
            email: settings.email,
            password: settings.password,
            token: settings.token,
            tokenExpiry: settings.tokenExpiry,
            updatedAt: new Date()
          })
          .where(eq(shiprocketSettings.id, existingSettings.id))
          .returning();
        
        // Cache the updated settings
        this.shiprocketSettings = updatedSettings;
        
        return updatedSettings;
      } else {
        // Create new settings
        const [newSettings] = await db.insert(shiprocketSettings)
          .values({
            email: settings.email,
            password: settings.password,
            token: settings.token,
            tokenExpiry: settings.tokenExpiry,
          })
          .returning();
        
        // Cache the new settings
        this.shiprocketSettings = newSettings;
        
        return newSettings;
      }
    } catch (error) {
      console.error('Error updating Shiprocket settings:', error);
      throw new Error('Failed to update Shiprocket settings');
    }
  },
  
  // Get shipment statistics by timeframe
  async getShipmentStatsByTimeframe(startDate: string, endDate: string): Promise<any> {
    try {
      // Get pending shipments (orders in processing status)
      const pendingResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM orders
        WHERE status = 'processing'
        AND order_date BETWEEN $1 AND $2
      `, [startDate, endDate]);
      
      // Get shipped orders (in transit)
      const shippedResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM orders
        WHERE status = 'shipped'
        AND shiprocket_shipment_id IS NOT NULL
        AND order_date BETWEEN $1 AND $2
      `, [startDate, endDate]);
      
      // Get delivered orders
      const deliveredResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM orders
        WHERE status = 'delivered'
        AND shiprocket_shipment_id IS NOT NULL
        AND order_date BETWEEN $1 AND $2
      `, [startDate, endDate]);
      
      // Get orders with issues (cancelled or returned after shipping)
      const issuesResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM orders
        WHERE (status = 'cancelled' OR status = 'returned')
        AND shiprocket_shipment_id IS NOT NULL
        AND order_date BETWEEN $1 AND $2
      `, [startDate, endDate]);
      
      return {
        pending: parseInt(pendingResult.rows[0].count) || 0,
        shipped: parseInt(shippedResult.rows[0].count) || 0,
        delivered: parseInt(deliveredResult.rows[0].count) || 0,
        issues: parseInt(issuesResult.rows[0].count) || 0
      };
    } catch (error) {
      console.error('Error getting shipment statistics:', error);
      // Return zeros if there's an error
      return {
        pending: 0,
        shipped: 0,
        delivered: 0,
        issues: 0
      };
    }
  }
};