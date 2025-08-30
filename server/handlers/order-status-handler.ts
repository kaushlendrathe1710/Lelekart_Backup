/**
 * Order Status Handler
 *
 * This file contains functions to update order statuses and handle related business logic.
 */

import { storage } from "../storage";
import { sendEmail } from "../services/email-service";
import { sendNotificationToUser } from "../websocket";

/**
 * Validate if an email template exists
 * @param templateName The name of the template to validate
 * @returns Promise<boolean> True if template exists, false otherwise
 */
async function validateEmailTemplate(templateName: string): Promise<boolean> {
  try {
    // Import the template service to check if template exists
    const { getTemplate } = await import("../services/template-service");
    const template = await getTemplate(templateName);
    return !!template;
  } catch (error) {
    console.warn(`Failed to validate email template "${templateName}":`, error);
    return false;
  }
}

/**
 * Handle order status change, including related business logic like refunds
 * @param orderId The ID of the order to update
 * @param status The new status to set
 * @returns The updated order
 */
export async function handleOrderStatusChange(orderId: number, status: string) {
  try {
    console.log(
      `Handling order status change for order #${orderId} to ${status}`
    );

    // Get current order
    const order = await storage.getOrder(orderId);
    if (!order) {
      throw new Error(`Order #${orderId} not found`);
    }

    // If status is already the target status, just return the order
    if (order.status === status) {
      console.log(`Order #${orderId} is already in ${status} status`);
      return order;
    }

    // Validate that the status parameter is a valid order status
    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "returned",
      "refunded",
      "replaced",
      "cancelled",
      "approve_return",
      "reject_return",
      "process_return",
      "completed_return",
    ];

    if (!validStatuses.includes(status)) {
      throw new Error(
        `Invalid status "${status}". Valid statuses are: ${validStatuses.join(", ")}`
      );
    }

    // Add status transition validation
    const validTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered", "returned", "cancelled"],
      delivered: ["returned"],
      returned: ["refunded", "replaced"],
      refunded: [],
      replaced: ["shipped"],
      cancelled: [],
      approve_return: ["process_return"],
      reject_return: ["returned"],
      process_return: ["completed_return", "returned"],
      completed_return: [],
    };

    // Check if the transition is valid
    if (
      !validTransitions[order.status] ||
      !validTransitions[order.status].includes(status)
    ) {
      throw new Error(
        `Invalid status transition from "${order.status}" to "${status}". ` +
          `Valid transitions from "${order.status}" are: ${validTransitions[order.status].join(", ")}`
      );
    }

    // Add business rule validation
    if (status === "cancelled") {
      if (order.status === "delivered") {
        throw new Error(
          "Cannot cancel a delivered order. Please use return process instead."
        );
      }
      if (order.status === "shipped") {
        console.warn(
          `Order #${orderId} is being cancelled while shipped. This may require special handling.`
        );
      }
      if (order.status === "returned") {
        throw new Error("Cannot cancel an already returned order.");
      }
      if (order.status === "refunded") {
        throw new Error("Cannot cancel an already refunded order.");
      }
    }

    if (status === "delivered") {
      if (order.status !== "shipped") {
        throw new Error(
          "Order must be shipped before it can be marked as delivered."
        );
      }
    }

    if (status === "shipped") {
      if (order.status !== "processing") {
        throw new Error(
          "Order must be in processing status before it can be shipped."
        );
      }
    }

    if (status === "returned") {
      if (!["delivered", "shipped"].includes(order.status)) {
        throw new Error(
          "Order must be delivered or shipped before it can be returned."
        );
      }
    }

    if (status === "refunded") {
      if (order.status !== "returned") {
        throw new Error("Order must be returned before it can be refunded.");
      }
    }

    if (status === "replaced") {
      if (order.status !== "returned") {
        throw new Error("Order must be returned before it can be replaced.");
      }
    }

    // Update the order status first (fast path)
    console.log(
      `Current order status: ${order.status}, Next status: ${status}`
    );
    let updatedOrder;
    try {
      // Use fast update for common status transitions to improve performance
      const commonFastTransitions = [
        "delivered",
        "shipped",
        "processing",
        "confirmed",
      ];
      if (commonFastTransitions.includes(status)) {
        updatedOrder = await storage.fastUpdateOrderStatus(orderId, status);
      } else {
        updatedOrder = await storage.updateOrderStatus(orderId, status);
      }
    } catch (err) {
      console.error("Error updating order status:", err);
      throw new Error(
        "Order status update failed: " +
          (err && err.message ? err.message : err)
      );
    }
    console.log(`Updated order #${orderId} status to ${status}`);

    // Process wallet refunds for cancellations (async - don't block the response)
    if (
      status === "cancelled" &&
      order.walletCoinsUsed &&
      order.walletCoinsUsed > 0
    ) {
      console.log(
        `Processing wallet refund for order #${orderId}, coins used: ${order.walletCoinsUsed}`
      );

      // Process wallet refund asynchronously
      processWalletRefund(orderId, order.userId, order.walletCoinsUsed).catch(
        (walletError) => {
          console.error(
            `Error processing wallet refund for order #${orderId}:`,
            walletError
          );
        }
      );
    }

    // Restore stock for cancelled orders (async - don't block the response)
    if (status === "cancelled") {
      console.log(
        `Processing stock restoration for cancelled order #${orderId}`
      );

      // Import and call stock restoration function asynchronously
      import("./stock-restoration-handler")
        .then(({ restoreOrderStock }) => {
          return restoreOrderStock(orderId);
        })
        .catch((stockError) => {
          console.error(
            `Error restoring stock for cancelled order #${orderId}:`,
            stockError
          );
        });
    }

    // Send notifications asynchronously (don't block the response)
    sendNotificationsAsync(orderId, status, order.userId).catch((error) => {
      console.error(
        `Error sending notifications for order #${orderId}:`,
        error
      );
    });

    // Custom logic for return-related statuses (approve_return, reject_return, process_return, completed_return)
    if (
      [
        "approve_return",
        "reject_return",
        "process_return",
        "completed_return",
      ].includes(status)
    ) {
      // Add business logic for return-related statuses
      if (status === "approve_return") {
        if (order.status !== "pending" && order.status !== "confirmed") {
          throw new Error(
            "Return can only be approved for pending or confirmed orders."
          );
        }
      }

      if (status === "process_return") {
        if (order.status !== "approve_return") {
          throw new Error("Return can only be processed after approval.");
        }
      }

      if (status === "completed_return") {
        if (order.status !== "process_return") {
          throw new Error("Return can only be completed after processing.");
        }
      }
    }

    return updatedOrder;
  } catch (error) {
    console.error(
      `Error handling order status change for order #${orderId}:`,
      error
    );
    throw error;
  }
}

/**
 * Process wallet refund asynchronously
 */
async function processWalletRefund(
  orderId: number,
  userId: number,
  coinsUsed: number
) {
  try {
    // Refund coins to wallet
    const wallet = await storage.getWalletByUserId(userId);

    if (wallet) {
      const updatedWallet = await storage.adjustWallet(
        userId,
        coinsUsed,
        "refund",
        `Refund for cancelled order #${orderId}`
      );

      console.log(
        `Refunded ${coinsUsed} coins to wallet ID #${wallet.id}, new balance: ${updatedWallet.balance}`
      );
    } else {
      console.log(
        `No wallet found for user ID #${userId}, skipping wallet refund`
      );
    }
  } catch (walletError) {
    console.error(
      `Error processing wallet refund for order #${orderId}:`,
      walletError
    );
    throw walletError;
  }
}

/**
 * Send notifications asynchronously
 */
async function sendNotificationsAsync(
  orderId: number,
  status: string,
  userId: number
) {
  try {
    // Get admin users and send notifications in parallel
    const adminUsers = await storage.getAllAdminUsers(false); // false = exclude co-admins

    // Create notification promises for all admins
    const adminNotificationPromises = adminUsers.map(async (admin) => {
      const notificationData = {
        userId: admin.id,
        type: "ORDER_STATUS",
        title: `Order #${orderId} ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Order #${orderId} status updated to ${status}.`,
        read: false,
        link: `/admin/orders/${orderId}`,
        metadata: JSON.stringify({ orderId, status }),
      };

      // Send both database notification and websocket notification in parallel
      return Promise.all([
        storage.createNotification(notificationData),
        sendNotificationToUser(admin.id, notificationData),
      ]);
    });

    // Wait for all admin notifications to complete
    await Promise.all(adminNotificationPromises);

    console.log(
      `Sent notifications to ${adminUsers.length} admin users for order #${orderId}`
    );
  } catch (error) {
    console.error(`Error sending notifications for order #${orderId}:`, error);
    throw error;
  }
}

/**
 * Update the status of a specific order item
 */
export async function updateOrderStatus(
  orderId: number,
  orderItemId: number,
  status: string
): Promise<void> {
  try {
    // Get the order item
    const orderItems = await storage.getOrderItems(orderId);
    const orderItem = orderItems.find((item) => item.id === orderItemId);

    if (!orderItem) {
      throw new Error("Order item not found");
    }

    // Update the order item status
    await storage.updateOrderItem(orderItemId, { status });

    // Get the order
    const order = await storage.getOrder(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    // Get the seller order
    const sellerOrders = await storage.getSellerOrders(orderId);
    const sellerOrder = sellerOrders.find(
      (so) => so.id === orderItem.sellerOrderId
    );

    if (!sellerOrder) {
      throw new Error("Seller order not found");
    }

    // Check if all items in the seller order have the same status
    const sellerOrderItems = orderItems.filter(
      (item) => item.sellerOrderId === sellerOrder.id
    );
    const allItemsHaveSameStatus = sellerOrderItems.every(
      (item) => item.status === status
    );

    // If all items have the same status, update the seller order status
    if (allItemsHaveSameStatus) {
      await storage.updateSellerOrderStatus(sellerOrder.id, status);

      // Notify the seller
      const seller = await storage.getUser(sellerOrder.sellerId);

      if (seller && seller.email) {
        // Validate email template before sending
        const templateExists = await validateEmailTemplate(
          "order-status-updated"
        );
        if (templateExists) {
          await sendEmail({
            to: seller.email,
            subject: `Order #${orderId} Status Update`,
            template: "order-status-updated",
            data: {
              orderId,
              sellerOrderId: sellerOrder.id,
              status,
              sellerName: seller.username,
            },
          });
        } else {
          console.warn(
            `Email template "order-status-updated" not found. Skipping seller notification for order #${orderId}`
          );
        }
      }
      // Permanent in-app notification for seller
      if (seller) {
        const notifTitle = `Order #${orderId} ${status.charAt(0).toUpperCase() + status.slice(1)}`;
        const notifMsg = `Order #${orderId} (Seller Order #${sellerOrder.id}) status updated to ${status}.`;
        await storage.createNotification({
          userId: seller.id,
          type: "seller_order",
          title: notifTitle,
          message: notifMsg,
          read: false,
          link: `/seller/orders/${sellerOrder.id}`,
          metadata: JSON.stringify({
            orderId,
            sellerOrderId: sellerOrder.id,
            status,
          }),
        });
        await sendNotificationToUser(seller.id, {
          type: "seller_order",
          title: notifTitle,
          message: notifMsg,
          read: false,
          link: `/seller/orders/${sellerOrder.id}`,
          metadata: JSON.stringify({
            orderId,
            sellerOrderId: sellerOrder.id,
            status,
          }),
        });
      }
    }

    // Check if all seller orders have the same status
    const allSellerOrdersHaveSameStatus = sellerOrders.every(
      (so) => so.status === status
    );

    // If all seller orders have the same status, update the main order status
    if (allSellerOrdersHaveSameStatus) {
      await storage.updateOrder(orderId, { status });

      // Notify the buyer
      const buyer = await storage.getUser(order.userId);

      if (buyer && buyer.email) {
        // Validate email template before sending
        const templateExists = await validateEmailTemplate(
          "order-status-updated-buyer"
        );
        if (templateExists) {
          await sendEmail({
            to: buyer.email,
            subject: `Your Order #${orderId} Status Update`,
            template: "order-status-updated-buyer",
            data: {
              orderId,
              status,
              buyerName: buyer.username,
            },
          });
        } else {
          console.warn(
            `Email template "order-status-updated-buyer" not found. Skipping buyer notification for order #${orderId}`
          );
        }
      }
      // Send notification to buyer
      if (buyer) {
        await sendNotificationToUser(buyer.id, {
          type: "ORDER_STATUS",
          title: `Order #${orderId} ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `Your order #${orderId} has been ${status}.`,
          read: false,
          link: `/orders/${orderId}`,
          metadata: JSON.stringify({ orderId, status }),
        });
        // Note: Permanent notification is handled by the calling route to avoid duplicates
      }
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
}
