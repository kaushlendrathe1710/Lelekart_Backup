import { Request, Response } from "express";
import { db } from "../db";
import {
  bulkItems,
  bulkOrders,
  bulkOrderItems,
  products,
  users,
  distributors,
  distributorLedger,
  insertBulkItemSchema,
  insertBulkOrderSchema,
  insertBulkOrderItemSchema,
} from "../../shared/schema";
import { eq, and, desc, inArray, sql, or, ilike, count } from "drizzle-orm";
import { z } from "zod";
import { storage } from "../storage";

// ========================
// ADMIN BULK ITEMS HANDLERS
// ========================

/**
 * Search products for bulk items configuration with pagination
 * GET /api/admin/bulk-items/search-products
 */
export async function searchProductsForBulkItems(req: Request, res: Response) {
  try {
    const search = (req.query.search as string) || "";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(products.approved, true)];

    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.sku, `%${search}%`),
        ) as any,
      );
    }

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(and(...conditions));

    const total = countResult?.count || 0;

    // Get paginated products
    const productsList = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        price: products.price,
        imageUrl: products.imageUrl,
      })
      .from(products)
      .where(and(...conditions))
      .orderBy(products.name)
      .limit(limit)
      .offset(offset);

    res.json({
      products: productsList,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ error: "Failed to search products" });
  }
}

/**
 * Get all bulk items configuration
 * GET /api/admin/bulk-items
 */
export async function getAllBulkItemsHandler(req: Request, res: Response) {
  try {
    // Pagination parameters
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = (page - 1) * limit;

    // Search parameter
    const search = req.query.search as string | undefined;

    // Build where conditions
    const conditions = [];

    // Search filter
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      conditions.push(
        or(ilike(products.name, searchLower), ilike(products.sku, searchLower)),
      );
    }

    // Get total count
    const countQuery = db
      .select({ count: count() })
      .from(bulkItems)
      .leftJoin(products, eq(bulkItems.productId, products.id));

    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }

    const [{ count: totalCount }] = await countQuery;

    // Get paginated items
    const query = db
      .select({
        id: bulkItems.id,
        productId: bulkItems.productId,
        allowPieces: bulkItems.allowPieces,
        allowSets: bulkItems.allowSets,
        piecesPerSet: bulkItems.piecesPerSet,
        sellingPrice: bulkItems.sellingPrice,
        createdAt: bulkItems.createdAt,
        updatedAt: bulkItems.updatedAt,
        productName: products.name,
        productPrice: products.price,
        productImage: products.imageUrl,
        productSku: products.sku,
      })
      .from(bulkItems)
      .leftJoin(products, eq(bulkItems.productId, products.id))
      .orderBy(desc(bulkItems.createdAt))
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const items = await query;

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      items,
      pagination: {
        total: totalCount,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching bulk items:", error);
    res.status(500).json({ error: "Failed to fetch bulk items" });
  }
}

/**
 * Get single bulk item by ID
 * GET /api/admin/bulk-items/:id
 */
export async function getBulkItemByIdHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid bulk item ID" });
    }

    const [item] = await db
      .select({
        id: bulkItems.id,
        productId: bulkItems.productId,
        allowPieces: bulkItems.allowPieces,
        allowSets: bulkItems.allowSets,
        piecesPerSet: bulkItems.piecesPerSet,
        sellingPrice: bulkItems.sellingPrice,
        createdAt: bulkItems.createdAt,
        updatedAt: bulkItems.updatedAt,
        productName: products.name,
        productPrice: products.price,
        productImage: products.imageUrl,
      })
      .from(bulkItems)
      .leftJoin(products, eq(bulkItems.productId, products.id))
      .where(eq(bulkItems.id, id))
      .limit(1);

    if (!item) {
      return res.status(404).json({ error: "Bulk item not found" });
    }

    res.json(item);
  } catch (error) {
    console.error("Error fetching bulk item:", error);
    res.status(500).json({ error: "Failed to fetch bulk item" });
  }
}

/**
 * Create or update bulk item configuration
 * POST /api/admin/bulk-items
 */
export async function createBulkItemHandler(req: Request, res: Response) {
  try {
    // Validate input
    const parsed = insertBulkItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid bulk item data",
        details: parsed.error.errors,
      });
    }

    const data = parsed.data;

    // Validate business rules
    if (data.allowSets && !data.piecesPerSet) {
      return res.status(400).json({
        error: "pieces_per_set is required when allow_sets is true",
      });
    }

    if (!data.allowPieces && !data.allowSets) {
      return res.status(400).json({
        error: "At least one of allow_pieces or allow_sets must be true",
      });
    }

    // Check if product exists
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, data.productId))
      .limit(1);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check if bulk item already exists for this product
    const [existingItem] = await db
      .select()
      .from(bulkItems)
      .where(eq(bulkItems.productId, data.productId))
      .limit(1);

    let result;
    if (existingItem) {
      // Update existing
      [result] = await db
        .update(bulkItems)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(bulkItems.id, existingItem.id))
        .returning();
    } else {
      // Create new
      [result] = await db.insert(bulkItems).values(data).returning();
    }

    res.status(existingItem ? 200 : 201).json(result);
  } catch (error) {
    console.error("Error creating/updating bulk item:", error);
    res.status(500).json({ error: "Failed to create/update bulk item" });
  }
}

/**
 * Update bulk item configuration
 * PUT /api/admin/bulk-items/:id
 */
export async function updateBulkItemHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid bulk item ID" });
    }

    // Validate input
    const parsed = insertBulkItemSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid bulk item data",
        details: parsed.error.errors,
      });
    }

    const data = parsed.data;

    // Get existing item
    const [existingItem] = await db
      .select()
      .from(bulkItems)
      .where(eq(bulkItems.id, id))
      .limit(1);

    if (!existingItem) {
      return res.status(404).json({ error: "Bulk item not found" });
    }

    // Merge with existing data for validation
    const mergedData = { ...existingItem, ...data };

    // Validate business rules
    if (mergedData.allowSets && !mergedData.piecesPerSet) {
      return res.status(400).json({
        error: "pieces_per_set is required when allow_sets is true",
      });
    }

    if (!mergedData.allowPieces && !mergedData.allowSets) {
      return res.status(400).json({
        error: "At least one of allow_pieces or allow_sets must be true",
      });
    }

    // Update
    const [updated] = await db
      .update(bulkItems)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(bulkItems.id, id))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Error updating bulk item:", error);
    res.status(500).json({ error: "Failed to update bulk item" });
  }
}

/**
 * Delete bulk item configuration
 * DELETE /api/admin/bulk-items/:id
 */
export async function deleteBulkItemHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid bulk item ID" });
    }

    const [deleted] = await db
      .delete(bulkItems)
      .where(eq(bulkItems.id, id))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: "Bulk item not found" });
    }

    res.json({ message: "Bulk item deleted successfully", item: deleted });
  } catch (error) {
    console.error("Error deleting bulk item:", error);
    res.status(500).json({ error: "Failed to delete bulk item" });
  }
}

/**
 * Get products available for bulk ordering (for distributor form)
 * GET /api/bulk-items
 */
export async function getAvailableBulkItemsHandler(
  req: Request,
  res: Response,
) {
  try {
    const items = await db
      .select({
        id: bulkItems.id,
        productId: bulkItems.productId,
        allowPieces: bulkItems.allowPieces,
        allowSets: bulkItems.allowSets,
        piecesPerSet: bulkItems.piecesPerSet,
        sellingPrice: bulkItems.sellingPrice,
        productName: products.name,
        productPrice: products.price,
        productImage: products.imageUrl,
        productSku: products.sku,
        productStock: products.stock,
        productDescription: products.description,
      })
      .from(bulkItems)
      .innerJoin(products, eq(bulkItems.productId, products.id))
      .where(eq(products.approved, true)) // Only approved products
      .orderBy(products.name);

    res.json(items);
  } catch (error) {
    console.error("Error fetching available bulk items:", error);
    res.status(500).json({ error: "Failed to fetch available bulk items" });
  }
}

// ========================
// BULK ORDERS HANDLERS
// ========================

/**
 * Create a new bulk order (for distributors)
 * POST /api/bulk-orders
 */
export async function createBulkOrderHandler(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Validate request body
    const orderSchema = z.object({
      items: z
        .array(
          z.object({
            productId: z.number().int().positive(),
            orderType: z.enum(["pieces", "sets"]),
            quantity: z.number().int().positive(),
          }),
        )
        .min(1, "At least one item is required"),
      notes: z.string().optional(),
    });

    const parsed = orderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid order data",
        details: parsed.error.errors,
      });
    }

    const { items: orderItems, notes } = parsed.data;

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Validate all items and calculate totals
      const orderItemsData = [];
      let grandTotal = 0;

      for (const item of orderItems) {
        // Get bulk item configuration
        const [bulkItem] = await tx
          .select()
          .from(bulkItems)
          .where(eq(bulkItems.productId, item.productId))
          .limit(1);

        if (!bulkItem) {
          throw new Error(
            `Product ${item.productId} is not available for bulk ordering`,
          );
        }

        // Validate order type
        if (item.orderType === "pieces" && !bulkItem.allowPieces) {
          throw new Error(
            `Product ${item.productId} does not allow ordering by pieces`,
          );
        }
        if (item.orderType === "sets" && !bulkItem.allowSets) {
          throw new Error(
            `Product ${item.productId} does not allow ordering by sets`,
          );
        }

        // Get product details
        const [product] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        if (!product.approved) {
          throw new Error(`Product ${item.productId} is not approved`);
        }

        // Calculate actual quantity and price
        let actualQuantity = item.quantity;
        if (item.orderType === "sets" && bulkItem.piecesPerSet) {
          actualQuantity = item.quantity * bulkItem.piecesPerSet;
        }

        // Use sellingPrice if available, otherwise fall back to product price
        const unitPrice = parseFloat(
          bulkItem.sellingPrice?.toString() || product.price,
        );
        const totalPrice = actualQuantity * unitPrice;

        orderItemsData.push({
          productId: item.productId,
          orderType: item.orderType,
          quantity: item.quantity,
          unitPrice: unitPrice.toFixed(2),
          totalPrice: totalPrice.toFixed(2),
        });

        grandTotal += totalPrice;
      }

      // Create bulk order
      const [order] = await tx
        .insert(bulkOrders)
        .values({
          distributorId: userId,
          totalAmount: grandTotal.toFixed(2),
          status: "pending",
          notes: notes || null,
        })
        .returning();

      // Create bulk order items
      const itemsWithOrderId = orderItemsData.map((item) => ({
        ...item,
        bulkOrderId: order.id,
      }));

      const createdItems = await tx
        .insert(bulkOrderItems)
        .values(itemsWithOrderId)
        .returning();

      return {
        order,
        items: createdItems,
      };
    });

    // After successful order creation, add ledger entry
    try {
      // Get distributor record to find distributorId
      const [distributor] = await db
        .select()
        .from(distributors)
        .where(eq(distributors.userId, userId))
        .limit(1);

      if (distributor) {
        // Get current balance from ledger
        const lastLedgerEntry = await db
          .select()
          .from(distributorLedger)
          .where(eq(distributorLedger.distributorId, distributor.id))
          .orderBy(desc(distributorLedger.id))
          .limit(1);

        const currentBalance = lastLedgerEntry.length
          ? lastLedgerEntry[0].balanceAfter
          : 0;
        const newBalance =
          currentBalance + Math.round(result.order.totalAmount);

        // Add ledger entry
        await storage.addLedgerEntry({
          distributorId: distributor.id,
          entryType: "order",
          amount: Math.round(result.order.totalAmount),
          orderId: result.order.id,
          orderType: "bulk",
          description: `Bulk Order BO-${result.order.id} - ${result.items.length} item(s)`,
          balanceAfter: newBalance,
          createdBy: userId,
          notes: result.order.notes || undefined,
        });

        console.log(
          `Ledger entry created for bulk order ${result.order.id}, distributor ${distributor.id}`,
        );
      }
    } catch (ledgerError) {
      console.error("Error creating ledger entry for bulk order:", ledgerError);
      // Don't fail the order creation if ledger fails
    }

    res.status(201).json(result);
  } catch (error: any) {
    console.error("Error creating bulk order:", error);
    res.status(500).json({
      error: error.message || "Failed to create bulk order",
    });
  }
}

/**
 * Get all bulk orders (admin view)
 * GET /api/admin/bulk-orders
 */
export async function getAllBulkOrdersHandler(req: Request, res: Response) {
  try {
    // Pagination parameters
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = (page - 1) * limit;

    // Filter parameters
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    // Build where conditions
    const conditions = [];

    // Status filter
    if (status && status !== "all") {
      conditions.push(eq(bulkOrders.status, status));
    }

    // Search filter (distributor name, email, or order ID)
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      conditions.push(
        or(
          ilike(users.name, searchLower),
          ilike(users.email, searchLower),
          ilike(users.username, searchLower),
          sql`CAST(${bulkOrders.id} AS TEXT) ILIKE ${searchLower}`,
        ),
      );
    }

    // Get total count
    const countQuery = db
      .select({ count: count() })
      .from(bulkOrders)
      .leftJoin(users, eq(bulkOrders.distributorId, users.id));

    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }

    const [{ count: totalCount }] = await countQuery;

    // Get paginated orders
    let query = db
      .select({
        id: bulkOrders.id,
        distributorId: bulkOrders.distributorId,
        totalAmount: bulkOrders.totalAmount,
        status: bulkOrders.status,
        notes: bulkOrders.notes,
        createdAt: bulkOrders.createdAt,
        updatedAt: bulkOrders.updatedAt,
        distributorName: users.name,
        distributorEmail: users.email,
        distributorUsername: users.username,
      })
      .from(bulkOrders)
      .leftJoin(users, eq(bulkOrders.distributorId, users.id))
      .orderBy(desc(bulkOrders.createdAt))
      .limit(limit)
      .offset(offset)
      .$dynamic();

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const orders = await query;

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      orders,
      pagination: {
        total: totalCount,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching bulk orders:", error);
    res.status(500).json({ error: "Failed to fetch bulk orders" });
  }
}

/**
 * Get bulk order by ID with items (admin and distributor)
 * GET /api/admin/bulk-orders/:id or GET /api/bulk-orders/:id
 */
export async function getBulkOrderByIdHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid bulk order ID" });
    }

    const userId = (req as any).user?.id;
    const isAdmin = (req as any).user?.role === "admin";

    // Get order
    const [order] = await db
      .select({
        id: bulkOrders.id,
        distributorId: bulkOrders.distributorId,
        totalAmount: bulkOrders.totalAmount,
        status: bulkOrders.status,
        notes: bulkOrders.notes,
        createdAt: bulkOrders.createdAt,
        updatedAt: bulkOrders.updatedAt,
        distributorName: users.name,
        distributorEmail: users.email,
        distributorUsername: users.username,
      })
      .from(bulkOrders)
      .leftJoin(users, eq(bulkOrders.distributorId, users.id))
      .where(eq(bulkOrders.id, id))
      .limit(1);

    if (!order) {
      return res.status(404).json({ error: "Bulk order not found" });
    }

    // Check authorization - distributors can only see their own orders
    if (!isAdmin && order.distributorId !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get order items
    const items = await db
      .select({
        id: bulkOrderItems.id,
        bulkOrderId: bulkOrderItems.bulkOrderId,
        productId: bulkOrderItems.productId,
        orderType: bulkOrderItems.orderType,
        quantity: bulkOrderItems.quantity,
        unitPrice: bulkOrderItems.unitPrice,
        totalPrice: bulkOrderItems.totalPrice,
        createdAt: bulkOrderItems.createdAt,
        productName: products.name,
        productImage: products.imageUrl,
        productSku: products.sku,
      })
      .from(bulkOrderItems)
      .leftJoin(products, eq(bulkOrderItems.productId, products.id))
      .where(eq(bulkOrderItems.bulkOrderId, id));

    res.json({
      ...order,
      items,
    });
  } catch (error) {
    console.error("Error fetching bulk order:", error);
    res.status(500).json({ error: "Failed to fetch bulk order" });
  }
}

/**
 * Get bulk orders for logged-in distributor
 * GET /api/bulk-orders
 */
export async function getDistributorBulkOrdersHandler(
  req: Request,
  res: Response,
) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const orders = await db
      .select({
        id: bulkOrders.id,
        distributorId: bulkOrders.distributorId,
        totalAmount: bulkOrders.totalAmount,
        status: bulkOrders.status,
        notes: bulkOrders.notes,
        createdAt: bulkOrders.createdAt,
        updatedAt: bulkOrders.updatedAt,
      })
      .from(bulkOrders)
      .where(eq(bulkOrders.distributorId, userId))
      .orderBy(desc(bulkOrders.createdAt));

    res.json(orders);
  } catch (error) {
    console.error("Error fetching distributor bulk orders:", error);
    res.status(500).json({ error: "Failed to fetch bulk orders" });
  }
}

/**
 * Update bulk order status (admin only)
 * PATCH /api/admin/bulk-orders/:id
 */
export async function updateBulkOrderStatusHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid bulk order ID" });
    }

    const statusSchema = z.object({
      status: z.enum(["pending", "approved", "rejected"]),
      notes: z.string().optional(),
    });

    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid status data",
        details: parsed.error.errors,
      });
    }

    const { status, notes } = parsed.data;

    const [updated] = await db
      .update(bulkOrders)
      .set({
        status,
        notes: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(bulkOrders.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Bulk order not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating bulk order status:", error);
    res.status(500).json({ error: "Failed to update bulk order status" });
  }
}

/**
 * Delete bulk order (admin only)
 * DELETE /api/admin/bulk-orders/:id
 */
export async function deleteBulkOrderHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid bulk order ID" });
    }

    // Get bulk order details first
    const [bulkOrder] = await db
      .select()
      .from(bulkOrders)
      .where(eq(bulkOrders.id, id))
      .limit(1);

    if (!bulkOrder) {
      return res.status(404).json({ error: "Bulk order not found" });
    }

    // Get distributor record
    const [distributor] = await db
      .select()
      .from(distributors)
      .where(eq(distributors.userId, bulkOrder.distributorId))
      .limit(1);

    // Delete in transaction to ensure data consistency
    await db.transaction(async (tx) => {
      // Step 1: Delete the ledger entry for this bulk order
      if (distributor) {
        const deletedLedgerEntries = await tx
          .delete(distributorLedger)
          .where(
            and(
              eq(distributorLedger.orderId, id),
              eq(distributorLedger.orderType, "bulk")
            )
          )
          .returning();

        if (deletedLedgerEntries.length > 0) {
          const deletedEntry = deletedLedgerEntries[0];

          // Step 2: Get all ledger entries after the deleted one for balance recalculation
          const subsequentEntries = await tx
            .select()
            .from(distributorLedger)
            .where(
              and(
                eq(distributorLedger.distributorId, distributor.id),
                sql`${distributorLedger.id} > ${deletedEntry.id}`
              )
            )
            .orderBy(distributorLedger.id);

          // Step 3: Recalculate balances for subsequent entries
          if (subsequentEntries.length > 0) {
            // Get the previous balance (before the deleted entry)
            const [previousEntry] = await tx
              .select()
              .from(distributorLedger)
              .where(
                and(
                  eq(distributorLedger.distributorId, distributor.id),
                  sql`${distributorLedger.id} < ${deletedEntry.id}`
                )
              )
              .orderBy(desc(distributorLedger.id))
              .limit(1);

            let runningBalance = previousEntry ? previousEntry.balanceAfter : 0;

            // Update each subsequent entry with recalculated balance
            for (const entry of subsequentEntries) {
              runningBalance += entry.amount;
              await tx
                .update(distributorLedger)
                .set({ balanceAfter: runningBalance })
                .where(eq(distributorLedger.id, entry.id));
            }

            // Update distributor's current balance
            await tx
              .update(distributors)
              .set({ currentBalance: runningBalance })
              .where(eq(distributors.id, distributor.id));
          } else {
            // No subsequent entries, so calculate balance from last remaining entry
            const [lastEntry] = await tx
              .select()
              .from(distributorLedger)
              .where(eq(distributorLedger.distributorId, distributor.id))
              .orderBy(desc(distributorLedger.id))
              .limit(1);

            const newBalance = lastEntry ? lastEntry.balanceAfter : 0;
            await tx
              .update(distributors)
              .set({ currentBalance: newBalance })
              .where(eq(distributors.id, distributor.id));
          }

          // Step 4: Update distributor's totalOrdered
          const orderAmount = Math.round(parseFloat(bulkOrder.totalAmount));
          await tx
            .update(distributors)
            .set({
              totalOrdered: sql`${distributors.totalOrdered} - ${orderAmount}`,
            })
            .where(eq(distributors.id, distributor.id));

          console.log(
            `Deleted ledger entry for bulk order ${id}, recalculated balances for distributor ${distributor.id}`
          );
        }
      }

      // Step 5: Delete the bulk order (cascade will delete bulk order items)
      await tx.delete(bulkOrders).where(eq(bulkOrders.id, id));
    });

    res.json({
      message: "Bulk order and associated ledger entries deleted successfully",
      orderId: id,
    });
  } catch (error) {
    console.error("Error deleting bulk order:", error);
    res.status(500).json({ error: "Failed to delete bulk order" });
  }
}

/**
 * Get bulk order statistics (admin dashboard)
 * GET /api/admin/bulk-orders/stats
 */
export async function getBulkOrderStatsHandler(req: Request, res: Response) {
  try {
    const stats = await db
      .select({
        status: bulkOrders.status,
        count: sql<number>`COUNT(*)::int`,
        totalAmount: sql<string>`SUM(${bulkOrders.totalAmount})::text`,
      })
      .from(bulkOrders)
      .groupBy(bulkOrders.status);

    const totalOrders = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(bulkOrders);

    res.json({
      byStatus: stats,
      total: totalOrders[0]?.count || 0,
    });
  } catch (error) {
    console.error("Error fetching bulk order stats:", error);
    res.status(500).json({ error: "Failed to fetch bulk order statistics" });
  }
}
