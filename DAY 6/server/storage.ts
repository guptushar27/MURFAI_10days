import { 
  type User, 
  type InsertUser,
  type FraudCase,
  type InsertFraudCase,
  type UpdateFraudCase,
  type CallSession,
  type InsertCallSession,
  users,
  fraudCases,
  callSessions
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Fraud case methods
  getAllFraudCases(): Promise<FraudCase[]>;
  getFraudCaseByUserName(userName: string): Promise<FraudCase | undefined>;
  createFraudCase(fraudCase: InsertFraudCase): Promise<FraudCase>;
  updateFraudCaseStatus(id: string, status: UpdateFraudCase): Promise<FraudCase>;
  
  // Call session methods
  createCallSession(session: InsertCallSession): Promise<CallSession>;
  getCallSessionsByUserName(userName: string): Promise<CallSession[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllFraudCases(): Promise<FraudCase[]> {
    return await db.select().from(fraudCases);
  }

  async getFraudCaseByUserName(userName: string): Promise<FraudCase | undefined> {
    const [fraudCase] = await db
      .select()
      .from(fraudCases)
      .where(eq(fraudCases.userName, userName));
    return fraudCase || undefined;
  }

  async createFraudCase(insertFraudCase: InsertFraudCase): Promise<FraudCase> {
    const [fraudCase] = await db
      .insert(fraudCases)
      .values(insertFraudCase)
      .returning();
    return fraudCase;
  }

  async updateFraudCaseStatus(id: string, update: UpdateFraudCase): Promise<FraudCase> {
    const [fraudCase] = await db
      .update(fraudCases)
      .set({ status: update.status, updatedAt: new Date() })
      .where(eq(fraudCases.id, id))
      .returning();
    return fraudCase;
  }

  async createCallSession(insertSession: InsertCallSession): Promise<CallSession> {
    const [session] = await db
      .insert(callSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getCallSessionsByUserName(userName: string): Promise<CallSession[]> {
    return await db
      .select()
      .from(callSessions)
      .where(eq(callSessions.userName, userName));
  }
}

export const storage = new DatabaseStorage();
