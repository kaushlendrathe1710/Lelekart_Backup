import { Router } from "express";
import { authenticateToken } from "../auth";
import * as bulkOrdersHandlers from "../handlers/bulk-orders-handlers";

const router = Router();

// ========================
// DISTRIBUTOR ROUTES
// ========================

/**
 * Get products available for bulk ordering
 * Public endpoint (or can be protected with authenticateToken)
 */
router.get("/bulk-items", authenticateToken, bulkOrdersHandlers.getAvailableBulkItemsHandler);

/**
 * Get bulk orders for logged-in distributor
 */
router.get("/bulk-orders", authenticateToken, bulkOrdersHandlers.getDistributorBulkOrdersHandler);

/**
 * Get single bulk order (distributor can only see their own)
 */
router.get("/bulk-orders/:id", authenticateToken, bulkOrdersHandlers.getBulkOrderByIdHandler);

/**
 * Create a new bulk order
 */
router.post("/bulk-orders", authenticateToken, bulkOrdersHandlers.createBulkOrderHandler);

// ========================
// ADMIN ROUTES
// ========================

/**
 * Middleware to check if user is admin
 */
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

/**
 * Search products for bulk items (with pagination)
 */
router.get(
  "/admin/bulk-items/search-products",
  authenticateToken,
  requireAdmin,
  bulkOrdersHandlers.searchProductsForBulkItems
);

/**
 * Get all bulk items configuration
 */
router.get(
  "/admin/bulk-items",
  authenticateToken,
  requireAdmin,
  bulkOrdersHandlers.getAllBulkItemsHandler
);

/**
 * Get single bulk item by ID
 */
router.get(
  "/admin/bulk-items/:id",
  authenticateToken,
  requireAdmin,
  bulkOrdersHandlers.getBulkItemByIdHandler
);

/**
 * Create or update bulk item configuration
 */
router.post(
  "/admin/bulk-items",
  authenticateToken,
  requireAdmin,
  bulkOrdersHandlers.createBulkItemHandler
);

/**
 * Update bulk item configuration
 */
router.put(
  "/admin/bulk-items/:id",
  authenticateToken,
  requireAdmin,
  bulkOrdersHandlers.updateBulkItemHandler
);

/**
 * Delete bulk item configuration
 */
router.delete(
  "/admin/bulk-items/:id",
  authenticateToken,
  requireAdmin,
  bulkOrdersHandlers.deleteBulkItemHandler
);

/**
 * Get all bulk orders (admin view)
 */
router.get(
  "/admin/bulk-orders",
  authenticateToken,
  requireAdmin,
  bulkOrdersHandlers.getAllBulkOrdersHandler
);

/**
 * Get bulk order statistics
 */
router.get(
  "/admin/bulk-orders/stats",
  authenticateToken,
  requireAdmin,
  bulkOrdersHandlers.getBulkOrderStatsHandler
);

/**
 * Get single bulk order by ID (admin can see all)
 */
router.get(
  "/admin/bulk-orders/:id",
  authenticateToken,
  requireAdmin,
  bulkOrdersHandlers.getBulkOrderByIdHandler
);

/**
 * Update bulk order status
 */
router.patch(
  "/admin/bulk-orders/:id",
  authenticateToken,
  requireAdmin,
  bulkOrdersHandlers.updateBulkOrderStatusHandler
);

/**
 * Delete bulk order
 */
router.delete(
  "/admin/bulk-orders/:id",
  authenticateToken,
  requireAdmin,
  bulkOrdersHandlers.deleteBulkOrderHandler
);

export default router;
