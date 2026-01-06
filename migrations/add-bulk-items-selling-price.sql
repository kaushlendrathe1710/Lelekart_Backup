-- Migration: Add selling_price column to bulk_items table
-- This allows bulk orders to have different pricing than regular products
-- Created: 2026-01-06

-- Add selling_price column
ALTER TABLE bulk_items
ADD COLUMN IF NOT EXISTS selling_price NUMERIC(10, 2);

-- Add comment to explain the purpose
COMMENT ON COLUMN bulk_items.selling_price IS 'Special selling price for bulk orders (can be different from regular product price)';
