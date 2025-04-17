import { Request, Response } from 'express';
import { storage } from '../storage';
import * as shiprocketService from '../services/shiprocket';

// Push order to Shiprocket
export async function pushOrderToShiprocket(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.role || !['admin', 'co-admin', 'seller'].includes(req.user.role)) {
      return res.status(403).json({ error: 'You are not authorized to perform this action' });
    }

    const orderId = parseInt(req.params.orderId);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    // Get order and order items
    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is already pushed to Shiprocket
    if (order.shippingStatus === 'PUSHED_TO_SHIPROCKET') {
      return res.status(400).json({ error: 'Order already pushed to Shiprocket' });
    }

    const orderItems = await storage.getOrderItems(orderId);
    if (!orderItems || orderItems.length === 0) {
      return res.status(404).json({ error: 'Order items not found' });
    }

    // Push order to Shiprocket
    const shiprocketResponse = await shiprocketService.createShiprocketOrder(order, orderItems);

    // Update order with Shiprocket information
    const updatedOrder = await storage.updateOrder(orderId, {
      shippingStatus: 'PUSHED_TO_SHIPROCKET',
      shiprocketOrderId: shiprocketResponse.order_id || '',
      shiprocketShipmentId: shiprocketResponse.shipment_id || '',
      trackingDetails: JSON.stringify(shiprocketResponse)
    });

    return res.json({
      message: 'Order pushed to Shiprocket successfully',
      order: updatedOrder,
      shiprocketResponse
    });
  } catch (error) {
    console.error('Error pushing order to Shiprocket:', error);
    return res.status(500).json({ error: 'Failed to push order to Shiprocket' });
  }
}

// Track order in Shiprocket
export async function trackShiprocketOrder(req: Request, res: Response) {
  try {
    const orderId = parseInt(req.params.orderId);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    // Get order
    const order = await storage.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is pushed to Shiprocket
    if (!order.shiprocketOrderId) {
      return res.status(400).json({ error: 'Order not yet pushed to Shiprocket' });
    }

    // Track order in Shiprocket
    const trackingResponse = await shiprocketService.trackShiprocketOrder(order.shiprocketOrderId);

    return res.json(trackingResponse);
  } catch (error) {
    console.error('Error tracking order in Shiprocket:', error);
    return res.status(500).json({ error: 'Failed to track order in Shiprocket' });
  }
}

// Cancel order in Shiprocket
export async function cancelShiprocketOrder(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.role || !['admin', 'co-admin', 'seller'].includes(req.user.role)) {
      return res.status(403).json({ error: 'You are not authorized to perform this action' });
    }

    const orderId = parseInt(req.params.orderId);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    // Get order
    const order = await storage.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is pushed to Shiprocket
    if (!order.shiprocketOrderId) {
      return res.status(400).json({ error: 'Order not yet pushed to Shiprocket' });
    }

    // Cancel order in Shiprocket
    const cancelResponse = await shiprocketService.cancelShiprocketOrder(order.shiprocketOrderId);

    // Update order with cancelled status
    const updatedOrder = await storage.updateOrder(orderId, {
      shippingStatus: 'CANCELLED_IN_SHIPROCKET',
      trackingDetails: JSON.stringify({
        ...JSON.parse(order.trackingDetails || '{}'),
        cancellation: cancelResponse
      })
    });

    return res.json({
      message: 'Order cancelled in Shiprocket successfully',
      order: updatedOrder,
      cancelResponse
    });
  } catch (error) {
    console.error('Error cancelling order in Shiprocket:', error);
    return res.status(500).json({ error: 'Failed to cancel order in Shiprocket' });
  }
}

// Get shipping rates from Shiprocket
export async function getShippingRates(req: Request, res: Response) {
  try {
    const { pickup_postcode, delivery_postcode, weight, cod } = req.query;

    if (!pickup_postcode || !delivery_postcode || !weight) {
      return res.status(400).json({ 
        error: 'Missing required parameters. Please provide pickup_postcode, delivery_postcode, and weight'
      });
    }

    const pickupPostcode = pickup_postcode.toString();
    const deliveryPostcode = delivery_postcode.toString();
    const weightValue = parseFloat(weight.toString());
    const codValue = cod === 'true' || cod === '1';

    if (isNaN(weightValue)) {
      return res.status(400).json({ error: 'Weight must be a valid number' });
    }

    // Get shipping rates from Shiprocket
    const rates = await shiprocketService.getShippingRates(
      pickupPostcode,
      deliveryPostcode,
      weightValue,
      codValue
    );

    return res.json(rates);
  } catch (error) {
    console.error('Error getting shipping rates from Shiprocket:', error);
    return res.status(500).json({ error: 'Failed to get shipping rates from Shiprocket' });
  }
}

// Auto-push order to Shiprocket when order is placed
export async function autoCreateShiprocketOrder(order: any, orderItems: any[]) {
  try {
    console.log(`Auto pushing order ${order.id} to Shiprocket...`);
    
    // Push order to Shiprocket
    const shiprocketResponse = await shiprocketService.createShiprocketOrder(order, orderItems);
    
    // Update order with Shiprocket information
    await storage.updateOrder(order.id, {
      shippingStatus: 'PUSHED_TO_SHIPROCKET',
      shiprocketOrderId: shiprocketResponse.order_id || '',
      shiprocketShipmentId: shiprocketResponse.shipment_id || '',
      trackingDetails: JSON.stringify(shiprocketResponse)
    });
    
    console.log(`Order ${order.id} successfully pushed to Shiprocket.`);
    return shiprocketResponse;
  } catch (error) {
    console.error(`Failed to auto-push order ${order.id} to Shiprocket:`, error);
    // Don't throw error, just log it
    return null;
  }
}