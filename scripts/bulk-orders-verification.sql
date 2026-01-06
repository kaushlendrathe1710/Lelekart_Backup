/*
 * BULK ORDERS FEATURE - DATABASE VERIFICATION QUERIES
 * 
 * This file contains example SQL queries to verify the bulk orders feature
 * and manually test the database structure.
 * 
 * Run these queries in your PostgreSQL client to verify the installation.
 */

-- ============================================
-- 1. VERIFY TABLE STRUCTURE
-- ============================================

-- Check if all tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('bulk_items', 'bulk_orders', 'bulk_order_items')
ORDER BY table_name;

-- View bulk_items table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bulk_items'
ORDER BY ordinal_position;

-- View bulk_orders table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bulk_orders'
ORDER BY ordinal_position;

-- View bulk_order_items table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bulk_order_items'
ORDER BY ordinal_position;

-- ============================================
-- 2. VERIFY FOREIGN KEY CONSTRAINTS
-- ============================================

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('bulk_items', 'bulk_orders', 'bulk_order_items');

-- ============================================
-- 3. VERIFY INDEXES
-- ============================================

SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('bulk_items', 'bulk_orders', 'bulk_order_items')
ORDER BY tablename, indexname;

-- ============================================
-- 4. INSERT SAMPLE DATA (FOR TESTING)
-- ============================================

-- Example: Configure a product for bulk ordering
-- Replace <product_id> with an actual product ID from your products table
/*
INSERT INTO bulk_items (product_id, allow_pieces, allow_sets, pieces_per_set, created_at, updated_at)
VALUES 
    (1, true, true, 12, NOW(), NOW()),
    (2, true, false, NULL, NOW(), NOW()),
    (3, false, true, 24, NOW(), NOW());
*/

-- Example: Create a sample bulk order
-- Replace <distributor_id> with an actual user ID with role='distributor'
/*
INSERT INTO bulk_orders (distributor_id, total_amount, status, notes, created_at, updated_at)
VALUES 
    (5, 1200.00, 'pending', 'Test order for distributor', NOW(), NOW());
*/

-- Example: Add items to the bulk order
-- Replace <bulk_order_id> and <product_id> with actual values
/*
INSERT INTO bulk_order_items (bulk_order_id, product_id, order_type, quantity, unit_price, total_price, created_at)
VALUES 
    (1, 1, 'sets', 10, 10.00, 1200.00, NOW()),
    (1, 2, 'pieces', 50, 5.00, 250.00, NOW());
*/

-- ============================================
-- 5. QUERY SAMPLE DATA
-- ============================================

-- View all bulk items with product details
SELECT 
    bi.id,
    bi.product_id,
    p.name AS product_name,
    p.sku,
    p.price,
    bi.allow_pieces,
    bi.allow_sets,
    bi.pieces_per_set,
    bi.created_at
FROM bulk_items bi
JOIN products p ON bi.product_id = p.id
ORDER BY bi.created_at DESC;

-- View all bulk orders with distributor details
SELECT 
    bo.id AS order_id,
    bo.distributor_id,
    u.username AS distributor_username,
    u.name AS distributor_name,
    u.email AS distributor_email,
    bo.total_amount,
    bo.status,
    bo.notes,
    bo.created_at,
    bo.updated_at
FROM bulk_orders bo
JOIN users u ON bo.distributor_id = u.id
ORDER BY bo.created_at DESC;

-- View bulk order with all items
SELECT 
    bo.id AS order_id,
    bo.status,
    bo.total_amount AS order_total,
    bo.created_at AS order_date,
    u.name AS distributor_name,
    boi.id AS item_id,
    p.name AS product_name,
    p.sku AS product_sku,
    boi.order_type,
    boi.quantity,
    boi.unit_price,
    boi.total_price AS item_total
FROM bulk_orders bo
JOIN users u ON bo.distributor_id = u.id
JOIN bulk_order_items boi ON boi.bulk_order_id = bo.id
JOIN products p ON boi.product_id = p.id
ORDER BY bo.id DESC, boi.id;

-- ============================================
-- 6. STATISTICS QUERIES
-- ============================================

-- Count bulk orders by status
SELECT 
    status,
    COUNT(*) AS order_count,
    SUM(total_amount) AS total_value
FROM bulk_orders
GROUP BY status
ORDER BY status;

-- Count bulk items (products available for bulk ordering)
SELECT COUNT(*) AS total_bulk_items
FROM bulk_items;

-- Products configured for pieces vs sets
SELECT 
    COUNT(CASE WHEN allow_pieces THEN 1 END) AS allow_pieces_count,
    COUNT(CASE WHEN allow_sets THEN 1 END) AS allow_sets_count,
    COUNT(CASE WHEN allow_pieces AND allow_sets THEN 1 END) AS allow_both_count
FROM bulk_items;

-- Top distributors by bulk order value
SELECT 
    u.id,
    u.username,
    u.name,
    COUNT(bo.id) AS total_orders,
    SUM(bo.total_amount) AS total_value,
    AVG(bo.total_amount) AS avg_order_value
FROM users u
JOIN bulk_orders bo ON bo.distributor_id = u.id
GROUP BY u.id, u.username, u.name
ORDER BY total_value DESC
LIMIT 10;

-- Most ordered products in bulk
SELECT 
    p.id,
    p.name,
    p.sku,
    COUNT(boi.id) AS times_ordered,
    SUM(boi.quantity) AS total_quantity,
    SUM(boi.total_price) AS total_revenue
FROM products p
JOIN bulk_order_items boi ON boi.product_id = p.id
GROUP BY p.id, p.name, p.sku
ORDER BY total_revenue DESC
LIMIT 10;

-- ============================================
-- 7. DATA CLEANUP (USE WITH CAUTION!)
-- ============================================

-- Delete all test bulk order items
-- DELETE FROM bulk_order_items WHERE bulk_order_id IN (SELECT id FROM bulk_orders WHERE notes LIKE '%test%');

-- Delete all test bulk orders
-- DELETE FROM bulk_orders WHERE notes LIKE '%test%';

-- Delete all bulk item configurations
-- DELETE FROM bulk_items;

-- ============================================
-- 8. VALIDATION QUERIES
-- ============================================

-- Check for orphaned bulk items (products that don't exist)
SELECT bi.*
FROM bulk_items bi
LEFT JOIN products p ON bi.product_id = p.id
WHERE p.id IS NULL;

-- Check for orders with incorrect totals
SELECT 
    bo.id,
    bo.total_amount AS stored_total,
    SUM(boi.total_price) AS calculated_total,
    bo.total_amount - SUM(boi.total_price) AS difference
FROM bulk_orders bo
JOIN bulk_order_items boi ON boi.bulk_order_id = bo.id
GROUP BY bo.id, bo.total_amount
HAVING ABS(bo.total_amount - SUM(boi.total_price)) > 0.01;

-- Check for bulk order items with invalid order types
SELECT *
FROM bulk_order_items
WHERE order_type NOT IN ('pieces', 'sets');

-- Check for bulk items with invalid configuration
SELECT *
FROM bulk_items
WHERE (allow_sets = true AND pieces_per_set IS NULL)
   OR (allow_pieces = false AND allow_sets = false);

-- ============================================
-- 9. PERFORMANCE ANALYSIS
-- ============================================

-- Analyze query performance for bulk orders listing
EXPLAIN ANALYZE
SELECT 
    bo.id,
    bo.total_amount,
    bo.status,
    bo.created_at,
    u.name,
    u.email
FROM bulk_orders bo
JOIN users u ON bo.distributor_id = u.id
WHERE bo.status = 'pending'
ORDER BY bo.created_at DESC
LIMIT 20;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE tablename IN ('bulk_items', 'bulk_orders', 'bulk_order_items')
ORDER BY size_bytes DESC;

-- ============================================
-- 10. EXAMPLE BUSINESS QUERIES
-- ============================================

-- Get pending bulk orders for admin review
SELECT 
    bo.id,
    u.name AS distributor_name,
    u.email AS distributor_email,
    bo.total_amount,
    bo.created_at,
    COUNT(boi.id) AS item_count
FROM bulk_orders bo
JOIN users u ON bo.distributor_id = u.id
LEFT JOIN bulk_order_items boi ON boi.bulk_order_id = bo.id
WHERE bo.status = 'pending'
GROUP BY bo.id, u.name, u.email, bo.total_amount, bo.created_at
ORDER BY bo.created_at ASC;

-- Get distributor's order history with summary
SELECT 
    bo.id,
    bo.total_amount,
    bo.status,
    bo.created_at,
    COUNT(boi.id) AS item_count,
    STRING_AGG(DISTINCT p.name, ', ') AS products
FROM bulk_orders bo
JOIN bulk_order_items boi ON boi.bulk_order_id = bo.id
JOIN products p ON boi.product_id = p.id
WHERE bo.distributor_id = 5  -- Replace with actual distributor ID
GROUP BY bo.id, bo.total_amount, bo.status, bo.created_at
ORDER BY bo.created_at DESC;

-- ============================================
-- 11. BACKUP QUERIES
-- ============================================

-- Export bulk items configuration
-- COPY (SELECT * FROM bulk_items ORDER BY id) TO '/tmp/bulk_items_backup.csv' WITH CSV HEADER;

-- Export bulk orders
-- COPY (SELECT * FROM bulk_orders ORDER BY id) TO '/tmp/bulk_orders_backup.csv' WITH CSV HEADER;

-- Export bulk order items
-- COPY (SELECT * FROM bulk_order_items ORDER BY id) TO '/tmp/bulk_order_items_backup.csv' WITH CSV HEADER;

/*
 * ============================================
 * NOTES:
 * ============================================
 * 
 * 1. Always test queries on a development/staging environment first
 * 2. Uncomment INSERT/DELETE statements only when you're sure
 * 3. Replace placeholder IDs (<product_id>, <distributor_id>, etc.) with actual values
 * 4. Monitor query performance and add indexes if needed
 * 5. Regular backups are recommended before any data modifications
 * 
 * ============================================
 * END OF VERIFICATION QUERIES
 * ============================================
 */
