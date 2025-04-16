import { Request, Response } from "express";
import { storage } from "../storage";
import { InsertSellerAnalytic } from "@shared/schema";
import { z } from "zod";

// Get analytics for a seller
export async function getSellerAnalyticsHandler(req: Request, res: Response) {
  try {
    const sellerId = parseInt(req.params.sellerId || req.user?.id?.toString() || "0");
    
    if (!sellerId) {
      return res.status(400).json({ error: 'Seller ID is required' });
    }
    
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (req.query.startDate && typeof req.query.startDate === 'string') {
      startDate = new Date(req.query.startDate);
    }
    
    if (req.query.endDate && typeof req.query.endDate === 'string') {
      endDate = new Date(req.query.endDate);
    }
    
    // If this is not an admin or the seller themselves, deny access
    if (req.user?.role !== 'admin' && req.user?.id !== sellerId) {
      return res.status(403).json({ error: 'You do not have permission to view these analytics' });
    }
    
    const analytics = await storage.getSellerAnalytics(sellerId, startDate, endDate);
    
    return res.status(200).json(analytics);
  } catch (error) {
    console.error("Error fetching seller analytics:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Create or update analytics data
export async function createOrUpdateAnalyticsHandler(req: Request, res: Response) {
  try {
    const analyticsSchema = z.object({
      sellerId: z.number(),
      date: z.string().refine(val => !isNaN(Date.parse(val)), {
        message: 'Invalid date format'
      }).transform(val => new Date(val)),
      totalOrders: z.number().int().min(0),
      totalRevenue: z.number().min(0),
      averageOrderValue: z.number().optional(),
      totalVisitors: z.number().int().min(0).optional(),
      conversionRate: z.number().min(0).max(100).optional(),
      topProducts: z.string().optional(),
      categoryBreakdown: z.string().optional(),
    });
    
    const validatedData = analyticsSchema.parse(req.body);
    
    // If this is not an admin or the seller themselves, deny access
    if (req.user?.role !== 'admin' && req.user?.id !== validatedData.sellerId) {
      return res.status(403).json({ error: 'You do not have permission to update these analytics' });
    }
    
    const analytics = await storage.createOrUpdateSellerAnalytics(validatedData as InsertSellerAnalytic);
    
    return res.status(200).json(analytics);
  } catch (error) {
    console.error("Error creating/updating analytics:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get dashboard summary with key metrics for a seller
export async function getSellerDashboardSummaryHandler(req: Request, res: Response) {
  try {
    const sellerId = parseInt(req.params.sellerId || req.user?.id?.toString() || "0");
    
    if (!sellerId) {
      return res.status(400).json({ error: 'Seller ID is required' });
    }
    
    // If this is not an admin or the seller themselves, deny access
    if (req.user?.role !== 'admin' && req.user?.id !== sellerId) {
      return res.status(403).json({ error: 'You do not have permission to view this dashboard' });
    }
    
    // Get analytics for the past 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const analytics = await storage.getSellerAnalytics(sellerId, thirtyDaysAgo);
    
    // Get the total number of products for this seller
    const products = await storage.getProducts(undefined, sellerId);
    
    // Get recent orders
    const orders = await storage.getOrders(undefined, sellerId);
    const recentOrders = orders.slice(0, 5);
    
    // Get returns
    const returns = await storage.getReturnsForSeller(sellerId);
    
    // Calculate total revenue
    let totalRevenue = 0;
    analytics.forEach(item => {
      totalRevenue += Number(item.totalRevenue);
    });
    
    // Create summary object
    const summary = {
      totalRevenue,
      totalProducts: products.length,
      totalOrders: orders.length,
      totalReturns: returns.length,
      recentOrders,
      analytics
    };
    
    return res.status(200).json(summary);
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}