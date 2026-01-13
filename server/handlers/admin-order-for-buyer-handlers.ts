import { Request, Response } from "express";
import { db } from "../db";
import {
  users,
  distributors,
  userAddresses,
  products,
  orders,
  orderItems,
  sellerOrders,
  insertUserAddressSchema,
} from "../../shared/schema";
import { eq, and, sql, or, ilike, isNull, desc } from "drizzle-orm";
import { z } from "zod";

/**
 * Get list of buyers (users who don't have distributor records)
 * GET /api/admin/buyers
 */
export async function getBuyersListHandler(req: Request, res: Response) {
  try {
    const search = (req.query.search as string) || "";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Build base query - get users with role 'buyer' who DON'T have distributor records
    let whereConditions = [
      eq(users.role, "buyer"),
      eq(users.deleted, false),
    ];

    if (search) {
      whereConditions.push(
        or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(users.phone, `%${search}%`),
          ilike(users.username, `%${search}%`)
        ) as any
      );
    }

    // Get users with left join to distributors table
    const buyersQuery = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        phone: users.phone,
        address: users.address,
        distributorId: distributors.id,
      })
      .from(users)
      .leftJoin(distributors, eq(users.id, distributors.userId))
      .where(and(...whereConditions))
      .limit(limit)
      .offset(offset);

    // Filter out users who have distributor records (distributorId is not null)
    const buyers = buyersQuery.filter((buyer) => buyer.distributorId === null);

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .leftJoin(distributors, eq(users.id, distributors.userId))
      .where(and(...whereConditions, isNull(distributors.id)));

    const total = countResult?.count || 0;

    res.json({
      buyers: buyers.map(({ distributorId, ...buyer }) => buyer),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching buyers list:", error);
    res.status(500).json({ error: "Failed to fetch buyers list" });
  }
}

/**
 * Get addresses for a specific buyer
 * GET /api/admin/buyers/:buyerId/addresses
 */
export async function getBuyerAddressesHandler(req: Request, res: Response) {
  try {
    const buyerId = parseInt(req.params.buyerId);

    if (isNaN(buyerId)) {
      return res.status(400).json({ error: "Invalid buyer ID" });
    }

    // Verify the buyer exists and is not a distributor
    const [buyer] = await db
      .select({
        id: users.id,
        distributorId: distributors.id,
      })
      .from(users)
      .leftJoin(distributors, eq(users.id, distributors.userId))
      .where(eq(users.id, buyerId))
      .limit(1);

    if (!buyer) {
      return res.status(404).json({ error: "Buyer not found" });
    }

    if (buyer.distributorId !== null) {
      return res.status(400).json({ error: "User is a distributor, not a buyer" });
    }

    // Get addresses
    const addresses = await db
      .select()
      .from(userAddresses)
      .where(and(eq(userAddresses.userId, buyerId), eq(userAddresses.deleted, false)))
      .orderBy(desc(userAddresses.isDefault), desc(userAddresses.createdAt));

    res.json(addresses);
  } catch (error) {
    console.error("Error fetching buyer addresses:", error);
    res.status(500).json({ error: "Failed to fetch buyer addresses" });
  }
}

/**
 * Create a new address for a buyer (admin action)
 * POST /api/admin/buyers/:buyerId/addresses
 */
export async function createBuyerAddressHandler(req: Request, res: Response) {
  try {
    const buyerId = parseInt(req.params.buyerId);

    if (isNaN(buyerId)) {
      return res.status(400).json({ error: "Invalid buyer ID" });
    }

    // Verify the buyer exists and is not a distributor
    const [buyer] = await db
      .select({
        id: users.id,
        distributorId: distributors.id,
      })
      .from(users)
      .leftJoin(distributors, eq(users.id, distributors.userId))
      .where(eq(users.id, buyerId))
      .limit(1);

    if (!buyer) {
      return res.status(404).json({ error: "Buyer not found" });
    }

    if (buyer.distributorId !== null) {
      return res.status(400).json({ error: "User is a distributor, not a buyer" });
    }

    // Validate the input data
    const addressData = insertUserAddressSchema.parse({
      ...req.body,
      userId: buyerId,
    });

    // Create the address
    const [newAddress] = await db
      .insert(userAddresses)
      .values(addressData)
      .returning();

    res.status(201).json(newAddress);
  } catch (error) {
    console.error("Error creating buyer address:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create buyer address" });
  }
}

/**
 * Get products for order placement
 * GET /api/admin/products-for-order
 */
export async function getProductsForOrderHandler(req: Request, res: Response) {
  try {
    const search = (req.query.search as string) || "";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [
      eq(products.approved, true),
      eq(products.deleted, false),
    ];

    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.sku, `%${search}%`),
          ilike(products.category, `%${search}%`)
        ) as any
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
        mrp: products.mrp,
        stock: products.stock,
        imageUrl: products.imageUrl,
        category: products.category,
        gstRate: products.gstRate,
        deliveryCharges: products.deliveryCharges,
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
 * Create order for buyer (admin action)
 * POST /api/admin/orders-for-buyer
 */
export async function createOrderForBuyerHandler(req: Request, res: Response) {
  try {
    const {
      buyerId,
      addressId,
      items,
      paymentMethod = "cod",
    } = req.body;

    // Validate input
    const orderSchema = z.object({
      buyerId: z.number().int().positive(),
      addressId: z.number().int().positive(),
      items: z
        .array(
          z.object({
            productId: z.number().int().positive(),
            quantity: z.number().int().positive(),
            variantId: z.number().int().positive().optional(),
          })
        )
        .min(1, "At least one item is required"),
      paymentMethod: z.string().default("cod"),
    });

    const parsed = orderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid order data",
        details: parsed.error.errors,
      });
    }

    const validatedData = parsed.data;

    // Verify the buyer exists and is not a distributor
    const [buyer] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        distributorId: distributors.id,
      })
      .from(users)
      .leftJoin(distributors, eq(users.id, distributors.userId))
      .where(eq(users.id, validatedData.buyerId))
      .limit(1);

    if (!buyer) {
      return res.status(404).json({ error: "Buyer not found" });
    }

    if (buyer.distributorId !== null) {
      return res.status(400).json({ error: "User is a distributor, not a buyer" });
    }

    // Verify address exists and belongs to buyer
    const [address] = await db
      .select()
      .from(userAddresses)
      .where(
        and(
          eq(userAddresses.id, validatedData.addressId),
          eq(userAddresses.userId, validatedData.buyerId)
        )
      )
      .limit(1);

    if (!address) {
      return res.status(404).json({ error: "Address not found or doesn't belong to buyer" });
    }

    // Validate stock and calculate totals
    const itemsData: {
      productId: number;
      variantId: number | null;
      quantity: number;
      price: number;
      sellerId: number | null;
    }[] = [];
    let total = 0;
    const sellerMap = new Map<number, { subtotal: number; deliveryCharge: number; items: any[] }>();

    for (const item of validatedData.items) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product) {
        return res.status(404).json({ error: `Product not found: ${item.productId}` });
      }

      if (!product.approved) {
        return res.status(400).json({ error: `Product not approved: ${product.name}` });
      }

      // Check stock
      let availableStock = product.stock;
      if (item.variantId) {
        // Would need to check variant stock here if using variants
      }

      if (item.quantity > availableStock) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Only ${availableStock} units available.`,
        });
      }

      const itemTotal = item.quantity * product.price;
      total += itemTotal;

      const itemData = {
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        price: product.price,
        sellerId: product.sellerId,
      };

      itemsData.push(itemData);

      // Group by seller
      if (product.sellerId) {
        if (!sellerMap.has(product.sellerId)) {
          sellerMap.set(product.sellerId, {
            subtotal: 0,
            deliveryCharge: product.deliveryCharges || 0,
            items: [],
          });
        }
        const sellerData = sellerMap.get(product.sellerId)!;
        sellerData.subtotal += itemTotal;
        sellerData.items.push(itemData);
      }
    }

    // Calculate delivery charges
    const totalDeliveryCharges = Array.from(sellerMap.values()).reduce(
      (sum, seller) => sum + seller.deliveryCharge,
      0
    );
    total += totalDeliveryCharges;

    // Create order in transaction
    const result = await db.transaction(async (tx) => {
      // Create main order with proper shipping details structure
      const [order] = await tx
        .insert(orders)
        .values({
          userId: validatedData.buyerId,
          addressId: validatedData.addressId,
          status: "pending",
          total: total,
          date: new Date(),
          paymentMethod: "prepaid", // Admin orders are marked as prepaid
          shippingDetails: JSON.stringify({
            name: address.fullName,
            fullName: address.fullName,
            email: buyer.email, // Include buyer email
            address: address.address,
            address1: address.address,
            city: address.city,
            state: address.state,
            zipCode: address.pincode,
            pincode: address.pincode,
            country: "India",
            phone: address.phone,
          }),
          walletDiscount: 0,
          walletCoinsUsed: 0,
          redeemDiscount: 0,
          redeemCoinsUsed: 0,
          rewardDiscount: 0,
          rewardPointsUsed: 0,
          couponDiscount: 0,
        })
        .returning();

      // Create order items
      const createdItems = await tx
        .insert(orderItems)
        .values(
          itemsData.map((item) => ({
            ...item,
            orderId: order.id,
          }))
        )
        .returning();

      // Create seller orders if multi-seller
      if (sellerMap.size > 0) {
        const sellerOrdersData = Array.from(sellerMap.entries()).map(
          ([sellerId, data]) => ({
            orderId: order.id,
            sellerId: sellerId,
            subtotal: data.subtotal,
            deliveryCharge: data.deliveryCharge,
            status: "pending",
          })
        );

        await tx.insert(sellerOrders).values(sellerOrdersData);
      }

      // Update product stock
      for (const item of itemsData) {
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
          })
          .where(eq(products.id, item.productId));
      }

      return { order, items: createdItems };
    });

    res.status(201).json({
      message: "Order created successfully",
      order: result.order,
      items: result.items,
    });
  } catch (error) {
    console.error("Error creating order for buyer:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create order" });
  }
}

/**
 * Preview invoice for buyer order
 * POST /api/admin/orders-for-buyer/preview-invoice
 */
export async function previewInvoiceForBuyerHandler(req: Request, res: Response) {
  try {
    const { buyerId, addressId, items } = req.body;

    // Validate input
    if (!buyerId || !addressId || !items || items.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get buyer details
    const [buyer] = await db
      .select()
      .from(users)
      .where(eq(users.id, buyerId))
      .limit(1);

    if (!buyer) {
      return res.status(404).json({ error: "Buyer not found" });
    }

    // Get address details
    const [address] = await db
      .select()
      .from(userAddresses)
      .where(eq(userAddresses.id, addressId))
      .limit(1);

    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    // Get product details for each item
    const itemsWithDetails = await Promise.all(
      items.map(async (item: any) => {
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const price = product.price;
        const gstRate = parseFloat(product.gstRate as any) || 0;
        const totalPrice = item.quantity * price;

        // Extract taxable value and GST amount from inclusive price
        const taxableValue =
          gstRate > 0 ? totalPrice / (1 + gstRate / 100) : totalPrice;
        const gstAmount = totalPrice - taxableValue;

        return {
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          price: price,
          gstRate: gstRate,
          mrp: product.mrp || price,
          taxableValue: taxableValue,
          gstAmount: gstAmount,
          total: totalPrice,
          deliveryCharges: product.deliveryCharges || 0,
        };
      })
    );

    res.json({
      buyer: {
        id: buyer.id,
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone,
      },
      address: {
        fullName: address.fullName,
        address: address.address,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        phone: address.phone,
      },
      items: itemsWithDetails,
      summary: {
        subtotal: itemsWithDetails.reduce((sum, item) => sum + item.total, 0),
        deliveryCharges: itemsWithDetails.reduce((sum, item) => sum + item.deliveryCharges, 0),
        total: itemsWithDetails.reduce((sum, item) => sum + item.total + item.deliveryCharges, 0),
      },
    });
  } catch (error) {
    console.error("Error generating preview:", error);
    res.status(500).json({ error: "Failed to generate invoice preview" });
  }
}
