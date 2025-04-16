import { db, pool } from './server/db.js';

async function addSellerIdToProductShippingOverrides() {
  try {
    console.log('Adding sellerId column to product_shipping_overrides table...');
    
    // Check if the column exists already
    const checkColumnSQL = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'product_shipping_overrides' AND column_name = 'seller_id'
    `;
    
    const columnExists = await pool.query(checkColumnSQL);
    
    if (columnExists.rows.length === 0) {
      // Add the seller_id column
      const addColumnSQL = `
        ALTER TABLE product_shipping_overrides 
        ADD COLUMN seller_id INTEGER NOT NULL REFERENCES users(id)
      `;
      
      await pool.query(addColumnSQL);
      
      // For existing records, we need to set a value for seller_id
      // We can get this from the products table
      const updateRecordsSQL = `
        UPDATE product_shipping_overrides po
        SET seller_id = p.seller_id
        FROM products p
        WHERE po.product_id = p.id
      `;
      
      await pool.query(updateRecordsSQL);
      
      console.log('Successfully added and populated seller_id column');
    } else {
      console.log('seller_id column already exists');
    }
    
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    await pool.end();
  }
}

// Execute the update
addSellerIdToProductShippingOverrides();