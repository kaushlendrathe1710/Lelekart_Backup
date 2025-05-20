import { Request, Response } from "express";
import axios from "axios";
import { storage } from "../storage";
import { db } from "../db";
import { shiprocketSettings, orders } from "@shared/schema";
import { eq, inArray, not, and, isNull } from "drizzle-orm";

const SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external";

/**
 * Helper function to generate a fresh Shiprocket token for each API request
 * Following the recommendation to always generate a new token for each API call
 */
async function getShiprocketToken(): Promise<string | null> {
  try {
    // Get the settings from the database - order by id to get a consistent record
    // This helps when there are multiple entries in the shiprocket_settings table
    const settings = await db.select().from(shiprocketSettings).orderBy(shiprocketSettings.id);
    
    if (!settings || settings.length === 0 || !settings[0].email || !settings[0].password) {
      console.error("Shiprocket credentials not configured");
      return null;
    }
    
    // Use the first valid setting record consistently
    const setting = settings[0];
    
    // Always generate a fresh token as recommended
    console.log("Generating new Shiprocket token...");
    try {
      const response = await axios.post(`${SHIPROCKET_API_BASE}/auth/login`, {
        email: setting.email,
        password: setting.password
      });
      
      if (response.data.token) {
        console.log("New Shiprocket token generated successfully");
        
        // Store the token for reference, but we will continue to get a fresh one each time
        await db.update(shiprocketSettings)
          .set({ token: response.data.token, updatedAt: new Date() })
          .where(eq(shiprocketSettings.id, setting.id));
        
        return response.data.token;
      } else {
        console.error("Failed to generate Shiprocket token - no token in response");
        return null;
      }
    } catch (tokenError: any) {
      // Check for specific error responses
      const status = tokenError?.response?.status;
      const errorMessage = tokenError?.response?.data?.message || "Unknown error";
      
      console.log("Shiprocket token generation failed:", errorMessage);
      
      // For 403 Forbidden errors, account might lack necessary permissions
      if (status === 403) {
        throw new Error(`Unauthorized! You do not have the required permissions.`);
      }
      
      // For authentication errors
      if (status === 401 || (errorMessage && errorMessage.toLowerCase().includes('auth'))) {
        throw new Error(`Authentication failed! Please check your Shiprocket credentials.`);
      }
      
      throw tokenError;
    }
  } catch (error) {
    console.error("Error in getShiprocketToken:", error);
    throw error; // Re-throw to allow proper error handling upstream
  }
}

/**
 * Get Shiprocket settings handler
 */
export async function getShiprocketSettings(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    // Get settings from the database - order by id to get a consistent record
    const settings = await db.select().from(shiprocketSettings).orderBy(shiprocketSettings.id);
    
    if (!settings || settings.length === 0) {
      // Create default settings if none exist
      const [newSettings] = await db.insert(shiprocketSettings)
        .values({
          email: "",
          password: "",
          token: "",
          defaultCourier: "",
          autoShipEnabled: false,
          updatedAt: new Date()
        })
        .returning();
      
      return res.status(200).json({
        ...newSettings,
        password: "" // Don't send password to client
      });
    }
    
    // Use the first record consistently
    const setting = settings[0];
    
    return res.status(200).json({
      ...setting,
      password: "" // Don't send password to client
    });
  } catch (error) {
    console.error("Error getting Shiprocket settings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Save Shiprocket settings handler
 */
export async function saveShiprocketSettings(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    const { email, password, defaultCourier, autoShipEnabled } = req.body;
    
    console.log("Saving Shiprocket settings:", { 
      email: email ? email : "not provided",
      passwordProvided: password ? "yes" : "no",
      defaultCourier: defaultCourier || "not provided", 
      autoShipEnabled: autoShipEnabled === true ? "enabled" : "disabled" 
    });
    
    // Get settings from the database - order by id to get a consistent record
    const settings = await db.select().from(shiprocketSettings).orderBy(shiprocketSettings.id);
    
    if (!settings || settings.length === 0) {
      // Create new settings
      const [newSettings] = await db.insert(shiprocketSettings)
        .values({
          email,
          password: password || "",
          token: "",
          defaultCourier: defaultCourier || "",
          autoShipEnabled: autoShipEnabled || false,
          updatedAt: new Date()
        })
        .returning();
      
      return res.status(200).json({
        ...newSettings,
        password: "" // Don't send password to client
      });
    }
    
    // Use the first record consistently
    const setting = settings[0];
    
    // Update settings
    const updateData: any = {
      email,
      defaultCourier: defaultCourier || "",
      autoShipEnabled: autoShipEnabled || false,
      updatedAt: new Date()
    };
    
    // Only update password if provided
    if (password) {
      updateData.password = password;
      // Clear token if password changed
      updateData.token = "";
    }
    
    const [updatedSettings] = await db.update(shiprocketSettings)
      .set(updateData)
      .where(eq(shiprocketSettings.id, setting.id))
      .returning();
    
    return res.status(200).json({
      ...updatedSettings,
      password: "" // Don't send password to client
    });
  } catch (error) {
    console.error("Error saving Shiprocket settings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Generate Shiprocket API token handler
 */
export async function generateShiprocketToken(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    // Get credentials from request body if provided
    const { email, password } = req.body;
    
    // Get settings from the database - order by id to get a consistent record
    const settings = await db.select().from(shiprocketSettings).orderBy(shiprocketSettings.id);
    
    // If no settings found, create new settings
    if (!settings || settings.length === 0) {
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      try {
        // Generate token with provided credentials
        const response = await axios.post(`${SHIPROCKET_API_BASE}/auth/login`, {
          email,
          password
        });
        
        if (response.data.token) {
          // Create new settings with token
          const [newSettings] = await db.insert(shiprocketSettings)
            .values({
              email,
              password,
              token: response.data.token,
              updatedAt: new Date()
            })
            .returning();
          
          return res.status(200).json({
            ...newSettings,
            password: "" // Don't send password to client
          });
        } else {
          return res.status(400).json({ error: "Failed to generate token" });
        }
      } catch (error) {
        console.error("Error generating Shiprocket token:", error);
        
        if (error.response && error.response.data) {
          return res.status(400).json({ error: "Authentication failed with Shiprocket API", details: error.response.data });
        }
        
        return res.status(500).json({ error: "Failed to authenticate with Shiprocket API" });
      }
    }
    
    // Use the first record consistently
    const setting = settings[0];
    
    // Use new credentials if provided, otherwise use existing credentials
    const credentialsToUse = {
      email: email || setting.email,
      password: password || setting.password
    };
    
    console.log("Using credentials: ", { email: credentialsToUse.email, password: credentialsToUse.password ? "******" : "empty" });
    
    if (!credentialsToUse.email || !credentialsToUse.password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    
    try {
      // Generate token
      const response = await axios.post(`${SHIPROCKET_API_BASE}/auth/login`, {
        email: credentialsToUse.email,
        password: credentialsToUse.password
      });
      
      if (response.data.token) {
        // Update settings with new credentials if provided
        const updateData: any = { 
          token: response.data.token, 
          updatedAt: new Date() 
        };
        
        // Only update email/password if new ones were provided
        if (email) updateData.email = email;
        if (password) updateData.password = password;
        
        const [updatedSettings] = await db.update(shiprocketSettings)
          .set(updateData)
          .where(eq(shiprocketSettings.id, setting.id))
          .returning();
        
        return res.status(200).json({
          ...updatedSettings,
          password: "" // Don't send password to client
        });
      } else {
        return res.status(400).json({ error: "Failed to generate token" });
      }
    } catch (error) {
      console.error("Error generating Shiprocket token:", error);
      
      if (error.response && error.response.data) {
        return res.status(400).json({ error: "Authentication failed with Shiprocket API", details: error.response.data });
      }
      
      return res.status(500).json({ error: "Failed to authenticate with Shiprocket API" });
    }
  } catch (error) {
    console.error("Error generating Shiprocket token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get Shiprocket couriers handler
 */
export async function getShiprocketCouriers(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    // Get token (this will automatically refresh if expired)
    let token;
    try {
      token = await getShiprocketToken();
      
      if (!token) {
        return res.status(400).json({ 
          error: "Shiprocket token not available", 
          message: "Please check your Shiprocket credentials or generate a new token.",
          code: "TOKEN_MISSING" 
        });
      }
    } catch (tokenError: any) {
      console.log("Shiprocket API error details:", tokenError.message);
      
      // Catch permission errors specifically
      if (tokenError.message && tokenError.message.includes("Unauthorized")) {
        return res.status(403).json({ 
          error: "API Permission Error",
          message: "Your Shiprocket account doesn't have the necessary API access permissions. This typically requires a Business plan or higher.",
          details: "Please upgrade your Shiprocket plan or contact Shiprocket support to enable API access.",
          code: "PERMISSION_ERROR"
        });
      }
      
      // For token expiration
      if (tokenError.message && tokenError.message.includes("expired")) {
        return res.status(401).json({ 
          error: "Token expired", 
          message: "Your Shiprocket token has expired. Please refresh your token.",
          code: "TOKEN_EXPIRED"
        });
      }
      
      // For incorrect credentials 
      if (tokenError.message && (tokenError.message.includes("Invalid credentials") || tokenError.message.includes("Authentication failed"))) {
        return res.status(401).json({ 
          error: "Authentication failed", 
          message: "Your Shiprocket email or password is incorrect. Please update your credentials.",
          code: "AUTH_FAILED"
        });
      }
      
      // For other token errors
      return res.status(400).json({ 
        error: "Error getting Shiprocket token", 
        message: tokenError.message || "Please check your Shiprocket credentials.",
        code: "TOKEN_ERROR"
      });
    }
    
    // Fetch couriers
    try {
      // Using a second try/catch block to handle API errors specifically
      const response = await axios.get(`${SHIPROCKET_API_BASE}/courier/courierListWithCounts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return res.status(200).json(response.data);
    } catch (apiError: any) {
      console.error("Error in Shiprocket API call:", apiError?.response?.data || apiError.message);
      
      // If we get a 401, token might have just expired (rare race condition)
      if (apiError?.response?.status === 401) {
        // Force token refresh by invalidating the current token in the database
        const settings = await db.select().from(shiprocketSettings).orderBy(shiprocketSettings.id);
        if (settings && settings.length > 0) {
          // Use the first record consistently
          const setting = settings[0];
          await db.update(shiprocketSettings)
            .set({ token: "" })
            .where(eq(shiprocketSettings.id, setting.id));
          
          // Suggest the client try again
          return res.status(401).json({ 
            error: "Token refresh required", 
            message: "Please try again in a moment" 
          });
        }
      }
      
      // Specifically handle 403 permission errors
      if (apiError?.response?.status === 403) {
        return res.status(403).json({
          error: "Unauthorized! You do not have the required permissions.",
          message: "Your Shiprocket account doesn't have the necessary API access permissions. Please upgrade your Shiprocket plan or contact Shiprocket support to enable API access for courier services.",
          details: apiError.response.data
        });
      }
      
      if (apiError?.response?.data) {
        return res.status(apiError.response.status || 400).json({
          error: "Error from Shiprocket API",
          message: apiError.response.data.message || "An error occurred while communicating with Shiprocket API",
          details: apiError.response.data
        });
      }
      
      return res.status(500).json({ error: "Failed to communicate with Shiprocket API" });
    }
  } catch (error: any) {
    console.error("Error in getShiprocketCouriers handler:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get pending orders for Shiprocket shipping
 */
export async function getPendingShiprocketOrders(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    console.log("Fetching pending Shiprocket orders from database...");
    
    // Get all orders regardless of status for demonstration
    // In production, we would only fetch orders with specific statuses
    const pendingOrders = await db.select()
      .from(orders)
      .where(
        and(
          not(eq(orders.status, "cancelled")), // Only exclude cancelled orders
          not(eq(orders.status, "refunded"))   // And refunded orders
          // Note: We removed the filter for shiprocketOrderId and payment method to show more orders
        )
      )
      .limit(20); // Limit to 20 most recent orders
    
    console.log(`Found ${pendingOrders.length} orders in the database`);
    
    // Get additional data for each order
    const ordersWithDetails = await Promise.all(
      pendingOrders.map(async (order) => {
        const orderItems = await storage.getOrderItems(order.id);
        const address = order.addressId ? await storage.getUserAddress(order.addressId) : null;
        const userDetails = await storage.getUser(order.userId);
        
        return {
          ...order,
          items: orderItems,
          address,
          user: {
            id: userDetails?.id,
            name: userDetails?.name || "Customer",
            email: userDetails?.email || "customer@example.com",
            phone: userDetails?.phone || "1234567890"
          }
        };
      })
    );
    
    return res.status(200).json(ordersWithDetails);
  } catch (error) {
    console.error("Error getting pending Shiprocket orders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Auto-ship orders with Shiprocket
 * This will find all pending orders and ship them with the default courier
 */
export async function autoShipWithShiprocket(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    // Get settings to check if auto-ship is enabled and get default courier
    const settings = await db.select().from(shiprocketSettings).orderBy(shiprocketSettings.id);
    
    if (!settings || settings.length === 0) {
      return res.status(400).json({ 
        error: "Shiprocket settings not configured",
        message: "Please configure your Shiprocket settings in the Shipping Settings page before using auto-ship."
      });
    }
    
    // Use the first record consistently
    const setting = settings[0];
    
    if (!setting.defaultCourier) {
      return res.status(400).json({ 
        error: "Default courier not configured",
        message: "Please configure a default courier in your Shiprocket settings to use auto-ship. You can do this in the Shiprocket dashboard under Settings > Shipping > Courier Priority."
      });
    }
    
    // Get pending orders
    const pendingOrders = await db.select()
      .from(orders)
      .where(
        and(
          eq(orders.status, "confirmed"),
          isNull(orders.shiprocketOrderId),
          not(eq(orders.paymentMethod, "cod"))
        )
      );
    
    if (pendingOrders.length === 0) {
      return res.status(200).json({ message: "No pending orders to ship", shipped: 0 });
    }
    
    // Ship each order
    const shipResults = [];
    let successCount = 0;
    
    for (const order of pendingOrders) {
      try {
        // Get token
        let token;
        token = await getShiprocketToken();
        
        if (!token) {
          return res.status(400).json({ error: "Shiprocket token not available" });
        }
        
        // Get order items
        const orderItems = await storage.getOrderItems(order.id);
        
        // Get shipping address
        const address = order.addressId ? await storage.getUserAddress(order.addressId) : null;
        
        if (!address) {
          shipResults.push({ orderId: order.id, success: false, error: "Shipping address not found" });
          continue;
        }
        
        // Get user details
        const user = await storage.getUser(order.userId);
        
        if (!user) {
          shipResults.push({ orderId: order.id, success: false, error: "User not found" });
          continue;
        }
        
        // Transform order data for Shiprocket API
        const shiprocketOrderData = {
          order_id: `ORD-${order.id}`,
          order_date: new Date(order.date).toISOString().split('T')[0],
          pickup_location: "Primary",
          channel_id: "",
          comment: "Order from LeLeKart (Auto-shipped)",
          billing_customer_name: user.name || user.username,
          billing_last_name: "",
          billing_address: address.street,
          billing_address_2: address.additionalInfo || "",
          billing_city: address.city,
          billing_pincode: address.pincode,
          billing_state: address.state,
          billing_country: "India",
          billing_email: user.email,
          billing_phone: user.phone || address.phone,
          shipping_is_billing: true,
          shipping_customer_name: user.name || user.username,
          shipping_last_name: "",
          shipping_address: address.street,
          shipping_address_2: address.additionalInfo || "",
          shipping_city: address.city,
          shipping_pincode: address.pincode,
          shipping_state: address.state,
          shipping_country: "India",
          shipping_email: user.email,
          shipping_phone: user.phone || address.phone,
          order_items: orderItems.map(item => ({
            name: item.productDetails?.name || `Product ID: ${item.productId}`,
            sku: `SKU-${item.productId}`,
            units: item.quantity,
            selling_price: item.price / 100, // Convert from paisa to rupees
            discount: "",
            tax: "",
            hsn: ""
          })),
          payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
          shipping_charges: 0,
          giftwrap_charges: 0,
          transaction_charges: 0,
          total_discount: 0,
          sub_total: order.total / 100, // Convert from paisa to rupees
          length: 10,
          breadth: 10,
          height: 10,
          weight: 0.5
        };
        
        // Create order in Shiprocket
        const response = await axios.post(
          `${SHIPROCKET_API_BASE}/orders/create/adhoc`,
          shiprocketOrderData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.order_id) {
          // Generate shipment with default courier
          const shipmentResponse = await axios.post(
            `${SHIPROCKET_API_BASE}/shipments/create/adhoc`,
            {
              shipment_id: response.data.shipment_id,
              courier_id: setting.defaultCourier
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          // Update order with Shiprocket details
          const [updatedOrder] = await db.update(orders)
            .set({
              shiprocketOrderId: response.data.order_id.toString(),
              shiprocketShipmentId: response.data.shipment_id.toString(),
              shippingStatus: "processing",
              status: "shipped",
              ...(shipmentResponse.data ? {
                awbCode: shipmentResponse.data.awb_code,
                courierName: shipmentResponse.data.courier_name,
                estimatedDeliveryDate: shipmentResponse.data.expected_delivery_date
                  ? new Date(shipmentResponse.data.expected_delivery_date)
                  : null
              } : {})
            })
            .where(eq(orders.id, order.id))
            .returning();
          
          shipResults.push({ 
            orderId: order.id, 
            success: true, 
            shiprocketOrderId: response.data.order_id.toString(),
            shiprocketShipmentId: response.data.shipment_id.toString(),
            awbCode: shipmentResponse.data?.awb_code || null
          });
          
          successCount++;
        } else {
          shipResults.push({ 
            orderId: order.id, 
            success: false, 
            error: "Failed to create order in Shiprocket" 
          });
        }
      } catch (error) {
        console.error(`Error auto-shipping order ${order.id}:`, error);
        shipResults.push({ 
          orderId: order.id, 
          success: false, 
          error: error.response?.data?.message || error.message || "Unknown error" 
        });
      }
    }
    
    return res.status(200).json({
      message: `Auto-shipped ${successCount} of ${pendingOrders.length} orders`,
      shipped: successCount,
      total: pendingOrders.length,
      results: shipResults
    });
  } catch (error) {
    console.error("Error auto-shipping with Shiprocket:", error);
    
    // Check for specific errors and provide more helpful messages
    if (error.message && error.message.includes("Unauthorized")) {
      return res.status(403).json({ 
        error: "Unauthorized! You do not have the required permissions.",
        message: "Your Shiprocket account doesn't have the necessary API access permissions. Please upgrade your Shiprocket plan or contact Shiprocket support to enable API access."
      });
    }
    
    if (error.response && error.response.data) {
      return res.status(error.response.status || 500).json({
        error: error.response.data.message || "Shiprocket API Error",
        details: error.response.data
      });
    }
    
    return res.status(500).json({ 
      error: "Internal server error",
      message: error.message || "An unexpected error occurred while processing your request."
    });
  }
}

/**
 * Get orders shipped with Shiprocket
 */
export async function getShiprocketOrders(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    // Get orders that have been shipped with Shiprocket
    const shippedOrders = await db.select()
      .from(orders)
      .where(not(isNull(orders.shiprocketOrderId)));
    
    // Get additional data for each order
    const ordersWithDetails = await Promise.all(
      shippedOrders.map(async (order) => {
        const orderItems = await storage.getOrderItems(order.id);
        
        return {
          ...order,
          items: orderItems
        };
      })
    );
    
    return res.status(200).json(ordersWithDetails);
  } catch (error) {
    console.error("Error getting Shiprocket orders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Ship order via Shiprocket
 */
export async function shipOrderWithShiprocket(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    const { orderId, courierCompany } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }
    
    // Get order
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    if (order.shiprocketOrderId) {
      return res.status(400).json({ error: "Order already shipped with Shiprocket" });
    }
    
    // Get token
    let token;
    try {
      token = await getShiprocketToken();
      
      if (!token) {
        return res.status(400).json({ 
          error: "Shiprocket token not available", 
          message: "Please check your Shiprocket credentials in Settings."
        });
      }
    } catch (tokenError: any) {
      // Handle permission errors specifically
      if (tokenError.message && tokenError.message.includes("Unauthorized")) {
        return res.status(403).json({ 
          error: "Unauthorized! You do not have the required permissions.",
          message: "Your Shiprocket account doesn't have the necessary API access permissions. Please upgrade your Shiprocket plan or contact Shiprocket support to enable API access."
        });
      }
      
      // For other token errors
      return res.status(400).json({ 
        error: "Error getting Shiprocket token", 
        message: tokenError.message || "Please check your Shiprocket credentials."
      });
    }
    
    // Get order items
    const orderItems = await storage.getOrderItems(order.id);
    
    // Get shipping address
    const address = order.addressId ? await storage.getUserAddress(order.addressId) : null;
    
    if (!address) {
      return res.status(400).json({ error: "Shipping address not found" });
    }
    
    // Get user details
    const user = await storage.getUser(order.userId);
    
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
    
    // Transform order data for Shiprocket API
    const shiprocketOrderData = {
      order_id: `ORD-${order.id}`,
      order_date: new Date(order.date).toISOString().split('T')[0],
      pickup_location: "Primary",
      channel_id: "",
      comment: "Order from LeLeKart",
      billing_customer_name: user.name || user.username,
      billing_last_name: "",
      billing_address: address.street,
      billing_address_2: address.additionalInfo || "",
      billing_city: address.city,
      billing_pincode: address.pincode,
      billing_state: address.state,
      billing_country: "India",
      billing_email: user.email,
      billing_phone: user.phone || address.phone,
      shipping_is_billing: true,
      shipping_customer_name: user.name || user.username,
      shipping_last_name: "",
      shipping_address: address.street,
      shipping_address_2: address.additionalInfo || "",
      shipping_city: address.city,
      shipping_pincode: address.pincode,
      shipping_state: address.state,
      shipping_country: "India",
      shipping_email: user.email,
      shipping_phone: user.phone || address.phone,
      order_items: orderItems.map(item => ({
        name: item.productDetails?.name || `Product ID: ${item.productId}`,
        sku: `SKU-${item.productId}`,
        units: item.quantity,
        selling_price: item.price / 100, // Convert from paisa to rupees
        discount: "",
        tax: "",
        hsn: ""
      })),
      payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: order.total / 100, // Convert from paisa to rupees
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5
    };
    
    // Create order in Shiprocket
    const response = await axios.post(
      `${SHIPROCKET_API_BASE}/orders/create/adhoc`,
      shiprocketOrderData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.order_id) {
      // If courier company provided, generate shipment
      let shipmentResponse = null;
      if (courierCompany) {
        shipmentResponse = await axios.post(
          `${SHIPROCKET_API_BASE}/shipments/create/adhoc`,
          {
            shipment_id: response.data.shipment_id,
            courier_id: courierCompany
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }
      
      // Update order with Shiprocket details
      const [updatedOrder] = await db.update(orders)
        .set({
          shiprocketOrderId: response.data.order_id.toString(),
          shiprocketShipmentId: response.data.shipment_id.toString(),
          shippingStatus: "processing",
          status: "shipped",
          ...(shipmentResponse && shipmentResponse.data ? {
            awbCode: shipmentResponse.data.awb_code,
            courierName: shipmentResponse.data.courier_name,
            estimatedDeliveryDate: shipmentResponse.data.expected_delivery_date
              ? new Date(shipmentResponse.data.expected_delivery_date)
              : null
          } : {})
        })
        .where(eq(orders.id, order.id))
        .returning();
      
      // Get updated order details to return
      const orderDetails = {
        ...updatedOrder,
        items: await storage.getOrderItems(updatedOrder.id)
      };
      
      return res.status(200).json(orderDetails);
    } else {
      return res.status(400).json({ error: "Failed to create order in Shiprocket", details: response.data });
    }
  } catch (error) {
    console.error("Error shipping order with Shiprocket:", error);
    
    // Check for specific errors and provide more helpful messages
    if (error.message && error.message.includes("Unauthorized")) {
      return res.status(403).json({ 
        error: "Unauthorized! You do not have the required permissions.",
        message: "Your Shiprocket account doesn't have the necessary API access permissions. Please upgrade your Shiprocket plan or contact Shiprocket support to enable API access."
      });
    }
    
    if (error.response && error.response.data) {
      return res.status(error.response.status || 500).json({
        error: error.response.data.message || "Error from Shiprocket API",
        details: error.response.data,
        message: "There was an error communicating with Shiprocket. Please check your credentials and try again."
      });
    }
    
    return res.status(500).json({ 
      error: "Internal server error",
      message: error.message || "An unexpected error occurred while processing your request."
    });
  }
}/**
 * Test Shiprocket connection by retrieving couriers
 */
export async function testShiprocketConnection(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    // Get token (this will automatically refresh if expired)
    let token;
    try {
      token = await getShiprocketToken();
      
      if (!token) {
        return res.status(400).json({ 
          error: "Shiprocket token not available", 
          message: "Please check your Shiprocket credentials or generate a new token.",
          code: "TOKEN_MISSING" 
        });
      }
    } catch (tokenError: any) {
      console.log("Shiprocket API error details:", tokenError.message);
      
      // Catch permission errors specifically
      if (tokenError.message && tokenError.message.includes("Unauthorized")) {
        return res.status(403).json({ 
          error: "API Permission Error",
          message: "Your Shiprocket account doesn't have the necessary API access permissions. This typically requires a Business plan or higher.",
          details: "Please upgrade your Shiprocket plan or contact Shiprocket support to enable API access.",
          code: "PERMISSION_ERROR"
        });
      }
      
      // For other token errors
      return res.status(400).json({ 
        error: "Error getting Shiprocket token", 
        message: tokenError.message || "Please check your Shiprocket credentials.",
        code: "TOKEN_ERROR"
      });
    }
    
    // Test API access by getting courier companies
    try {
      const response = await axios.get(`${SHIPROCKET_API_BASE}/courier/courierListWithCounts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return res.status(200).json({ 
        success: true,
        message: "Successfully connected to Shiprocket API"
      });
    } catch (apiError: any) {
      console.error("Error in Shiprocket API test call:", apiError?.response?.data || apiError.message);
      
      if (apiError?.response?.data) {
        return res.status(apiError.response.status || 400).json({
          error: "Error from Shiprocket API",
          message: apiError.response.data.message || "An error occurred while communicating with Shiprocket API",
          details: apiError.response.data
        });
      }
      
      return res.status(500).json({ 
        error: "Failed to communicate with Shiprocket API",
        message: apiError.message || "Connection test failed"
      });
    }
  } catch (error: any) {
    console.error("Error in testShiprocketConnection:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      message: error.message || "An unexpected error occurred while processing your request."
    });
  }
}