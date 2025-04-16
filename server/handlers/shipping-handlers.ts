import { Request, Response } from 'express';
import { storage } from '../storage';
import { db } from '../db';
import {
  shippingMethods,
  shippingZones,
  shippingRules,
  sellerShippingSettings,
  productShippingOverrides,
  shippingTracking
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Shipping Methods handlers
export async function getShippingMethods(req: Request, res: Response) {
  try {
    const methods = await db.select().from(shippingMethods).orderBy(shippingMethods.id);
    res.json(methods);
  } catch (error) {
    console.error('Error fetching shipping methods:', error);
    res.status(500).json({ error: 'Failed to fetch shipping methods' });
  }
}

export async function getShippingMethod(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const [method] = await db.select().from(shippingMethods).where(eq(shippingMethods.id, id));
    
    if (!method) {
      return res.status(404).json({ error: 'Shipping method not found' });
    }
    
    res.json(method);
  } catch (error) {
    console.error('Error fetching shipping method:', error);
    res.status(500).json({ error: 'Failed to fetch shipping method' });
  }
}

export async function createShippingMethod(req: Request, res: Response) {
  try {
    // Validate admin role
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Only admins can create shipping methods' });
    }

    const [newMethod] = await db.insert(shippingMethods).values(req.body).returning();
    res.status(201).json(newMethod);
  } catch (error) {
    console.error('Error creating shipping method:', error);
    res.status(500).json({ error: 'Failed to create shipping method' });
  }
}

export async function updateShippingMethod(req: Request, res: Response) {
  try {
    // Validate admin role
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Only admins can update shipping methods' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const [updatedMethod] = await db
      .update(shippingMethods)
      .set(req.body)
      .where(eq(shippingMethods.id, id))
      .returning();
    
    if (!updatedMethod) {
      return res.status(404).json({ error: 'Shipping method not found' });
    }
    
    res.json(updatedMethod);
  } catch (error) {
    console.error('Error updating shipping method:', error);
    res.status(500).json({ error: 'Failed to update shipping method' });
  }
}

export async function deleteShippingMethod(req: Request, res: Response) {
  try {
    // Validate admin role
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Only admins can delete shipping methods' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Check if method is in use by any shipping rules
    const rules = await db.select().from(shippingRules).where(eq(shippingRules.methodId, id));
    
    if (rules.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete shipping method that is in use by shipping rules',
        rulesCount: rules.length
      });
    }

    // Check if method is in use by any seller shipping settings
    const settings = await db.select().from(sellerShippingSettings).where(eq(sellerShippingSettings.defaultShippingMethodId, id));
    
    if (settings.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete shipping method that is in use by seller settings',
        settingsCount: settings.length
      });
    }

    const [deletedMethod] = await db
      .delete(shippingMethods)
      .where(eq(shippingMethods.id, id))
      .returning();
    
    if (!deletedMethod) {
      return res.status(404).json({ error: 'Shipping method not found' });
    }
    
    res.json(deletedMethod);
  } catch (error) {
    console.error('Error deleting shipping method:', error);
    res.status(500).json({ error: 'Failed to delete shipping method' });
  }
}

// Shipping Zones handlers
export async function getShippingZones(req: Request, res: Response) {
  try {
    const zones = await db.select().from(shippingZones).orderBy(shippingZones.id);
    res.json(zones);
  } catch (error) {
    console.error('Error fetching shipping zones:', error);
    res.status(500).json({ error: 'Failed to fetch shipping zones' });
  }
}

export async function getShippingZone(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const [zone] = await db.select().from(shippingZones).where(eq(shippingZones.id, id));
    
    if (!zone) {
      return res.status(404).json({ error: 'Shipping zone not found' });
    }
    
    res.json(zone);
  } catch (error) {
    console.error('Error fetching shipping zone:', error);
    res.status(500).json({ error: 'Failed to fetch shipping zone' });
  }
}

export async function createShippingZone(req: Request, res: Response) {
  try {
    // Validate admin role
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Only admins can create shipping zones' });
    }

    const [newZone] = await db.insert(shippingZones).values(req.body).returning();
    res.status(201).json(newZone);
  } catch (error) {
    console.error('Error creating shipping zone:', error);
    res.status(500).json({ error: 'Failed to create shipping zone' });
  }
}

export async function updateShippingZone(req: Request, res: Response) {
  try {
    // Validate admin role
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Only admins can update shipping zones' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const [updatedZone] = await db
      .update(shippingZones)
      .set(req.body)
      .where(eq(shippingZones.id, id))
      .returning();
    
    if (!updatedZone) {
      return res.status(404).json({ error: 'Shipping zone not found' });
    }
    
    res.json(updatedZone);
  } catch (error) {
    console.error('Error updating shipping zone:', error);
    res.status(500).json({ error: 'Failed to update shipping zone' });
  }
}

export async function deleteShippingZone(req: Request, res: Response) {
  try {
    // Validate admin role
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Only admins can delete shipping zones' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Check if zone is in use by any shipping rules
    const rules = await db.select().from(shippingRules).where(eq(shippingRules.zoneId, id));
    
    if (rules.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete shipping zone that is in use by shipping rules',
        rulesCount: rules.length
      });
    }

    const [deletedZone] = await db
      .delete(shippingZones)
      .where(eq(shippingZones.id, id))
      .returning();
    
    if (!deletedZone) {
      return res.status(404).json({ error: 'Shipping zone not found' });
    }
    
    res.json(deletedZone);
  } catch (error) {
    console.error('Error deleting shipping zone:', error);
    res.status(500).json({ error: 'Failed to delete shipping zone' });
  }
}

// Shipping Rules handlers
export async function getShippingRules(req: Request, res: Response) {
  try {
    const rules = await db.select().from(shippingRules).orderBy(shippingRules.id);
    res.json(rules);
  } catch (error) {
    console.error('Error fetching shipping rules:', error);
    res.status(500).json({ error: 'Failed to fetch shipping rules' });
  }
}

export async function getShippingRule(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const [rule] = await db.select().from(shippingRules).where(eq(shippingRules.id, id));
    
    if (!rule) {
      return res.status(404).json({ error: 'Shipping rule not found' });
    }
    
    res.json(rule);
  } catch (error) {
    console.error('Error fetching shipping rule:', error);
    res.status(500).json({ error: 'Failed to fetch shipping rule' });
  }
}

export async function createShippingRule(req: Request, res: Response) {
  try {
    // Validate admin role
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Only admins can create shipping rules' });
    }

    // Check if method exists
    const methodId = req.body.methodId;
    const [method] = await db.select().from(shippingMethods).where(eq(shippingMethods.id, methodId));
    
    if (!method) {
      return res.status(400).json({ error: 'Invalid shipping method ID' });
    }

    // Check if zone exists
    const zoneId = req.body.zoneId;
    const [zone] = await db.select().from(shippingZones).where(eq(shippingZones.id, zoneId));
    
    if (!zone) {
      return res.status(400).json({ error: 'Invalid shipping zone ID' });
    }

    // Check if rule for this zone and method already exists
    const existingRules = await db
      .select()
      .from(shippingRules)
      .where(
        and(
          eq(shippingRules.zoneId, zoneId),
          eq(shippingRules.methodId, methodId)
        )
      );

    if (existingRules.length > 0) {
      return res.status(400).json({ 
        error: 'A rule for this zone and method combination already exists',
        existingRule: existingRules[0]
      });
    }

    const [newRule] = await db.insert(shippingRules).values(req.body).returning();
    res.status(201).json(newRule);
  } catch (error) {
    console.error('Error creating shipping rule:', error);
    res.status(500).json({ error: 'Failed to create shipping rule' });
  }
}

export async function updateShippingRule(req: Request, res: Response) {
  try {
    // Validate admin role
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Only admins can update shipping rules' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // If updating method or zone, check if they exist
    if (req.body.methodId) {
      const methodId = req.body.methodId;
      const [method] = await db.select().from(shippingMethods).where(eq(shippingMethods.id, methodId));
      
      if (!method) {
        return res.status(400).json({ error: 'Invalid shipping method ID' });
      }
    }

    if (req.body.zoneId) {
      const zoneId = req.body.zoneId;
      const [zone] = await db.select().from(shippingZones).where(eq(shippingZones.id, zoneId));
      
      if (!zone) {
        return res.status(400).json({ error: 'Invalid shipping zone ID' });
      }
    }

    // If updating both method and zone, check for existing rule with same combination
    if (req.body.methodId && req.body.zoneId) {
      const existingRules = await db
        .select()
        .from(shippingRules)
        .where(
          and(
            eq(shippingRules.zoneId, req.body.zoneId),
            eq(shippingRules.methodId, req.body.methodId),
            eq(shippingRules.id, id).not() // Exclude current rule
          )
        );

      if (existingRules.length > 0) {
        return res.status(400).json({ 
          error: 'A rule for this zone and method combination already exists',
          existingRule: existingRules[0]
        });
      }
    }

    const [updatedRule] = await db
      .update(shippingRules)
      .set(req.body)
      .where(eq(shippingRules.id, id))
      .returning();
    
    if (!updatedRule) {
      return res.status(404).json({ error: 'Shipping rule not found' });
    }
    
    res.json(updatedRule);
  } catch (error) {
    console.error('Error updating shipping rule:', error);
    res.status(500).json({ error: 'Failed to update shipping rule' });
  }
}

export async function deleteShippingRule(req: Request, res: Response) {
  try {
    // Validate admin role
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Only admins can delete shipping rules' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const [deletedRule] = await db
      .delete(shippingRules)
      .where(eq(shippingRules.id, id))
      .returning();
    
    if (!deletedRule) {
      return res.status(404).json({ error: 'Shipping rule not found' });
    }
    
    res.json(deletedRule);
  } catch (error) {
    console.error('Error deleting shipping rule:', error);
    res.status(500).json({ error: 'Failed to delete shipping rule' });
  }
}

// Seller Shipping Settings handlers
export async function getSellerShippingSettings(req: Request, res: Response) {
  try {
    // Get seller ID from authenticated user or from query params (for admins)
    let sellerId = req.user?.id;
    
    if (req.user?.role === 'admin' && req.query.sellerId) {
      sellerId = parseInt(req.query.sellerId as string);
      if (isNaN(sellerId)) {
        return res.status(400).json({ error: 'Invalid seller ID format' });
      }
    }
    
    if (!sellerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if seller has settings
    const [settings] = await db
      .select()
      .from(sellerShippingSettings)
      .where(eq(sellerShippingSettings.sellerId, sellerId));
    
    if (!settings) {
      // Return default settings if not found
      return res.json({
        sellerId,
        enableCustomShipping: false,
        defaultShippingMethodId: 1, // Default to standard shipping
        freeShippingThreshold: 0,
        processingTime: "1-2 business days",
        shippingPolicy: "",
        returnPolicy: "",
        internationalShipping: false,
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching seller shipping settings:', error);
    res.status(500).json({ error: 'Failed to fetch seller shipping settings' });
  }
}

export async function createOrUpdateSellerShippingSettings(req: Request, res: Response) {
  try {
    // Get seller ID from authenticated user or from body (for admins)
    let sellerId = req.user?.id;
    
    if (req.user?.role === 'admin' && req.body.sellerId) {
      sellerId = req.body.sellerId;
    }
    
    if (!sellerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if seller has settings
    const [existingSettings] = await db
      .select()
      .from(sellerShippingSettings)
      .where(eq(sellerShippingSettings.sellerId, sellerId));
    
    let result;
    
    if (existingSettings) {
      // Update existing settings
      [result] = await db
        .update(sellerShippingSettings)
        .set({
          ...req.body,
          sellerId,
          updatedAt: new Date()
        })
        .where(eq(sellerShippingSettings.sellerId, sellerId))
        .returning();
    } else {
      // Create new settings
      [result] = await db
        .insert(sellerShippingSettings)
        .values({
          ...req.body,
          sellerId,
        })
        .returning();
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error saving seller shipping settings:', error);
    res.status(500).json({ error: 'Failed to save seller shipping settings' });
  }
}

// Product Shipping Overrides handlers
export async function getProductShippingOverrides(req: Request, res: Response) {
  try {
    // Get seller ID from authenticated user
    const sellerId = req.user?.id;
    
    if (!sellerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find seller's products
    const products = await db
      .select()
      .from(sellerShippingSettings)
      .where(eq(sellerShippingSettings.sellerId, sellerId));
    
    // If no products, return empty array
    if (!products.length) {
      return res.json([]);
    }

    // Get product IDs
    const productIds = products.map((product: any) => product.id);

    // Get overrides for seller's products
    const overrides = await db
      .select()
      .from(productShippingOverrides)
      .where(({ productId }) => productId.in(productIds));
    
    res.json(overrides);
  } catch (error) {
    console.error('Error fetching product shipping overrides:', error);
    res.status(500).json({ error: 'Failed to fetch product shipping overrides' });
  }
}

export async function getProductShippingOverride(req: Request, res: Response) {
  try {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }

    // Get seller ID from authenticated user
    const sellerId = req.user?.id;
    
    if (!sellerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if product belongs to seller
    const [product] = await db
      .select()
      .from(sellerShippingSettings)
      .where(and(
        eq(sellerShippingSettings.id, productId),
        eq(sellerShippingSettings.sellerId, sellerId)
      ));
    
    if (!product && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Product does not belong to seller' });
    }

    // Get override
    const [override] = await db
      .select()
      .from(productShippingOverrides)
      .where(eq(productShippingOverrides.productId, productId));
    
    if (!override) {
      return res.status(404).json({ error: 'Product shipping override not found' });
    }
    
    res.json(override);
  } catch (error) {
    console.error('Error fetching product shipping override:', error);
    res.status(500).json({ error: 'Failed to fetch product shipping override' });
  }
}

export async function createOrUpdateProductShippingOverride(req: Request, res: Response) {
  try {
    const productId = parseInt(req.body.productId);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }

    // Get seller ID from authenticated user
    const sellerId = req.user?.id;
    
    if (!sellerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if product belongs to seller
    const [product] = await db
      .select()
      .from(sellerShippingSettings)
      .where(and(
        eq(sellerShippingSettings.id, productId),
        eq(sellerShippingSettings.sellerId, sellerId)
      ));
    
    if (!product && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Product does not belong to seller' });
    }

    // Check if override exists
    const [existingOverride] = await db
      .select()
      .from(productShippingOverrides)
      .where(eq(productShippingOverrides.productId, productId));
    
    let result;
    
    if (existingOverride) {
      // Update existing override
      [result] = await db
        .update(productShippingOverrides)
        .set({
          ...req.body,
          updatedAt: new Date()
        })
        .where(eq(productShippingOverrides.productId, productId))
        .returning();
    } else {
      // Create new override
      [result] = await db
        .insert(productShippingOverrides)
        .values(req.body)
        .returning();
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error saving product shipping override:', error);
    res.status(500).json({ error: 'Failed to save product shipping override' });
  }
}

export async function deleteProductShippingOverride(req: Request, res: Response) {
  try {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }

    // Get seller ID from authenticated user
    const sellerId = req.user?.id;
    
    if (!sellerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if product belongs to seller
    const [product] = await db
      .select()
      .from(sellerShippingSettings)
      .where(and(
        eq(sellerShippingSettings.id, productId),
        eq(sellerShippingSettings.sellerId, sellerId)
      ));
    
    if (!product && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Product does not belong to seller' });
    }

    // Delete override
    const [deletedOverride] = await db
      .delete(productShippingOverrides)
      .where(eq(productShippingOverrides.productId, productId))
      .returning();
    
    if (!deletedOverride) {
      return res.status(404).json({ error: 'Product shipping override not found' });
    }
    
    res.json(deletedOverride);
  } catch (error) {
    console.error('Error deleting product shipping override:', error);
    res.status(500).json({ error: 'Failed to delete product shipping override' });
  }
}

// Shipping Tracking handlers
export async function getOrderShippingTracking(req: Request, res: Response) {
  try {
    const orderId = parseInt(req.params.orderId);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }

    const [tracking] = await db
      .select()
      .from(shippingTracking)
      .where(eq(shippingTracking.orderId, orderId));
    
    if (!tracking) {
      return res.status(404).json({ error: 'Shipping tracking not found for this order' });
    }
    
    res.json(tracking);
  } catch (error) {
    console.error('Error fetching shipping tracking:', error);
    res.status(500).json({ error: 'Failed to fetch shipping tracking' });
  }
}

export async function createOrUpdateOrderShippingTracking(req: Request, res: Response) {
  try {
    const orderId = parseInt(req.params.orderId);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }

    // Check if tracking exists
    const [existingTracking] = await db
      .select()
      .from(shippingTracking)
      .where(eq(shippingTracking.orderId, orderId));
    
    let result;
    
    if (existingTracking) {
      // Update existing tracking
      [result] = await db
        .update(shippingTracking)
        .set({
          ...req.body,
          updatedAt: new Date()
        })
        .where(eq(shippingTracking.orderId, orderId))
        .returning();
    } else {
      // Create new tracking
      [result] = await db
        .insert(shippingTracking)
        .values({
          ...req.body,
          orderId
        })
        .returning();
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error saving shipping tracking:', error);
    res.status(500).json({ error: 'Failed to save shipping tracking' });
  }
}