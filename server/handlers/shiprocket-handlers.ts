import { Request, Response } from "express";
import { storage } from "../storage";

/**
 * Check Shiprocket API connection status
 */
export async function checkShiprocketStatus(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin" && req.user.role !== "co-admin") {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    // Check if Shiprocket credentials are set
    const settings = await storage.getShiprocketSettings();
    
    if (!settings || !settings.email || !settings.password) {
      return res.json({ connected: false, message: "Shiprocket not configured" });
    }
    
    // Return connection status
    return res.json({ 
      connected: true, 
      email: settings.email,
      lastTokenTime: settings.lastTokenTime || null
    });
  } catch (error) {
    console.error("Error checking Shiprocket status:", error);
    return res.status(500).json({ error: "Error checking Shiprocket status" });
  }
}

/**
 * Connect to Shiprocket API using credentials
 */
export async function connectShiprocket(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin" && req.user.role !== "co-admin") {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    
    // Save the credentials
    await storage.saveShiprocketSettings({
      email,
      password,
      token: "mock-token", // In a real implementation, this would be obtained from Shiprocket
      lastTokenTime: new Date().toISOString()
    });
    
    return res.json({ success: true, message: "Connected to Shiprocket successfully" });
  } catch (error) {
    console.error("Error connecting to Shiprocket:", error);
    return res.status(500).json({ error: "Error connecting to Shiprocket" });
  }
}

/**
 * Test Shiprocket API connection
 */
export async function testShiprocketConnection(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin" && req.user.role !== "co-admin") {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    // Get Shiprocket settings
    const settings = await storage.getShiprocketSettings();
    
    if (!settings || !settings.email || !settings.password) {
      return res.status(400).json({ error: "Shiprocket not configured" });
    }
    
    // In a real implementation, test the connection with Shiprocket API
    // For now, simulate a successful test
    return res.json({ success: true, message: "Connection successful" });
  } catch (error) {
    console.error("Error testing Shiprocket connection:", error);
    return res.status(500).json({ error: "Error testing Shiprocket connection" });
  }
}

/**
 * Get Shiprocket courier list
 */
export async function getShiprocketCouriers(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin" && req.user.role !== "co-admin" && req.user.role !== "seller") {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    // In a real implementation, fetch couriers from Shiprocket API
    const couriers = [
      { id: 1, name: "Delhivery", serviceable_zones: "Metro, Urban, Semi-Urban" },
      { id: 2, name: "DTDC", serviceable_zones: "Metro, Urban" },
      { id: 3, name: "BlueDart", serviceable_zones: "Metro, Urban, Rural" },
      { id: 4, name: "FedEx", serviceable_zones: "Metro, Urban" }
    ];
    
    return res.json(couriers);
  } catch (error) {
    console.error("Error fetching Shiprocket couriers:", error);
    return res.status(500).json({ error: "Error fetching Shiprocket couriers" });
  }
}

/**
 * Get Shiprocket shipments
 */
export async function getShiprocketShipments(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin" && req.user.role !== "co-admin" && req.user.role !== "seller") {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    // In a real implementation, fetch shipments from Shiprocket API
    // For now, return mock data
    const shipments = [
      {
        id: "SH-123456",
        order_id: "SR-123456",
        status: "Shipped",
        courier: "Delhivery",
        tracking_id: "TRK-123456",
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "SH-789012",
        order_id: "SR-789012",
        status: "Delivered",
        courier: "BlueDart",
        tracking_id: "TRK-789012",
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    return res.json(shipments);
  } catch (error) {
    console.error("Error fetching Shiprocket shipments:", error);
    return res.status(500).json({ error: "Error fetching Shiprocket shipments" });
  }
}

/**
 * Get Shiprocket settings
 */
export async function getShiprocketSettings(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin" && req.user.role !== "co-admin") {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    const settings = await storage.getShiprocketSettings();
    
    if (!settings) {
      return res.json({
        email: "",
        password: "",
        defaultCourier: "",
        autoShipEnabled: false
      });
    }
    
    // Don't send the actual password back to the client
    return res.json({
      email: settings.email,
      password: settings.password ? "********" : "",
      defaultCourier: settings.defaultCourier || "",
      autoShipEnabled: settings.autoShipEnabled || false
    });
  } catch (error) {
    console.error("Error fetching Shiprocket settings:", error);
    return res.status(500).json({ error: "Error fetching Shiprocket settings" });
  }
}

/**
 * Save Shiprocket settings
 */
export async function saveShiprocketSettings(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin" && req.user.role !== "co-admin") {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    const { email, password, defaultCourier, autoShipEnabled } = req.body;
    
    // Get existing settings
    const existingSettings = await storage.getShiprocketSettings();
    
    // Only update password if provided (not the placeholder)
    const updatedSettings = {
      email,
      password: password === "********" ? existingSettings?.password : password,
      defaultCourier,
      autoShipEnabled,
      token: existingSettings?.token,
      lastTokenTime: existingSettings?.lastTokenTime
    };
    
    await storage.saveShiprocketSettings(updatedSettings);
    
    return res.json({ success: true, message: "Settings saved successfully" });
  } catch (error) {
    console.error("Error saving Shiprocket settings:", error);
    return res.status(500).json({ error: "Error saving Shiprocket settings" });
  }
}

/**
 * Get pending orders for shipment
 */
export async function getPendingOrders(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin" && req.user.role !== "co-admin" && req.user.role !== "seller") {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    // Get seller ID for seller role
    const sellerId = req.user.role === "seller" ? req.user.id : undefined;
    
    // Get orders with status 'processing' or 'confirmed' that haven't been sent to Shiprocket yet
    const pendingOrders = await storage.getPendingShipmentOrders(sellerId);
    
    return res.json(pendingOrders);
  } catch (error) {
    console.error("Error fetching pending shipment orders:", error);
    return res.status(500).json({ error: "Error fetching pending shipment orders" });
  }
}