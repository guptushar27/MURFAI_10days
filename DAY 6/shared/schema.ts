import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const fraudCases = pgTable("fraud_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userName: text("user_name").notNull(),
  securityIdentifier: text("security_identifier").notNull(),
  cardEnding: text("card_ending").notNull(),
  status: text("status").notNull().default("pending_review"),
  transactionName: text("transaction_name").notNull(),
  transactionAmount: text("transaction_amount").notNull(),
  transactionTime: text("transaction_time").notNull(),
  transactionCategory: text("transaction_category").notNull(),
  transactionSource: text("transaction_source").notNull(),
  securityQuestion: text("security_question").notNull(),
  securityAnswer: text("security_answer").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const callSessions = pgTable("call_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fraudCaseId: varchar("fraud_case_id").references(() => fraudCases.id),
  userName: text("user_name").notNull(),
  transcript: text("transcript"),
  outcome: text("outcome").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFraudCaseSchema = createInsertSchema(fraudCases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateFraudCaseSchema = z.object({
  status: z.enum(["pending_review", "confirmed_safe", "confirmed_fraud", "verification_failed"]),
});

export const insertCallSessionSchema = createInsertSchema(callSessions).omit({
  id: true,
  completedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type FraudCase = typeof fraudCases.$inferSelect;
export type InsertFraudCase = z.infer<typeof insertFraudCaseSchema>;
export type UpdateFraudCase = z.infer<typeof updateFraudCaseSchema>;
export type CallSession = typeof callSessions.$inferSelect;
export type InsertCallSession = z.infer<typeof insertCallSessionSchema>;
