import { Router } from "express";
import { authenticateToken } from "../auth";
import * as adminOrderHandlers from "../handlers/admin-order-for-buyer-handlers";

const router = Router();

/**
 * Middleware to check if user is admin
 */
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// ========================
// ADMIN ROUTES FOR PLACING ORDERS ON BEHALF OF BUYERS
// ========================

/**
 * Get list of buyers (exclude distributors)
 * GET /api/admin/buyers
 */
router.get(
  "/buyers",
  authenticateToken,
  requireAdmin,
  adminOrderHandlers.getBuyersListHandler
);

/**
 * Get addresses for a specific buyer
 * GET /api/admin/buyers/:buyerId/addresses
 */
router.get(
  "/buyers/:buyerId/addresses",
  authenticateToken,
  requireAdmin,
  adminOrderHandlers.getBuyerAddressesHandler
);

/**
 * Create a new address for a buyer
 * POST /api/admin/buyers/:buyerId/addresses
 */
router.post(
  "/buyers/:buyerId/addresses",
  authenticateToken,
  requireAdmin,
  adminOrderHandlers.createBuyerAddressHandler
);

/**
 * Get products for order placement
 * GET /api/admin/products-for-order
 */
router.get(
  "/products-for-order",
  authenticateToken,
  requireAdmin,
  adminOrderHandlers.getProductsForOrderHandler
);

/**
 * Create order for buyer
 * POST /api/admin/orders-for-buyer
 */
router.post(
  "/orders-for-buyer",
  authenticateToken,
  requireAdmin,
  adminOrderHandlers.createOrderForBuyerHandler
);

/**
 * Preview invoice for buyer order
 * POST /api/admin/orders-for-buyer/preview-invoice
 */
router.post(
  "/orders-for-buyer/preview-invoice",
  authenticateToken,
  requireAdmin,
  adminOrderHandlers.previewInvoiceForBuyerHandler
);

export default router;
