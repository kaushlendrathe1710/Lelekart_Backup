-- Migration: Add HSN (Harmonized System of Nomenclature) column to products table
-- Created: 2026-01-20
-- Description: Adds hsn field to store product HSN codes for tax and classification purposes

-- Add hsn column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn TEXT;

-- Create an index on hsn for better query performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_products_hsn ON products(hsn);

-- Add comment to document the column
COMMENT ON COLUMN products.hsn IS 'HSN (Harmonized System of Nomenclature) code for product classification and taxation';
