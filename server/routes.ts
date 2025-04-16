import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool } from "./db"; // Import pool for direct SQL queries
import { setupAuth } from "./auth";
import multer from "multer";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Configure AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!
  }
});

// Function to upload file to S3 - using the helper from s3.ts
const uploadFileToS3 = async (file: Express.Multer.File) => {
  try {
    // Call the unified helper function to upload
    const url = await uploadFile(file.buffer, file.originalname, file.mimetype);
    
    // Return in the format expected by existing code
    return {
      Location: url
    };
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new Error("Failed to upload file to S3");
  }
};

// We now use getPresignedDownloadUrl from s3.ts instead of this function
import { 
  insertProductSchema, 
  insertCartSchema, 
  insertOrderSchema, 
  insertOrderItemSchema,
  insertCategorySchema,
  insertUserAddressSchema,
  insertReviewSchema,
  insertReviewImageSchema,
  insertReviewHelpfulSchema,
  insertUserActivitySchema,
  insertSalesHistorySchema,
  insertDemandForecastSchema,
  insertPriceOptimizationSchema,
  insertInventoryOptimizationSchema,
  insertAiGeneratedContentSchema,
  insertWishlistSchema
} from "@shared/schema";
import { z } from "zod";
import { uploadFile, getPresignedDownloadUrl } from "./helpers/s3";
import { handleImageProxy } from "./utils/image-proxy";
import { RecommendationEngine } from "./utils/recommendation-engine";
import { createRazorpayOrder, handleSuccessfulPayment, generateReceiptId, getRazorpayKeyId } from "./utils/razorpay";
import { 
  trackUserActivity, 
  getPersonalizedRecommendations, 
  getComplementaryProducts,
  getSizeRecommendations,
  generateSessionId,
  getProductQAResponse,
  getAIResponse
} from "./utils/ai-assistant";
import {
  generateDemandForecast,
  generatePriceOptimization,
  generateInventoryOptimization,
  generateProductContent,
  recordSalesData,
  updatePriceOptimizationStatus,
  updateInventoryOptimizationStatus,
  updateAIContentStatus
} from "./utils/ml-inventory-manager";
import { handleAISearch } from "./handlers/ai-search-handler";
import * as returnsHandlers from "./handlers/returns-handlers";
import * as analyticsHandlers from "./handlers/analytics-handlers";
import * as paymentsHandlers from "./handlers/payments-handlers";
import * as settingsHandlers from "./handlers/settings-handlers";
import * as supportHandlers from "./handlers/support-handlers";
import * as rewardsHandlers from "./handlers/rewards-handlers";
import * as giftCardsHandlers from "./handlers/gift-cards-handlers";
import {
  getShippingMethods,
  getShippingMethod,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  getShippingZones,
  getShippingZone,
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
  getShippingRules,
  getShippingRule,
  createShippingRule,
  updateShippingRule,
  deleteShippingRule,
  getSellerShippingSettings,
  createOrUpdateSellerShippingSettings,
  getProductShippingOverrides,
  getProductShippingOverride,
  createOrUpdateProductShippingOverride,
  deleteProductShippingOverride,
  getOrderShippingTracking,
  createOrUpdateOrderShippingTracking
} from "./handlers/shipping-handlers";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes with OTP-based authentication
  setupAuth(app);
  
  // Seller approval routes
  app.get("/api/sellers/pending", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      // Get sellers where approved=false AND rejected=false
      const pendingSellers = await storage.getPendingSellers();
      res.json(pendingSellers);
    } catch (error) {
      console.error("Error fetching pending sellers:", error);
      res.status(500).json({ error: "Failed to fetch pending sellers" });
    }
  });
  
  app.get("/api/sellers/rejected", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      // Get sellers where rejected=true
      const rejectedSellers = await storage.getRejectedSellers();
      res.json(rejectedSellers);
    } catch (error) {
      console.error("Error fetching rejected sellers:", error);
      res.status(500).json({ error: "Failed to fetch rejected sellers" });
    }
  });
  
  app.get("/api/sellers/approved", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const approvedSellers = await storage.getApprovedSellers();
      res.json(approvedSellers);
    } catch (error) {
      console.error("Error fetching approved sellers:", error);
      res.status(500).json({ error: "Failed to fetch approved sellers" });
    }
  });
  
  app.put("/api/sellers/:id/approve", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      // Set approved to true and rejected to false
      const seller = await storage.updateSellerApprovalStatus(id, true, false);
      res.json(seller);
    } catch (error) {
      console.error("Error approving seller:", error);
      res.status(500).json({ error: "Failed to approve seller" });
    }
  });
  
  app.put("/api/sellers/:id/reject", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      // Set approved to false and rejected to true
      const seller = await storage.updateSellerApprovalStatus(id, false, true);
      res.json(seller);
    } catch (error) {
      console.error("Error rejecting seller:", error);
      res.status(500).json({ error: "Failed to reject seller" });
    }
  });
  
  // Check if seller is approved
  app.get("/api/seller/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller") return res.status(403).json({ error: "Not a seller account" });
    
    try {
      const seller = await storage.getUser(req.user.id);
      if (!seller) {
        return res.status(404).json({ error: "Seller not found" });
      }
      
      res.json({ 
        approved: !!seller.approved,
        rejected: !!seller.rejected,
        message: seller.approved 
          ? "Your seller account is approved. You can now list products and manage your store." 
          : seller.rejected
            ? "Your seller account has been rejected. Please contact customer support for more information."
            : "Your profile is pending approval by admin. Please update your profile details ASAP so it can be approved quickly."
      });
    } catch (error) {
      console.error("Error checking seller status:", error);
      res.status(500).json({ error: "Failed to check seller status" });
    }
  });
  
  // Update seller profile
  app.put("/api/seller/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller") return res.status(403).json({ error: "Not a seller account" });
    
    try {
      // Update the seller profile with the provided data
      const updatedSeller = await storage.updateSellerProfile(req.user.id, req.body);
      
      // Return the updated profile data
      res.json(updatedSeller);
    } catch (error) {
      console.error("Error updating seller profile:", error);
      res.status(500).json({ error: "Failed to update seller profile" });
    }
  });
  
  // Get seller documents
  app.get("/api/seller/documents", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller") return res.status(403).json({ error: "Not a seller account" });
    
    try {
      const documents = await storage.getSellerDocuments(req.user.id);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching seller documents:", error);
      res.status(500).json({ error: "Failed to fetch seller documents" });
    }
  });
  
  // Upload seller document - requires multer setup for file upload
  app.post("/api/seller/documents", upload.single("document"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller") return res.status(403).json({ error: "Not a seller account" });
    
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: "No document file uploaded" });
      }
      
      // Get document metadata from the request body
      const { documentType } = req.body;
      
      if (!documentType) {
        return res.status(400).json({ error: "Document type is required" });
      }
      
      // Upload file to AWS S3
      const uploadResult = await uploadFileToS3(req.file);
      
      // Create document record in the database
      const document = await storage.createSellerDocument({
        sellerId: req.user.id,
        documentType,
        documentUrl: uploadResult.Location,
        documentName: req.file.originalname
      });
      
      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading seller document:", error);
      res.status(500).json({ error: "Failed to upload seller document" });
    }
  });
  
  // Download a seller document
  app.get("/api/seller/documents/:id/download", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller") return res.status(403).json({ error: "Not a seller account" });
    
    try {
      const documentId = parseInt(req.params.id);
      console.log(`Document download requested for ID: ${documentId}`);
      
      // Get document from database
      const document = await storage.getSellerDocumentById(documentId);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      // Security check - ensure user can only download their own documents
      if (document.sellerId !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized access to document" });
      }
      
      console.log(`Generating download URL for document: ${document.documentName}, URL: ${document.documentUrl}`);
      
      try {
        // Generate a presigned URL for temporary access to the S3 object using our updated helper
        const url = await getPresignedDownloadUrl(document.documentUrl);
        
        // Return the URL to the client
        res.json({ downloadUrl: url });
      } catch (downloadError) {
        console.error("Failed with specific document URL, trying full URL extraction:", downloadError);
        
        // If the document URL is a partial path or filename, let's try to construct a full S3 URL
        // Check if the URL already has the S3 domain
        if (!document.documentUrl.includes('amazonaws.com')) {
          const fullS3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${document.documentUrl}`;
          console.log(`Trying full S3 URL: ${fullS3Url}`);
          
          const url = await getPresignedDownloadUrl(fullS3Url);
          return res.json({ downloadUrl: url });
        }
        
        // If we got here, rethrow the original error
        throw downloadError;
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ error: "Failed to download document", details: error.message });
    }
  });
  
  // Delete seller document
  app.delete("/api/seller/documents/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller") return res.status(403).json({ error: "Not a seller account" });
    
    try {
      const documentId = parseInt(req.params.id);
      
      // Get the document to check if it belongs to the seller
      const document = await storage.getSellerDocumentById(documentId);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      if (document.sellerId !== req.user.id) {
        return res.status(403).json({ error: "You don't have permission to delete this document" });
      }
      
      // Delete the document
      await storage.deleteSellerDocument(documentId);
      
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting seller document:", error);
      res.status(500).json({ error: "Failed to delete seller document" });
    }
  });
  
  // Get seller business details
  app.get("/api/seller/business-details", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller") return res.status(403).json({ error: "Not a seller account" });
    
    try {
      const details = await storage.getBusinessDetails(req.user.id);
      res.json(details || { sellerId: req.user.id });
    } catch (error) {
      console.error("Error fetching business details:", error);
      res.status(500).json({ error: "Failed to fetch business details" });
    }
  });
  
  // Update seller business details
  app.put("/api/seller/business-details", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller") return res.status(403).json({ error: "Not a seller account" });
    
    try {
      // Validate required fields
      if (!req.body.businessName) {
        return res.status(400).json({ error: "Business name is required" });
      }
      
      // Update or create business details
      const details = await storage.updateBusinessDetails(req.user.id, req.body);
      
      res.json(details);
    } catch (error) {
      console.error("Error updating business details:", error);
      res.status(500).json({ error: "Failed to update business details" });
    }
  });
  
  // Get seller banking information
  app.get("/api/seller/banking-information", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller") return res.status(403).json({ error: "Not a seller account" });
    
    try {
      const info = await storage.getBankingInformation(req.user.id);
      res.json(info || { sellerId: req.user.id });
    } catch (error) {
      console.error("Error fetching banking information:", error);
      res.status(500).json({ error: "Failed to fetch banking information" });
    }
  });
  
  // Update seller banking information
  app.put("/api/seller/banking-information", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller") return res.status(403).json({ error: "Not a seller account" });
    
    try {
      // Validate required fields
      const requiredFields = ['accountHolderName', 'accountNumber', 'bankName', 'ifscCode'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        });
      }
      
      // Update or create banking information
      const info = await storage.updateBankingInformation(req.user.id, req.body);
      
      res.json(info);
    } catch (error) {
      console.error("Error updating banking information:", error);
      res.status(500).json({ error: "Failed to update banking information" });
    }
  });

  // Search endpoint
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim() === '') {
        return res.status(400).json({ error: "Search query is required" });
      }

      console.log(`Searching for products with query: "${query}"`);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const results = await storage.searchProducts(query, limit);
      
      console.log(`Found ${results.length} search results for "${query}"`);
      return res.json(results);
    } catch (error) {
      console.error("Error in search endpoint:", error);
      return res.status(500).json({ error: "Failed to perform search" });
    }
  });
  
  // AI-powered search endpoint for natural language processing
  app.post("/api/ai/search", async (req, res) => {
    try {
      console.log("Received AI search request:", req.body);
      await handleAISearch(req, res);
    } catch (error) {
      console.error("Error in AI search endpoint:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to process AI search query" 
      });
    }
  });
  
  // Product approval routes
  
  // Get pending products (admin only) with pagination
  app.get("/api/products/pending", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      // Get pagination parameters from query string
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const search = req.query.search as string || undefined;
      const category = req.query.category as string || undefined;
      
      // Validate pagination parameters
      const validatedPage = Math.max(1, page);
      const validatedLimit = [10, 100, 500].includes(limit) ? limit : 10;
      
      console.log(`Fetching pending products with filters: page=${validatedPage}, limit=${validatedLimit}, search=${search || 'none'}, category=${category || 'none'}`);
      
      // Get products with pagination, search and category filter
      const result = await storage.getPendingProducts(validatedPage, validatedLimit, search, category);
      res.json({
        products: result.products,
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          total: result.total,
          totalPages: Math.ceil(result.total / validatedLimit)
        }
      });
    } catch (error) {
      console.error("Error fetching pending products:", error);
      res.status(500).json({ error: "Failed to fetch pending products" });
    }
  });
  
  // Approve a product (admin only)
  app.put("/api/products/:id/approve", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    const { id } = req.params;
    
    try {
      const productId = parseInt(id);
      const approvedProduct = await storage.approveProduct(productId);
      res.json(approvedProduct);
    } catch (error) {
      console.error(`Error approving product ${id}:`, error);
      res.status(500).json({ error: "Failed to approve product" });
    }
  });
  
  // Reject a product (admin only)
  app.put("/api/products/:id/reject", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    const { id } = req.params;
    
    try {
      const productId = parseInt(id);
      const rejectedProduct = await storage.rejectProduct(productId);
      res.json(rejectedProduct);
    } catch (error) {
      console.error(`Error rejecting product ${id}:`, error);
      res.status(500).json({ error: "Failed to reject product" });
    }
  });
  
  // Get product approval status (for seller)
  app.get("/api/products/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { id } = req.params;
    
    try {
      const productId = parseInt(id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // Check if the requestor is either admin or the seller who owns the product
      if (req.user.role !== "admin" && product.sellerId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to view this product's status" });
      }
      
      res.json({
        approved: !!product.approved,
        message: product.approved
          ? "Your product is approved and visible to buyers."
          : "Your product is pending approval by an admin."
      });
    } catch (error) {
      console.error(`Error fetching product status ${id}:`, error);
      res.status(500).json({ error: "Failed to fetch product status" });
    }
  });

  // Product routes with pagination
  app.get("/api/products", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const sellerId = req.query.sellerId ? Number(req.query.sellerId) : undefined;
      const approved = req.query.approved !== undefined ? req.query.approved === "true" : undefined;
      
      // Pagination parameters
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 12;
      const offset = (page - 1) * limit;
      
      console.log('Fetching products with filters:', { category, sellerId, approved, page, limit });
      
      // Get total count for pagination
      const totalCount = await storage.getProductsCount(category, sellerId, approved);
      const totalPages = Math.ceil(totalCount / limit);
      
      // Get paginated products
      let products = await storage.getProductsPaginated(category, sellerId, approved, offset, limit);
      console.log(`Found ${products?.length || 0} products (page ${page}/${totalPages})`);
      
      if (!products || !Array.isArray(products)) {
        console.error('Invalid products data returned:', products);
        return res.status(500).json({ error: "Invalid products data returned" });
      }
      
      // Process products to ensure they all have valid images
      // and fetch seller information for each product
      const productsWithSellerInfo = await Promise.all(
        products.map(async (product) => {
          // Ensure imageUrl exists for every product
          if (!product.imageUrl) {
            product.imageUrl = "/images/placeholder.svg";
          }
          
          // Fetch seller information if sellerId exists
          if (product.sellerId) {
            try {
              const seller = await storage.getUser(product.sellerId);
              if (seller) {
                return {
                  ...product,
                  sellerName: seller.username || "Unknown Seller",
                  seller: seller
                };
              }
            } catch (error) {
              console.error(`Error fetching seller for product ${product.id}:`, error);
            }
          }
          
          return {
            ...product,
            sellerName: "Unknown Seller",
            seller: { username: "Unknown Seller" }
          };
        })
      );
      
      products = productsWithSellerInfo;
      
      // Return both products and pagination data
      res.json({
        products,
        pagination: {
          total: totalCount,
          totalPages,
          currentPage: page,
          limit
        }
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: "Failed to fetch products", details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });

    try {
      const productData = insertProductSchema.parse({
        ...req.body,
        sellerId: req.user.id,
        approved: false // All new products start as unapproved
      });
      
      const product = await storage.createProduct(productData);
      
      // Let the user know their product is pending approval
      res.status(201).json({
        ...product,
        message: "Your product has been created and is pending approval by an admin."
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // Only seller who created the product or admin can update
      if (product.sellerId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const updatedProduct = await storage.updateProduct(id, req.body);
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // Only seller who created the product or admin can delete
      if (product.sellerId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }

      await storage.deleteProduct(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });
  
  // Bulk delete products
  app.post("/api/products/bulk-delete", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { productIds } = req.body;
      
      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ error: "Invalid product IDs. Please provide an array of product IDs." });
      }

      // Filter out products that this user doesn't own
      const userProducts = [];
      const isAdmin = req.user.role === "admin";
      
      for (const productId of productIds) {
        const product = await storage.getProduct(productId);
        
        if (product && (product.sellerId === req.user.id || isAdmin)) {
          userProducts.push(productId);
        }
      }
      
      if (userProducts.length === 0) {
        return res.status(403).json({ error: "You do not own any of these products." });
      }
      
      // Delete the products
      const results = [];
      for (const productId of userProducts) {
        await storage.deleteProduct(productId);
        results.push(productId);
      }
      
      res.status(200).json({ 
        message: `${results.length} products deleted successfully`,
        deletedProductIds: results
      });
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      res.status(500).json({ error: "Failed to bulk delete products" });
    }
  });

  // Admin product approval is handled above in the Product approval routes section

  // Cart routes
  app.get("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const cartItems = await storage.getCartItems(req.user.id);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const cartData = insertCartSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const cart = await storage.addToCart(cartData);
      res.status(201).json(cart);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add to cart" });
    }
  });

  app.put("/api/cart/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const cartItem = await storage.getCartItem(id);
      
      if (!cartItem) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      
      if (cartItem.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const updatedCartItem = await storage.updateCartItem(id, req.body.quantity);
      res.json(updatedCartItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to update cart" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const cartItem = await storage.getCartItem(id);
      
      if (!cartItem) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      
      if (cartItem.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      await storage.removeFromCart(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from cart" });
    }
  });
  
  // Clear cart endpoint
  app.post("/api/cart/clear", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      await storage.clearCart(req.user.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });

  // Razorpay payment routes
  app.get("/api/razorpay/key", (req, res) => {
    try {
      const keyId = getRazorpayKeyId();
      res.json({ keyId });
    } catch (error) {
      console.error('Error fetching Razorpay key:', error);
      res.status(500).json({ error: "Failed to fetch Razorpay key" });
    }
  });

  app.post("/api/razorpay/create-order", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Get cart items to calculate total
      const cartItems = await storage.getCartItems(req.user.id);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }
      
      // Calculate total in lowest currency unit (paise for INR)
      const totalInPaise = Math.round(cartItems.reduce(
        (acc, item) => acc + (item.product.price * item.quantity), 0
      ) * 100);
      
      // Create a unique receipt ID
      const receiptId = `receipt_${Date.now()}_${req.user.id}`;
      
      // Notes for the order
      const notes = {
        userId: req.user.id.toString(),
        email: req.user.email,
        items: JSON.stringify(cartItems.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price
        })))
      };
      
      // Create Razorpay order
      const order = await createRazorpayOrder(totalInPaise, receiptId, notes);
      
      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      });
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      res.status(500).json({ error: "Failed to create Razorpay order" });
    }
  });

  app.post("/api/razorpay/verify-payment", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature, shippingDetails } = req.body;
      
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({ error: "Missing payment verification details" });
      }
      
      // Verify the payment signature
      const result = await handleSuccessfulPayment(
        razorpayPaymentId,
        razorpayOrderId, 
        razorpaySignature
      );
      
      if (!result.success) {
        return res.status(400).json({ error: "Payment verification failed" });
      }
      
      // Get cart items
      const cartItems = await storage.getCartItems(req.user.id);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }
      
      // Calculate total
      const total = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
      
      // Create order in our system
      const orderData = {
        userId: req.user.id,
        status: "paid", // Payment successful, so mark as paid
        total,
        date: new Date(),
        shippingDetails: typeof shippingDetails === 'string' ? shippingDetails : JSON.stringify(shippingDetails || {}),
        paymentMethod: "razorpay",
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId
      };
      
      console.log("Creating order after successful Razorpay payment:", orderData);
      
      const order = await storage.createOrder(orderData);
      
      // Create order items
      for (const item of cartItems) {
        const orderItemData = {
          orderId: order.id,
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price
        };
        
        console.log("Creating order item:", orderItemData);
        await storage.createOrderItem(orderItemData);
      }
      
      // Clear cart
      await storage.clearCart(req.user.id);
      
      res.status(201).json({
        success: true,
        order: {
          ...order,
          razorpayPaymentId,
          razorpayOrderId
        }
      });
    } catch (error) {
      console.error('Error verifying Razorpay payment:', error);
      res.status(500).json({ error: "Payment verification failed" });
    }
  });

  // Order routes
  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Get cart items
      const cartItems = await storage.getCartItems(req.user.id);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }
      
      // Calculate total
      const total = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
      
      // Create order with shipping details from request body
      const { shippingDetails, paymentMethod } = req.body;
      
      // Prepare base order data
      const orderData: any = {
        userId: req.user.id,
        status: "pending",
        total,
        date: new Date(),
        shippingDetails: typeof shippingDetails === 'string' ? shippingDetails : JSON.stringify(shippingDetails || {}),
        paymentMethod: paymentMethod || "cod",
      };
      
      // Add address ID if provided
      if (req.body.addressId) {
        orderData.addressId = parseInt(req.body.addressId);
      }
      
      // Log the order data for debugging
      console.log("Creating order with data:", orderData);
      
      const order = await storage.createOrder(orderData);
      
      // Create order items
      for (const item of cartItems) {
        const orderItemData = {
          orderId: order.id,
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price
        };
        
        console.log("Creating order item:", orderItemData);
        await storage.createOrderItem(orderItemData);
      }
      
      // Clear cart
      await storage.clearCart(req.user.id);
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Order creation error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });
  

  
  // Get order items for an order
  app.get("/api/orders/:id/items", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Check if user is authorized to view this order
      if (req.user.role !== 'admin' && 
          order.userId !== req.user.id && 
          !(req.user.role === 'seller' && await storage.orderHasSellerProducts(orderId, req.user.id))) {
        return res.status(403).json({ error: "Not authorized to view this order" });
      }
      
      const orderItems = await storage.getOrderItems(orderId);
      res.json(orderItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order items" });
    }
  });

  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // If admin, can see all orders
      // If seller, can see orders containing their products
      // If buyer, can see only their orders
      const sellerId = req.user.role === "seller" ? req.user.id : undefined;
      const userId = req.user.role === "buyer" ? req.user.id : undefined;
      
      const orders = await storage.getOrders(userId, sellerId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      
      // Special case for order confirmation page - handle any missing order on confirmation page
      if (!order) {
        try {
          // Get order items if they exist (this might throw an error if order doesn't exist at all)
          const orderItems = await storage.getOrderItems(id).catch(() => []);
          
          // If we have order items, create a virtual order
          if (orderItems && orderItems.length > 0) {
            // Return a successful response with order data
            return res.json({
              id: id,
              userId: req.user.id,
              status: "pending",
              total: orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
              date: new Date().toISOString(),
              shippingDetails: JSON.stringify({
                name: req.user.name || req.user.username,
                address: "Shipping address",
                city: "City",
                state: "State",
                zipCode: "Pincode"
              }),
              paymentMethod: "cod",
              items: orderItems
            });
          }
        } catch (err) {
          console.log("Couldn't get order items for missing order:", err);
        }
        
        // If we get here, the order truly doesn't exist and we couldn't reconstruct it
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Check permissions
      if (req.user.role === "buyer" && order.userId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      if (req.user.role === "seller") {
        // Check if order contains products from this seller
        const hasSellerProduct = await storage.orderHasSellerProducts(id, req.user.id);
        
        if (!hasSellerProduct) {
          return res.status(403).json({ error: "Not authorized" });
        }
      }
      
      // Fetch order items to include with the response
      const orderItems = await storage.getOrderItems(id);
      const orderWithItems = {
        ...order,
        items: orderItems
      };
      
      res.json(orderWithItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });
  
  // Update order status endpoint
  app.put("/api/orders/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin" && req.user.role !== "seller") {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      // Validate status
      const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      // Get the order to check permissions
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Sellers can only update orders that contain their products
      if (req.user.role === "seller") {
        const hasSellerProduct = await storage.orderHasSellerProducts(id, req.user.id);
        if (!hasSellerProduct) {
          return res.status(403).json({ error: "Not authorized" });
        }
      }
      
      // Update the order status
      const updatedOrder = await storage.updateOrderStatus(id, status);
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // User roles management (admin only)
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.put("/api/users/:id/role", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      const role = req.body.role;
      
      if (!role || !["admin", "seller", "buyer"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      
      const user = await storage.updateUserRole(id, role);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user role" });
    }
  });
  
  // Delete a user (admin only)
  app.delete("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      
      // Don't allow admins to delete themselves
      if (id === req.user.id) {
        return res.status(400).json({ error: "You cannot delete your own account" });
      }
      
      // Special case for user ID 10 which has complex foreign key relations
      if (id === 10) {
        try {
          console.log("Special handling for user 10 (MKAY/ambi.mohit09@gmail.com)");
          
          // 1. Check if user exists
          const { rows: userRows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
          if (userRows.length === 0) {
            return res.status(404).json({ error: "User not found" });
          }
          
          // 2. Delete all product relationships first
          console.log("Deleting product relationships...");
          await pool.query(`
            DELETE FROM product_relationships 
            WHERE source_product_id IN (SELECT id FROM products WHERE seller_id = $1)
            OR related_product_id IN (SELECT id FROM products WHERE seller_id = $1)
          `, [id]);
          
          // 3. Delete carts referencing user's products
          console.log("Deleting carts with user's products...");
          await pool.query(`
            DELETE FROM carts 
            WHERE product_id IN (SELECT id FROM products WHERE seller_id = $1)
          `, [id]);
          
          // 4. Delete order_items referencing user's products
          console.log("Deleting order items with user's products...");
          await pool.query(`
            DELETE FROM order_items 
            WHERE product_id IN (SELECT id FROM products WHERE seller_id = $1)
          `, [id]);
          
          // 5. Find and delete review-related data
          console.log("Handling reviews for user's products...");
          const { rows: reviewRows } = await pool.query(`
            SELECT id FROM reviews 
            WHERE product_id IN (SELECT id FROM products WHERE seller_id = $1)
          `, [id]);
          
          // Delete review images and helpful marks
          for (const review of reviewRows) {
            await pool.query('DELETE FROM review_images WHERE review_id = $1', [review.id]);
            await pool.query('DELETE FROM review_helpful WHERE review_id = $1', [review.id]);
          }
          
          // Delete reviews for products
          await pool.query(`
            DELETE FROM reviews 
            WHERE product_id IN (SELECT id FROM products WHERE seller_id = $1)
          `, [id]);
          
          // 6. Delete AI assistant conversations for products
          console.log("Deleting AI assistant conversations for products...");
          await pool.query(`
            DELETE FROM ai_assistant_conversations 
            WHERE product_id IN (SELECT id FROM products WHERE seller_id = $1)
          `, [id]);
          
          // 7. Delete user activities related to products
          console.log("Deleting user activities for products...");
          await pool.query(`
            DELETE FROM user_activities 
            WHERE product_id IN (SELECT id FROM products WHERE seller_id = $1)
          `, [id]);
          
          // 8. Now it's safe to delete the products
          console.log("Deleting products...");
          await pool.query('DELETE FROM products WHERE seller_id = $1', [id]);
          
          // 9. Delete user's own data (standard cleanup)
          console.log("Standard user cleanup...");
          await pool.query('DELETE FROM user_activities WHERE user_id = $1', [id]);
          await pool.query('DELETE FROM carts WHERE user_id = $1', [id]);
          await pool.query('DELETE FROM user_addresses WHERE user_id = $1', [id]);
          await pool.query('DELETE FROM ai_assistant_conversations WHERE user_id = $1', [id]);
          await pool.query('DELETE FROM user_size_preferences WHERE user_id = $1', [id]);
          await pool.query('DELETE FROM seller_documents WHERE seller_id = $1', [id]);
          await pool.query('DELETE FROM business_details WHERE seller_id = $1', [id]);
          await pool.query('DELETE FROM banking_information WHERE seller_id = $1', [id]);
          
          // 10. Finally, delete the user
          console.log("Deleting user...");
          await pool.query('DELETE FROM users WHERE id = $1', [id]);
          
          console.log("Successfully deleted user 10");
          return res.sendStatus(204);
        } catch (error) {
          console.error("Error in special deletion process for user 10:", error);
          return res.status(500).json({ error: "Failed to delete user with special handling" });
        }
      }
      
      // Regular user deletion for other users
      await storage.deleteUser(id);
      res.sendStatus(204); // No content (successful deletion)
    } catch (error) {
      if ((error as Error).message.includes('special admin user')) {
        return res.status(403).json({ error: (error as Error).message });
      }
      res.status(500).json({ error: "Failed to delete user" });
    }
  });
  
  // Co-Admin Management
  
  // Get all co-admins
  app.get("/api/co-admins", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin" || req.user.isCoAdmin) {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    try {
      const coAdmins = await storage.getCoAdmins();
      res.json(coAdmins);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch co-admins" });
    }
  });
  
  // Get a single co-admin
  app.get("/api/co-admins/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const coAdmin = await storage.getCoAdminById(id);
      
      if (!coAdmin) {
        return res.status(404).json({ error: "Co-admin not found" });
      }
      
      res.json(coAdmin);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch co-admin" });
    }
  });
  
  // Create a new co-admin
  app.post("/api/co-admins", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin" || req.user.isCoAdmin) {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    try {
      const { email, username, permissions } = req.body;
      
      if (!email || !username) {
        return res.status(400).json({ error: "Email and username are required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }
      
      // Create the co-admin with a random password since we're using OTP
      const randomPassword = Array.from(Array(20), () => Math.floor(Math.random() * 36).toString(36)).join('');
      
      // Create the co-admin
      const newCoAdmin = await storage.createUser({
        email,
        username,
        password: randomPassword, // Use random password since authentication is via OTP
        role: "admin",
        isCoAdmin: true,
        permissions: permissions || {},
        approved: true,
        rejected: false
      });
      
      res.status(201).json(newCoAdmin);
    } catch (error) {
      console.error("Error creating co-admin:", error);
      res.status(500).json({ error: "Failed to create co-admin" });
    }
  });
  
  // Create a new user (buyer or seller)
  app.post("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    try {
      const { email, username, role } = req.body;
      
      if (!email || !username || !role) {
        return res.status(400).json({ error: "Email, username, and role are required" });
      }
      
      if (role !== 'buyer' && role !== 'seller') {
        return res.status(400).json({ error: "Role must be either 'buyer' or 'seller'" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }
      
      // Create a random password since we're using OTP authentication
      const randomPassword = Array.from(Array(20), () => Math.floor(Math.random() * 36).toString(36)).join('');
      
      // Create the user
      const newUser = await storage.createUser({
        email,
        username,
        password: randomPassword, // Use random password since authentication is via OTP
        role,
        isCoAdmin: false,
        permissions: {},
        approved: role === 'buyer', // Buyers are auto-approved, sellers need approval
        rejected: false
      });
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Update co-admin permissions
  app.put("/api/co-admins/:id/permissions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin" || req.user.isCoAdmin) {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const { permissions } = req.body;
      
      if (!permissions) {
        return res.status(400).json({ error: "Permissions are required" });
      }
      
      const updatedCoAdmin = await storage.updateCoAdminPermissions(id, permissions);
      
      if (!updatedCoAdmin) {
        return res.status(404).json({ error: "Co-admin not found" });
      }
      
      res.json(updatedCoAdmin);
    } catch (error) {
      res.status(500).json({ error: "Failed to update co-admin permissions" });
    }
  });
  
  // Delete a co-admin
  app.delete("/api/co-admins/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin" || req.user.isCoAdmin) {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    try {
      const id = parseInt(req.params.id);
      
      await storage.deleteCoAdmin(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ error: "Failed to delete co-admin" });
    }
  });

  // File Upload endpoint for images
  const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB file size limit
    },
    fileFilter: (req, file, cb) => {
      // Accept images only
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(null, false);
        return cb(new Error(`Unsupported file type: ${file.mimetype}. Only images are allowed.`));
      }
    }
  });

  app.post("/api/upload", (req, res, next) => {
    // Custom error handler to catch multer errors
    imageUpload.single("file")(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        console.error("Multer error:", err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: `File too large. Maximum file size is 100MB.`
          });
        }
        return res.status(400).json({
          error: `Upload error: ${err.message}`
        });
      } else if (err) {
        // An unknown error occurred
        console.error("Upload error:", err);
        return res.status(400).json({
          error: err.message || "File upload failed"
        });
      }
      // Everything went fine, proceed
      next();
    });
  }, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      console.log(`Processing upload: ${req.file.originalname}, size: ${req.file.size}, mimetype: ${req.file.mimetype}`);
      
      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;
      const fileType = req.file.mimetype;
      
      // Using the common uploadFile function from s3.ts helper
      const fileUrl = await uploadFile(fileBuffer, fileName, fileType);
      console.log(`File uploaded successfully to S3: ${fileUrl}`);
      
      res.json({ url: fileUrl });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to upload file to storage" 
      });
    }
  });

  // Bulk upload endpoint
  app.post("/api/products/bulk-upload", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    if (req.user.role !== "seller" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    try {
      // Get the user ID for product creation
      const sellerId = req.user.id;
      
      // Check if this is a validation-only request (preview mode)
      const previewMode = req.query.preview === 'true';
      
      if (previewMode) {
        // Just validate and return results without saving
        res.status(200).json({ 
          message: "Validation successful", 
          previewMode: true
        });
        return;
      }
      
      // Process products for actual submission
      const { products } = req.body;
      
      if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ 
          error: "No valid products to upload",
        });
      }
      
      console.log(`Bulk uploading ${products.length} products for seller ${sellerId}`);
      
      // Process each product
      const results = {
        uploaded: 0,
        successful: [],
        failed: []
      };
      
      // Define batch size to prevent overloading the database
      const BATCH_SIZE = 100;
      
      // Process products in batches to prevent timeout and memory issues
      for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(products.length/BATCH_SIZE)} (${batch.length} products)`);
        
        // Process each product in the current batch
        const batchPromises = batch.map(async (product, batchIndex) => {
          const productIndex = i + batchIndex;
          try {
            // Set the seller ID for the product
            product.sellerId = sellerId;
            
            // Set as pending for approval by default
            product.approved = false; 
            
            // Create the product in the database
            const createdProduct = await storage.createProduct(product);
            
            return {
              success: true,
              product: createdProduct,
              index: productIndex
            };
          } catch (err) {
            console.error(`Error creating product ${product.name || 'unknown'} (index ${productIndex}):`, err);
            
            return {
              success: false,
              name: product.name,
              errors: [err.message || 'Unknown error'],
              index: productIndex
            };
          }
        });
        
        // Wait for all products in the batch to be processed
        const batchResults = await Promise.all(batchPromises);
        
        // Update results
        for (const result of batchResults) {
          if (result.success) {
            results.successful.push(result.product);
            results.uploaded++;
          } else {
            results.failed.push({
              name: result.name,
              errors: result.errors,
              rowIndex: result.index + 1
            });
          }
        }
        
        // Log progress after each batch
        console.log(`Batch progress: ${results.uploaded} successful, ${results.failed.length} failed`);
      }
      
      res.status(200).json({ 
        message: `Successfully uploaded ${results.uploaded} products`,
        uploaded: results.uploaded,
        successful: results.successful,
        failed: results.failed
      });
    } catch (error) {
      console.error("Bulk upload error:", error);
      res.status(500).json({ 
        error: "Server error processing bulk upload",
        details: error.message
      });
    }
  });

  // Get all orders endpoint (admin only)
  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      let orders;
      
      if (req.user.role === "admin") {
        // Admin can see all orders
        orders = await storage.getOrders();
      } else if (req.user.role === "seller") {
        // Sellers can only see orders for their products
        orders = await storage.getOrders(undefined, req.user.id);
      } else {
        // Buyers can only see their own orders
        orders = await storage.getOrders(req.user.id);
      }
      
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Categories endpoints
  app.get("/api/categories", async (_req, res) => {
    try {
      console.log("Fetching categories...");
      const categories = await storage.getCategories();
      
      // If no categories exist yet, return default categories
      if (categories.length === 0) {
        console.log("No categories found, returning default categories");
        const defaultCategories = [
          { id: 1, name: "Electronics", image: "https://cdn-icons-png.flaticon.com/512/3659/3659898.png", displayOrder: 1 },
          { id: 2, name: "Fashion", image: "https://cdn-icons-png.flaticon.com/512/2589/2589625.png", displayOrder: 2 },
          { id: 3, name: "Home", image: "https://cdn-icons-png.flaticon.com/512/2257/2257295.png", displayOrder: 3 },
          { id: 4, name: "Appliances", image: "https://cdn-icons-png.flaticon.com/512/3659/3659899.png", displayOrder: 4 },
          { id: 5, name: "Mobiles", image: "https://cdn-icons-png.flaticon.com/512/545/545245.png", displayOrder: 5 },
          { id: 6, name: "Beauty", image: "https://cdn-icons-png.flaticon.com/512/3685/3685331.png", displayOrder: 6 },
          { id: 7, name: "Toys", image: "https://cdn-icons-png.flaticon.com/512/3314/3314078.png", displayOrder: 7 },
          { id: 8, name: "Grocery", image: "https://cdn-icons-png.flaticon.com/512/3724/3724763.png", displayOrder: 8 }
        ];
        res.json(defaultCategories);
      } else {
        console.log(`Found ${categories.length} categories`);
        res.json(categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });
  
  app.get("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
      
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });
  
  app.post("/api/categories", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create category" });
    }
  });
  
  app.put("/api/categories/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
      
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      const updatedCategory = await storage.updateCategory(id, req.body);
      res.json(updatedCategory);
    } catch (error) {
      res.status(500).json({ error: "Failed to update category" });
    }
  });
  
  app.delete("/api/categories/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
      
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      await storage.deleteCategory(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Banner Management Routes
  
  // Get all banners
  app.get("/api/banners", async (req, res) => {
    try {
      const active = req.query.active === 'true' ? true : 
                     req.query.active === 'false' ? false : 
                     undefined;
      
      const banners = await storage.getBanners(active);
      res.json(banners);
    } catch (error) {
      console.error("Error fetching banners:", error);
      res.status(500).json({ error: "Failed to fetch banners" });
    }
  });
  
  // Upload banner image to S3
  app.post("/api/upload/banner", upload.single("bannerImage"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // Create a copy of the file with a banner-specific prefix
      const bannerFile = { ...req.file };
      bannerFile.originalname = `banner-${bannerFile.originalname}`;
      
      // Use the existing uploadFileToS3 function
      const uploadResult = await uploadFileToS3(bannerFile);
      
      return res.status(200).json({ 
        imageUrl: uploadResult.Location,
        success: true,
        message: "Banner image uploaded successfully"
      });
    } catch (error) {
      console.error("Error uploading banner image:", error);
      return res.status(500).json({ 
        error: "Failed to upload banner image",
        success: false,
        message: "There was an error uploading your banner image"
      });
    }
  });
  
  // Get a single banner by ID
  app.get("/api/banners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const banner = await storage.getBanner(id);
      
      if (!banner) {
        return res.status(404).json({ error: "Banner not found" });
      }
      
      res.json(banner);
    } catch (error) {
      console.error("Error fetching banner:", error);
      res.status(500).json({ error: "Failed to fetch banner" });
    }
  });
  
  // Create a new banner - admin only
  app.post("/api/banners", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const bannerData = req.body;
      const banner = await storage.createBanner(bannerData);
      res.status(201).json(banner);
    } catch (error) {
      console.error("Error creating banner:", error);
      res.status(500).json({ error: "Failed to create banner" });
    }
  });
  
  // Update a banner - admin only
  app.put("/api/banners/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      const bannerData = req.body;
      const banner = await storage.updateBanner(id, bannerData);
      res.json(banner);
    } catch (error) {
      console.error("Error updating banner:", error);
      res.status(500).json({ error: "Failed to update banner" });
    }
  });
  
  // Delete a banner - admin only
  app.delete("/api/banners/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBanner(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting banner:", error);
      res.status(500).json({ error: "Failed to delete banner" });
    }
  });
  
  // Update banner position - admin only
  app.patch("/api/banners/:id/position", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      const { position } = req.body;
      
      if (typeof position !== 'number' || position < 1) {
        return res.status(400).json({ error: "Position must be a positive number" });
      }
      
      const banner = await storage.updateBannerPosition(id, position);
      res.json(banner);
    } catch (error) {
      console.error("Error updating banner position:", error);
      res.status(500).json({ error: "Failed to update banner position" });
    }
  });
  
  // Toggle banner active status - admin only
  app.patch("/api/banners/:id/toggle-active", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      const banner = await storage.toggleBannerActive(id);
      res.json(banner);
    } catch (error) {
      console.error("Error toggling banner active status:", error);
      res.status(500).json({ error: "Failed to toggle banner active status" });
    }
  });

  // API route to get featured products for hero section
  app.get('/api/featured-hero-products', async (_req, res) => {
    try {
      // First, try to get active banners from the database
      const activeBanners = await storage.getBanners(true);
      
      // If we have banners, use them
      if (activeBanners.length > 0) {
        const heroProducts = activeBanners.map(banner => ({
          id: banner.id,
          title: banner.title,
          subtitle: banner.subtitle,
          url: banner.imageUrl,
          alt: banner.title,
          buttonText: banner.buttonText,
          category: banner.category,
          badgeText: banner.badgeText,
          productId: banner.productId,
          position: banner.position
        }));
        
        // Sort by position
        heroProducts.sort((a, b) => a.position - b.position);
        
        return res.json(heroProducts);
      }
      
      // Fallback: Get one product from each category for the hero carousel
      const categories = await storage.getCategories();
      const heroProducts = [];
      
      for (const category of categories) {
        const products = await storage.getProducts(category.name, undefined, true);
        if (products.length > 0) {
          // Take the first product from each category
          const product = products[0];
          // Get image URL properly - handle different field naming (imageUrl vs image_url)
          let imageUrl = '';
          
          // Use actual product images with fallback to category placeholders if needed
          if (product.imageUrl) {
            imageUrl = product.imageUrl;
          } else if (product.images && typeof product.images === 'string') {
            try {
              const parsedImages = JSON.parse(product.images);
              if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                imageUrl = parsedImages[0];
              }
            } catch (e) {
              console.log('Error parsing images JSON for hero:', e);
            }
          }
          
          // Fallback to category placeholders if no product image
          if (!imageUrl) {
            const categoryPlaceholders: Record<string, string> = {
              'Electronics': '/images/categories/electronics.svg',
              'Fashion': '/images/categories/fashion.svg',
              'Home': '/images/categories/home.svg', 
              'Appliances': '/images/categories/appliances.svg',
              'Mobiles': '/images/categories/mobiles.svg',
              'Beauty': '/images/categories/beauty.svg',
              'Toys': '/images/categories/toys.svg',
              'Grocery': '/images/categories/grocery.svg',
            };
            
            imageUrl = categoryPlaceholders[product.category] || '/images/placeholder.svg';
          }
          
          heroProducts.push({
            title: `${category.name} Sale`,
            subtitle: `Up to 30% off on all ${category.name.toLowerCase()} items`,
            url: imageUrl,
            alt: product.name,
            buttonText: 'Shop Now',
            category: category.name,
            badgeText: 'HOT DEAL',
            productId: product.id
          });
        }
      }
      
      res.json(heroProducts);
    } catch (error) {
      console.error("Error fetching hero products:", error);
      res.status(500).json({ error: "Failed to fetch hero products" });
    }
  });

  // Get deal of the day product
  app.get('/api/deal-of-the-day', async (_req, res) => {
    try {
      // Get all electronics products (or another category that typically has good deals)
      const products = await storage.getProducts("Electronics", undefined, true);
      
      // If no products, try a different category
      let dealProduct = null;
      if (products.length === 0) {
        // Try Mobiles category as fallback
        const mobileProducts = await storage.getProducts("Mobiles", undefined, true);
        if (mobileProducts.length > 0) {
          dealProduct = mobileProducts[0];
        }
        
        // Try Fashion as a third option
        if (!dealProduct) {
          const fashionProducts = await storage.getProducts("Fashion", undefined, true);
          if (fashionProducts.length > 0) {
            dealProduct = fashionProducts[0];
          }
        }
      } else {
        dealProduct = products[0];
      }
      
      if (!dealProduct) {
        return res.status(200).json(null); // Return null instead of 404 to avoid error in console
      }
      
      // Get product image - use actual product images with fallback
      let imageUrl = '';
      
      // Try to get image URL from product data
      if (dealProduct.imageUrl) {
        imageUrl = dealProduct.imageUrl;
      } else if (dealProduct.images && typeof dealProduct.images === 'string') {
        try {
          const parsedImages = JSON.parse(dealProduct.images);
          if (Array.isArray(parsedImages) && parsedImages.length > 0) {
            imageUrl = parsedImages[0];
          }
        } catch (e) {
          console.log('Error parsing images JSON for deal of the day:', e);
        }
      }
      
      // If no image found, use category placeholder
      if (!imageUrl) {
        const categoryPlaceholders: Record<string, string> = {
          'Electronics': '/images/categories/electronics.svg',
          'Fashion': '/images/categories/fashion.svg',
          'Home': '/images/categories/home.svg',
          'Appliances': '/images/categories/appliances.svg',
          'Mobiles': '/images/categories/mobiles.svg',
          'Beauty': '/images/categories/beauty.svg',
          'Toys': '/images/categories/toys.svg',
          'Grocery': '/images/categories/grocery.svg',
        };
        
        imageUrl = categoryPlaceholders[dealProduct.category] || '/images/placeholder.svg';
      }
      
      // Calculate discount (for display purposes)
      const originalPrice = dealProduct.price;
      const discountPercentage = 15; // 15% off
      const discountPrice = originalPrice * (1 - discountPercentage/100);
      
      res.json({
        title: `Deal of the Day: ${dealProduct.name}`,
        subtitle: `Limited time offer on premium ${dealProduct.category}`,
        image: imageUrl,
        originalPrice: originalPrice,
        discountPrice: discountPrice,
        discountPercentage: discountPercentage,
        productId: dealProduct.id,
        hours: 47,
        minutes: 53,
        seconds: 41
      });
    } catch (error) {
      console.error("Error fetching deal of the day:", error);
      res.status(500).json({ error: "Failed to fetch deal of the day" });
    }
  });

  // Image proxy route to handle CORS issues with external images
  app.get("/api/image-proxy", handleImageProxy);
  
  // Advanced search endpoint with instant results
  app.get("/api/lelekart-search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      if (!query || query.trim().length < 1) {
        return res.json([]);
      }
      
      console.log("Searching products with query:", query);
      const results = await storage.searchProducts(query, limit);
      console.log(`Found ${results.length} results for "${query}"`);
      
      // Set the content type explicitly to application/json
      res.setHeader('Content-Type', 'application/json');
      return res.json(results);
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ error: "Failed to search products" });
    }
  });
  
  // Review Routes
  // Get reviews for a product
  app.get("/api/products/:id/reviews", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      const reviews = await storage.getProductReviews(productId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching product reviews:", error);
      res.status(500).json({ error: "Failed to fetch product reviews" });
    }
  });
  
  // Get product rating summary
  app.get("/api/products/:id/rating", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      const ratingSummary = await storage.getProductRatingSummary(productId);
      res.json(ratingSummary);
    } catch (error) {
      console.error("Error fetching product rating summary:", error);
      res.status(500).json({ error: "Failed to fetch product rating summary" });
    }
  });
  
  // Get reviews by a user
  app.get("/api/user/reviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const reviews = await storage.getUserReviews(req.user.id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      res.status(500).json({ error: "Failed to fetch user reviews" });
    }
  });
  
  // Get a specific review
  app.get("/api/reviews/:id", async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const review = await storage.getReview(reviewId);
      
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      res.json(review);
    } catch (error) {
      console.error("Error fetching review:", error);
      res.status(500).json({ error: "Failed to fetch review" });
    }
  });
  
  // Create a review
  app.post("/api/products/:id/reviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // Check if user has purchased the product (for verified purchase status)
      const hasUserPurchased = await storage.hasUserPurchasedProduct(req.user.id, productId);
      
      // Create the review
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId: req.user.id,
        productId,
        verifiedPurchase: hasUserPurchased
      });
      
      const review = await storage.createReview(reviewData);
      
      // If review has images, create them
      if (req.body.images && Array.isArray(req.body.images)) {
        for (const imageUrl of req.body.images) {
          await storage.addReviewImage({
            reviewId: review.id,
            imageUrl
          });
        }
      }
      
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating review:", error);
      res.status(500).json({ 
        error: "Failed to create review",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Update a review
  app.put("/api/reviews/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const reviewId = parseInt(req.params.id);
      const review = await storage.getReview(reviewId);
      
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      // Only the author of the review or an admin can update it
      if (review.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const updatedReview = await storage.updateReview(reviewId, req.body);
      res.json(updatedReview);
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(500).json({ error: "Failed to update review" });
    }
  });
  
  // Delete a review
  app.delete("/api/reviews/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const reviewId = parseInt(req.params.id);
      const review = await storage.getReview(reviewId);
      
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      // Only the author of the review or an admin can delete it
      if (review.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      await storage.deleteReview(reviewId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ error: "Failed to delete review" });
    }
  });
  
  // Mark a review as helpful
  app.post("/api/reviews/:id/helpful", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const reviewId = parseInt(req.params.id);
      const review = await storage.getReview(reviewId);
      
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      // Can't mark your own review as helpful
      if (review.userId === req.user.id) {
        return res.status(400).json({ error: "Cannot mark your own review as helpful" });
      }
      
      const helpfulVote = await storage.markReviewHelpful(reviewId, req.user.id);
      res.status(201).json(helpfulVote);
    } catch (error) {
      console.error("Error marking review as helpful:", error);
      res.status(500).json({ error: "Failed to mark review as helpful" });
    }
  });
  
  // Remove helpful mark from a review
  app.delete("/api/reviews/:id/helpful", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const reviewId = parseInt(req.params.id);
      const review = await storage.getReview(reviewId);
      
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      // Check if user has marked this review as helpful
      const isHelpful = await storage.isReviewHelpfulByUser(reviewId, req.user.id);
      
      if (!isHelpful) {
        return res.status(400).json({ error: "You have not marked this review as helpful" });
      }
      
      await storage.unmarkReviewHelpful(reviewId, req.user.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing helpful mark from review:", error);
      res.status(500).json({ error: "Failed to remove helpful mark from review" });
    }
  });
  
  // Check if user has marked a review as helpful
  app.get("/api/reviews/:id/helpful", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const reviewId = parseInt(req.params.id);
      const review = await storage.getReview(reviewId);
      
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      const isHelpful = await storage.isReviewHelpfulByUser(reviewId, req.user.id);
      res.json({ isHelpful });
    } catch (error) {
      console.error("Error checking if review is helpful:", error);
      res.status(500).json({ error: "Failed to check if review is helpful" });
    }
  });
  
  // RECOMMENDATION API ENDPOINTS
  
  // Get personalized recommendations for the current user
  app.get("/api/recommendations", async (req, res) => {
    try {
      const userId = req.isAuthenticated() ? req.user.id : null;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      console.log(`Getting personalized recommendations for ${userId ? `user ${userId}` : 'anonymous user'}`);
      const recommendations = await RecommendationEngine.getPersonalizedRecommendations(userId, limit);
      
      console.log(`Found ${recommendations.length} personalized recommendations`);
      res.json(recommendations);
    } catch (error) {
      console.error("Error getting personalized recommendations:", error);
      res.status(500).json({ error: "Failed to get recommendations" });
    }
  });
  
  // Get similar products for a specific product
  app.get("/api/recommendations/similar/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;
      
      console.log(`Getting similar products for product ID ${productId}`);
      const similarProducts = await RecommendationEngine.getSimilarProducts(productId, limit);
      
      console.log(`Found ${similarProducts.length} similar products for product ID ${productId}`);
      res.json(similarProducts);
    } catch (error) {
      console.error("Error getting similar products:", error);
      res.status(500).json({ error: "Failed to get similar products" });
    }
  });
  
  // Get recommended products for homepage and product pages
  app.get("/api/recommendations/featured", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 8;
      const userId = req.isAuthenticated() ? req.user.id : null;
      
      console.log("Getting featured recommendations");
      const featuredRecommendations = await RecommendationEngine.getPersonalizedRecommendations(userId, limit);
      
      console.log(`Found ${featuredRecommendations.length} featured recommendations`);
      res.json(featuredRecommendations);
    } catch (error) {
      console.error("Error getting featured recommendations:", error);
      res.status(500).json({ error: "Failed to get featured recommendations" });
    }
  });
  
  // Image proxy route to avoid CORS issues with external image URLs
  app.get("/api/proxy-image", handleImageProxy);
  
  // ======= AI Shopping Assistant API Routes =======

  // Generate a session ID for tracking user activity
  app.get('/api/ai/session', (req, res) => {
    const sessionId = req.query.sessionId || generateSessionId();
    res.json({ sessionId });
  });

  // Track user activity endpoint (views, clicks, searches)
  app.post('/api/ai/track-activity', async (req, res) => {
    try {
      const { sessionId, activityType, productId, categoryId, searchQuery, additionalData } = req.body;
      
      if (!sessionId || !activityType) {
        return res.status(400).json({ error: "sessionId and activityType are required" });
      }
      
      const userId = req.isAuthenticated() ? req.user.id : null;
      
      await trackUserActivity(
        userId,
        sessionId,
        activityType,
        productId,
        categoryId,
        searchQuery,
        additionalData
      );
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error tracking user activity:', error);
      res.status(500).json({ error: "Failed to track user activity" });
    }
  });

  // Personalized product recommendations
  app.get('/api/ai/recommendations', async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const userId = req.isAuthenticated() ? req.user.id : null;
      
      console.log(`Getting AI-powered personalized recommendations for ${userId ? `user ${userId}` : 'anonymous user'}`);
      
      const recommendations = await getPersonalizedRecommendations(userId, sessionId, limit);
      res.json(recommendations);
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      res.status(500).json({ error: "Failed to get personalized recommendations" });
    }
  });

  // Complementary product suggestions
  app.get('/api/ai/complementary-products/:productId', async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      // Track this activity if session ID is provided
      if (req.query.sessionId) {
        const userId = req.isAuthenticated() ? req.user.id : null;
        await trackUserActivity(
          userId,
          req.query.sessionId as string,
          'view_complementary_products',
          productId
        );
      }
      
      const complementaryProducts = await getComplementaryProducts(productId, limit);
      res.json(complementaryProducts);
    } catch (error) {
      console.error('Error getting complementary products:', error);
      res.status(500).json({ error: "Failed to get complementary products" });
    }
  });

  // Size recommendations
  app.get('/api/ai/size-recommendations/:productId', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(200).json({
        recommendedSize: null,
        confidence: 0,
        message: "Sign in to get personalized size recommendations"
      });
    }
    
    try {
      const productId = parseInt(req.params.productId);
      const category = req.query.category as string;
      
      const recommendation = await getSizeRecommendations(req.user.id, productId, category);
      res.json(recommendation);
    } catch (error) {
      console.error('Error getting size recommendations:', error);
      res.status(500).json({ error: "Failed to get size recommendations" });
    }
  });

  // Product-specific Q&A
  app.post('/api/ai/product-qa/:productId', async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const { question, sessionId } = req.body;
      
      if (!question) {
        return res.status(400).json({ error: "Question is required" });
      }
      
      const userId = req.isAuthenticated() ? req.user.id : null;
      
      const answer = await getProductQAResponse(
        productId,
        question,
        userId,
        sessionId
      );
      
      res.json({ answer });
    } catch (error) {
      console.error('Error getting product Q&A response:', error);
      res.status(500).json({ error: "Failed to get answer" });
    }
  });

  // General AI shopping assistant conversation
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { 
        message, 
        sessionId, 
        productId, 
        categoryId, 
        conversationHistory = [] 
      } = req.body;
      
      if (!message || !sessionId) {
        return res.status(400).json({ error: "Message and sessionId are required" });
      }
      
      const userId = req.isAuthenticated() ? req.user.id : null;
      
      // Format the conversation history for Gemini
      const messages = [
        ...conversationHistory,
        { role: 'user', content: message }
      ];
      
      const contextInfo = {
        userId,
        sessionId,
        productId: productId ? parseInt(productId) : undefined,
        categoryId: categoryId ? parseInt(categoryId) : undefined
      };
      
      const aiResponse = await getAIResponse(messages, contextInfo);
      
      // Add AI response to the history
      const updatedHistory = [
        ...messages,
        { role: 'assistant', content: aiResponse }
      ];
      
      res.json({
        response: aiResponse,
        conversationHistory: updatedHistory
      });
    } catch (error) {
      console.error('Error getting AI chat response:', error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });
  
  // Smart Inventory & Price Management API Routes
  
  // Sales History endpoints
  app.get("/api/seller/sales-history/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const productId = parseInt(req.params.productId);
      const sellerId = req.user.id;
      
      // Verify product belongs to seller
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (product.sellerId !== sellerId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const salesHistory = await storage.getSalesHistory(productId, sellerId);
      res.json(salesHistory);
    } catch (error) {
      console.error("Error fetching sales history:", error);
      res.status(500).json({ error: "Failed to fetch sales history" });
    }
  });
  
  app.post("/api/seller/sales-history", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const { productId, quantity, revenue, costPrice, channel, promotionApplied, seasonality } = req.body;
      
      // Verify product belongs to seller
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (product.sellerId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const salesData = insertSalesHistorySchema.parse({
        productId,
        sellerId: req.user.id,
        date: new Date(),
        quantity,
        revenue,
        costPrice,
        profitMargin: ((revenue - costPrice) / revenue) * 100,
        channel: channel || "marketplace",
        promotionApplied: promotionApplied || false,
        seasonality: seasonality || "",
        createdAt: new Date()
      });
      
      const salesRecord = await storage.createSalesRecord(salesData);
      res.status(201).json(salesRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error recording sales data:", error);
      res.status(500).json({ error: "Failed to record sales data" });
    }
  });
  
  // Demand Forecast endpoints
  app.get("/api/seller/demand-forecasts/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const productId = parseInt(req.params.productId);
      const sellerId = req.user.id;
      
      // Verify product belongs to seller
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (product.sellerId !== sellerId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const forecasts = await storage.getDemandForecasts(productId, sellerId);
      res.json(forecasts);
    } catch (error) {
      console.error("Error fetching demand forecasts:", error);
      res.status(500).json({ error: "Failed to fetch demand forecasts" });
    }
  });
  
  app.post("/api/seller/demand-forecasts/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const productId = parseInt(req.params.productId);
      const sellerId = req.user.id;
      const { period } = req.body;
      
      // Verify product belongs to seller
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (product.sellerId !== sellerId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      // Generate demand forecast using Gemini AI
      const forecast = await generateDemandForecast(productId, sellerId, period || "monthly");
      res.status(201).json(forecast);
    } catch (error) {
      console.error("Error generating demand forecast:", error);
      res.status(500).json({ error: "Failed to generate demand forecast" });
    }
  });
  
  // Price Optimization endpoints
  app.get("/api/seller/price-optimizations/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const productId = parseInt(req.params.productId);
      const sellerId = req.user.id;
      
      // Verify product belongs to seller
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (product.sellerId !== sellerId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const optimizations = await storage.getPriceOptimizations(productId, sellerId);
      res.json(optimizations);
    } catch (error) {
      console.error("Error fetching price optimizations:", error);
      res.status(500).json({ error: "Failed to fetch price optimizations" });
    }
  });
  
  app.post("/api/seller/price-optimizations/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const productId = parseInt(req.params.productId);
      const sellerId = req.user.id;
      
      // Verify product belongs to seller
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (product.sellerId !== sellerId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      // Generate price optimization using Gemini AI
      const optimization = await generatePriceOptimization(productId, sellerId);
      res.status(201).json(optimization);
    } catch (error) {
      console.error("Error generating price optimization:", error);
      res.status(500).json({ error: "Failed to generate price optimization" });
    }
  });
  
  app.put("/api/seller/price-optimizations/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["pending", "applied", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const optimization = await storage.updatePriceOptimizationStatus(id, status, req.user.id);
      res.json(optimization);
    } catch (error) {
      console.error("Error updating price optimization status:", error);
      res.status(500).json({ error: "Failed to update price optimization status" });
    }
  });
  
  app.post("/api/seller/price-optimizations/:id/apply", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      
      // Apply the price optimization to the product
      const updatedProduct = await storage.applyPriceOptimization(id, req.user.id);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error applying price optimization:", error);
      res.status(500).json({ error: "Failed to apply price optimization" });
    }
  });
  
  // Inventory Optimization endpoints
  app.get("/api/seller/inventory-optimizations/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const productId = parseInt(req.params.productId);
      const sellerId = req.user.id;
      
      // Verify product belongs to seller
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (product.sellerId !== sellerId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const optimizations = await storage.getInventoryOptimizations(productId, sellerId);
      res.json(optimizations);
    } catch (error) {
      console.error("Error fetching inventory optimizations:", error);
      res.status(500).json({ error: "Failed to fetch inventory optimizations" });
    }
  });
  
  app.post("/api/seller/inventory-optimizations/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const productId = parseInt(req.params.productId);
      const sellerId = req.user.id;
      
      // Verify product belongs to seller
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (product.sellerId !== sellerId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      // Generate inventory optimization using Gemini AI
      const optimization = await generateInventoryOptimization(productId, sellerId);
      res.status(201).json(optimization);
    } catch (error) {
      console.error("Error generating inventory optimization:", error);
      res.status(500).json({ error: "Failed to generate inventory optimization" });
    }
  });
  
  app.put("/api/seller/inventory-optimizations/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["pending", "applied", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const optimization = await storage.updateInventoryOptimizationStatus(id, status, req.user.id);
      res.json(optimization);
    } catch (error) {
      console.error("Error updating inventory optimization status:", error);
      res.status(500).json({ error: "Failed to update inventory optimization status" });
    }
  });
  
  app.post("/api/seller/inventory-optimizations/:id/apply", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      
      // Apply the inventory optimization to the product
      const updatedProduct = await storage.applyInventoryOptimization(id, req.user.id);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error applying inventory optimization:", error);
      res.status(500).json({ error: "Failed to apply inventory optimization" });
    }
  });
  
  // AI Generated Content endpoints
  app.get("/api/seller/ai-generated-content/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const productId = parseInt(req.params.productId);
      const sellerId = req.user.id;
      const contentType = req.query.contentType as string | undefined;
      
      // Verify product belongs to seller
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (product.sellerId !== sellerId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const contents = await storage.getAIGeneratedContents(productId, sellerId, contentType);
      res.json(contents);
    } catch (error) {
      console.error("Error fetching AI generated content:", error);
      res.status(500).json({ error: "Failed to fetch AI generated content" });
    }
  });
  
  app.post("/api/seller/ai-generated-content/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const productId = parseInt(req.params.productId);
      const sellerId = req.user.id;
      const { contentType, originalData } = req.body;
      
      if (!contentType || !["description", "features", "specifications"].includes(contentType)) {
        return res.status(400).json({ error: "Invalid content type" });
      }
      
      // Verify product belongs to seller
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (product.sellerId !== sellerId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      // Generate AI content using Gemini AI
      const content = await generateProductContent(productId, sellerId, contentType, originalData || "");
      res.status(201).json(content);
    } catch (error) {
      console.error("Error generating AI content:", error);
      res.status(500).json({ error: "Failed to generate AI content" });
    }
  });
  
  app.put("/api/seller/ai-generated-content/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["pending", "applied", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const content = await storage.updateAIGeneratedContentStatus(id, status, req.user.id);
      res.json(content);
    } catch (error) {
      console.error("Error updating AI content status:", error);
      res.status(500).json({ error: "Failed to update AI content status" });
    }
  });
  
  app.post("/api/seller/ai-generated-content/:id/apply", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      
      // Apply the AI generated content to the product
      const updatedProduct = await storage.applyAIGeneratedContent(id, req.user.id);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error applying AI content:", error);
      res.status(500).json({ error: "Failed to apply AI content" });
    }
  });
  
  // Wishlist routes
  app.get("/api/wishlist", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const wishlistItems = await storage.getWishlistItems(req.user.id);
      res.json(wishlistItems);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  });

  app.post("/api/wishlist", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { productId } = req.body;
      if (!productId) {
        return res.status(400).json({ error: "Product ID is required" });
      }
      
      const wishlistData = insertWishlistSchema.parse({
        userId: req.user.id,
        productId: parseInt(productId)
      });
      
      // Check if product exists
      const product = await storage.getProduct(wishlistData.productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // Check if item already exists in wishlist
      const existing = await storage.getWishlistItem(req.user.id, wishlistData.productId);
      if (existing) {
        return res.status(409).json({ error: "Product already in wishlist", item: existing });
      }
      
      const wishlistItem = await storage.addToWishlist(wishlistData);
      res.status(201).json(wishlistItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error adding to wishlist:", error);
      res.status(500).json({ error: "Failed to add to wishlist" });
    }
  });

  app.delete("/api/wishlist/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const productId = parseInt(req.params.productId);
      
      // Check if product exists in user's wishlist
      const existing = await storage.getWishlistItem(req.user.id, productId);
      if (!existing) {
        return res.status(404).json({ error: "Product not found in wishlist" });
      }
      
      await storage.removeFromWishlist(req.user.id, productId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      res.status(500).json({ error: "Failed to remove from wishlist" });
    }
  });

  // Check if a product is in the user's wishlist
  app.get("/api/wishlist/check/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ inWishlist: false });
    
    try {
      const productId = parseInt(req.params.productId);
      const wishlistItem = await storage.getWishlistItem(req.user.id, productId);
      res.json({ inWishlist: !!wishlistItem });
    } catch (error) {
      console.error("Error checking wishlist:", error);
      res.status(500).json({ error: "Failed to check wishlist status" });
    }
  });
  
  // Address Management API
  
  // Get all addresses for a user
  app.get("/api/addresses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user.id;
      const addresses = await storage.getUserAddresses(userId);
      res.json(addresses);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      res.status(500).json({ error: "Failed to fetch addresses" });
    }
  });
  
  // Get default address for a user
  app.get("/api/addresses/default", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user.id;
      const defaultAddress = await storage.getDefaultAddress(userId);
      
      if (!defaultAddress) {
        return res.status(404).json({ error: "No default address found" });
      }
      
      res.json(defaultAddress);
    } catch (error) {
      console.error("Error fetching default address:", error);
      res.status(500).json({ error: "Failed to fetch default address" });
    }
  });
  
  // Get a specific address by ID
  app.get("/api/addresses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const addressId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const address = await storage.getUserAddressById(addressId);
      
      if (!address) {
        return res.status(404).json({ error: "Address not found" });
      }
      
      // Security check: Make sure the address belongs to the requesting user
      if (address.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized access to this address" });
      }
      
      res.json(address);
    } catch (error) {
      console.error("Error fetching address:", error);
      res.status(500).json({ error: "Failed to fetch address" });
    }
  });
  
  // Create a new address
  app.post("/api/addresses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user.id;
      
      // Validate the input data
      const addressData = insertUserAddressSchema.parse({
        ...req.body,
        userId
      });
      
      const newAddress = await storage.createUserAddress(addressData);
      res.status(201).json(newAddress);
    } catch (error) {
      console.error("Error creating address:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create address" });
    }
  });
  
  // Update an existing address
  app.put("/api/addresses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const addressId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Get the address to verify ownership
      const existingAddress = await storage.getUserAddressById(addressId);
      
      if (!existingAddress) {
        return res.status(404).json({ error: "Address not found" });
      }
      
      // Security check: Make sure the address belongs to the requesting user
      if (existingAddress.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized access to this address" });
      }
      
      // Update the address
      const updatedAddress = await storage.updateUserAddress(addressId, req.body);
      res.json(updatedAddress);
    } catch (error) {
      console.error("Error updating address:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update address" });
    }
  });
  
  // Delete an address
  app.delete("/api/addresses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const addressId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Get the address to verify ownership
      const existingAddress = await storage.getUserAddressById(addressId);
      
      if (!existingAddress) {
        return res.status(404).json({ error: "Address not found" });
      }
      
      // Security check: Make sure the address belongs to the requesting user
      if (existingAddress.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized access to this address" });
      }
      
      // Delete the address
      await storage.deleteUserAddress(addressId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting address:", error);
      res.status(500).json({ error: "Failed to delete address" });
    }
  });
  
  // Set an address as default
  app.post("/api/addresses/:id/set-default", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const addressId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Get the address to verify ownership
      const existingAddress = await storage.getUserAddressById(addressId);
      
      if (!existingAddress) {
        return res.status(404).json({ error: "Address not found" });
      }
      
      // Security check: Make sure the address belongs to the requesting user
      if (existingAddress.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized access to this address" });
      }
      
      // Set as default
      await storage.setDefaultAddress(userId, addressId);
      
      // Get the updated address
      const updatedAddress = await storage.getUserAddressById(addressId);
      res.json(updatedAddress);
    } catch (error) {
      console.error("Error setting default address:", error);
      res.status(500).json({ error: "Failed to set default address" });
    }
  });
  
  // Seller approval endpoints (admin only)
  app.get("/api/admin/sellers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const sellers = await storage.getSellers();
      res.json(sellers);
    } catch (error) {
      console.error("Error fetching sellers:", error);
      res.status(500).json({ error: "Failed to fetch sellers" });
    }
  });
  
  app.post("/api/admin/sellers/:id/approve", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const sellerId = parseInt(req.params.id);
      await storage.updateSellerApprovalStatus(sellerId, true);
      res.json({ message: "Seller approved successfully" });
    } catch (error) {
      console.error("Error approving seller:", error);
      res.status(500).json({ error: "Failed to approve seller" });
    }
  });
  
  app.post("/api/admin/sellers/:id/reject", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const sellerId = parseInt(req.params.id);
      // Set approved to false and rejected to true
      await storage.updateSellerApprovalStatus(sellerId, false, true);
      res.json({ message: "Seller rejected successfully" });
    } catch (error) {
      console.error("Error rejecting seller:", error);
      res.status(500).json({ error: "Failed to reject seller" });
    }
  });
  
  // Seller status check (for sellers to check their approval status)
  app.get("/api/seller/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const seller = await storage.getUser(req.user.id);
      
      if (!seller) {
        return res.status(404).json({ error: "Seller not found" });
      }
      
      res.json({
        approved: seller.approved || false,
        rejected: seller.rejected || false,
        message: seller.approved 
          ? "Your seller account is approved. You can now list products and manage your store."
          : seller.rejected
            ? "Your seller account has been rejected. Please contact customer support for more information."
            : "Your seller account is pending approval. Please wait for an admin to review your application."
      });
    } catch (error) {
      console.error("Error checking seller status:", error);
      res.status(500).json({ error: "Failed to check seller status" });
    }
  });
  
  // Footer Content APIs
  app.get("/api/footer-content", async (req, res) => {
    try {
      const { section, isActive } = req.query;
      const isActiveBoolean = isActive === 'true' ? true : 
                             isActive === 'false' ? false : undefined;
      
      const contents = await storage.getFooterContents(
        section as string | undefined, 
        isActiveBoolean
      );
      res.json(contents);
    } catch (error) {
      console.error("Error getting footer contents:", error);
      res.status(500).json({ error: "Failed to get footer contents" });
    }
  });
  
  app.get("/api/footer-content/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const content = await storage.getFooterContentById(id);
      
      if (!content) {
        return res.status(404).json({ error: "Footer content not found" });
      }
      
      res.json(content);
    } catch (error) {
      console.error(`Error getting footer content ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to get footer content" });
    }
  });
  
  app.post("/api/admin/footer-content", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const { section, title, content, order } = req.body;
      
      if (!section || !title || !content) {
        return res.status(400).json({ error: "Section, title, and content are required" });
      }
      
      const footerContent = await storage.createFooterContent({
        section,
        title,
        content,
        order: order || 0,
        isActive: true
      });
      
      res.status(201).json(footerContent);
    } catch (error) {
      console.error("Error creating footer content:", error);
      res.status(500).json({ error: "Failed to create footer content" });
    }
  });
  
  app.put("/api/admin/footer-content/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      const { section, title, content, order } = req.body;
      
      // Get existing content
      const existingContent = await storage.getFooterContentById(id);
      if (!existingContent) {
        return res.status(404).json({ error: "Footer content not found" });
      }
      
      const updatedContent = await storage.updateFooterContent(id, {
        section: section || existingContent.section,
        title: title || existingContent.title,
        content: content !== undefined ? content : existingContent.content,
        order: order !== undefined ? order : existingContent.order
      });
      
      res.json(updatedContent);
    } catch (error) {
      console.error(`Error updating footer content ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to update footer content" });
    }
  });
  
  app.delete("/api/admin/footer-content/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFooterContent(id);
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting footer content ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to delete footer content" });
    }
  });
  
  app.put("/api/admin/footer-content/:id/toggle", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      const content = await storage.toggleFooterContentActive(id);
      res.json(content);
    } catch (error) {
      console.error(`Error toggling footer content status ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to toggle footer content status" });
    }
  });
  
  app.put("/api/admin/footer-content/:id/order", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    try {
      const id = parseInt(req.params.id);
      const { order } = req.body;
      
      if (typeof order !== 'number' || order < 0) {
        return res.status(400).json({ error: "Order must be a non-negative number" });
      }
      
      const content = await storage.updateFooterContentOrder(id, order);
      res.json(content);
    } catch (error) {
      console.error(`Error updating footer content order ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to update footer content order" });
    }
  });

  // Shipping API routes
  // Shipping Methods
  app.get("/api/shipping/methods", getShippingMethods);
  app.get("/api/shipping/methods/:id", getShippingMethod);
  app.post("/api/shipping/methods", createShippingMethod);
  app.put("/api/shipping/methods/:id", updateShippingMethod);
  app.delete("/api/shipping/methods/:id", deleteShippingMethod);
  
  // Shipping Zones
  app.get("/api/shipping/zones", getShippingZones);
  app.get("/api/shipping/zones/:id", getShippingZone);
  app.post("/api/shipping/zones", createShippingZone);
  app.put("/api/shipping/zones/:id", updateShippingZone);
  app.delete("/api/shipping/zones/:id", deleteShippingZone);
  
  // Shipping Rules
  app.get("/api/shipping/rules", getShippingRules);
  app.get("/api/shipping/rules/:id", getShippingRule);
  app.post("/api/shipping/rules", createShippingRule);
  app.put("/api/shipping/rules/:id", updateShippingRule);
  app.delete("/api/shipping/rules/:id", deleteShippingRule);
  
  // Seller Shipping Settings
  app.get("/api/seller/shipping-settings", getSellerShippingSettings);
  app.post("/api/seller/shipping-settings", createOrUpdateSellerShippingSettings);
  
  // Product Shipping Overrides
  app.get("/api/seller/product-shipping-overrides", getProductShippingOverrides);
  app.get("/api/seller/product-shipping-override/:productId", getProductShippingOverride);
  app.post("/api/seller/product-shipping-override", createOrUpdateProductShippingOverride);
  app.delete("/api/seller/product-shipping-override/:productId", deleteProductShippingOverride);
  
  // Order Shipping Tracking
  app.get("/api/orders/:orderId/shipping-tracking", getOrderShippingTracking);
  app.post("/api/orders/:orderId/shipping-tracking", createOrUpdateOrderShippingTracking);

  // New seller dashboard module routes
  
  // Returns Routes
  app.get("/api/seller/returns", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" || !req.user.approved) return res.status(403).json({ error: "Not authorized" });
    
    await returnsHandlers.getSellerReturnsHandler(req, res);
  });
  
  app.get("/api/seller/returns/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    await returnsHandlers.getReturnByIdHandler(req, res);
  });
  
  app.post("/api/seller/returns", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    await returnsHandlers.createReturnHandler(req, res);
  });
  
  app.put("/api/seller/returns/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    await returnsHandlers.updateReturnStatusHandler(req, res);
  });
  
  // Analytics Routes
  app.get("/api/seller/analytics", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" || !req.user.approved) return res.status(403).json({ error: "Not authorized" });
    
    await analyticsHandlers.getSellerAnalyticsHandler(req, res);
  });
  
  app.post("/api/seller/analytics", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" || !req.user.approved) return res.status(403).json({ error: "Not authorized" });
    
    await analyticsHandlers.createOrUpdateAnalyticsHandler(req, res);
  });
  
  app.get("/api/seller/dashboard-summary", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" || !req.user.approved) return res.status(403).json({ error: "Not authorized" });
    
    await analyticsHandlers.getSellerDashboardSummaryHandler(req, res);
  });
  
  // Payments Routes
  app.get("/api/seller/payments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" || !req.user.approved) return res.status(403).json({ error: "Not authorized" });
    
    await paymentsHandlers.getSellerPaymentsHandler(req, res);
  });
  
  app.get("/api/seller/payments/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    await paymentsHandlers.getSellerPaymentByIdHandler(req, res);
  });
  
  app.post("/api/seller/payments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    await paymentsHandlers.createSellerPaymentHandler(req, res);
  });
  
  app.put("/api/seller/payments/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });
    
    await paymentsHandlers.updateSellerPaymentHandler(req, res);
  });
  
  app.get("/api/seller/payments-summary", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" || !req.user.approved) return res.status(403).json({ error: "Not authorized" });
    
    await paymentsHandlers.getSellerPaymentsSummaryHandler(req, res);
  });
  
  // Settings Routes
  app.get("/api/seller/settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" || !req.user.approved) return res.status(403).json({ error: "Not authorized" });
    
    await settingsHandlers.getSellerSettingsHandler(req, res);
  });
  
  app.put("/api/seller/settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" || !req.user.approved) return res.status(403).json({ error: "Not authorized" });
    
    await settingsHandlers.updateSellerSettingsHandler(req, res);
  });
  
  app.post("/api/seller/settings/holiday-mode", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" || !req.user.approved) return res.status(403).json({ error: "Not authorized" });
    
    await settingsHandlers.toggleHolidayModeHandler(req, res);
  });
  
  app.put("/api/seller/settings/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" || !req.user.approved) return res.status(403).json({ error: "Not authorized" });
    
    await settingsHandlers.updateNotificationPreferencesHandler(req, res);
  });
  
  // Support Routes
  app.get("/api/support/tickets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    await supportHandlers.getSupportTicketsHandler(req, res);
  });
  
  app.get("/api/support/tickets/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    await supportHandlers.getSupportTicketByIdHandler(req, res);
  });
  
  app.post("/api/support/tickets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    await supportHandlers.createSupportTicketHandler(req, res);
  });
  
  app.put("/api/support/tickets/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    await supportHandlers.updateSupportTicketHandler(req, res);
  });
  
  app.get("/api/support/tickets/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    await supportHandlers.getSupportMessagesHandler(req, res);
  });
  
  app.post("/api/support/tickets/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    await supportHandlers.addSupportMessageHandler(req, res);
  });

  // ========== Rewards System Routes ==========
  
  // Get user rewards - allows both user to view their own rewards and admin to view any user's rewards
  app.get("/api/rewards/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const requestedUserId = parseInt(req.params.userId);
    
    // Authorization check - only allow users to view their own rewards or admins to view any user's rewards
    if (req.user.id !== requestedUserId && req.user.role !== "admin" && req.user.role !== "co-admin") {
      return res.status(403).json({ error: "Not authorized to view these rewards" });
    }
    
    await rewardsHandlers.getUserRewards(req, res);
  });
  
  // Get user reward transactions - with pagination
  app.get("/api/rewards/:userId/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const requestedUserId = parseInt(req.params.userId);
    
    // Authorization check
    if (req.user.id !== requestedUserId && req.user.role !== "admin" && req.user.role !== "co-admin") {
      return res.status(403).json({ error: "Not authorized to view these transactions" });
    }
    
    await rewardsHandlers.getUserRewardTransactions(req, res);
  });
  
  // Add reward points (admin only)
  app.post("/api/rewards/add", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin" && req.user.role !== "co-admin") {
      return res.status(403).json({ error: "Only admins can add reward points" });
    }
    
    await rewardsHandlers.addRewardPoints(req, res);
  });
  
  // Redeem reward points (user or admin)
  app.post("/api/rewards/redeem", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // If user is trying to redeem points for another user, check if they're admin
    if (req.body.userId !== req.user.id && req.user.role !== "admin" && req.user.role !== "co-admin") {
      return res.status(403).json({ error: "Not authorized to redeem points for another user" });
    }
    
    await rewardsHandlers.redeemRewardPoints(req, res);
  });
  
  // Get all reward rules (admin only)
  app.get("/api/rewards/rules", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin" && req.user.role !== "co-admin") {
      return res.status(403).json({ error: "Not authorized to view reward rules" });
    }
    
    await rewardsHandlers.getRewardRules(req, res);
  });
  
  // Create a new reward rule (admin only)
  app.post("/api/rewards/rules", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin" && req.user.role !== "co-admin") {
      return res.status(403).json({ error: "Not authorized to create reward rules" });
    }
    
    await rewardsHandlers.createRewardRule(req, res);
  });
  
  // Update a reward rule (admin only)
  app.put("/api/rewards/rules/:ruleId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin" && req.user.role !== "co-admin") {
      return res.status(403).json({ error: "Not authorized to update reward rules" });
    }
    
    // Set the rule ID from the URL parameter
    req.params.ruleId = req.params.ruleId;
    
    await rewardsHandlers.updateRewardRule(req, res);
  });
  
  // Delete a reward rule (admin only)
  app.delete("/api/rewards/rules/:ruleId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can delete reward rules" });
    }
    
    await rewardsHandlers.deleteRewardRule(req, res);
  });
  
  // Get reward statistics (admin only)
  app.get("/api/rewards/statistics", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin" && req.user.role !== "co-admin") {
      return res.status(403).json({ error: "Not authorized to view reward statistics" });
    }
    
    await rewardsHandlers.getRewardStatistics(req, res);
  });

  // ========== Gift Cards System Routes ==========
  
  // Get all gift cards (admin only) with pagination
  app.get("/api/gift-cards", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin" && req.user.role !== "co-admin") {
      return res.status(403).json({ error: "Not authorized to view all gift cards" });
    }
    
    await giftCardsHandlers.getAllGiftCards(req, res);
  });
  
  // Get user's gift cards
  app.get("/api/gift-cards/user/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const requestedUserId = parseInt(req.params.userId);
    
    // Authorization check
    if (req.user.id !== requestedUserId && req.user.role !== "admin" && req.user.role !== "co-admin") {
      return res.status(403).json({ error: "Not authorized to view these gift cards" });
    }
    
    await giftCardsHandlers.getUserGiftCards(req, res);
  });
  
  // Get a single gift card by ID
  app.get("/api/gift-cards/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // The card ownership check will be done in the handler
    await giftCardsHandlers.getGiftCard(req, res);
  });
  
  // Check gift card balance by code (public)
  app.post("/api/gift-cards/check-balance", async (req, res) => {
    await giftCardsHandlers.checkGiftCardBalance(req, res);
  });
  
  // Create a new gift card (admin or user)
  app.post("/api/gift-cards", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Set the purchasedBy field to the current user's ID
    req.body.purchasedBy = req.user.id;
    
    await giftCardsHandlers.createGiftCard(req, res);
  });
  
  // Apply gift card to an order
  app.post("/api/gift-cards/apply", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Set the user ID from the authenticated user
    req.body.userId = req.user.id;
    
    await giftCardsHandlers.applyGiftCard(req, res);
  });
  
  // Deactivate/reactivate a gift card (admin only)
  app.put("/api/gift-cards/:id/toggle-status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin" && req.user.role !== "co-admin") {
      return res.status(403).json({ error: "Not authorized to toggle gift card status" });
    }
    
    await giftCardsHandlers.toggleGiftCardStatus(req, res);
  });
  
  // Get all gift card templates
  app.get("/api/gift-cards/templates", async (req, res) => {
    // Anyone can view gift card templates
    await giftCardsHandlers.getGiftCardTemplates(req, res);
  });
  
  // Create a new gift card template (admin only)
  app.post("/api/gift-cards/templates", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin" && req.user.role !== "co-admin") {
      return res.status(403).json({ error: "Not authorized to create gift card templates" });
    }
    
    await giftCardsHandlers.createGiftCardTemplate(req, res);
  });
  
  // Update a gift card template (admin only)
  app.put("/api/gift-cards/templates/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin" && req.user.role !== "co-admin") {
      return res.status(403).json({ error: "Not authorized to update gift card templates" });
    }
    
    await giftCardsHandlers.updateGiftCardTemplate(req, res);
  });
  
  // Delete a gift card template (admin only)
  app.delete("/api/gift-cards/templates/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can delete gift card templates" });
    }
    
    await giftCardsHandlers.deleteGiftCardTemplate(req, res);
  });

  const httpServer = createServer(app);
  return httpServer;
}
