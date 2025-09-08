import { Request, Response } from "express";
import { storage } from "../storage";
import { InsertSellerPayment } from "@shared/schema";
import { z } from "zod";

// Get all payments for a seller
export async function getSellerPaymentsHandler(req: Request, res: Response) {
  try {
    const sellerId = parseInt(
      req.params.sellerId || req.user?.id?.toString() || "0"
    );

    if (!sellerId) {
      return res.status(400).json({ error: "Seller ID is required" });
    }

    // If this is not an admin or the seller themselves, deny access
    if (req.user?.role !== "admin" && req.user?.id !== sellerId) {
      return res
        .status(403)
        .json({ error: "You do not have permission to view these payments" });
    }

    const payments = await storage.getSellerPayments(sellerId);

    return res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching seller payments:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get a specific payment by ID
export async function getSellerPaymentByIdHandler(req: Request, res: Response) {
  try {
    const paymentId = parseInt(req.params.id);

    if (isNaN(paymentId)) {
      return res.status(400).json({ error: "Invalid payment ID" });
    }

    const payment = await storage.getSellerPaymentById(paymentId);

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // If this is not an admin or the seller themselves, deny access
    if (req.user?.role !== "admin" && req.user?.id !== payment.sellerId) {
      return res
        .status(403)
        .json({ error: "You do not have permission to view this payment" });
    }

    return res.status(200).json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Create a new payment (admin only)
export async function createSellerPaymentHandler(req: Request, res: Response) {
  try {
    // Only admins can create payments
    if (req.user?.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only administrators can create payments" });
    }

    const paymentSchema = z.object({
      sellerId: z.number(),
      amount: z.number().positive(),
      status: z.string().default("pending"),
      paymentDate: z
        .string()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
      referenceId: z.string().optional(),
      paymentMethod: z.string().optional(),
      notes: z.string().optional(),
    });

    const validatedData = paymentSchema.parse(req.body);

    const newPayment = await storage.createSellerPayment(
      validatedData as InsertSellerPayment
    );

    return res.status(201).json(newPayment);
  } catch (error) {
    console.error("Error creating payment:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Update payment status (admin only)
export async function updateSellerPaymentHandler(req: Request, res: Response) {
  try {
    // Only admins can update payments
    if (req.user?.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only administrators can update payments" });
    }

    const paymentId = parseInt(req.params.id);

    if (isNaN(paymentId)) {
      return res.status(400).json({ error: "Invalid payment ID" });
    }

    const payment = await storage.getSellerPaymentById(paymentId);

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const paymentSchema = z.object({
      status: z.string().optional(),
      paymentDate: z
        .string()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
      referenceId: z.string().optional(),
      notes: z.string().optional(),
    });

    const validatedData = paymentSchema.parse(req.body);

    const updatedPayment = await storage.updateSellerPayment(
      paymentId,
      validatedData
    );

    return res.status(200).json(updatedPayment);
  } catch (error) {
    console.error("Error updating payment:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get payment summary for a seller
export async function getSellerPaymentsSummaryHandler(
  req: Request,
  res: Response
) {
  try {
    const sellerId = parseInt(
      req.params.sellerId || req.user?.id?.toString() || "0"
    );

    if (!sellerId) {
      return res.status(400).json({ error: "Seller ID is required" });
    }

    // If this is not an admin or the seller themselves, deny access
    if (req.user?.role !== "admin" && req.user?.id !== sellerId) {
      return res.status(403).json({
        error: "You do not have permission to view this payment summary",
      });
    }

    const payments = await storage.getSellerPayments(sellerId);

    // Calculate payment totals
    let totalPaid = 0;
    let totalPending = 0;
    let pendingPayments = 0;
    let completedPayments = 0;

    payments.forEach((payment) => {
      if (payment.status === "completed") {
        totalPaid += Number(payment.amount);
        completedPayments++;
      } else if (payment.status === "pending") {
        totalPending += Number(payment.amount);
        pendingPayments++;
      }
    });

    // Get delivered orders for this seller
    const orders = await storage.getOrders(undefined, sellerId);
    const deliveredOrders = orders.filter(
      (order) => order.status === "delivered"
    );

    // Calculate delivered orders total based on purchase prices
    let deliveredOrdersTotal = 0;
    let deliveredOrdersCount = deliveredOrders.length;
    let availableForPayment = 0; // Orders available for payment (15+ days after delivery)
    let pendingPayment = 0; // Orders delivered but not yet 15 days old

    const currentDate = new Date();
    const fifteenDaysAgo = new Date(
      currentDate.getTime() - 15 * 24 * 60 * 60 * 1000
    );

    for (const order of deliveredOrders) {
      try {
        // Get delivery date from shipping tracking first
        const shippingTracking = await storage.getShippingTracking(order.id);
        let deliveryDate = shippingTracking?.deliveredDate
          ? new Date(shippingTracking.deliveredDate)
          : null;

        // If no shipping tracking delivery date, use order's updatedAt as fallback
        // This assumes the order was marked as delivered when updatedAt was set
        if (!deliveryDate) {
          // For orders marked as delivered, use updatedAt as delivery date
          // Subtract 1 day to account for the time between delivery and status update
          if (order.updatedAt) {
            deliveryDate = new Date(order.updatedAt);
            // Check if the date is valid
            if (isNaN(deliveryDate.getTime())) {
              console.warn(
                `Invalid updatedAt date for order ${order.id}: ${order.updatedAt}`
              );
              deliveryDate = null;
            } else {
              deliveryDate.setDate(deliveryDate.getDate() - 1);
              console.log(
                `Using fallback delivery date for order ${order.id}: ${deliveryDate.toISOString()}`
              );
            }
          } else {
            console.warn(`No updatedAt date for order ${order.id}`);
            deliveryDate = null;
          }
        }

        const orderItems = await storage.getOrderItems(order.id);
        // Filter items that belong to this seller
        const sellerItems = orderItems.filter((item) => {
          // Check if the product belongs to this seller
          return item.product && item.product.sellerId === sellerId;
        });

        // Calculate order total for this seller
        let orderTotal = 0;
        sellerItems.forEach((item) => {
          orderTotal += Number(item.price) * item.quantity;
        });

        deliveredOrdersTotal += orderTotal;

        // Check if 15 days have passed since delivery
        // Use delivery date if available, otherwise use order creation date
        let checkDate = deliveryDate;

        if (!checkDate) {
          if (order.createdAt) {
            checkDate = new Date(order.createdAt);
            // Check if the date is valid
            if (isNaN(checkDate.getTime())) {
              console.warn(
                `Invalid createdAt date for order ${order.id}: ${order.createdAt}`
              );
              checkDate = null;
            }
          } else {
            console.warn(`No createdAt date for order ${order.id}`);
            checkDate = null;
          }
        }

        if (checkDate) {
          const daysDifference = Math.floor(
            (currentDate.getTime() - checkDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          if (daysDifference >= 15) {
            availableForPayment += orderTotal;
            console.log(
              `Order ${order.id} is available for payment (${daysDifference} days old, date: ${checkDate.toISOString()})`
            );
          } else {
            pendingPayment += orderTotal;
            console.log(
              `Order ${order.id} is pending payment (${daysDifference} days old, date: ${checkDate.toISOString()})`
            );
          }
        } else {
          // If we can't determine any valid date, assume it's very old and available
          availableForPayment += orderTotal;
          console.log(
            `Order ${order.id} is available for payment (no valid date - assuming old order)`
          );
        }
      } catch (error) {
        console.error(
          `Error fetching order items for order ${order.id}:`,
          error
        );
      }
    }

    // Calculate withdrawals (negative payments)
    let totalWithdrawals = 0;
    payments.forEach((payment) => {
      if (payment.status === "completed" && Number(payment.amount) < 0) {
        totalWithdrawals += Math.abs(Number(payment.amount));
      }
    });

    // Available balance = orders available for payment (15+ days after delivery) - withdrawals
    const availableBalance = availableForPayment - totalWithdrawals;

    // Get the latest 5 payments
    const recentPayments = payments.slice(0, 5);

    const summary = {
      // Existing payment data
      totalPaid,
      totalPending,
      pendingPayments,
      completedPayments,
      totalPayments: payments.length,
      recentPayments,

      // New delivered orders data
      deliveredOrdersTotal,
      deliveredOrdersCount,

      // 15-day payment processing fields
      availableForPayment, // Orders available for payment (15+ days after delivery)
      pendingPayment, // Orders delivered but not yet 15 days old
      availableBalance: Math.max(0, availableBalance), // Available balance after 15-day delay
      totalWithdrawals,

      // Legacy fields for backward compatibility
      pendingBalance: pendingPayment, // Now shows orders pending 15-day period
      lifetimeEarnings: deliveredOrdersTotal,
      nextPayoutAmount: availableForPayment, // Next payout will be from available orders
      nextPayoutDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(), // Next Monday
      growthRate: 0,
    };

    return res.status(200).json(summary);
  } catch (error) {
    console.error("Error fetching payment summary:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Request payment for available balance
export async function requestSellerPaymentHandler(req: Request, res: Response) {
  try {
    const sellerId = req.user?.id;

    if (!sellerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (req.user?.role !== "seller") {
      return res
        .status(403)
        .json({ error: "Only sellers can request payments" });
    }

    const requestSchema = z.object({
      amount: z.number().positive("Amount must be positive"),
      notes: z.string().optional(),
    });

    const validatedData = requestSchema.parse(req.body);

    // Get current payment summary to validate available balance
    const payments = await storage.getSellerPayments(sellerId);
    const orders = await storage.getOrders(undefined, sellerId);
    const deliveredOrders = orders.filter(
      (order) => order.status === "delivered"
    );

    let availableForPayment = 0;
    const currentDate = new Date();
    const fifteenDaysAgo = new Date(
      currentDate.getTime() - 15 * 24 * 60 * 60 * 1000
    );

    for (const order of deliveredOrders) {
      try {
        // Get delivery date from shipping tracking first
        const shippingTracking = await storage.getShippingTracking(order.id);
        let deliveryDate = shippingTracking?.deliveredDate
          ? new Date(shippingTracking.deliveredDate)
          : null;

        // If no shipping tracking delivery date, use order's updatedAt as fallback
        if (!deliveryDate) {
          if (order.updatedAt) {
            deliveryDate = new Date(order.updatedAt);
            // Check if the date is valid
            if (isNaN(deliveryDate.getTime())) {
              console.warn(
                `Invalid updatedAt date for order ${order.id}: ${order.updatedAt}`
              );
              deliveryDate = null;
            } else {
              deliveryDate.setDate(deliveryDate.getDate() - 1);
            }
          } else {
            console.warn(`No updatedAt date for order ${order.id}`);
            deliveryDate = null;
          }
        }

        const orderItems = await storage.getOrderItems(order.id);
        const sellerItems = orderItems.filter((item) => {
          return item.product && item.product.sellerId === sellerId;
        });

        let orderTotal = 0;
        sellerItems.forEach((item) => {
          orderTotal += Number(item.price) * item.quantity;
        });

        // Use delivery date if available, otherwise use order creation date
        let checkDate = deliveryDate;

        if (!checkDate) {
          if (order.createdAt) {
            checkDate = new Date(order.createdAt);
            // Check if the date is valid
            if (isNaN(checkDate.getTime())) {
              checkDate = null;
            }
          }
        }

        if (checkDate) {
          const daysDifference = Math.floor(
            (currentDate.getTime() - checkDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          if (daysDifference >= 15) {
            availableForPayment += orderTotal;
          }
        } else {
          // If we can't determine any valid date, assume it's very old and available
          availableForPayment += orderTotal;
        }
      } catch (error) {
        console.error(`Error processing order ${order.id}:`, error);
      }
    }

    // Calculate withdrawals
    let totalWithdrawals = 0;
    payments.forEach((payment) => {
      if (payment.status === "completed" && Number(payment.amount) < 0) {
        totalWithdrawals += Math.abs(Number(payment.amount));
      }
    });

    const availableBalance = availableForPayment - totalWithdrawals;

    if (validatedData.amount > availableBalance) {
      return res.status(400).json({
        error: "Insufficient available balance",
        availableBalance: Math.max(0, availableBalance),
      });
    }

    // Create payment request record
    const paymentRequest = await storage.createSellerPayment({
      sellerId,
      amount: -validatedData.amount, // Negative amount for withdrawal
      status: "pending",
      notes: validatedData.notes || "Payment request",
      paymentMethod: "bank_transfer",
    });

    return res.status(201).json({
      message: "Payment request submitted successfully",
      paymentRequest,
      availableBalance: Math.max(0, availableBalance - validatedData.amount),
    });
  } catch (error) {
    console.error("Error requesting payment:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}
