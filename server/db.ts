import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Category,
  FamilyGroup,
  FamilyMember,
  InsertCategory,
  InsertInvestment,
  InsertRecurringTransaction,
  InsertTransaction,
  InsertUser,
  Investment,
  InvestmentCategory,
  InvestmentGoal,
  Transaction,
  UserSettings,
  categories,
  familyGroups,
  familyInvites,
  familyMembers,
  investmentCategories,
  investmentGoals,
  investments,
  recurringTransactions,
  transactions,
  userSettings,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategoriesForUser(userId: number): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(categories)
    .where(or(isNull(categories.userId), eq(categories.userId, userId)))
    .orderBy(categories.name);
}

export async function createCategory(data: InsertCategory): Promise<Category> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(categories).values(data);
  const id = (result as any)[0]?.insertId ?? (result as any).insertId;
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return rows[0];
}

export async function updateCategory(
  id: number,
  userId: number,
  data: Partial<InsertCategory>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .update(categories)
    .set(data)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));
}

export async function deleteCategory(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function getTransactions(
  userId: number,
  filters: { year: number; month: number }
): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];
  const startDate = `${filters.year}-${String(filters.month).padStart(2, "0")}-01`;
  const endDate = `${filters.year}-${String(filters.month).padStart(2, "0")}-31`;
  return db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        sql`${transactions.transactionDate} >= ${startDate}`,
        sql`${transactions.transactionDate} <= ${endDate}`
      )
    )
    .orderBy(desc(transactions.transactionDate));
}

export async function getTransactionsByUserIds(
  userIds: number[],
  filters: { year: number; month: number }
): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];
  const startDate = `${filters.year}-${String(filters.month).padStart(2, "0")}-01`;
  const endDate = `${filters.year}-${String(filters.month).padStart(2, "0")}-31`;
  const conditions = userIds.map((id) => eq(transactions.userId, id));
  return db
    .select()
    .from(transactions)
    .where(
      and(
        or(...conditions),
        sql`${transactions.transactionDate} >= ${startDate}`,
        sql`${transactions.transactionDate} <= ${endDate}`
      )
    )
    .orderBy(desc(transactions.transactionDate));
}

export async function getAllTransactionsForUser(userId: number): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.transactionDate));
}

export async function createTransaction(data: InsertTransaction): Promise<Transaction> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(transactions).values(data);
  const id = (result as any)[0]?.insertId ?? (result as any).insertId;
  const rows = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
  return rows[0];
}

export async function createTransactions(data: InsertTransaction[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(transactions).values(data);
}

export async function updateTransaction(
  id: number,
  userId: number,
  data: Partial<InsertTransaction>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .update(transactions)
    .set(data)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
}

export async function deleteTransaction(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
}

export async function deleteInstallmentGroup(
  groupId: string,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .delete(transactions)
    .where(
      and(eq(transactions.installmentGroupId, groupId), eq(transactions.userId, userId))
    );
}

// ─── Investments ──────────────────────────────────────────────────────────────

export async function getInvestmentCategoriesForUser(
  userId: number
): Promise<InvestmentCategory[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(investmentCategories)
    .where(
      or(isNull(investmentCategories.userId), eq(investmentCategories.userId, userId))
    )
    .orderBy(investmentCategories.name);
}

export async function getInvestmentsForUser(userId: number): Promise<Investment[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(investments)
    .where(eq(investments.userId, userId))
    .orderBy(desc(investments.investmentDate));
}

export async function createInvestment(data: InsertInvestment): Promise<Investment> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(investments).values(data);
  const id = (result as any)[0]?.insertId ?? (result as any).insertId;
  const rows = await db.select().from(investments).where(eq(investments.id, id)).limit(1);
  return rows[0];
}

export async function updateInvestment(
  id: number,
  userId: number,
  data: Partial<InsertInvestment>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .update(investments)
    .set(data)
    .where(and(eq(investments.id, id), eq(investments.userId, userId)));
}

export async function deleteInvestment(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .delete(investments)
    .where(and(eq(investments.id, id), eq(investments.userId, userId)));
}

// ─── Investment Goals ─────────────────────────────────────────────────────────

export async function getInvestmentGoalsForUser(userId: number): Promise<InvestmentGoal[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(investmentGoals)
    .where(eq(investmentGoals.userId, userId))
    .orderBy(desc(investmentGoals.year));
}

export async function upsertInvestmentGoal(data: {
  userId: number;
  title: string;
  targetAmount: string;
  period: "monthly" | "annual";
  year: number;
  month?: number | null;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(investmentGoals).values(data).onDuplicateKeyUpdate({
    set: { targetAmount: data.targetAmount, title: data.title },
  });
}

// ─── User Settings ────────────────────────────────────────────────────────────

export async function getUserSettings(userId: number): Promise<UserSettings | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUserSettings(
  userId: number,
  data: Partial<{
    alertThresholdPercent: number;
    monthlyIncomeEstimate: string;
    emailNotifications: boolean;
  }>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .insert(userSettings)
    .values({ userId, ...data })
    .onDuplicateKeyUpdate({ set: data });
}

// ─── Family Groups ────────────────────────────────────────────────────────────

export async function getFamilyGroupForUser(
  userId: number
): Promise<{ group: FamilyGroup; members: FamilyMember[] } | null> {
  const db = await getDb();
  if (!db) return null;
  const memberRows = await db
    .select()
    .from(familyMembers)
    .where(eq(familyMembers.userId, userId))
    .limit(1);
  if (memberRows.length === 0) return null;
  const groupRows = await db
    .select()
    .from(familyGroups)
    .where(eq(familyGroups.id, memberRows[0].groupId))
    .limit(1);
  if (groupRows.length === 0) return null;
  const allMembers = await db
    .select()
    .from(familyMembers)
    .where(eq(familyMembers.groupId, groupRows[0].id));
  return { group: groupRows[0], members: allMembers };
}

export async function createFamilyGroup(
  ownerId: number,
  name: string
): Promise<FamilyGroup> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(familyGroups).values({ ownerId, name });
  const id = (result as any)[0]?.insertId ?? (result as any).insertId;
  await db.insert(familyMembers).values({ groupId: id, userId: ownerId, role: "owner" });
  const rows = await db.select().from(familyGroups).where(eq(familyGroups.id, id)).limit(1);
  return rows[0];
}

export async function createFamilyInvite(
  groupId: number,
  invitedByUserId: number,
  inviteCode: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await db
    .insert(familyInvites)
    .values({ groupId, invitedByUserId, inviteCode, expiresAt });
}

export async function acceptFamilyInvite(
  inviteCode: string,
  userId: number
): Promise<{ success: boolean; groupId?: number }> {
  const db = await getDb();
  if (!db) return { success: false };
  const inviteRows = await db
    .select()
    .from(familyInvites)
    .where(
      and(
        eq(familyInvites.inviteCode, inviteCode),
        eq(familyInvites.status, "pending")
      )
    )
    .limit(1);
  if (inviteRows.length === 0) return { success: false };
  const invite = inviteRows[0];
  if (invite.expiresAt < new Date()) return { success: false };
  // Check if user is already a member
  const existingMember = await db
    .select()
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.groupId, invite.groupId),
        eq(familyMembers.userId, userId)
      )
    )
    .limit(1);
  if (existingMember.length === 0) {
    await db.insert(familyMembers).values({ groupId: invite.groupId, userId, role: "member" });
  }
  await db
    .update(familyInvites)
    .set({ status: "accepted" })
    .where(eq(familyInvites.id, invite.id));
  return { success: true, groupId: invite.groupId };
}

// ─── Dashboard helpers ────────────────────────────────────────────────────────

export async function getMonthlyTransactionsByUserIds(
  userIds: number[],
  year: number,
  month: number
): Promise<Transaction[]> {
  return getTransactionsByUserIds(userIds, { year, month });
}

export async function getTransactionHistoryForUser(
  userId: number,
  months: number = 6
): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  return db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        sql`${transactions.transactionDate} >= ${cutoffStr}`
      )
    )
    .orderBy(desc(transactions.transactionDate));
}

// ─── Recurring Transactions ───────────────────────────────────────────────────

export async function getRecurringTransactionsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(recurringTransactions)
    .where(eq(recurringTransactions.userId, userId))
    .orderBy(desc(recurringTransactions.createdAt));
}

export async function createRecurringTransaction(data: InsertRecurringTransaction) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(recurringTransactions).values(data);
  const id = (result as any)[0]?.insertId ?? (result as any).insertId;
  const rows = await db
    .select()
    .from(recurringTransactions)
    .where(eq(recurringTransactions.id, id))
    .limit(1);
  return rows[0];
}

export async function updateRecurringTransaction(
  id: number,
  userId: number,
  data: Partial<InsertRecurringTransaction>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .update(recurringTransactions)
    .set(data)
    .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)));
}

export async function deleteRecurringTransaction(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .delete(recurringTransactions)
    .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)));
}

/**
 * Generates transactions from active recurring templates for the given month.
 * Skips templates that were already generated for this month.
 */
export async function generateRecurringForMonth(
  userId: number,
  year: number,
  month: number
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const templates = await db
    .select()
    .from(recurringTransactions)
    .where(
      and(
        eq(recurringTransactions.userId, userId),
        eq(recurringTransactions.isActive, true)
      )
    );

  let generated = 0;

  for (const tmpl of templates) {
    // Skip if already generated for this month
    if (tmpl.lastGeneratedYear === year && tmpl.lastGeneratedMonth === month) {
      continue;
    }

    // Clamp day to last day of month (e.g. Feb 30 → Feb 28)
    const lastDay = new Date(year, month, 0).getDate();
    const day = Math.min(tmpl.dayOfMonth, lastDay);
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    await db.insert(transactions).values({
      userId,
      categoryId: tmpl.categoryId,
      type: tmpl.type,
      amount: tmpl.amount,
      description: tmpl.description,
      paymentMethod: tmpl.paymentMethod,
      expenseType: tmpl.expenseType,
      transactionDate: new Date(dateStr),
      notes: tmpl.notes,
      isInstallment: false,
      installmentGroupId: null,
      installmentNumber: null,
      totalInstallments: null,
    });

    // Update lastGenerated marker
    await db
      .update(recurringTransactions)
      .set({ lastGeneratedYear: year, lastGeneratedMonth: month })
      .where(eq(recurringTransactions.id, tmpl.id));

    generated++;
  }

  return generated;
}
