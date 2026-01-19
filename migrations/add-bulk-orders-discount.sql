-- Migration: Add discount column to bulk_orders
-- Date: 2026-01-17
-- Description: Adds support for optional discount amount in bulk orders

-- Add discount column to bulk_orders table
ALTER TABLE bulk_orders
ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2);

-- Add comment to explain the column
COMMENT ON COLUMN bulk_orders.discount IS 'Optional discount amount to be deducted from the total';
