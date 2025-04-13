import { db } from "../db";
import { storage } from "../storage";
import { getChatResponse } from "./gemini-ai";
import { 
  products, 
  salesHistory, 
  demandForecasts, 
  priceOptimizations, 
  inventoryOptimizations,
  aiGeneratedContent
} from "@shared/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

// ML-powered demand forecasting
export async function generateDemandForecast(
  productId: number, 
  sellerId: number, 
  period: string = "monthly"
): Promise<any> {
  try {
    // 1. Collect historical sales data
    const salesData = await db.select().from(salesHistory).where(
      and(
        eq(salesHistory.productId, productId),
        eq(salesHistory.sellerId, sellerId)
      )
    ).orderBy(desc(salesHistory.date));

    // Get product details
    const product = await storage.getProduct(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // 2. Use Gemini AI to generate forecast based on historical data
    const prompt = `
    You are an AI-powered demand forecasting system for e-commerce. 
    Use the following historical sales data to predict ${period} demand for the product "${product.name}" (ID: ${productId}).
    
    Historical Sales Data:
    ${JSON.stringify(salesData, null, 2)}
    
    Product Details:
    ${JSON.stringify(product, null, 2)}
    
    Analyze seasonality, trends, and patterns in the data.
    Return the forecast as a JSON object with the following structure:
    {
      "predictedDemand": number, // Predicted unit sales for the next ${period}
      "confidenceScore": number, // Between 0.1 and 1.0
      "factorsConsidered": {
        "seasonality": string, // e.g., "holiday", "summer", etc.
        "trends": string,      // e.g., "upward", "downward", "stable" 
        "events": string[],    // e.g., ["Black Friday", "Christmas"]
        "competition": string  // e.g., "high", "medium", "low"
      }
    }
    
    Important: Only return the JSON object, no additional text.
    `;

    // If there's no historical data yet, provide a simpler forecast
    if (salesData.length === 0) {
      // Create a default forecast based on general product category trends
      return {
        predictedDemand: 10, // Default conservative estimate
        confidenceScore: 0.3, // Low confidence due to lack of historical data
        factorsConsidered: {
          seasonality: "unknown",
          trends: "unknown",
          events: [],
          competition: "unknown"
        }
      };
    }

    // Use Gemini API to generate the forecast
    const forecastResponse = await getChatResponse(prompt);
    let forecast;
    
    try {
      forecast = JSON.parse(forecastResponse);
    } catch (error) {
      console.error("Failed to parse AI forecast response:", error);
      throw new Error("Invalid forecast format returned by AI");
    }

    // 3. Store the forecast in the database
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + (period === "daily" ? 1 : period === "weekly" ? 7 : 30));

    const [newForecast] = await db.insert(demandForecasts).values({
      productId,
      sellerId,
      forecastDate,
      predictedDemand: forecast.predictedDemand,
      confidenceScore: forecast.confidenceScore,
      forecastPeriod: period,
      factorsConsidered: forecast.factorsConsidered,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    return newForecast;
  } catch (error) {
    console.error("Error generating demand forecast:", error);
    throw error;
  }
}

// ML-powered price optimization
export async function generatePriceOptimization(
  productId: number, 
  sellerId: number
): Promise<any> {
  try {
    // 1. Collect relevant data: product info, sales history, competitor pricing, etc.
    const product = await storage.getProduct(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const salesData = await db.select().from(salesHistory).where(
      and(
        eq(salesHistory.productId, productId),
        eq(salesHistory.sellerId, sellerId)
      )
    ).orderBy(desc(salesHistory.date));

    // 2. Use Gemini AI to generate optimal pricing
    const prompt = `
    You are an AI-powered price optimization system for e-commerce. 
    Analyze the following data and suggest an optimal price for the product "${product.name}" (ID: ${productId}).
    
    Product Details:
    ${JSON.stringify(product, null, 2)}
    
    Current Price: ${product.price}
    Cost Price: ${product.purchasePrice || "Unknown"}
    
    Historical Sales Data:
    ${JSON.stringify(salesData, null, 2)}
    
    Return the price optimization recommendation as a JSON object with the following structure:
    {
      "currentPrice": ${product.price},
      "suggestedPrice": number, // Recommended price in same currency unit as current price
      "projectedRevenue": number, // Projected revenue at suggested price
      "projectedSales": number, // Projected unit sales at suggested price
      "confidenceScore": number, // Between 0.1 and 1.0
      "reasoningFactors": {
        "demandElasticity": string, // e.g., "high", "medium", "low"
        "competitivePricing": string, // e.g., "above market", "at market", "below market"
        "margin": string, // e.g., "high", "medium", "low"
        "reasoning": string // Brief explanation for the recommendation
      }
    }
    
    Important: Only return the JSON object, no additional text.
    `;

    // Use Gemini API to generate the price optimization
    const optimizationResponse = await getChatResponse(prompt);
    let optimization;
    
    try {
      optimization = JSON.parse(optimizationResponse);
    } catch (error) {
      console.error("Failed to parse AI price optimization response:", error);
      throw new Error("Invalid price optimization format returned by AI");
    }

    // 3. Store the optimization in the database
    const [newOptimization] = await db.insert(priceOptimizations).values({
      productId,
      sellerId,
      currentPrice: optimization.currentPrice,
      suggestedPrice: optimization.suggestedPrice,
      projectedRevenue: optimization.projectedRevenue,
      projectedSales: optimization.projectedSales,
      confidenceScore: optimization.confidenceScore,
      reasoningFactors: optimization.reasoningFactors,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    return newOptimization;
  } catch (error) {
    console.error("Error generating price optimization:", error);
    throw error;
  }
}

// ML-powered inventory optimization
export async function generateInventoryOptimization(
  productId: number, 
  sellerId: number
): Promise<any> {
  try {
    // 1. Collect relevant data: product info, sales history, current stock, etc.
    const product = await storage.getProduct(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Get current stock level
    const currentStock = product.stock || 0;

    // Get recent sales data
    const salesData = await db.select().from(salesHistory).where(
      and(
        eq(salesHistory.productId, productId),
        eq(salesHistory.sellerId, sellerId)
      )
    ).orderBy(desc(salesHistory.date));

    // Get latest demand forecast
    const [latestForecast] = await db.select().from(demandForecasts).where(
      and(
        eq(demandForecasts.productId, productId),
        eq(demandForecasts.sellerId, sellerId)
      )
    ).orderBy(desc(demandForecasts.createdAt)).limit(1);

    // 2. Use Gemini AI to generate inventory optimization
    const prompt = `
    You are an AI-powered inventory optimization system for e-commerce. 
    Analyze the following data and suggest optimal inventory levels for the product "${product.name}" (ID: ${productId}).
    
    Product Details:
    ${JSON.stringify(product, null, 2)}
    
    Current Stock Level: ${currentStock}
    
    Historical Sales Data:
    ${JSON.stringify(salesData, null, 2)}
    
    Latest Demand Forecast:
    ${JSON.stringify(latestForecast || "No forecast available", null, 2)}
    
    Return the inventory optimization recommendation as a JSON object with the following structure:
    {
      "recommendedStock": number, // Recommended inventory level
      "reorderPoint": number, // Stock level at which to reorder
      "maxStock": number, // Maximum stock level to maintain
      "safetyStock": number, // Buffer stock to prevent stockouts
      "leadTime": number, // Estimated lead time for restocking in days
      "reason": string, // Brief explanation for the recommendation
      "priorityLevel": string // "low", "medium", "high", or "critical"
    }
    
    Important: Only return the JSON object, no additional text.
    `;

    // Use Gemini API to generate the inventory optimization
    const optimizationResponse = await getChatResponse(prompt);
    let optimization;
    
    try {
      optimization = JSON.parse(optimizationResponse);
    } catch (error) {
      console.error("Failed to parse AI inventory optimization response:", error);
      throw new Error("Invalid inventory optimization format returned by AI");
    }

    // 3. Store the optimization in the database
    const [newOptimization] = await db.insert(inventoryOptimizations).values({
      productId,
      sellerId,
      currentStock: currentStock,
      recommendedStock: optimization.recommendedStock,
      reorderPoint: optimization.reorderPoint,
      maxStock: optimization.maxStock,
      safetyStock: optimization.safetyStock,
      leadTime: optimization.leadTime,
      reason: optimization.reason,
      priorityLevel: optimization.priorityLevel,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    return newOptimization;
  } catch (error) {
    console.error("Error generating inventory optimization:", error);
    throw error;
  }
}

// AI-powered product content generation
export async function generateProductContent(
  productId: number,
  sellerId: number,
  contentType: string,
  originalData: string
): Promise<any> {
  try {
    // 1. Get product details
    const product = await storage.getProduct(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // 2. Generate appropriate prompt based on content type
    let prompt = "";
    switch (contentType) {
      case "description":
        prompt = `
        You are an AI-powered product description writer for an e-commerce platform. 
        Generate a compelling, SEO-friendly product description for the following product:
        
        Product Name: ${product.name}
        Category: ${product.category}
        Original Description: ${originalData || product.description}
        
        Your description should:
        - Be between 150-200 words
        - Highlight key features and benefits
        - Include relevant keywords for SEO
        - Use persuasive language to drive conversions
        - Include bullet points for key features
        - Have a clear call-to-action
        
        Return only the generated description, no additional text.
        `;
        break;
      
      case "features":
        prompt = `
        You are an AI-powered product features writer for an e-commerce platform.
        Generate a list of compelling product features in bullet point format for the following product:
        
        Product Name: ${product.name}
        Category: ${product.category}
        Description: ${product.description}
        Original Features: ${originalData || ""}
        
        Return a JSON array of feature strings, each being a concise bullet point. 
        For example: ["Feature 1", "Feature 2", "Feature 3"]
        
        Important: Only return the JSON array, no additional text.
        `;
        break;
      
      case "specifications":
        prompt = `
        You are an AI-powered product specifications writer for an e-commerce platform.
        Generate a comprehensive list of technical specifications for the following product:
        
        Product Name: ${product.name}
        Category: ${product.category}
        Description: ${product.description}
        Original Specifications: ${originalData || product.specifications || ""}
        
        Return a JSON object where each key is a specification category and value is the specification detail.
        For example: {"Material": "Cotton", "Dimensions": "10 x 15 cm", "Weight": "250g"}
        
        Important: Only return the JSON object, no additional text.
        `;
        break;
      
      default:
        throw new Error(`Unsupported content type: ${contentType}`);
    }

    // 3. Use Gemini API to generate the content
    const contentResponse = await getChatResponse(prompt);
    let generatedContent = contentResponse;
    
    // Parse JSON responses if needed
    if (contentType === "features" || contentType === "specifications") {
      try {
        generatedContent = JSON.stringify(JSON.parse(contentResponse));
      } catch (error) {
        console.error(`Failed to parse AI ${contentType} response:`, error);
        throw new Error(`Invalid ${contentType} format returned by AI`);
      }
    }

    // 4. Store the generated content in the database
    const [newContent] = await db.insert(aiGeneratedContent).values({
      productId,
      sellerId,
      contentType,
      originalData: originalData || "",
      generatedContent,
      promptUsed: prompt,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    return newContent;
  } catch (error) {
    console.error("Error generating product content:", error);
    throw error;
  }
}

// Create or update sales history record
export async function recordSalesData(
  productId: number,
  sellerId: number,
  quantity: number,
  revenue: number,
  costPrice: number,
  channel: string = "marketplace",
  promotionApplied: boolean = false,
  seasonality: string = ""
): Promise<any> {
  try {
    const today = new Date();
    
    // Calculate profit margin
    const profitMargin = ((revenue - costPrice) / revenue) * 100;
    
    const [newSalesRecord] = await db.insert(salesHistory).values({
      productId,
      sellerId,
      date: today,
      quantity,
      revenue,
      costPrice,
      profitMargin,
      channel,
      promotionApplied,
      seasonality,
      createdAt: today
    }).returning();

    return newSalesRecord;
  } catch (error) {
    console.error("Error recording sales data:", error);
    throw error;
  }
}

// Update price optimization status
export async function updatePriceOptimizationStatus(
  id: number,
  status: string,
  sellerId: number
): Promise<any> {
  try {
    // First, verify seller owns this optimization
    const [existingOptimization] = await db.select().from(priceOptimizations).where(
      and(
        eq(priceOptimizations.id, id),
        eq(priceOptimizations.sellerId, sellerId)
      )
    );

    if (!existingOptimization) {
      throw new Error("Price optimization not found or not authorized");
    }

    // Update the status
    const [updatedOptimization] = await db.update(priceOptimizations)
      .set({
        status,
        appliedAt: status === "applied" ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(priceOptimizations.id, id))
      .returning();

    // If status is "applied", update the product price
    if (status === "applied") {
      await db.update(products)
        .set({ price: existingOptimization.suggestedPrice })
        .where(eq(products.id, existingOptimization.productId));
    }

    return updatedOptimization;
  } catch (error) {
    console.error("Error updating price optimization status:", error);
    throw error;
  }
}

// Update inventory optimization status
export async function updateInventoryOptimizationStatus(
  id: number,
  status: string,
  sellerId: number
): Promise<any> {
  try {
    // First, verify seller owns this optimization
    const [existingOptimization] = await db.select().from(inventoryOptimizations).where(
      and(
        eq(inventoryOptimizations.id, id),
        eq(inventoryOptimizations.sellerId, sellerId)
      )
    );

    if (!existingOptimization) {
      throw new Error("Inventory optimization not found or not authorized");
    }

    // Update the status
    const [updatedOptimization] = await db.update(inventoryOptimizations)
      .set({
        status,
        appliedAt: status === "applied" ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(inventoryOptimizations.id, id))
      .returning();

    // If status is "applied", update the product stock level
    if (status === "applied") {
      await db.update(products)
        .set({ stock: existingOptimization.recommendedStock })
        .where(eq(products.id, existingOptimization.productId));
    }

    return updatedOptimization;
  } catch (error) {
    console.error("Error updating inventory optimization status:", error);
    throw error;
  }
}

// Update AI generated content status
export async function updateAIContentStatus(
  id: number,
  status: string,
  sellerId: number
): Promise<any> {
  try {
    // First, verify seller owns this content
    const [existingContent] = await db.select().from(aiGeneratedContent).where(
      and(
        eq(aiGeneratedContent.id, id),
        eq(aiGeneratedContent.sellerId, sellerId)
      )
    );

    if (!existingContent) {
      throw new Error("AI generated content not found or not authorized");
    }

    // Update the status
    const [updatedContent] = await db.update(aiGeneratedContent)
      .set({
        status,
        appliedAt: status === "applied" ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(aiGeneratedContent.id, id))
      .returning();

    // If status is "applied", update the product with the generated content
    if (status === "applied") {
      const updateData: any = {};
      
      switch (existingContent.contentType) {
        case "description":
          updateData.description = existingContent.generatedContent;
          break;
        case "specifications":
          updateData.specifications = existingContent.generatedContent;
          break;
        // For other content types, handling would be added in the product entity
      }
      
      if (Object.keys(updateData).length > 0) {
        await db.update(products)
          .set(updateData)
          .where(eq(products.id, existingContent.productId));
      }
    }

    return updatedContent;
  } catch (error) {
    console.error("Error updating AI content status:", error);
    throw error;
  }
}