import { Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { insertRewardRuleSchema, insertRewardTransactionSchema } from '@shared/schema';
import crypto from 'crypto';

// Get user rewards summary
export async function getUserRewardsSummary(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = parseInt(req.params.userId || req.user?.id.toString() || '0', 10);
    
    // Check if user is trying to access another user's rewards and is not an admin
    if (userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const rewardsSummary = await storage.getUserRewardsSummary(userId);
    if (!rewardsSummary) {
      // If user has no reward record yet, initialize one with zero points
      const newRewardsSummary = await storage.initializeUserRewards(userId);
      return res.json(newRewardsSummary);
    }

    return res.json(rewardsSummary);
  } catch (error) {
    console.error('Error getting user rewards summary:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}

// Get user reward transactions history
export async function getUserRewardTransactions(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = parseInt(req.params.userId || req.user?.id.toString() || '0', 10);
    
    // Check if user is trying to access another user's transactions and is not an admin
    if (userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    const offset = (page - 1) * limit;

    const transactions = await storage.getUserRewardTransactions(userId, offset, limit);
    const totalCount = await storage.getUserRewardTransactionsCount(userId);
    
    return res.json({
      transactions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error getting user reward transactions:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}

// Add reward points to a user
export async function addRewardPoints(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Requires admin privileges.' });
    }

    const schema = z.object({
      userId: z.number().int().positive(),
      points: z.number().int().positive(),
      type: z.string(),
      description: z.string().optional(),
      orderId: z.number().int().positive().optional(),
      productId: z.number().int().positive().optional(),
      expiryDate: z.string().optional(), // ISO date string
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: 'Invalid input data', errors: result.error.format() });
    }

    const { userId, points, type, description, orderId, productId, expiryDate } = result.data;

    // Create transaction record
    const transaction = await storage.createRewardTransaction({
      userId,
      points,
      type,
      description: description || '',
      orderId,
      productId,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      transactionDate: new Date(),
      status: 'active'
    });

    // Update user's rewards balance
    const updatedRewards = await storage.updateUserRewardPoints(userId, points);

    return res.status(201).json({ transaction, updatedRewards });
  } catch (error) {
    console.error('Error adding reward points:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}

// Redeem reward points
export async function redeemRewardPoints(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const schema = z.object({
      points: z.number().int().positive(),
      orderId: z.number().int().positive().optional(),
      description: z.string().optional(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: 'Invalid input data', errors: result.error.format() });
    }

    const { points, orderId, description } = result.data;
    const userId = req.user!.id;

    // Get current rewards balance
    const rewardsSummary = await storage.getUserRewardsSummary(userId);
    if (!rewardsSummary || rewardsSummary.points < points) {
      return res.status(400).json({ message: 'Insufficient reward points' });
    }

    // Create redemption transaction
    const transaction = await storage.createRewardTransaction({
      userId,
      points: -points, // Negative value for redemption
      type: 'redeem',
      description: description || 'Points redemption',
      orderId,
      transactionDate: new Date(),
      status: 'used'
    });

    // Update user's rewards balance
    const updatedRewards = await storage.updateUserRewardPoints(userId, -points);

    return res.status(200).json({ transaction, updatedRewards });
  } catch (error) {
    console.error('Error redeeming reward points:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}

// Admin: Get all reward rules
export async function getAllRewardRules(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Requires admin privileges.' });
    }

    const rules = await storage.getAllRewardRules();
    return res.json(rules);
  } catch (error) {
    console.error('Error getting reward rules:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}

// Admin: Create reward rule
export async function createRewardRule(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Requires admin privileges.' });
    }

    const ruleData = insertRewardRuleSchema.safeParse(req.body);
    if (!ruleData.success) {
      return res.status(400).json({ message: 'Invalid rule data', errors: ruleData.error.format() });
    }

    const newRule = await storage.createRewardRule(ruleData.data);
    return res.status(201).json(newRule);
  } catch (error) {
    console.error('Error creating reward rule:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}

// Admin: Update reward rule
export async function updateRewardRule(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Requires admin privileges.' });
    }

    const ruleId = parseInt(req.params.id, 10);
    if (isNaN(ruleId)) {
      return res.status(400).json({ message: 'Invalid rule ID' });
    }

    const ruleData = insertRewardRuleSchema.partial().safeParse(req.body);
    if (!ruleData.success) {
      return res.status(400).json({ message: 'Invalid rule data', errors: ruleData.error.format() });
    }

    const updatedRule = await storage.updateRewardRule(ruleId, ruleData.data);
    if (!updatedRule) {
      return res.status(404).json({ message: 'Reward rule not found' });
    }

    return res.json(updatedRule);
  } catch (error) {
    console.error('Error updating reward rule:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}

// Admin: Delete reward rule
export async function deleteRewardRule(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Requires admin privileges.' });
    }

    const ruleId = parseInt(req.params.id, 10);
    if (isNaN(ruleId)) {
      return res.status(400).json({ message: 'Invalid rule ID' });
    }

    const success = await storage.deleteRewardRule(ruleId);
    if (!success) {
      return res.status(404).json({ message: 'Reward rule not found' });
    }

    return res.json({ message: 'Reward rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting reward rule:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}

// Admin: Get reward statistics
export async function getRewardStatistics(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Requires admin privileges.' });
    }

    const statistics = await storage.getRewardStatistics();
    return res.json(statistics);
  } catch (error) {
    console.error('Error getting reward statistics:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}

// Award points automatically based on order completion
export async function awardOrderCompletionPoints(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const schema = z.object({
      orderId: z.number().int().positive(),
      orderTotal: z.number().positive(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: 'Invalid input data', errors: result.error.format() });
    }

    const { orderId, orderTotal } = result.data;
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

    // Update user's rewards balance
    const updatedRewards = await storage.updateUserRewardPoints(userId, pointsToAward);

    return res.status(200).json({ 
      message: 'Points awarded successfully', 
      pointsAwarded: pointsToAward,
      transaction, 
      updatedRewards 
    });
  } catch (error) {
    console.error('Error awarding order completion points:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}

// Award points for product review
export async function awardReviewPoints(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const schema = z.object({
      productId: z.number().int().positive(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: 'Invalid input data', errors: result.error.format() });
    }

    const { productId } = result.data;
    const userId = req.user!.id;

    // Check if user has already received points for reviewing this product
    const existingTransaction = await storage.getRewardTransactionByUserAndProductForType(userId, productId, 'review');
    if (existingTransaction) {
      return res.status(400).json({ message: 'Points already awarded for reviewing this product' });
    }

    // Get applicable rule for review
    const reviewRules = await storage.getActiveRewardRulesByType('review');
    if (!reviewRules.length) {
      return res.status(404).json({ message: 'No active reward rule found for product reviews' });
    }
    
    // Use the first applicable rule
    const rule = reviewRules[0];
    const pointsToAward = rule.pointsAwarded;
    
    // Create transaction record
    const transaction = await storage.createRewardTransaction({
      userId,
      points: pointsToAward,
      type: 'review',
      description: `${pointsToAward} points for product review`,
      productId,
      transactionDate: new Date(),
      status: 'active'
    });

    // Update user's rewards balance
    const updatedRewards = await storage.updateUserRewardPoints(userId, pointsToAward);

    return res.status(200).json({ 
      message: 'Points awarded successfully for product review', 
      pointsAwarded: pointsToAward,
      transaction, 
      updatedRewards 
    });
  } catch (error) {
    console.error('Error awarding review points:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}

// Generate a referral code for a user
export async function generateReferralCode(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user!.id;
    
    // Check if user already has a referral code
    let referralCode = await storage.getUserReferralCode(userId);
    
    if (!referralCode) {
      // Generate a new referral code
      const uniqueCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      referralCode = `${req.user!.username.substring(0, 3).toUpperCase()}-${uniqueCode}`;
      
      // Save the referral code
      await storage.saveUserReferralCode(userId, referralCode);
    }
    
    return res.json({ referralCode });
  } catch (error) {
    console.error('Error generating referral code:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}

// Process a referral
export async function processReferral(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const schema = z.object({
      referralCode: z.string()
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: 'Invalid input data', errors: result.error.format() });
    }

    const { referralCode } = result.data;
    const newUserId = req.user!.id;
    
    // Find the user who owns this referral code
    const referringUser = await storage.getUserByReferralCode(referralCode);
    if (!referringUser) {
      return res.status(404).json({ message: 'Invalid referral code' });
    }
    
    // Make sure a user isn't referring themselves
    if (referringUser.id === newUserId) {
      return res.status(400).json({ message: 'You cannot refer yourself' });
    }
    
    // Check if this new user has already used a referral code
    const existingReferral = await storage.getUserReferralUsage(newUserId);
    if (existingReferral) {
      return res.status(400).json({ message: 'You have already used a referral code' });
    }
    
    // Get the referral reward rule
    const referralRules = await storage.getActiveRewardRulesByType('referral');
    if (!referralRules.length) {
      return res.status(404).json({ message: 'No active reward rule found for referrals' });
    }
    
    const rule = referralRules[0];
    const pointsToAward = rule.pointsAwarded;
    
    // Save the referral usage
    await storage.saveReferralUsage(newUserId, referringUser.id, referralCode);
    
    // Award points to the referring user
    const transaction = await storage.createRewardTransaction({
      userId: referringUser.id,
      points: pointsToAward,
      type: 'referral',
      description: `${pointsToAward} points for referring a new user`,
      transactionDate: new Date(),
      status: 'active'
    });
    
    // Update the referring user's rewards balance
    const updatedRewards = await storage.updateUserRewardPoints(referringUser.id, pointsToAward);
    
    return res.status(200).json({ 
      message: 'Referral processed successfully', 
      referringUser: referringUser.username,
      pointsAwarded: pointsToAward
    });
  } catch (error) {
    console.error('Error processing referral:', error);
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
}