import {
  mysqlTable,
  varchar,
  text,
  int,
  decimal,
  boolean,
  bigint,
  json,
  timestamp,
  index,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = mysqlTable(
  "sessions",
  {
    sid: varchar("sid", { length: 255 }).primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - local authentication
export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  username: varchar("username", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  ecoPoints: int("eco_points").default(0),
  carbonFootprint: decimal("carbon_footprint", { precision: 10, scale: 2 }).default("0"),
  greenTier: varchar("green_tier", { length: 50 }).default("Bronze"),
  language: varchar("language", { length: 10 }).default("en"),
  createdAt: bigint("created_at", { mode: 'number' }).default(Date.now()),
  updatedAt: bigint("updated_at", { mode: 'number' }).default(Date.now()),
});

// Waste entries table
export const wasteEntries = mysqlTable("waste_entries", {
  id: int("id").primaryKey({ autoIncrement: true }),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  wasteType: varchar("waste_type", { length: 100 }).notNull(), // organic, plastic, e-waste, hazardous, bulk
  quantity: decimal("quantity", { precision: 8, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(), // kg, liters, pieces
  disposalMethod: varchar("disposal_method", { length: 100 }), // recycle, compost, landfill, hazardous
  ecoPointsEarned: int("eco_points_earned").default(0),
  imageUrl: varchar("image_url", { length: 500 }),
  notes: text("notes"),
  createdAt: bigint("created_at", { mode: 'number' }).default(Date.now()),
});

// Pickup schedules table
export const pickupSchedules = mysqlTable("pickup_schedules", {
  id: int("id").primaryKey({ autoIncrement: true }),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  wasteType: varchar("waste_type", { length: 100 }).notNull(),
  scheduledDate: bigint("scheduled_date", { mode: 'number' }).notNull(),
  status: varchar("status", { length: 50 }).default("scheduled"), // scheduled, in-progress, completed, cancelled
  address: text("address").notNull(),
  specialInstructions: text("special_instructions"),
  estimatedQuantity: varchar("estimated_quantity", { length: 100 }),
  actualQuantity: decimal("actual_quantity", { precision: 8, scale: 2 }),
  pickupPersonnel: varchar("pickup_personnel", { length: 255 }),
  completedAt: bigint("completed_at", { mode: 'number' }),
  createdAt: bigint("created_at", { mode: 'number' }).default(Date.now()),
});

// Community reports table
export const communityReports = mysqlTable("community_reports", {
  id: int("id").primaryKey({ autoIncrement: true }),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  reportType: varchar("report_type", { length: 100 }).notNull(), // overflowing_bin, illegal_dumping, cleanup_needed
  description: text("description").notNull(),
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  imageUrl: varchar("image_url", { length: 500 }),
  status: varchar("status", { length: 50 }).default("reported"), // reported, investigating, resolved
  priority: varchar("priority", { length: 50 }).default("medium"), // low, medium, high, urgent
  assignedTo: varchar("assigned_to", { length: 255 }),
  resolvedAt: bigint("resolved_at", { mode: 'number' }),
  createdAt: bigint("created_at", { mode: 'number' }).default(Date.now()),
});

// Cleanup events table
export const cleanupEvents = mysqlTable("cleanup_events", {
  id: int("id").primaryKey({ autoIncrement: true }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  eventDate: bigint("event_date", { mode: 'number' }).notNull(),
  duration: int("duration"), // in minutes
  maxParticipants: int("max_participants"),
  currentParticipants: int("current_participants").default(0),
  organizerId: varchar("organizer_id", { length: 255 }).references(() => users.id),
  ecoPointsReward: int("eco_points_reward").default(0),
  status: varchar("status", { length: 50 }).default("upcoming"), // upcoming, ongoing, completed, cancelled
  createdAt: bigint("created_at", { mode: 'number' }).default(Date.now()),
});

// Event participants table
export const eventParticipants = mysqlTable("event_participants", {
  id: int("id").primaryKey({ autoIncrement: true }),
  eventId: int("event_id").references(() => cleanupEvents.id),
  userId: varchar("user_id", { length: 255 }).references(() => users.id),
  joinedAt: bigint("joined_at", { mode: 'number' }).default(Date.now()),
  attended: boolean("attended").default(false),
  ecoPointsEarned: int("eco_points_earned").default(0),
});

// Eco challenges table
export const ecoChallenges = mysqlTable("eco_challenges", {
  id: int("id").primaryKey({ autoIncrement: true }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  challengeType: varchar("challenge_type", { length: 50 }).notNull(), // daily, weekly, monthly
  targetValue: int("target_value").notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  ecoPointsReward: int("eco_points_reward").notNull(),
  startDate: bigint("start_date", { mode: 'number' }).notNull(),
  endDate: bigint("end_date", { mode: 'number' }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: bigint("created_at", { mode: 'number' }).default(Date.now()),
});

// User challenge progress table
export const userChallengeProgress = mysqlTable("user_challenge_progress", {
  id: int("id").primaryKey({ autoIncrement: true }),
  userId: varchar("user_id", { length: 255 }).references(() => users.id),
  challengeId: int("challenge_id").references(() => ecoChallenges.id),
  currentProgress: int("current_progress").default(0),
  isCompleted: boolean("is_completed").default(false),
  completedAt: bigint("completed_at", { mode: 'number' }),
  ecoPointsEarned: int("eco_points_earned").default(0),
  createdAt: bigint("created_at", { mode: 'number' }).default(Date.now()),
});

// Rewards table
export const rewards = mysqlTable("rewards", {
  id: int("id").primaryKey({ autoIncrement: true }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // voucher, discount, donation
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  ecoPointsCost: int("eco_points_cost").notNull(),
  category: varchar("category", { length: 100 }), // eco_products, food, transportation, donation
  validUntil: bigint("valid_until", { mode: 'number' }),
  isActive: boolean("is_active").default(true),
  stockQuantity: int("stock_quantity"),
  createdAt: bigint("created_at", { mode: 'number' }).default(Date.now()),
});

// User rewards table
export const userRewards = mysqlTable("user_rewards", {
  id: int("id").primaryKey({ autoIncrement: true }),
  userId: varchar("user_id", { length: 255 }).references(() => users.id),
  rewardId: int("reward_id").references(() => rewards.id),
  redemptionCode: varchar("redemption_code", { length: 255 }),
  redeemedAt: bigint("redeemed_at", { mode: 'number' }).default(Date.now()),
  usedAt: bigint("used_at", { mode: 'number' }),
  isUsed: boolean("is_used").default(false),
  expiresAt: bigint("expires_at", { mode: 'number' }),
});

// Marketplace for product exchange
export const marketplaceItems = mysqlTable("marketplace_items", {
  id: int("id").primaryKey({ autoIncrement: true }),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(), // electronics, clothing, furniture, books, etc.
  condition: varchar("condition", { length: 50 }).notNull(), // excellent, good, fair, needs_repair
  images: json("images").default("[]"), // JSON array
  location: varchar("location", { length: 255 }),
  price: int("price").default(0), // 0 for free items
  status: varchar("status", { length: 50 }).notNull().default("available"), // available, reserved, traded, removed
  contactMethod: varchar("contact_method", { length: 50 }).notNull(), // email, phone, message
  contactInfo: varchar("contact_info", { length: 255 }).notNull(),
  ecoPointsReward: int("eco_points_reward").default(10), // points for posting
  createdAt: bigint("created_at", { mode: 'number' }).default(Date.now()),
  updatedAt: bigint("updated_at", { mode: 'number' }).default(Date.now()),
});

// Eco-points transactions for tracking earnings
export const ecoPointsTransactions = mysqlTable("eco_points_transactions", {
  id: int("id").primaryKey({ autoIncrement: true }),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  amount: int("amount").notNull(), // positive for earning, negative for spending
  source: varchar("source", { length: 100 }).notNull(), // quiz, recycling, marketplace_post, reward_redemption, etc.
  description: varchar("description", { length: 255 }).notNull(),
  referenceId: varchar("reference_id", { length: 255 }), // ID of related item (quiz, marketplace item, etc.)
  createdAt: bigint("created_at", { mode: 'number' }).default(Date.now()),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  wasteEntries: many(wasteEntries),
  pickupSchedules: many(pickupSchedules),
  communityReports: many(communityReports),
  organizedEvents: many(cleanupEvents),
  eventParticipations: many(eventParticipants),
  challengeProgress: many(userChallengeProgress),
  redeemedRewards: many(userRewards),
  marketplaceItems: many(marketplaceItems),
  ecoPointsTransactions: many(ecoPointsTransactions),
}));

export const wasteEntriesRelations = relations(wasteEntries, ({ one }) => ({
  user: one(users, { fields: [wasteEntries.userId], references: [users.id] }),
}));

export const pickupSchedulesRelations = relations(pickupSchedules, ({ one }) => ({
  user: one(users, { fields: [pickupSchedules.userId], references: [users.id] }),
}));

export const communityReportsRelations = relations(communityReports, ({ one }) => ({
  user: one(users, { fields: [communityReports.userId], references: [users.id] }),
}));

export const cleanupEventsRelations = relations(cleanupEvents, ({ one, many }) => ({
  organizer: one(users, { fields: [cleanupEvents.organizerId], references: [users.id] }),
  participants: many(eventParticipants),
}));

export const eventParticipantsRelations = relations(eventParticipants, ({ one }) => ({
  event: one(cleanupEvents, { fields: [eventParticipants.eventId], references: [cleanupEvents.id] }),
  user: one(users, { fields: [eventParticipants.userId], references: [users.id] }),
}));

export const userChallengeProgressRelations = relations(userChallengeProgress, ({ one }) => ({
  user: one(users, { fields: [userChallengeProgress.userId], references: [users.id] }),
  challenge: one(ecoChallenges, { fields: [userChallengeProgress.challengeId], references: [ecoChallenges.id] }),
}));

export const userRewardsRelations = relations(userRewards, ({ one }) => ({
  user: one(users, { fields: [userRewards.userId], references: [users.id] }),
  reward: one(rewards, { fields: [userRewards.rewardId], references: [rewards.id] }),
}));

export const marketplaceItemsRelations = relations(marketplaceItems, ({ one }) => ({
  user: one(users, { fields: [marketplaceItems.userId], references: [users.id] }),
}));

export const ecoPointsTransactionsRelations = relations(ecoPointsTransactions, ({ one }) => ({
  user: one(users, { fields: [ecoPointsTransactions.userId], references: [users.id] }),
}));

// Insert schemas
export const insertWasteEntrySchema = createInsertSchema(wasteEntries).omit({
  id: true,
  createdAt: true,
});

export const insertPickupScheduleSchema = createInsertSchema(pickupSchedules).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertCommunityReportSchema = createInsertSchema(communityReports).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export const insertCleanupEventSchema = createInsertSchema(cleanupEvents).omit({
  id: true,
  createdAt: true,
});

export const insertUserChallengeProgressSchema = createInsertSchema(userChallengeProgress).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertUserRewardSchema = createInsertSchema(userRewards).omit({
  id: true,
  redeemedAt: true,
});

export const insertMarketplaceItemSchema = createInsertSchema(marketplaceItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEcoPointsTransactionSchema = createInsertSchema(ecoPointsTransactions).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type WasteEntry = typeof wasteEntries.$inferSelect;
export type InsertWasteEntry = z.infer<typeof insertWasteEntrySchema>;
export type PickupSchedule = typeof pickupSchedules.$inferSelect;
export type InsertPickupSchedule = z.infer<typeof insertPickupScheduleSchema>;
export type CommunityReport = typeof communityReports.$inferSelect;
export type InsertCommunityReport = z.infer<typeof insertCommunityReportSchema>;
export type CleanupEvent = typeof cleanupEvents.$inferSelect;
export type InsertCleanupEvent = z.infer<typeof insertCleanupEventSchema>;
export type EcoChallenge = typeof ecoChallenges.$inferSelect;
export type UserChallengeProgress = typeof userChallengeProgress.$inferSelect;
export type InsertUserChallengeProgress = z.infer<typeof insertUserChallengeProgressSchema>;
export type Reward = typeof rewards.$inferSelect;
export type UserReward = typeof userRewards.$inferSelect;
export type InsertUserReward = z.infer<typeof insertUserRewardSchema>;
export type MarketplaceItem = typeof marketplaceItems.$inferSelect;
export type InsertMarketplaceItem = z.infer<typeof insertMarketplaceItemSchema>;
export type EcoPointsTransaction = typeof ecoPointsTransactions.$inferSelect;
export type InsertEcoPointsTransaction = z.infer<typeof insertEcoPointsTransactionSchema>;
