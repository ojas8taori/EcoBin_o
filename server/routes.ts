import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { analyzeWasteImage, generateQuiz, generateEducationalContent } from "./gemini";
import { 
  insertWasteEntrySchema,
  insertPickupScheduleSchema,
  insertCommunityReportSchema,
  insertCleanupEventSchema,
  insertMarketplaceItemSchema,
  insertEcoPointsTransactionSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware and routes
  setupAuth(app);

  // Waste entry routes
  app.post('/api/waste-entries', async (req: any, res) => {
    try {
      const userId = req.userId;
      const wasteData = insertWasteEntrySchema.parse({
        ...req.body,
        userId,
      });
      
      const wasteEntry = await storage.createWasteEntry(wasteData);
      res.json(wasteEntry);
    } catch (error) {
      console.error("Error creating waste entry:", error);
      res.status(400).json({ message: "Failed to create waste entry" });
    }
  });

  app.get('/api/waste-entries', async (req: any, res) => {
    try {
      const userId = req.userId;
      const entries = await storage.getUserWasteEntries(userId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching waste entries:", error);
      res.status(500).json({ message: "Failed to fetch waste entries" });
    }
  });

  // Pickup schedule routes
  app.post('/api/pickup-schedules', async (req: any, res) => {
    try {
      const userId = req.userId;
      const scheduleData = {
        ...req.body,
        userId,
        scheduledDate: new Date(req.body.scheduledDate),
        estimatedQuantity: req.body.estimatedQuantity?.toString() || null,
      };
      const validatedData = insertPickupScheduleSchema.parse(scheduleData);
      const schedule = await storage.createPickupSchedule(validatedData);
      res.json(schedule);
    } catch (error) {
      console.error("Error creating pickup schedule:", error);
      res.status(400).json({ message: "Failed to create pickup schedule" });
    }
  });

  app.get('/api/pickup-schedules', async (req: any, res) => {
    try {
      const userId = req.userId;
      const schedules = await storage.getUserPickupSchedules(userId);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching pickup schedules:", error);
      res.status(500).json({ message: "Failed to fetch pickup schedules" });
    }
  });

  app.patch('/api/pickup-schedules/:id/status', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      const schedule = await storage.updatePickupScheduleStatus(id, status);
      res.json(schedule);
    } catch (error) {
      console.error("Error updating pickup schedule:", error);
      res.status(400).json({ message: "Failed to update pickup schedule" });
    }
  });

  // Community report routes
  app.post('/api/community-reports', async (req: any, res) => {
    try {
      const userId = req.userId;
      const reportData = insertCommunityReportSchema.parse({
        ...req.body,
        userId,
      });
      
      const report = await storage.createCommunityReport(reportData);
      res.json(report);
    } catch (error) {
      console.error("Error creating community report:", error);
      res.status(400).json({ message: "Failed to create community report" });
    }
  });

  app.get('/api/community-reports', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const reports = await storage.getCommunityReports(limit);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching community reports:", error);
      res.status(500).json({ message: "Failed to fetch community reports" });
    }
  });

  // Cleanup events routes
  app.post('/api/cleanup-events', async (req: any, res) => {
    try {
      const userId = req.userId;
      const eventData = insertCleanupEventSchema.parse({
        ...req.body,
        organizerId: userId,
      });
      
      const event = await storage.createCleanupEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error("Error creating cleanup event:", error);
      res.status(400).json({ message: "Failed to create cleanup event" });
    }
  });

  app.get('/api/cleanup-events', async (req, res) => {
    try {
      const events = await storage.getUpcomingCleanupEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching cleanup events:", error);
      res.status(500).json({ message: "Failed to fetch cleanup events" });
    }
  });

  app.post('/api/cleanup-events/:id/join', async (req: any, res) => {
    try {
      const userId = req.userId;
      const eventId = parseInt(req.params.id);
      
      await storage.joinCleanupEvent(eventId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error joining cleanup event:", error);
      res.status(400).json({ message: "Failed to join cleanup event" });
    }
  });

  // Challenges routes
  app.get('/api/challenges', async (req, res) => {
    try {
      const challenges = await storage.getActiveChallenges();
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });

  app.get('/api/challenges/progress', async (req: any, res) => {
    try {
      const userId = req.userId;
      const progress = await storage.getUserChallengeProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching challenge progress:", error);
      res.status(500).json({ message: "Failed to fetch challenge progress" });
    }
  });

  // Rewards routes
  app.get('/api/rewards', async (req, res) => {
    try {
      const rewards = await storage.getAvailableRewards();
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });

  app.post('/api/rewards/:id/redeem', async (req: any, res) => {
    try {
      const userId = req.userId;
      const rewardId = parseInt(req.params.id);
      
      const userReward = await storage.redeemReward(userId, rewardId);
      res.json(userReward);
    } catch (error) {
      console.error("Error redeeming reward:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to redeem reward" });
    }
  });

  app.get('/api/rewards/user', async (req: any, res) => {
    try {
      const userId = req.userId;
      const rewards = await storage.getUserRewards(userId);
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching user rewards:", error);
      res.status(500).json({ message: "Failed to fetch user rewards" });
    }
  });

  // Analytics routes
  app.get('/api/analytics', async (req: any, res) => {
    try {
      const userId = req.userId;
      const analytics = await storage.getUserAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // AI Scanner endpoint with Gemini integration
  app.post('/api/ai-scanner', async (req: any, res) => {
    try {
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ message: "No image data provided" });
      }
      
      // Remove data URL prefix if present
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const analysis = await analyzeWasteImage(base64Data);
      res.json(analysis);
    } catch (error) {
      console.error("Error processing AI scan:", error);
      res.status(500).json({ message: "Failed to analyze image with AI" });
    }
  });

  // Quiz generation endpoint
  app.post('/api/quiz/generate', async (req: any, res) => {
    try {
      const { topic, difficulty = 'medium' } = req.body;
      
      if (!topic) {
        return res.status(400).json({ message: "Topic is required" });
      }
      
      const quiz = await generateQuiz(topic, difficulty);
      res.json(quiz);
    } catch (error) {
      console.error("Error generating quiz:", error);
      res.status(500).json({ message: "Failed to generate quiz" });
    }
  });

  // Learning progress endpoint
  app.get('/api/user/learning-progress', async (req: any, res) => {
    try {
      const userId = req.userId;
      const progress = {
        articlesRead: 12,
        quizzesCompleted: 5,
        learningPoints: 850,
        timeSpent: "3h 45m",
        weeklyGoal: { current: 3, target: 5 },
        quizMaster: { current: 5, target: 10 },
        ecoExplorer: { current: 4, target: 6 }
      };
      res.json(progress);
    } catch (error) {
      console.error("Error fetching learning progress:", error);
      res.status(500).json({ message: "Failed to fetch learning progress" });
    }
  });

  // Educational content generation endpoint
  app.post('/api/content/generate', async (req: any, res) => {
    try {
      const { topic } = req.body;
      
      if (!topic) {
        return res.status(400).json({ message: "Topic is required" });
      }
      
      const content = await generateEducationalContent(topic);
      res.json({ content });
    } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({ message: "Failed to generate content" });
    }
  });

  // Marketplace routes
  app.post('/api/marketplace', async (req: any, res) => {
    try {
      const userId = req.userId;
      const itemData = insertMarketplaceItemSchema.parse({
        ...req.body,
        userId,
      });
      
      const item = await storage.createMarketplaceItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating marketplace item:", error);
      res.status(400).json({ message: "Failed to create marketplace item" });
    }
  });

  app.get('/api/marketplace', async (req: any, res) => {
    try {
      const { category, limit } = req.query;
      const items = await storage.getMarketplaceItems(
        limit ? parseInt(limit as string) : undefined,
        category as string
      );
      res.json(items);
    } catch (error) {
      console.error("Error fetching marketplace items:", error);
      res.status(500).json({ message: "Failed to fetch marketplace items" });
    }
  });

  app.get('/api/marketplace/my-items', async (req: any, res) => {
    try {
      const userId = req.userId;
      const items = await storage.getUserMarketplaceItems(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching user marketplace items:", error);
      res.status(500).json({ message: "Failed to fetch user marketplace items" });
    }
  });

  app.patch('/api/marketplace/:id/status', async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const updatedItem = await storage.updateMarketplaceItemStatus(parseInt(id), status);
      if (!updatedItem) {
        return res.status(404).json({ message: "Marketplace item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating marketplace item status:", error);
      res.status(500).json({ message: "Failed to update marketplace item status" });
    }
  });

  app.delete('/api/marketplace/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId;
      
      const deleted = await storage.deleteMarketplaceItem(parseInt(id), userId);
      if (!deleted) {
        return res.status(404).json({ message: "Marketplace item not found or not authorized" });
      }
      
      res.json({ message: "Marketplace item deleted successfully" });
    } catch (error) {
      console.error("Error deleting marketplace item:", error);
      res.status(500).json({ message: "Failed to delete marketplace item" });
    }
  });

  // Eco-points routes
  app.get('/api/eco-points/transactions', async (req: any, res) => {
    try {
      const userId = req.userId;
      const { limit } = req.query;
      const transactions = await storage.getUserEcoPointsTransactions(
        userId,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching eco-points transactions:", error);
      res.status(500).json({ message: "Failed to fetch eco-points transactions" });
    }
  });

  app.post('/api/eco-points/award', async (req: any, res) => {
    try {
      const userId = req.userId;
      const { amount, source, description, referenceId } = req.body;
      
      // Add transaction
      const transaction = await storage.addEcoPointsTransaction({
        userId,
        amount,
        source,
        description,
        referenceId,
      });
      
      // Update user points
      const updatedUser = await storage.updateUserEcoPoints(userId, amount);
      
      res.json({ transaction, user: updatedUser });
    } catch (error) {
      console.error("Error awarding eco-points:", error);
      res.status(500).json({ message: "Failed to award eco-points" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
