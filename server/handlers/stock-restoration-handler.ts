/**
 * Stock Restoration Handler
 *
 * This file contains functions to restore product stock when orders are cancelled.
 */

import { storage } from "../storage";

/**
 * Restore product stock levels when an order is cancelled
 */
export async function restoreProductStock(orderItem: any): Promise<void> {
  try {
    // Determine if we need to restore variant stock or product stock
    const variantId =
      (orderItem as any).variant_id ?? (orderItem as any).variantId;
    if (variantId) {
      // Get the current variant
      const variant = await storage.getProductVariant(variantId);
      if (!variant) {
        throw new Error(`Variant ${variantId} not found`);
      }

      // If variant has its own stock tracking
      if (variant.stock !== null && variant.stock !== undefined) {
        // Calculate new stock level (restore the quantity)
        const newStock = variant.stock + orderItem.quantity;

        // Update variant stock
        await storage.updateProductVariantStock(variantId, newStock);
        console.log(
          `Restored variant ${variantId} stock from ${variant.stock} to ${newStock} (restored ${orderItem.quantity} units)`
        );

        return;
      }
    }

    // If no variant stock, restore the main product stock
    const product = await storage.getProduct(orderItem.productId);
    if (!product) {
      throw new Error(`Product ${orderItem.productId} not found`);
    }

    // Calculate new stock level (restore the quantity)
    const newStock = product.stock + orderItem.quantity;

    // Update product stock
    await storage.updateProductStock(orderItem.productId, newStock);
    console.log(
      `Restored product ${orderItem.productId} stock from ${product.stock} to ${newStock} (restored ${orderItem.quantity} units)`
    );
  } catch (error) {
    console.error(`Error restoring stock for order item:`, error);
    throw error;
  }
}

/**
 * Restore stock for all items in an order when it's cancelled
 */
export async function restoreOrderStock(orderId: number): Promise<void> {
  try {
    console.log(`Restoring stock for cancelled order #${orderId}`);

    // Get all order items for this order
    const orderItems = await storage.getOrderItems(orderId);

    if (!orderItems || orderItems.length === 0) {
      console.log(`No order items found for order #${orderId}`);
      return;
    }

    console.log(`Found ${orderItems.length} items to restore stock for`);

    // Restore stock for each item
    for (const item of orderItems) {
      try {
        await restoreProductStock(item);
        console.log(`Successfully restored stock for item ${item.id}`);
      } catch (itemError) {
        console.error(`Error restoring stock for item ${item.id}:`, itemError);
        // Continue with other items even if one fails
      }
    }

    console.log(`Stock restoration completed for order #${orderId}`);
  } catch (error) {
    console.error(`Error restoring order stock for order #${orderId}:`, error);
    throw error;
  }
}
