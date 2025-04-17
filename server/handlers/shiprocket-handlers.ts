import { Request, Response } from 'express';
import { storage } from '../storage';
import axios from 'axios';
import { ShiprocketService } from '../services/shiprocket';

let shiprocketService: ShiprocketService | null = null;

// Initialize Shiprocket service
async function initializeShiprocketService() {
  try {
    const settings = await storage.getShiprocketSettings();
    if (settings) {
      shiprocketService = new ShiprocketService(settings.email, settings.password);
      await shiprocketService.authenticate();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to initialize Shiprocket service:', error);
    return false;
  }
}

// Get Shiprocket settings
export async function getShiprocketSettings(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'co-admin')) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const settings = await storage.getShiprocketSettings();
    return res.json(settings || { email: '', password: '', token: '', tokenExpiry: null });
  } catch (error) {
    console.error('Error fetching Shiprocket settings:', error);
    return res.status(500).json({ error: 'Failed to fetch Shiprocket settings' });
  }
}

// Update Shiprocket settings
export async function updateShiprocketSettings(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'co-admin')) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Test authentication with Shiprocket
    const service = new ShiprocketService(email, password);
    
    try {
      await service.authenticate();
      
      // Save settings to database
      await storage.updateShiprocketSettings({
        email,
        password,
        token: service.token,
        tokenExpiry: service.tokenExpiry
      });
      
      return res.json({ success: true, message: 'Shiprocket settings updated successfully' });
    } catch (error) {
      console.error('Shiprocket authentication failed:', error);
      return res.status(400).json({ error: 'Invalid Shiprocket credentials' });
    }
  } catch (error) {
    console.error('Error updating Shiprocket settings:', error);
    return res.status(500).json({ error: 'Failed to update Shiprocket settings' });
  }
}

// Create a shipment using Shiprocket
export async function createShipment(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const orderId = parseInt(req.params.orderId);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    
    // Get order details
    const order = await storage.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Check authorization - only admin, co-admin, or the seller can create shipments
    const isAdmin = req.user.role === 'admin' || req.user.role === 'co-admin';
    const isSeller = req.user.role === 'seller' && order.sellerId === req.user.id;
    
    if (!isAdmin && !isSeller) {
      return res.status(403).json({ error: 'You do not have permission to create shipments for this order' });
    }
    
    // Check if order is in a valid state for shipping
    if (order.status !== 'processing') {
      return res.status(400).json({ 
        error: `Order cannot be shipped: Current status is ${order.status}. Only orders in 'processing' status can be shipped.` 
      });
    }
    
    // Check if order already has a shipment
    if (order.shiprocketOrderId || order.shiprocketShipmentId) {
      return res.status(400).json({ error: 'Shipment already created for this order' });
    }
    
    // Initialize Shiprocket service if not already initialized
    if (!shiprocketService) {
      const initialized = await initializeShiprocketService();
      if (!initialized) {
        return res.status(500).json({ 
          error: 'Shiprocket service not configured. Please set up your Shiprocket credentials in admin settings.' 
        });
      }
    }
    
    // Get order items
    const orderItems = await storage.getOrderItems(orderId);
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ error: 'Order has no items' });
    }
    
    // Parse shipping details
    let shippingDetails;
    try {
      shippingDetails = typeof order.shippingDetails === 'string' 
        ? JSON.parse(order.shippingDetails) 
        : order.shippingDetails;
    } catch (error) {
      return res.status(400).json({ error: 'Invalid shipping details' });
    }
    
    // Create shipment on Shiprocket
    try {
      const response = await shiprocketService.createOrder({
        order_id: `ORD-${order.id}`,
        order_date: new Date(order.date).toISOString().split('T')[0],
        pickup_location: "Primary",
        billing_customer_name: shippingDetails.name,
        billing_address: shippingDetails.address,
        billing_city: shippingDetails.city,
        billing_state: shippingDetails.state,
        billing_country: "India",
        billing_pincode: shippingDetails.zipCode,
        billing_email: shippingDetails.email,
        billing_phone: shippingDetails.phone,
        shipping_customer_name: shippingDetails.name,
        shipping_address: shippingDetails.address,
        shipping_city: shippingDetails.city,
        shipping_state: shippingDetails.state,
        shipping_country: "India",
        shipping_pincode: shippingDetails.zipCode,
        shipping_email: shippingDetails.email,
        shipping_phone: shippingDetails.phone,
        order_items: orderItems.map(item => ({
          name: item.product.name,
          sku: `PROD-${item.productId}`,
          units: item.quantity,
          selling_price: item.price,
          discount: 0,
          tax: 0,
        })),
        payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
        sub_total: order.total,
        length: 10,
        breadth: 10,
        height: 10,
        weight: 0.5,
      });
      
      // Update order with shipment details
      await storage.updateOrderShipment(orderId, {
        shiprocketOrderId: response.order_id.toString(),
        shiprocketShipmentId: response.shipment_id.toString(),
        status: 'shipped'
      });
      
      return res.json({
        success: true,
        message: 'Shipment created successfully',
        orderId: response.order_id,
        shipmentId: response.shipment_id
      });
    } catch (error) {
      console.error('Error creating Shiprocket shipment:', error);
      return res.status(500).json({ 
        error: error.response?.data?.message || 'Failed to create shipment with Shiprocket' 
      });
    }
  } catch (error) {
    console.error('Error creating shipment:', error);
    return res.status(500).json({ error: 'Failed to create shipment' });
  }
}

// Cancel a shipment
export async function cancelShipment(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const orderId = parseInt(req.params.orderId);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    
    // Get order details
    const order = await storage.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Check authorization - only admin, co-admin, or the seller can cancel shipments
    const isAdmin = req.user.role === 'admin' || req.user.role === 'co-admin';
    const isSeller = req.user.role === 'seller' && order.sellerId === req.user.id;
    
    if (!isAdmin && !isSeller) {
      return res.status(403).json({ error: 'You do not have permission to cancel shipments for this order' });
    }
    
    // Check if order has a shipment
    if (!order.shiprocketOrderId && !order.shiprocketShipmentId) {
      return res.status(400).json({ error: 'No shipment found for this order' });
    }
    
    // Check if order is in a valid state for cancellation
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({ 
        error: `Order cannot be cancelled: Current status is ${order.status}` 
      });
    }
    
    // Initialize Shiprocket service if not already initialized
    if (!shiprocketService) {
      const initialized = await initializeShiprocketService();
      if (!initialized) {
        return res.status(500).json({ 
          error: 'Shiprocket service not configured. Please set up your Shiprocket credentials in admin settings.' 
        });
      }
    }
    
    // Cancel shipment on Shiprocket
    try {
      await shiprocketService.cancelOrder(order.shiprocketOrderId);
      
      // Update order status
      await storage.updateOrderShipment(orderId, {
        status: 'cancelled'
      });
      
      return res.json({
        success: true,
        message: 'Shipment cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling Shiprocket shipment:', error);
      return res.status(500).json({ 
        error: error.response?.data?.message || 'Failed to cancel shipment with Shiprocket' 
      });
    }
  } catch (error) {
    console.error('Error cancelling shipment:', error);
    return res.status(500).json({ error: 'Failed to cancel shipment' });
  }
}

// Get tracking data
export async function getTrackingData(req: Request, res: Response) {
  try {
    const { trackingId } = req.params;
    
    if (!trackingId) {
      return res.status(400).json({ error: 'Tracking ID is required' });
    }
    
    // Initialize Shiprocket service if not already initialized
    if (!shiprocketService) {
      const initialized = await initializeShiprocketService();
      if (!initialized) {
        return res.status(500).json({ 
          error: 'Shiprocket service not configured. Please set up your Shiprocket credentials in admin settings.' 
        });
      }
    }
    
    // Get tracking data from Shiprocket
    try {
      const trackingData = await shiprocketService.trackShipment(trackingId);
      return res.json({ tracking_data: trackingData });
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      return res.status(500).json({ 
        error: error.response?.data?.message || 'Failed to fetch tracking data from Shiprocket' 
      });
    }
  } catch (error) {
    console.error('Error getting tracking data:', error);
    return res.status(500).json({ error: 'Failed to get tracking data' });
  }
}

// Generate shipping label
export async function generateShippingLabel(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { shipmentId } = req.params;
    
    if (!shipmentId) {
      return res.status(400).json({ error: 'Shipment ID is required' });
    }
    
    // Initialize Shiprocket service if not already initialized
    if (!shiprocketService) {
      const initialized = await initializeShiprocketService();
      if (!initialized) {
        return res.status(500).json({ 
          error: 'Shiprocket service not configured. Please set up your Shiprocket credentials in admin settings.' 
        });
      }
    }
    
    // Generate label on Shiprocket
    try {
      const labelData = await shiprocketService.generateLabel(shipmentId);
      return res.json({ label_url: labelData.label_url });
    } catch (error) {
      console.error('Error generating shipping label:', error);
      return res.status(500).json({ 
        error: error.response?.data?.message || 'Failed to generate shipping label from Shiprocket' 
      });
    }
  } catch (error) {
    console.error('Error generating shipping label:', error);
    return res.status(500).json({ error: 'Failed to generate shipping label' });
  }
}

// Get all courier companies
export async function getCourierCompanies(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'co-admin')) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Initialize Shiprocket service if not already initialized
    if (!shiprocketService) {
      const initialized = await initializeShiprocketService();
      if (!initialized) {
        return res.status(500).json({ 
          error: 'Shiprocket service not configured. Please set up your Shiprocket credentials in admin settings.' 
        });
      }
    }
    
    // Get courier companies from Shiprocket
    try {
      const courierCompanies = await shiprocketService.getCourierCompanies();
      return res.json(courierCompanies);
    } catch (error) {
      console.error('Error fetching courier companies:', error);
      return res.status(500).json({ 
        error: error.response?.data?.message || 'Failed to fetch courier companies from Shiprocket' 
      });
    }
  } catch (error) {
    console.error('Error getting courier companies:', error);
    return res.status(500).json({ error: 'Failed to get courier companies' });
  }
}

// Get shipping rates
export async function getShippingRates(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const {
      pickup_postcode,
      delivery_postcode,
      weight,
      cod = false
    } = req.body;
    
    if (!pickup_postcode || !delivery_postcode || !weight) {
      return res.status(400).json({ 
        error: 'Pickup postcode, delivery postcode, and weight are required' 
      });
    }
    
    // Initialize Shiprocket service if not already initialized
    if (!shiprocketService) {
      const initialized = await initializeShiprocketService();
      if (!initialized) {
        return res.status(500).json({ 
          error: 'Shiprocket service not configured. Please set up your Shiprocket credentials in admin settings.' 
        });
      }
    }
    
    // Get shipping rates from Shiprocket
    try {
      const rates = await shiprocketService.getShippingRates({
        pickup_postcode,
        delivery_postcode,
        weight,
        cod
      });
      
      return res.json(rates);
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      return res.status(500).json({ 
        error: error.response?.data?.message || 'Failed to fetch shipping rates from Shiprocket' 
      });
    }
  } catch (error) {
    console.error('Error getting shipping rates:', error);
    return res.status(500).json({ error: 'Failed to get shipping rates' });
  }
}

// Check if Shiprocket is properly configured
export async function checkShiprocketStatus(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'co-admin')) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const settings = await storage.getShiprocketSettings();
    const isConfigured = !!settings && !!settings.email && !!settings.password;
    
    return res.json({
      configured: isConfigured,
      status: isConfigured ? 'connected' : 'not_configured'
    });
  } catch (error) {
    console.error('Error checking Shiprocket status:', error);
    return res.status(500).json({ error: 'Failed to check Shiprocket status' });
  }
}

// Connect to Shiprocket with credentials
export async function connectShiprocket(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'co-admin')) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Test authentication with Shiprocket
    const service = new ShiprocketService(email, password);
    
    try {
      await service.authenticate();
      
      // Save settings to database
      await storage.updateShiprocketSettings({
        email,
        password,
        token: service.token,
        tokenExpiry: service.tokenExpiry
      });
      
      return res.json({
        success: true,
        message: 'Successfully connected to Shiprocket',
        token: service.token
      });
    } catch (error) {
      console.error('Shiprocket authentication failed:', error);
      return res.status(400).json({ error: 'Invalid Shiprocket credentials' });
    }
  } catch (error) {
    console.error('Error connecting to Shiprocket:', error);
    return res.status(500).json({ error: 'Failed to connect to Shiprocket' });
  }
}

// Test Shiprocket connection
export async function testShiprocketConnection(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'co-admin')) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Initialize Shiprocket service if not already initialized
    if (!shiprocketService) {
      const initialized = await initializeShiprocketService();
      if (!initialized) {
        return res.status(500).json({ 
          error: 'Shiprocket service not configured. Please set up your Shiprocket credentials in admin settings.' 
        });
      }
    }
    
    // Test by fetching courier companies
    try {
      await shiprocketService.getCourierCompanies();
      return res.json({ success: true, message: 'Shiprocket connection is working correctly' });
    } catch (error) {
      console.error('Shiprocket connection test failed:', error);
      return res.status(500).json({ 
        error: error.response?.data?.message || 'Failed to connect to Shiprocket API' 
      });
    }
  } catch (error) {
    console.error('Error testing Shiprocket connection:', error);
    return res.status(500).json({ error: 'Failed to test Shiprocket connection' });
  }
}

// Get shiprocket shipments
export async function getShiprocketShipments(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'co-admin')) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Return the list of orders that have shiprocket shipments
    const orders = await storage.getOrdersWithShiprocketShipments();
    return res.json(orders);
  } catch (error) {
    console.error('Error fetching Shiprocket shipments:', error);
    return res.status(500).json({ error: 'Failed to fetch Shiprocket shipments' });
  }
}

// Save Shiprocket settings
export async function saveShiprocketSettings(req: Request, res: Response) {
  // This is just an alias for updateShiprocketSettings for clearer API naming
  return updateShiprocketSettings(req, res);
}

// Get pending orders that can be shipped
export async function getPendingOrders(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'co-admin')) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Get orders that are in 'processing' status and don't have Shiprocket shipments yet
    const orders = await storage.getPendingShiprocketOrders();
    return res.json(orders);
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    return res.status(500).json({ error: 'Failed to fetch pending orders' });
  }
}