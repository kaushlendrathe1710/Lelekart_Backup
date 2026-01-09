-- Add order_type column to distributor_ledger table
ALTER TABLE distributor_ledger
ADD COLUMN order_type TEXT DEFAULT 'normal';

-- Update existing entries to set order_type based on description/notes
UPDATE distributor_ledger
SET order_type = 'bulk'
WHERE description LIKE '%Bulk Invoice%' OR notes LIKE '%Bulk Order ID:%';

-- Add comment for clarity
COMMENT ON COLUMN distributor_ledger.order_type IS 'Type of order: normal or bulk';
