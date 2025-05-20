/**
 * Order Status Handler
 * 
 * This file contains functions to update order statuses and handle related business logic.
 */

import { storage } from "../storage";
import { sendEmail } from "../services/email-service";

/**
 * Handle order status change, including related business logic like refunds
 * @param orderId The ID of the order to update
 * @param status The new status to set
 * @returns The updated order
 */
export async function handleOrderStatusChange(
  orderId: number,
  status: string
) {
  try {
    console.log(`Handling order status change for order #${orderId} to ${status}`);
    
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
    
    // Process wallet refunds for cancellations
    if (status === 'cancelled' && order.walletCoinsUsed && order.walletCoinsUsed > 0) {
      console.log(`Processing wallet refund for order #${orderId}, coins used: ${order.walletCoinsUsed}`);
      
      try {
        // Refund coins to wallet
        const wallet = await storage.getWalletByUserId(order.userId);
        
        if (wallet) {
          const updatedWallet = await storage.adjustWallet(
            order.userId, 
            order.walletCoinsUsed, 
            'refund',
            `Refund for cancelled order #${orderId}`
          );
          
          console.log(`Refunded ${order.walletCoinsUsed} coins to wallet ID #${wallet.id}, new balance: ${updatedWallet.balance}`);
        } else {
          console.log(`No wallet found for user ID #${order.userId}, skipping wallet refund`);
        }
      } catch (walletError) {
        console.error(`Error processing wallet refund for order #${orderId}:`, walletError);
        // Continue with order cancellation even if wallet refund fails
      }
    }
    
    // Update the order status
    const updatedOrder = await storage.updateOrder(orderId, { status });
    console.log(`Updated order #${orderId} status to ${status}`);
    
    return updatedOrder;
  } catch (error) {
    console.error(`Error handling order status change for order #${orderId}:`, error);
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
    const orderItem = orderItems.find(item => item.id === orderItemId);
    
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
    const sellerOrder = sellerOrders.find(so => so.id === orderItem.sellerOrderId);
    
    if (!sellerOrder) {
      throw new Error("Seller order not found");
    }
    
    // Check if all items in the seller order have the same status
    const sellerOrderItems = orderItems.filter(item => item.sellerOrderId === sellerOrder.id);
    const allItemsHaveSameStatus = sellerOrderItems.every(item => item.status === status);
    
    // If all items have the same status, update the seller order status
    if (allItemsHaveSameStatus) {
      await storage.updateSellerOrderStatus(sellerOrder.id, status);
      
      // Notify the seller
      const seller = await storage.getUser(sellerOrder.sellerId);
      
      if (seller && seller.email) {
        await sendEmail({
          to: seller.email,
          subject: `Order #${orderId} Status Update`,
          template: "order-status-updated",
          data: {
            orderId,
            sellerOrderId: sellerOrder.id,
            status,
            sellerName: seller.username
          }
        });
      }
    }
    
    // Check if all seller orders have the same status
    const allSellerOrdersHaveSameStatus = sellerOrders.every(so => so.status === status);
    
    // If all seller orders have the same status, update the main order status
    if (allSellerOrdersHaveSameStatus) {
      await storage.updateOrder(orderId, { status });
      
      // Notify the buyer
      const buyer = await storage.getUser(order.userId);
      
      if (buyer && buyer.email) {
        await sendEmail({
          to: buyer.email,
          subject: `Your Order #${orderId} Status Update`,
          template: "order-status-updated-buyer",
          data: {
            orderId,
            status,
            buyerName: buyer.username
          }
        });
      }
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
}