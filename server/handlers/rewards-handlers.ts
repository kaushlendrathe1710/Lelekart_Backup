import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";

// Validate user reward points transaction request
const rewardTransactionSchema = z.object({
  userId: z.number(),
  points: z.number(),
  type: z.string(),
  description: z.string().optional(),
  orderId: z.number().optional(),
  productId: z.number().optional(),
});

// Process point award for a purchase
export async function processOrderReward(req: Request, res: Response) {
  try {
    // Validate request
    const result = await z.object({
      orderId: z.number(),
      orderTotal: z.number(),
    }).parseAsync(req.body);
    
    const { orderId, orderTotal } = result;
    const userId = req.user!.id;

    // Get applicable rules for purchase
    const purchaseRules = await storage.getActiveRewardRulesByType('purchase');
    
    // Calculate points to award based on applicable rules
    let pointsToAward = 0;
    let description = '';
    
    for (const rule of purchaseRules) {
      // Skip rules with minimum order value if the order total doesn't meet it
      if (rule.minimumOrderValue && orderTotal < rule.minimumOrderValue) {
        continue;
      }
      
      // Calculate points based on type of rule
      if (rule.percentageValue) {
        // Percentage of order value
        pointsToAward += Math.floor(orderTotal * (rule.percentageValue / 100));
        description = `${pointsToAward} points (${rule.percentageValue}% of order value)`;
      } else {
        // Fixed points amount
        pointsToAward += rule.pointsAwarded;
        description = `${pointsToAward} points for order completion`;
      }
    }
    
    if (pointsToAward <= 0) {
      return res.json({ message: 'No points awarded for this order', pointsAwarded: 0 });
    }

    // Create transaction record
    const transaction = await storage.createRewardTransaction({
      userId,
      points: pointsToAward,
      type: 'purchase',
      description,
      orderId,
      transactionDate: new Date(),
      status: 'active'
    });

    // Update user rewards balance
    let userRewards = await storage.getUserRewards(userId);
    if (!userRewards) {
      userRewards = await storage.createUserRewards({
        userId,
        points: pointsToAward,
        lifetimePoints: pointsToAward,
        lastUpdated: new Date()
      });
    } else {
      userRewards = await storage.updateUserRewards(userId, {
        points: userRewards.points + pointsToAward,
        lifetimePoints: userRewards.lifetimePoints + pointsToAward,
        lastUpdated: new Date()
      });
    }

    return res.json({
      message: 'Points awarded successfully',
      pointsAwarded: pointsToAward,
      transaction,
      rewards: userRewards
    });
  } catch (error) {
    console.error('Error processing reward points for order:', error);
    return res.status(500).json({ error: 'Failed to process reward points' });
  }
}

// Get user rewards data
export async function getUserRewards(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const rewards = await storage.getUserRewards(userId);
    
    if (!rewards) {
      // Create a new rewards record if one doesn't exist
      const newRewards = await storage.createUserRewards({
        userId,
        points: 0,
        lifetimePoints: 0,
        lastUpdated: new Date()
      });
      
      return res.json(newRewards);
    }
    
    return res.json(rewards);
  } catch (error) {
    console.error('Error fetching user rewards:', error);
    return res.status(500).json({ error: 'Failed to fetch rewards data' });
  }
}

// Get user reward transactions
export async function getUserTransactions(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await storage.getUserRewardTransactions(userId, page, limit);
    
    return res.json(result.transactions);
  } catch (error) {
    console.error('Error fetching user reward transactions:', error);
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
}

// Get user reward transactions for specific user (used in the API route)
export async function getUserRewardTransactions(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await storage.getUserRewardTransactions(userId, page, limit);
    
    return res.json(result);
  } catch (error) {
    console.error(`Error fetching reward transactions for user ${req.params.userId}:`, error);
    return res.status(500).json({ error: 'Failed to fetch reward transactions' });
  }
}

// Admin handlers
export async function getRewardRules(req: Request, res: Response) {
  try {
    const rules = await storage.getRewardRules();
    return res.json(rules);
  } catch (error) {
    console.error('Error fetching reward rules:', error);
    return res.status(500).json({ error: 'Failed to fetch reward rules' });
  }
}

export async function createRewardRule(req: Request, res: Response) {
  try {
    const rule = await storage.createRewardRule(req.body);
    return res.status(201).json(rule);
  } catch (error) {
    console.error('Error creating reward rule:', error);
    return res.status(500).json({ error: 'Failed to create reward rule' });
  }
}

export async function updateRewardRule(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const rule = await storage.updateRewardRule(id, req.body);
    return res.json(rule);
  } catch (error) {
    console.error('Error updating reward rule:', error);
    return res.status(500).json({ error: 'Failed to update reward rule' });
  }
}

export async function deleteRewardRule(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteRewardRule(id);
    return res.status(204).end();
  } catch (error) {
    console.error('Error deleting reward rule:', error);
    return res.status(500).json({ error: 'Failed to delete reward rule' });
  }
}

export async function getRewardStatistics(req: Request, res: Response) {
  try {
    const stats = await storage.getRewardStatistics();
    return res.json(stats);
  } catch (error) {
    console.error('Error fetching reward statistics:', error);
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
}

// Add points to user
export async function addPointsToUser(req: Request, res: Response) {
  try {
    const { userId, points, type, description } = req.body;
    
    // Create transaction
    const transaction = await storage.createRewardTransaction({
      userId,
      points,
      type,
      description,
      transactionDate: new Date(),
      status: 'active'
    });
    
    // Update user rewards balance
    let userRewards = await storage.getUserRewards(userId);
    if (!userRewards) {
      userRewards = await storage.createUserRewards({
        userId,
        points,
        lifetimePoints: points,
        lastUpdated: new Date()
      });
    } else {
      userRewards = await storage.updateUserRewards(userId, {
        points: userRewards.points + points,
        lifetimePoints: userRewards.lifetimePoints + points,
        lastUpdated: new Date()
      });
    }
    
    return res.json({
      message: 'Points added successfully',
      transaction,
      rewards: userRewards
    });
  } catch (error) {
    console.error('Error adding points to user:', error);
    return res.status(500).json({ error: 'Failed to add points' });
  }
}

// Redeem reward points for an order
export async function redeemRewardPoints(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { orderTotal, pointsToRedeem, orderId } = req.body;

    if (!orderTotal || !pointsToRedeem) {
      return res.status(400).json({ error: 'orderTotal and pointsToRedeem are required' });
    }

    // Get user rewards
    const userRewards = await storage.getUserRewards(userId);
    if (!userRewards) {
      return res.status(400).json({ error: 'No rewards account found for user' });
    }

    // Calculate max redeemable points (5% of order total, floored)
    const maxRedeemable = Math.floor(Number(orderTotal) * 0.05);
    if (pointsToRedeem > maxRedeemable) {
      return res.status(400).json({ error: `Cannot redeem more than ${maxRedeemable} points for this order (5% of order total)` });
    }
    if (pointsToRedeem > userRewards.points) {
      return res.status(400).json({ error: 'Insufficient reward points' });
    }
    if (pointsToRedeem <= 0) {
      return res.status(400).json({ error: 'Points to redeem must be greater than 0' });
    }

    // Deduct points and create transaction
    const transaction = await storage.createRewardTransaction({
      userId,
      points: -pointsToRedeem, // Negative for redemption
      type: 'redeem',
      description: `Redeemed ${pointsToRedeem} points for order #${orderId || ''}`,
      orderId: orderId || null,
      transactionDate: new Date(),
      status: 'used',
    });

    // Update user rewards balance
    const updatedRewards = await storage.updateUserRewards(userId, {
      points: userRewards.points - pointsToRedeem,
      lastUpdated: new Date(),
    });

    return res.json({
      message: 'Points redeemed successfully',
      pointsRedeemed: pointsToRedeem,
      transaction,
      rewards: updatedRewards,
    });
  } catch (error) {
    console.error('Error redeeming reward points:', error);
    return res.status(500).json({ error: 'Failed to redeem reward points' });
  }
}