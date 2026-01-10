-- Migration: Add cash_handling_fees and payment_type to bulk_orders table
-- Date: 2026-01-10
-- Description: Adds support for cash handling fees and payment type (prepaid/cod) in bulk orders

-- Add cash_handling_fees column (optional)
ALTER TABLE bulk_orders
ADD COLUMN IF NOT EXISTS cash_handling_fees DECIMAL(10, 2);

-- Add payment_type column with default value 'prepaid'
ALTER TABLE bulk_orders
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'prepaid';

-- Add comment to columns for documentation
COMMENT ON COLUMN bulk_orders.cash_handling_fees IS 'Optional cash handling fees for COD orders';
COMMENT ON COLUMN bulk_orders.payment_type IS 'Payment type: prepaid or cod';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'bulk_orders'
  AND column_name IN ('cash_handling_fees', 'payment_type')
ORDER BY column_name;
