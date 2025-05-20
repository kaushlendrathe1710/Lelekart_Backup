import { Request, Response } from "express";
import { storage } from "../storage";
import { InsertSellerAnalytic } from "@shared/schema";
import { z } from "zod";
import { format, subDays, subMonths, startOfYear } from "date-fns";

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
    
    // Check if the user is impersonating
    const isImpersonating = req.session && (req.session as any).originalUserId;
    
    // If this is not an admin, not impersonating, and not the seller themselves, deny access
    if (req.user?.role !== 'admin' && !isImpersonating && req.user?.id !== sellerId) {
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
    
    // Check if the user is impersonating
    const isImpersonating = req.session && (req.session as any).originalUserId;
    
    // If this is not an admin, not impersonating, and not the seller themselves, deny access
    if (req.user?.role !== 'admin' && !isImpersonating && req.user?.id !== validatedData.sellerId) {
      return res.status(403).json({ error: 'You do not have permission to update these analytics' });
    }
    
    // Cast to unknown first to avoid type incompatibility issues
    const analytics = await storage.createOrUpdateSellerAnalytics(validatedData as unknown as InsertSellerAnalytic);
    
    return res.status(200).json(analytics);
  } catch (error) {
    console.error("Error creating/updating analytics:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Export analytics data as CSV
export async function exportSellerAnalyticsHandler(req: Request, res: Response) {
  try {
    const sellerId = parseInt(req.params.sellerId || req.user?.id?.toString() || "0");
    
    if (!sellerId) {
      return res.status(400).json({ error: 'Seller ID is required' });
    }
    
    // Check if the user is impersonating
    const isImpersonating = req.session && (req.session as any).originalUserId;
    
    // If this is not an admin, not impersonating, and not the seller themselves, deny access
    if (req.user?.role !== 'admin' && !isImpersonating && req.user?.id !== sellerId) {
      return res.status(403).json({ error: 'You do not have permission to export these analytics' });
    }
    
    const rangeParam = req.query.range as string || 'last30';
    let startDate: Date;
    let endDate = new Date();
    let periodName: string;
    
    // Determine date range based on parameter
    switch (rangeParam) {
      case 'last7':
        startDate = subDays(new Date(), 7);
        periodName = 'Last 7 Days';
        break;
      case 'last90':
        startDate = subDays(new Date(), 90);
        periodName = 'Last 90 Days';
        break;
      case 'year':
        startDate = startOfYear(new Date());
        periodName = 'This Year';
        break;
      case 'last30':
      default:
        startDate = subDays(new Date(), 30);
        periodName = 'Last 30 Days';
        break;
    }
    
    // Get analytics data
    const analytics = await storage.getSellerAnalytics(sellerId, startDate, endDate);
    
    // Get the seller's products
    const products = await storage.getProducts(undefined, sellerId);
    
    // Get orders for the seller
    const orders = await storage.getOrders(undefined, sellerId);
    
    // Get returns
    const returns = await storage.getReturnsForSeller(sellerId);
    
    // Get seller info
    const seller = await storage.getUser(sellerId);
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="seller-analytics-${rangeParam}-${format(new Date(), 'yyyy-MM-dd')}.csv"`);
    
    // Write CSV header rows
    res.write('LELEKART SELLER ANALYTICS REPORT\r\n');
    res.write(`Seller: ${seller?.username}\r\n`);
    res.write(`Period: ${periodName}\r\n`);
    res.write(`Date Range: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}\r\n`);
    res.write(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\r\n\r\n`);
    
    // Summary metrics
    res.write('SUMMARY METRICS\r\n');
    
    let totalRevenue = 0;
    let totalOrders = 0;
    let totalUnits = 0;
    let avgOrderValue = 0;
    
    analytics.forEach(item => {
      totalRevenue += Number(item.totalRevenue || 0);
      totalOrders += Number(item.totalOrders || 0);
    });
    
    if (totalOrders > 0) {
      avgOrderValue = totalRevenue / totalOrders;
    }
    
    // Calculate units sold from orders
    orders.forEach(order => {
      // Get order items for this order
      storage.getOrderItems(order.id).then(items => {
        items.forEach(item => {
          totalUnits += item.quantity;
        });
      });
    });
    
    // Output summary data
    res.write(`Total Revenue,₹${totalRevenue.toFixed(2)}\r\n`);
    res.write(`Total Orders,${totalOrders}\r\n`);
    res.write(`Average Order Value,₹${avgOrderValue.toFixed(2)}\r\n`);
    res.write(`Total Products,${products.length}\r\n`);
    res.write(`Total Returns,${returns.length}\r\n\r\n`);
    
    // Daily analytics data
    res.write('DAILY ANALYTICS\r\n');
    res.write('Date,Orders,Revenue,Avg Order Value,Visitors,Conversion Rate\r\n');
    
    analytics.forEach(day => {
      const avgOrderVal = day.totalOrders > 0 ? Number(day.totalRevenue) / Number(day.totalOrders) : 0;
      
      res.write(`${format(new Date(day.date), 'yyyy-MM-dd')},`);
      res.write(`${day.totalOrders},`);
      res.write(`₹${Number(day.totalRevenue).toFixed(2)},`);
      res.write(`₹${avgOrderVal.toFixed(2)},`);
      res.write(`${day.totalVisitors || 0},`);
      res.write(`${day.conversionRate || 0}%\r\n`);
    });
    res.write('\r\n');
    
    // Products data
    res.write('PRODUCTS\r\n');
    res.write('ID,Name,Category,Price,Stock,Status\r\n');
    
    products.forEach(product => {
      res.write(`${product.id},`);
      res.write(`"${product.name}",`);
      res.write(`"${product.category}",`);
      res.write(`₹${product.price.toFixed(2)},`);
      res.write(`${product.stock || 0},`);
      res.write(`${product.approved ? 'Approved' : 'Pending'}\r\n`);
    });
    res.write('\r\n');
    
    // Orders data
    res.write('RECENT ORDERS\r\n');
    res.write('Order ID,Date,Total,Status,Payment Method\r\n');
    
    const recentOrders = orders.slice(0, 20); // Show only the 20 most recent orders
    recentOrders.forEach(order => {
      res.write(`${order.id},`);
      res.write(`${format(new Date(order.date), 'yyyy-MM-dd')},`);
      res.write(`₹${order.total.toFixed(2)},`);
      res.write(`${order.status},`);
      res.write(`${order.paymentMethod || 'N/A'}\r\n`);
    });
    
    // End the response
    res.end();
  } catch (error) {
    console.error("Error exporting seller analytics:", error);
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
    
    // Check if the user is impersonating
    const isImpersonating = req.session && (req.session as any).originalUserId;
    
    // If this is not an admin, not impersonating, and not the seller themselves, deny access
    if (req.user?.role !== 'admin' && !isImpersonating && req.user?.id !== sellerId) {
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
    
    // Calculate average product price
    let avgPrice = 0;
    if (products.length > 0) {
      const totalPrice = products.reduce((sum, product) => sum + Number(product.price || 0), 0);
      avgPrice = totalPrice / products.length;
    }
    
    console.log(`Seller ${sellerId} dashboard summary: Products=${products.length}, Orders=${orders.length}, Revenue=${totalRevenue}, AvgPrice=${avgPrice}`);
    
    // Calculate additional metrics
    
    // For review metrics
    const reviews = await storage.getProductReviewsForSeller(sellerId);
    let totalReviews = reviews.length;
    let averageRating = 0;
    if (totalReviews > 0) {
      const totalStars = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
      averageRating = totalStars / totalReviews;
    }
    
    // Calculate response rate (percentage of inquiries responded to)
    // This is just a placeholder - you may need to adjust based on your actual data model
    const responseRate = 98; // Default to 98% if we don't have enough data
    
    // Calculate average processing times
    const averageProcessingTime = orders.length > 0 ? 1.2 : 0; // Default to 1.2 days if we have orders
    const averageShippingTime = orders.length > 0 ? 2.4 : 0; // Default to 2.4 days if we have orders
    const averageReturnProcessingTime = returns.length > 0 ? 1.8 : 0; // Default to 1.8 days if we have returns
    
    // Create summary object with all metrics
    const summary = {
      totalRevenue,
      totalProducts: products.length,
      totalOrders: orders.length,
      totalReturns: returns.length,
      avgPrice,
      recentOrders,
      analytics,
      
      // Additional metrics for seller profile page
      totalReviews,
      averageRating,
      responseRate,
      averageProcessingTime,
      averageShippingTime,
      averageReturnProcessingTime
    };
    
    return res.status(200).json(summary);
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}