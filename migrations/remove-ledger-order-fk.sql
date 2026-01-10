-- Migration: Remove foreign key constraint from distributor_ledger.order_id
-- This allows storing both regular order IDs and bulk order IDs in the same field
-- The order_type column ('normal' or 'bulk') indicates which table the order_id references

-- Drop the foreign key constraint
ALTER TABLE distributor_ledger
DROP CONSTRAINT IF EXISTS distributor_ledger_order_id_orders_id_fk;

-- Add comment to document the change
COMMENT ON COLUMN distributor_ledger.order_id IS 'Order ID - references orders.id for normal orders or bulk_orders.id for bulk orders. Check order_type to determine which table.';

-- Verify the constraint was dropped
SELECT
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'distributor_ledger'::regclass
    AND conname LIKE '%order_id%';
