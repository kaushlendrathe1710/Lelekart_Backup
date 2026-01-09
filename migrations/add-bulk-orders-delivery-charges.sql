-- Add delivery charges fields to bulk_orders table
ALTER TABLE bulk_orders
ADD COLUMN delivery_charges NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN delivery_charges_gst_rate NUMERIC(5, 2) DEFAULT 18;

-- Add comment for clarity
COMMENT ON COLUMN bulk_orders.delivery_charges IS 'Delivery charges amount (GST inclusive)';
COMMENT ON COLUMN bulk_orders.delivery_charges_gst_rate IS 'GST rate applied on delivery charges as percentage';
