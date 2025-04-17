import { Request, Response } from 'express';
import { storage } from '../storage';
import { 
  createShiprocketOrder, 
  trackShiprocketOrder, 
  getShippingRates as getShiprocketRates,
  cancelShiprocketOrder 
} from '../services/shiprocket';

/**
 * Push an order to Shiprocket for shipping
 */
export async function pushOrderToShiprocket(req: Request, res: Response) {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    
    // Get order details
    const order = await storage.getOrderById(parseInt(orderId));
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Check if seller is not "self" - Shiprocket can only handle orders from external sellers
    if (!order.sellerId || order.sellerId === 0) {
      return res.status(400).json({ error: 'Order must be from a seller to use Shiprocket' });
    }
    
    // Get order items
    const orderItems = await storage.getOrderItems(order.id);
    
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ error: 'Order has no items' });
    }
    
    // Push order to Shiprocket
    const shiprocketResponse = await createShiprocketOrder(order, orderItems);
    
    // Update order with Shiprocket information
    if (shiprocketResponse && shiprocketResponse.shipment_id) {
      await storage.updateOrder(order.id, {
        shiprocketShipmentId: shiprocketResponse.shipment_id,
        shiprocketOrderId: shiprocketResponse.order_id,
        status: 'PROCESSING', // Update order status to reflect Shiprocket order creation
      });
      
      // If tracking provided, update that too
      if (shiprocketResponse.tracking_number) {
        await storage.createOrUpdateOrderShippingTracking({
          orderId: order.id,
          trackingId: shiprocketResponse.tracking_number,
          courierName: shiprocketResponse.courier_name || 'Shiprocket',
          trackingUrl: shiprocketResponse.tracking_url || `https://shiprocket.co/tracking/${shiprocketResponse.tracking_number}`,
        });
      }
      
      return res.json({
        message: 'Order successfully pushed to Shiprocket',
        shiprocketOrderId: shiprocketResponse.order_id,
        shipmentId: shiprocketResponse.shipment_id,
        trackingNumber: shiprocketResponse.tracking_number || null,
      });
    }
    
    // If we got here without the expected response format
    return res.status(500).json({
      error: 'Unexpected response from Shiprocket',
      details: shiprocketResponse
    });
    
  } catch (error) {
    console.error('Error pushing order to Shiprocket:', error);
    res.status(500).json({ 
      error: 'Failed to push order to Shiprocket',
      message: error.message
    });
  }
}

/**
 * Track an order in Shiprocket
 */
export async function trackShiprocketOrder(req: Request, res: Response) {
  try {
    const { trackingNumber } = req.params;
    
    if (!trackingNumber) {
      return res.status(400).json({ error: 'Tracking number is required' });
    }
    
    // Track order in Shiprocket
    const trackingDetails = await trackShiprocketOrder(trackingNumber);
    
    res.json(trackingDetails);
  } catch (error) {
    console.error('Error tracking order in Shiprocket:', error);
    res.status(500).json({ 
      error: 'Failed to track order in Shiprocket',
      message: error.message
    });
  }
}

/**
 * Cancel an order in Shiprocket
 */
export async function cancelShiprocketOrder(req: Request, res: Response) {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    
    // Get order details
    const order = await storage.getOrderById(parseInt(orderId));
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Check if the user has permission to cancel the order
    if (req.user.role !== 'admin' && req.user.role !== 'co-admin' && 
        order.userId !== req.user.id && order.sellerId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to cancel this order' });
    }
    
    // Check if order has Shiprocket ID
    if (!order.shiprocketOrderId) {
      return res.status(400).json({ error: 'Order is not associated with Shiprocket' });
    }
    
    // Cancel order in Shiprocket
    const cancelResponse = await cancelShiprocketOrder(order.shiprocketOrderId);
    
    // Update order status in our system
    await storage.updateOrder(order.id, {
      status: 'CANCELLED',
      cancellationReason: req.body.reason || 'Cancelled by user',
      cancelledAt: new Date().toISOString(),
    });
    
    res.json({
      message: 'Order successfully cancelled in Shiprocket',
      details: cancelResponse
    });
  } catch (error) {
    console.error('Error cancelling order in Shiprocket:', error);
    res.status(500).json({ 
      error: 'Failed to cancel order in Shiprocket',
      message: error.message
    });
  }
}

/**
 * Get shipping rates from Shiprocket
 */
export async function getShippingRates(req: Request, res: Response) {
  try {
    const { pickup_postcode, delivery_postcode, weight, cod } = req.query;
    
    if (!pickup_postcode || !delivery_postcode || !weight) {
      return res.status(400).json({ 
        error: 'Missing required parameters: pickup_postcode, delivery_postcode, weight' 
      });
    }
    
    // Convert and validate parameters
    const pickupPostcode = String(pickup_postcode);
    const deliveryPostcode = String(delivery_postcode);
    const weightValue = parseFloat(String(weight));
    const codValue = cod === 'true' || cod === '1';
    
    if (isNaN(weightValue)) {
      return res.status(400).json({ error: 'Weight must be a number' });
    }
    
    // Get shipping rates from Shiprocket
    const rates = await getShiprocketRates(
      pickupPostcode, 
      deliveryPostcode, 
      weightValue, 
      codValue
    );
    
    res.json(rates);
  } catch (error) {
    console.error('Error getting shipping rates from Shiprocket:', error);
    res.status(500).json({ 
      error: 'Failed to get shipping rates from Shiprocket',
      message: error.message
    });
  }
}