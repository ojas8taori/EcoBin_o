import {
  users,
  wasteEntries,
  pickupSchedules,
  communityReports,
  cleanupEvents,
  eventParticipants,
  ecoChallenges,
  userChallengeProgress,
  rewards,
  userRewards,
  marketplaceItems,
  ecoPointsTransactions,
  type User,
  type UpsertUser,
  type WasteEntry,
  type InsertWasteEntry,
  type PickupSchedule,
  type InsertPickupSchedule,
  type CommunityReport,
  type InsertCommunityReport,
  type CleanupEvent,
  type InsertCleanupEvent,
  type EcoChallenge,
  type UserChallengeProgress,
  type InsertUserChallengeProgress,
  type Reward,
  type UserReward,
  type InsertUserReward,
  type MarketplaceItem,
  type InsertMarketplaceItem,
  type EcoPointsTransaction,
  type InsertEcoPointsTransaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - local authentication
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  
  // Waste entry operations
  createWasteEntry(entry: InsertWasteEntry): Promise<WasteEntry>;
  getUserWasteEntries(userId: string): Promise<WasteEntry[]>;
  getWasteEntriesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<WasteEntry[]>;
  
  // Pickup schedule operations
  createPickupSchedule(schedule: InsertPickupSchedule): Promise<PickupSchedule>;
  getUserPickupSchedules(userId: string): Promise<PickupSchedule[]>;
  updatePickupScheduleStatus(id: number, status: string): Promise<PickupSchedule | undefined>;
  
  // Community operations
  createCommunityReport(report: InsertCommunityReport): Promise<CommunityReport>;
  getCommunityReports(limit?: number): Promise<CommunityReport[]>;
  updateCommunityReportStatus(id: number, status: string): Promise<CommunityReport | undefined>;
  
  // Cleanup events
  createCleanupEvent(event: InsertCleanupEvent): Promise<CleanupEvent>;
  getUpcomingCleanupEvents(): Promise<CleanupEvent[]>;
  joinCleanupEvent(eventId: number, userId: string): Promise<void>;
  
  // Challenges
  getActiveChallenges(): Promise<EcoChallenge[]>;
  getUserChallengeProgress(userId: string): Promise<UserChallengeProgress[]>;
  updateChallengeProgress(userId: string, challengeId: number, progress: number): Promise<void>;
  
  // Rewards
  getAvailableRewards(): Promise<Reward[]>;
  redeemReward(userId: string, rewardId: number): Promise<UserReward>;
  getUserRewards(userId: string): Promise<UserReward[]>;
  
  // Analytics
  getUserAnalytics(userId: string): Promise<{
    totalWasteEntries: number;
    totalEcoPoints: number;
    wasteByType: Record<string, number>;
    carbonFootprint: number;
  }>;
  
  // Marketplace operations
  createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem>;
  getMarketplaceItems(limit?: number, category?: string): Promise<MarketplaceItem[]>;
  getUserMarketplaceItems(userId: string): Promise<MarketplaceItem[]>;
  updateMarketplaceItemStatus(id: number, status: string): Promise<MarketplaceItem | undefined>;
  deleteMarketplaceItem(id: number, userId: string): Promise<boolean>;
  
  // Eco-points operations
  addEcoPointsTransaction(transaction: InsertEcoPointsTransaction): Promise<EcoPointsTransaction>;
  getUserEcoPointsTransactions(userId: string, limit?: number): Promise<EcoPointsTransaction[]>;
  updateUserEcoPoints(userId: string, amount: number): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Waste entry operations
  async createWasteEntry(entry: InsertWasteEntry): Promise<WasteEntry> {
    const [wasteEntry] = await db
      .insert(wasteEntries)
      .values(entry)
      .returning();
    
    // Update user's eco points
    await db
      .update(users)
      .set({
        ecoPoints: sql`${users.ecoPoints} + ${entry.ecoPointsEarned || 0}`,
      })
      .where(eq(users.id, entry.userId));
    
    return wasteEntry;
  }

  async getUserWasteEntries(userId: string): Promise<WasteEntry[]> {
    return await db
      .select()
      .from(wasteEntries)
      .where(eq(wasteEntries.userId, userId))
      .orderBy(desc(wasteEntries.createdAt));
  }

  async getWasteEntriesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<WasteEntry[]> {
    return await db
      .select()
      .from(wasteEntries)
      .where(
        and(
          eq(wasteEntries.userId, userId),
          gte(wasteEntries.createdAt, startDate),
          lte(wasteEntries.createdAt, endDate)
        )
      )
      .orderBy(desc(wasteEntries.createdAt));
  }

  // Pickup schedule operations
  async createPickupSchedule(schedule: InsertPickupSchedule): Promise<PickupSchedule> {
    const [pickupSchedule] = await db
      .insert(pickupSchedules)
      .values(schedule)
      .returning();
    return pickupSchedule;
  }

  async getUserPickupSchedules(userId: string): Promise<PickupSchedule[]> {
    return await db
      .select()
      .from(pickupSchedules)
      .where(eq(pickupSchedules.userId, userId))
      .orderBy(desc(pickupSchedules.scheduledDate));
  }

  async updatePickupScheduleStatus(id: number, status: string): Promise<PickupSchedule | undefined> {
    const [schedule] = await db
      .update(pickupSchedules)
      .set({ status, completedAt: status === 'completed' ? new Date() : undefined })
      .where(eq(pickupSchedules.id, id))
      .returning();
    return schedule;
  }

  // Community operations
  async createCommunityReport(report: InsertCommunityReport): Promise<CommunityReport> {
    const [communityReport] = await db
      .insert(communityReports)
      .values(report)
      .returning();
    return communityReport;
  }

  async getCommunityReports(limit = 50): Promise<CommunityReport[]> {
    return await db
      .select()
      .from(communityReports)
      .orderBy(desc(communityReports.createdAt))
      .limit(limit);
  }

  async updateCommunityReportStatus(id: number, status: string): Promise<CommunityReport | undefined> {
    const [report] = await db
      .update(communityReports)
      .set({ status, resolvedAt: status === 'resolved' ? new Date() : undefined })
      .where(eq(communityReports.id, id))
      .returning();
    return report;
  }

  // Cleanup events
  async createCleanupEvent(event: InsertCleanupEvent): Promise<CleanupEvent> {
    const [cleanupEvent] = await db
      .insert(cleanupEvents)
      .values(event)
      .returning();
    return cleanupEvent;
  }

  async getUpcomingCleanupEvents(): Promise<CleanupEvent[]> {
    return await db
      .select()
      .from(cleanupEvents)
      .where(
        and(
          eq(cleanupEvents.status, 'upcoming'),
          gte(cleanupEvents.eventDate, new Date())
        )
      )
      .orderBy(cleanupEvents.eventDate);
  }

  async joinCleanupEvent(eventId: number, userId: string): Promise<void> {
    await db
      .insert(eventParticipants)
      .values({ eventId, userId })
      .onConflictDoNothing();
    
    // Update participant count
    await db
      .update(cleanupEvents)
      .set({
        currentParticipants: sql`${cleanupEvents.currentParticipants} + 1`,
      })
      .where(eq(cleanupEvents.id, eventId));
  }

  // Challenges
  async getActiveChallenges(): Promise<EcoChallenge[]> {
    try {
      return await db
        .select()
        .from(ecoChallenges)
        .where(eq(ecoChallenges.isActive, 1)) // Use 1 instead of true for SQLite compatibility
        .orderBy(ecoChallenges.endDate);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      return [];
    }
  }

  async getUserChallengeProgress(userId: string): Promise<UserChallengeProgress[]> {
    return await db
      .select()
      .from(userChallengeProgress)
      .where(eq(userChallengeProgress.userId, userId))
      .orderBy(desc(userChallengeProgress.createdAt));
  }

  async updateChallengeProgress(userId: string, challengeId: number, progress: number): Promise<void> {
    await db
      .insert(userChallengeProgress)
      .values({
        userId,
        challengeId,
        currentProgress: progress,
      })
      .onConflictDoUpdate({
        target: [userChallengeProgress.userId, userChallengeProgress.challengeId],
        set: {
          currentProgress: sql`${userChallengeProgress.currentProgress} + ${progress}`,
        },
      });
  }

  // Rewards
  async getAvailableRewards(): Promise<Reward[]> {
    try {
      return await db
        .select()
        .from(rewards)
        .where(eq(rewards.isActive, 1)) // Use 1 instead of true for SQLite compatibility
        .orderBy(rewards.ecoPointsCost);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      return [];
    }
  }

  async redeemReward(userId: string, rewardId: number): Promise<UserReward> {
    const [reward] = await db
      .select()
      .from(rewards)
      .where(eq(rewards.id, rewardId));
    
    if (!reward) {
      throw new Error('Reward not found');
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user || (user.ecoPoints || 0) < reward.ecoPointsCost) {
      throw new Error('Insufficient EcoPoints');
    }

    // Deduct points from user
    await db
      .update(users)
      .set({
        ecoPoints: sql`${users.ecoPoints} - ${reward.ecoPointsCost}`,
      })
      .where(eq(users.id, userId));

    // Create user reward
    const [userReward] = await db
      .insert(userRewards)
      .values({
        userId,
        rewardId,
        redemptionCode: `ECO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        expiresAt: reward.validUntil,
      })
      .returning();

    return userReward;
  }

  async getUserRewards(userId: string): Promise<UserReward[]> {
    return await db
      .select()
      .from(userRewards)
      .where(eq(userRewards.userId, userId))
      .orderBy(desc(userRewards.redeemedAt));
  }

  // Analytics
  async getUserAnalytics(userId: string): Promise<{
    totalWasteEntries: number;
    totalEcoPoints: number;
    wasteByType: Record<string, number>;
    carbonFootprint: number;
  }> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    const wasteEntriesData = await db
      .select()
      .from(wasteEntries)
      .where(eq(wasteEntries.userId, userId));
    
    const wasteByType = wasteEntriesData.reduce((acc, entry) => {
      acc[entry.wasteType] = (acc[entry.wasteType] || 0) + parseFloat(entry.quantity);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalWasteEntries: wasteEntriesData.length,
      totalEcoPoints: user?.ecoPoints || 0,
      wasteByType,
      carbonFootprint: parseFloat(user?.carbonFootprint || "0"),
    };
  }
  
  // Marketplace operations
  async createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem> {
    const [newItem] = await db.insert(marketplaceItems).values(item).returning();
    
    // Award eco-points for posting
    await this.addEcoPointsTransaction({
      userId: item.userId,
      amount: item.ecoPointsReward || 10,
      source: 'marketplace_post',
      description: `Posted marketplace item: ${item.title}`,
      referenceId: newItem.id.toString(),
    });
    
    await this.updateUserEcoPoints(item.userId, item.ecoPointsReward || 10);
    
    return newItem;
  }
  
  async getMarketplaceItems(limit = 50, category?: string): Promise<MarketplaceItem[]> {
    if (category && category !== 'all') {
      return await db.select().from(marketplaceItems)
        .where(and(eq(marketplaceItems.status, 'available'), eq(marketplaceItems.category, category)))
        .orderBy(desc(marketplaceItems.createdAt))
        .limit(limit);
    }
    
    return await db.select().from(marketplaceItems)
      .where(eq(marketplaceItems.status, 'available'))
      .orderBy(desc(marketplaceItems.createdAt))
      .limit(limit);
  }
  
  async getUserMarketplaceItems(userId: string): Promise<MarketplaceItem[]> {
    return await db.select().from(marketplaceItems)
      .where(eq(marketplaceItems.userId, userId))
      .orderBy(desc(marketplaceItems.createdAt));
  }
  
  async updateMarketplaceItemStatus(id: number, status: string): Promise<MarketplaceItem | undefined> {
    const [updatedItem] = await db.update(marketplaceItems)
      .set({ status, updatedAt: new Date() })
      .where(eq(marketplaceItems.id, id))
      .returning();
    
    return updatedItem;
  }
  
  async deleteMarketplaceItem(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(marketplaceItems)
      .where(and(eq(marketplaceItems.id, id), eq(marketplaceItems.userId, userId)));
    
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  // Eco-points operations
  async addEcoPointsTransaction(transaction: InsertEcoPointsTransaction): Promise<EcoPointsTransaction> {
    const [newTransaction] = await db.insert(ecoPointsTransactions).values(transaction).returning();
    return newTransaction;
  }
  
  async getUserEcoPointsTransactions(userId: string, limit = 50): Promise<EcoPointsTransaction[]> {
    return await db.select().from(ecoPointsTransactions)
      .where(eq(ecoPointsTransactions.userId, userId))
      .orderBy(desc(ecoPointsTransactions.createdAt))
      .limit(limit);
  }
  
  async updateUserEcoPoints(userId: string, amount: number): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({ 
        ecoPoints: sql`${users.ecoPoints} + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
}

export const storage = new DatabaseStorage();
