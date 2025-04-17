import { Request, Response } from 'express';
import { storage } from '../storage';
import axios from 'axios';

// Token storage - in a real app this would be in a database with secure encryption
let shiprocketToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Check Shiprocket API connection status
 */
export async function checkShiprocketStatus(req: Request, res: Response) {
  try {
    const isConnected = shiprocketToken !== null && (tokenExpiry !== null && tokenExpiry > Date.now());
    res.json({ 
      connected: isConnected,
      message: isConnected ? 'Connected to Shiprocket API' : 'Not connected to Shiprocket API',
    });
  } catch (error) {
    console.error('Error checking Shiprocket status:', error);
    res.status(500).json({ error: 'Failed to check Shiprocket connection status' });
  }
}

/**
 * Connect to Shiprocket API using credentials
 */
export async function connectShiprocket(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Call Shiprocket API to get token
    const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
      email,
      password,
    });
    
    if (response.data && response.data.token) {
      shiprocketToken = response.data.token;
      // Set token expiry (default to 24 hours)
      tokenExpiry = Date.now() + (24 * 60 * 60 * 1000);
      
      // Save credentials to environment for later use (in a real app, store in secure database)
      process.env.SHIPROCKET_EMAIL = email;
      process.env.SHIPROCKET_PASSWORD = password;
      
      res.json({ 
        success: true, 
        message: 'Successfully connected to Shiprocket API',
      });
    } else {
      res.status(400).json({ error: 'Invalid credentials or API response' });
    }
  } catch (error) {
    console.error('Shiprocket connection error:', error);
    
    const errorMessage = error.response?.data?.message || 'Failed to connect to Shiprocket API';
    res.status(500).json({ error: errorMessage });
  }
}

/**
 * Test Shiprocket API connection
 */
export async function testShiprocketConnection(req: Request, res: Response) {
  try {
    if (!shiprocketToken) {
      // Try to get token using stored credentials
      if (process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD) {
        const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
          email: process.env.SHIPROCKET_EMAIL,
          password: process.env.SHIPROCKET_PASSWORD,
        });
        
        if (response.data && response.data.token) {
          shiprocketToken = response.data.token;
          tokenExpiry = Date.now() + (24 * 60 * 60 * 1000);
        } else {
          return res.status(401).json({ error: 'Not connected to Shiprocket API' });
        }
      } else {
        return res.status(401).json({ error: 'Shiprocket credentials not available' });
      }
    }
    
    // Test the connection by getting courier list
    const response = await axios.get('https://apiv2.shiprocket.in/v1/external/courier/courierListWithCounts', {
      headers: {
        'Authorization': `Bearer ${shiprocketToken}`
      }
    });
    
    res.json({ 
      success: true, 
      message: 'Connection to Shiprocket API is working',
    });
  } catch (error) {
    console.error('Shiprocket test connection error:', error);
    
    // If token expired, try to refresh it
    if (error.response?.status === 401) {
      shiprocketToken = null;
      tokenExpiry = null;
    }
    
    const errorMessage = error.response?.data?.message || 'Failed to test connection to Shiprocket API';
    res.status(500).json({ error: errorMessage });
  }
}

/**
 * Get Shiprocket courier list
 */
export async function getShiprocketCouriers(req: Request, res: Response) {
  try {
    if (!shiprocketToken) {
      // Try to get token using stored credentials
      if (process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD) {
        const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
          email: process.env.SHIPROCKET_EMAIL,
          password: process.env.SHIPROCKET_PASSWORD,
        });
        
        if (response.data && response.data.token) {
          shiprocketToken = response.data.token;
          tokenExpiry = Date.now() + (24 * 60 * 60 * 1000);
        } else {
          return res.status(401).json({ error: 'Not connected to Shiprocket API' });
        }
      } else {
        return res.status(401).json({ error: 'Shiprocket credentials not available' });
      }
    }
    
    // Get courier list
    const response = await axios.get('https://apiv2.shiprocket.in/v1/external/courier/courierListWithCounts', {
      headers: {
        'Authorization': `Bearer ${shiprocketToken}`
      }
    });
    
    const couriers = response.data.data.available_courier_companies || [];
    res.json(couriers);
  } catch (error) {
    console.error('Error fetching Shiprocket couriers:', error);
    
    // If token expired, try to refresh it
    if (error.response?.status === 401) {
      shiprocketToken = null;
      tokenExpiry = null;
    }
    
    const errorMessage = error.response?.data?.message || 'Failed to fetch Shiprocket couriers';
    res.status(500).json({ error: errorMessage });
  }
}

/**
 * Get Shiprocket shipments
 */
export async function getShiprocketShipments(req: Request, res: Response) {
  try {
    if (!shiprocketToken) {
      // Try to get token using stored credentials
      if (process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD) {
        const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
          email: process.env.SHIPROCKET_EMAIL,
          password: process.env.SHIPROCKET_PASSWORD,
        });
        
        if (response.data && response.data.token) {
          shiprocketToken = response.data.token;
          tokenExpiry = Date.now() + (24 * 60 * 60 * 1000);
        } else {
          return res.status(401).json({ error: 'Not connected to Shiprocket API' });
        }
      } else {
        return res.status(401).json({ error: 'Shiprocket credentials not available' });
      }
    }
    
    // Get shipments list
    const response = await axios.get('https://apiv2.shiprocket.in/v1/external/shipments', {
      headers: {
        'Authorization': `Bearer ${shiprocketToken}`
      },
      params: {
        sort_by: 'created_at',
        sort: 'desc',
        per_page: 20
      }
    });
    
    const shipments = response.data.data || [];
    res.json(shipments);
  } catch (error) {
    console.error('Error fetching Shiprocket shipments:', error);
    
    // If token expired, try to refresh it
    if (error.response?.status === 401) {
      shiprocketToken = null;
      tokenExpiry = null;
    }
    
    const errorMessage = error.response?.data?.message || 'Failed to fetch Shiprocket shipments';
    res.status(500).json({ error: errorMessage });
  }
}

/**
 * Get Shiprocket settings
 */
export async function getShiprocketSettings(req: Request, res: Response) {
  try {
    // In a real app, fetch these from database
    const settings = {
      autoShipOrders: false,
      defaultCourier: '',
      returnAddress: '',
      preferredCouriers: '',
      notifyCustomers: true,
    };
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching Shiprocket settings:', error);
    res.status(500).json({ error: 'Failed to fetch Shiprocket settings' });
  }
}

/**
 * Save Shiprocket settings
 */
export async function saveShiprocketSettings(req: Request, res: Response) {
  try {
    const {
      autoShipOrders,
      defaultCourier,
      returnAddress,
      preferredCouriers,
      notifyCustomers,
    } = req.body;
    
    // In a real app, save these to database
    const settings = {
      autoShipOrders: autoShipOrders || false,
      defaultCourier: defaultCourier || '',
      returnAddress: returnAddress || '',
      preferredCouriers: preferredCouriers || '',
      notifyCustomers: notifyCustomers || true,
    };
    
    // TODO: Save to database in real implementation
    
    res.json({
      success: true,
      message: 'Settings saved successfully',
      settings
    });
  } catch (error) {
    console.error('Error saving Shiprocket settings:', error);
    res.status(500).json({ error: 'Failed to save Shiprocket settings' });
  }
}

/**
 * Get pending orders for shipment
 */
export async function getPendingOrders(req: Request, res: Response) {
  try {
    // Get orders that are in 'processing' status and not yet pushed to Shiprocket
    const pendingOrders = await storage.getPendingShipmentOrders();
    res.json(pendingOrders);
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    res.status(500).json({ error: 'Failed to fetch pending orders' });
  }
}