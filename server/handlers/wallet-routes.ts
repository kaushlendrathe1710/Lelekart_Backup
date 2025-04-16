import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";

// Get wallet settings
export async function getWalletSettings(req: Request, res: Response) {
  try {
    const settings = await storage.getWalletSettings();
    return res.status(200).json(settings);
  } catch (error) {
    console.error("Error getting wallet settings:", error);
    return res.status(500).json({ error: "Failed to get wallet settings" });
  }
}

// Update wallet settings - admin only
export async function updateWalletSettings(req: Request, res: Response) {
  try {
    // Ensure user is admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }

    const settingsSchema = z.object({
      firstPurchaseCoins: z.number().int().optional(),
      coinToCurrencyRatio: z.number().positive().optional(),
      minOrderValue: z.number().positive().optional(),
      maxRedeemableCoins: z.number().int().optional(),
      coinExpiryDays: z.number().int().optional(),
      isEnabled: z.boolean().optional(),
    });

    const validatedData = settingsSchema.parse(req.body);
    const updatedSettings = await storage.updateWalletSettings(validatedData);
    
    return res.status(200).json(updatedSettings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating wallet settings:", error);
    return res.status(500).json({ error: "Failed to update wallet settings" });
  }
}

// Get user wallet
export async function getUserWallet(req: Request, res: Response) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.user.id;
    const wallet = await storage.getUserWallet(userId);
    
    if (!wallet) {
      // Create wallet if it doesn't exist
      const newWallet = await storage.createUserWalletIfNotExists(userId);
      return res.status(200).json(newWallet);
    }
    
    return res.status(200).json(wallet);
  } catch (error) {
    console.error("Error getting user wallet:", error);
    return res.status(500).json({ error: "Failed to get wallet" });
  }
}

// Get user wallet transactions
export async function getUserWalletTransactions(req: Request, res: Response) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.user.id;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const { transactions, total } = await storage.getUserWalletTransactions(userId, page, limit);
    
    return res.status(200).json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error getting wallet transactions:", error);
    return res.status(500).json({ error: "Failed to get wallet transactions" });
  }
}

// Redeem coins from wallet
export async function redeemCoins(req: Request, res: Response) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const redeemSchema = z.object({
      amount: z.number().int().positive(),
      referenceType: z.string().default("ORDER_DISCOUNT"),
      referenceId: z.number().optional(),
      description: z.string().optional(),
    });

    const validatedData = redeemSchema.parse(req.body);
    const userId = req.user.id;
    
    const result = await storage.redeemCoinsFromWallet(
      userId,
      validatedData.amount,
      validatedData.referenceType,
      validatedData.referenceId,
      validatedData.description
    );
    
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    
    console.error("Error redeeming coins:", error);
    
    // Return user-friendly error message
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(500).json({ error: "Failed to redeem coins" });
  }
}

// Process expired coins (admin only, could be called by a scheduled job)
export async function processExpiredCoins(req: Request, res: Response) {
  try {
    // Ensure user is admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }

    const expiredCoinsCount = await storage.processExpiredCoins();
    
    return res.status(200).json({ 
      success: true, 
      expiredCoinsCount 
    });
  } catch (error) {
    console.error("Error processing expired coins:", error);
    return res.status(500).json({ error: "Failed to process expired coins" });
  }
}

// Manual wallet adjustment (admin only)
export async function manualWalletAdjustment(req: Request, res: Response) {
  try {
    // Ensure user is admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }

    const adjustmentSchema = z.object({
      userId: z.number().int().positive(),
      amount: z.number().int().refine(val => val !== 0, {
        message: "Amount cannot be zero"
      }),
      description: z.string().min(3),
    });

    const validatedData = adjustmentSchema.parse(req.body);
    
    const updatedWallet = await storage.manualAdjustWallet(
      validatedData.userId,
      validatedData.amount,
      validatedData.description
    );
    
    return res.status(200).json(updatedWallet);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    
    console.error("Error making manual wallet adjustment:", error);
    
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(500).json({ error: "Failed to adjust wallet" });
  }
}

// Get user wallet for admin
export async function getWalletByUserId(req: Request, res: Response) {
  try {
    // Ensure user is admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }

    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    const wallet = await storage.getUserWallet(userId);
    
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }
    
    return res.status(200).json(wallet);
  } catch (error) {
    console.error(`Error getting wallet for user ${req.params.userId}:`, error);
    return res.status(500).json({ error: "Failed to get wallet" });
  }
}

// Get wallet transactions for admin
export async function getWalletTransactionsByUserId(req: Request, res: Response) {
  try {
    // Ensure user is admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }

    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const { transactions, total } = await storage.getUserWalletTransactions(userId, page, limit);
    
    return res.status(200).json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(`Error getting wallet transactions for user ${req.params.userId}:`, error);
    return res.status(500).json({ error: "Failed to get wallet transactions" });
  }
}