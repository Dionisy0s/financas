var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  categories: () => categories,
  familyGroups: () => familyGroups,
  familyInvites: () => familyInvites,
  familyMembers: () => familyMembers,
  investmentCategories: () => investmentCategories,
  investmentGoals: () => investmentGoals,
  investments: () => investments,
  notifications: () => notifications,
  pushSubscriptions: () => pushSubscriptions,
  recurringTransactions: () => recurringTransactions,
  transactions: () => transactions,
  userSettings: () => userSettings,
  users: () => users
});
import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  date
} from "drizzle-orm/mysql-core";
var users, familyGroups, familyMembers, familyInvites, categories, transactions, investmentCategories, investments, investmentGoals, userSettings, recurringTransactions, notifications, pushSubscriptions;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    familyGroups = mysqlTable("family_groups", {
      id: int("id").autoincrement().primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      ownerId: int("ownerId").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    familyMembers = mysqlTable("family_members", {
      id: int("id").autoincrement().primaryKey(),
      groupId: int("groupId").notNull(),
      userId: int("userId").notNull(),
      role: mysqlEnum("role", ["owner", "member"]).default("member").notNull(),
      joinedAt: timestamp("joinedAt").defaultNow().notNull()
    });
    familyInvites = mysqlTable("family_invites", {
      id: int("id").autoincrement().primaryKey(),
      groupId: int("groupId").notNull(),
      invitedByUserId: int("invitedByUserId").notNull(),
      inviteCode: varchar("inviteCode", { length: 64 }).notNull().unique(),
      email: varchar("email", { length: 320 }),
      status: mysqlEnum("status", ["pending", "accepted", "expired"]).default("pending").notNull(),
      expiresAt: timestamp("expiresAt").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    categories = mysqlTable("categories", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId"),
      // null = categoria padrão do sistema
      name: varchar("name", { length: 100 }).notNull(),
      icon: varchar("icon", { length: 50 }).default("tag"),
      color: varchar("color", { length: 20 }).default("#6366f1"),
      type: mysqlEnum("type", ["income", "expense", "both"]).default("both").notNull(),
      isDefault: boolean("isDefault").default(false).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    transactions = mysqlTable("transactions", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      categoryId: int("categoryId").notNull(),
      type: mysqlEnum("type", ["income", "expense"]).notNull(),
      amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
      description: varchar("description", { length: 500 }).notNull(),
      paymentMethod: mysqlEnum("paymentMethod", ["pix", "credit", "debit", "cash", "boleto"]).notNull(),
      expenseType: mysqlEnum("expenseType", ["fixed", "variable"]).default("variable").notNull(),
      transactionDate: date("transactionDate").notNull(),
      notes: text("notes"),
      // Para parcelamento
      installmentGroupId: varchar("installmentGroupId", { length: 64 }),
      // agrupa parcelas
      installmentNumber: int("installmentNumber"),
      // número da parcela atual
      totalInstallments: int("totalInstallments"),
      // total de parcelas
      isInstallment: boolean("isInstallment").default(false).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    investmentCategories = mysqlTable("investment_categories", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId"),
      // null = padrão do sistema
      name: varchar("name", { length: 100 }).notNull(),
      icon: varchar("icon", { length: 50 }).default("trending-up"),
      color: varchar("color", { length: 20 }).default("#10b981"),
      isDefault: boolean("isDefault").default(false).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    investments = mysqlTable("investments", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      categoryId: int("categoryId").notNull(),
      name: varchar("name", { length: 255 }).notNull(),
      amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
      investmentDate: date("investmentDate").notNull(),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    investmentGoals = mysqlTable("investment_goals", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      title: varchar("title", { length: 255 }).notNull(),
      targetAmount: decimal("targetAmount", { precision: 15, scale: 2 }).notNull(),
      period: mysqlEnum("period", ["monthly", "annual"]).default("monthly").notNull(),
      year: int("year").notNull(),
      month: int("month"),
      // null = meta anual
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    userSettings = mysqlTable("user_settings", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull().unique(),
      alertThresholdPercent: int("alertThresholdPercent").default(80),
      // % da renda para alertar
      monthlyIncomeEstimate: decimal("monthlyIncomeEstimate", { precision: 15, scale: 2 }),
      emailNotifications: boolean("emailNotifications").default(true).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    recurringTransactions = mysqlTable("recurring_transactions", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      categoryId: int("categoryId").notNull(),
      type: mysqlEnum("type", ["income", "expense"]).notNull(),
      amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
      description: varchar("description", { length: 500 }).notNull(),
      paymentMethod: mysqlEnum("paymentMethod", ["pix", "credit", "debit", "cash", "boleto"]).notNull(),
      expenseType: mysqlEnum("expenseType", ["fixed", "variable"]).default("fixed").notNull(),
      dayOfMonth: int("dayOfMonth").notNull(),
      // dia do mês em que ocorre (1-28)
      notes: text("notes"),
      isActive: boolean("isActive").default(true).notNull(),
      lastGeneratedYear: int("lastGeneratedYear"),
      lastGeneratedMonth: int("lastGeneratedMonth"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    notifications = mysqlTable("notifications", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      title: varchar("title", { length: 255 }).notNull(),
      body: text("body").notNull(),
      type: mysqlEnum("type", [
        "alert",
        // gasto ultrapassou limite
        "goal",
        // meta atingida
        "recurring",
        // recorrência gerada
        "summary",
        // resumo mensal
        "reminder",
        // lembrete de conta
        "info"
        // informação geral
      ]).default("info").notNull(),
      isRead: boolean("isRead").default(false).notNull(),
      link: varchar("link", { length: 255 }),
      // rota interna opcional
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    pushSubscriptions = mysqlTable("push_subscriptions", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      endpoint: text("endpoint").notNull(),
      p256dh: text("p256dh").notNull(),
      auth: text("auth").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      ownerName: process.env.OWNER_NAME ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? "",
      vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? ""
    };
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  acceptFamilyInvite: () => acceptFamilyInvite,
  createCategory: () => createCategory,
  createFamilyGroup: () => createFamilyGroup,
  createFamilyInvite: () => createFamilyInvite,
  createInvestment: () => createInvestment,
  createRecurringTransaction: () => createRecurringTransaction,
  createTransaction: () => createTransaction,
  createTransactions: () => createTransactions,
  deleteCategory: () => deleteCategory,
  deleteInstallmentGroup: () => deleteInstallmentGroup,
  deleteInvestment: () => deleteInvestment,
  deleteRecurringTransaction: () => deleteRecurringTransaction,
  deleteTransaction: () => deleteTransaction,
  generateRecurringForMonth: () => generateRecurringForMonth,
  getAllTransactionsForUser: () => getAllTransactionsForUser,
  getCategoriesForUser: () => getCategoriesForUser,
  getDb: () => getDb,
  getFamilyGroupForUser: () => getFamilyGroupForUser,
  getInvestmentCategoriesForUser: () => getInvestmentCategoriesForUser,
  getInvestmentGoalsForUser: () => getInvestmentGoalsForUser,
  getInvestmentsForUser: () => getInvestmentsForUser,
  getMonthlyTransactionsByUserIds: () => getMonthlyTransactionsByUserIds,
  getRecurringTransactionsForUser: () => getRecurringTransactionsForUser,
  getTransactionHistoryForUser: () => getTransactionHistoryForUser,
  getTransactions: () => getTransactions,
  getTransactionsByUserIds: () => getTransactionsByUserIds,
  getUserById: () => getUserById,
  getUserByOpenId: () => getUserByOpenId,
  getUserSettings: () => getUserSettings,
  updateCategory: () => updateCategory,
  updateInvestment: () => updateInvestment,
  updateRecurringTransaction: () => updateRecurringTransaction,
  updateTransaction: () => updateTransaction,
  upsertInvestmentGoal: () => upsertInvestmentGoal,
  upsertUser: () => upsertUser,
  upsertUserSettings: () => upsertUserSettings
});
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
async function getDb() {
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
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values = { openId: user.openId };
  const updateSet = {};
  const textFields = ["name", "email", "loginMethod"];
  const assignNullable = (field) => {
    const value = user[field];
    if (value === void 0) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== void 0) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== void 0) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getCategoriesForUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(or(isNull(categories.userId), eq(categories.userId, userId))).orderBy(categories.name);
}
async function createCategory(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(categories).values(data);
  const id = result[0]?.insertId ?? result.insertId;
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return rows[0];
}
async function updateCategory(id, userId, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(categories).set(data).where(and(eq(categories.id, id), eq(categories.userId, userId)));
}
async function deleteCategory(id, userId) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
}
async function getTransactions(userId, filters) {
  const db = await getDb();
  if (!db) return [];
  const startDate = `${filters.year}-${String(filters.month).padStart(2, "0")}-01`;
  const endDate = `${filters.year}-${String(filters.month).padStart(2, "0")}-31`;
  return db.select().from(transactions).where(
    and(
      eq(transactions.userId, userId),
      sql`${transactions.transactionDate} >= ${startDate}`,
      sql`${transactions.transactionDate} <= ${endDate}`
    )
  ).orderBy(desc(transactions.transactionDate));
}
async function getTransactionsByUserIds(userIds, filters) {
  const db = await getDb();
  if (!db) return [];
  const startDate = `${filters.year}-${String(filters.month).padStart(2, "0")}-01`;
  const endDate = `${filters.year}-${String(filters.month).padStart(2, "0")}-31`;
  const conditions = userIds.map((id) => eq(transactions.userId, id));
  return db.select().from(transactions).where(
    and(
      or(...conditions),
      sql`${transactions.transactionDate} >= ${startDate}`,
      sql`${transactions.transactionDate} <= ${endDate}`
    )
  ).orderBy(desc(transactions.transactionDate));
}
async function getAllTransactionsForUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.transactionDate));
}
async function createTransaction(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(transactions).values(data);
  const id = result[0]?.insertId ?? result.insertId;
  const rows = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
  return rows[0];
}
async function createTransactions(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(transactions).values(data);
}
async function updateTransaction(id, userId, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(transactions).set(data).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
}
async function deleteTransaction(id, userId) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
}
async function deleteInstallmentGroup(groupId, userId) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(transactions).where(
    and(eq(transactions.installmentGroupId, groupId), eq(transactions.userId, userId))
  );
}
async function getInvestmentCategoriesForUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(investmentCategories).where(
    or(isNull(investmentCategories.userId), eq(investmentCategories.userId, userId))
  ).orderBy(investmentCategories.name);
}
async function getInvestmentsForUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(investments).where(eq(investments.userId, userId)).orderBy(desc(investments.investmentDate));
}
async function createInvestment(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(investments).values(data);
  const id = result[0]?.insertId ?? result.insertId;
  const rows = await db.select().from(investments).where(eq(investments.id, id)).limit(1);
  return rows[0];
}
async function updateInvestment(id, userId, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(investments).set(data).where(and(eq(investments.id, id), eq(investments.userId, userId)));
}
async function deleteInvestment(id, userId) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(investments).where(and(eq(investments.id, id), eq(investments.userId, userId)));
}
async function getInvestmentGoalsForUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(investmentGoals).where(eq(investmentGoals.userId, userId)).orderBy(desc(investmentGoals.year));
}
async function upsertInvestmentGoal(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(investmentGoals).values(data).onDuplicateKeyUpdate({
    set: { targetAmount: data.targetAmount, title: data.title }
  });
}
async function getUserSettings(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function upsertUserSettings(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(userSettings).values({ userId, ...data }).onDuplicateKeyUpdate({ set: data });
}
async function getFamilyGroupForUser(userId) {
  const db = await getDb();
  if (!db) return null;
  const memberRows = await db.select().from(familyMembers).where(eq(familyMembers.userId, userId)).limit(1);
  if (memberRows.length === 0) return null;
  const groupRows = await db.select().from(familyGroups).where(eq(familyGroups.id, memberRows[0].groupId)).limit(1);
  if (groupRows.length === 0) return null;
  const allMembers = await db.select().from(familyMembers).where(eq(familyMembers.groupId, groupRows[0].id));
  return { group: groupRows[0], members: allMembers };
}
async function createFamilyGroup(ownerId, name) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(familyGroups).values({ ownerId, name });
  const id = result[0]?.insertId ?? result.insertId;
  await db.insert(familyMembers).values({ groupId: id, userId: ownerId, role: "owner" });
  const rows = await db.select().from(familyGroups).where(eq(familyGroups.id, id)).limit(1);
  return rows[0];
}
async function createFamilyInvite(groupId, invitedByUserId, inviteCode) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
  await db.insert(familyInvites).values({ groupId, invitedByUserId, inviteCode, expiresAt });
}
async function acceptFamilyInvite(inviteCode, userId) {
  const db = await getDb();
  if (!db) return { success: false };
  const inviteRows = await db.select().from(familyInvites).where(
    and(
      eq(familyInvites.inviteCode, inviteCode),
      eq(familyInvites.status, "pending")
    )
  ).limit(1);
  if (inviteRows.length === 0) return { success: false };
  const invite = inviteRows[0];
  if (invite.expiresAt < /* @__PURE__ */ new Date()) return { success: false };
  const existingMember = await db.select().from(familyMembers).where(
    and(
      eq(familyMembers.groupId, invite.groupId),
      eq(familyMembers.userId, userId)
    )
  ).limit(1);
  if (existingMember.length === 0) {
    await db.insert(familyMembers).values({ groupId: invite.groupId, userId, role: "member" });
  }
  await db.update(familyInvites).set({ status: "accepted" }).where(eq(familyInvites.id, invite.id));
  return { success: true, groupId: invite.groupId };
}
async function getMonthlyTransactionsByUserIds(userIds, year, month) {
  return getTransactionsByUserIds(userIds, { year, month });
}
async function getTransactionHistoryForUser(userId, months = 6) {
  const db = await getDb();
  if (!db) return [];
  const cutoff = /* @__PURE__ */ new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  return db.select().from(transactions).where(
    and(
      eq(transactions.userId, userId),
      sql`${transactions.transactionDate} >= ${cutoffStr}`
    )
  ).orderBy(desc(transactions.transactionDate));
}
async function getRecurringTransactionsForUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recurringTransactions).where(eq(recurringTransactions.userId, userId)).orderBy(desc(recurringTransactions.createdAt));
}
async function createRecurringTransaction(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(recurringTransactions).values(data);
  const id = result[0]?.insertId ?? result.insertId;
  const rows = await db.select().from(recurringTransactions).where(eq(recurringTransactions.id, id)).limit(1);
  return rows[0];
}
async function updateRecurringTransaction(id, userId, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(recurringTransactions).set(data).where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)));
}
async function deleteRecurringTransaction(id, userId) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(recurringTransactions).where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)));
}
async function generateRecurringForMonth(userId, year, month) {
  const db = await getDb();
  if (!db) return 0;
  const templates = await db.select().from(recurringTransactions).where(
    and(
      eq(recurringTransactions.userId, userId),
      eq(recurringTransactions.isActive, true)
    )
  );
  let generated = 0;
  for (const tmpl of templates) {
    if (tmpl.lastGeneratedYear === year && tmpl.lastGeneratedMonth === month) {
      continue;
    }
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
      totalInstallments: null
    });
    await db.update(recurringTransactions).set({ lastGeneratedYear: year, lastGeneratedMonth: month }).where(eq(recurringTransactions.id, tmpl.id));
    generated++;
  }
  return generated;
}
var _db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    _db = null;
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
init_db();

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/routers.ts
init_db();
import { nanoid } from "nanoid";
import { z as z2 } from "zod";

// server/_core/llm.ts
init_env();
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/notifications.ts
init_db();
init_schema();
init_env();
import webpush from "web-push";
import { and as and2, desc as desc2, eq as eq2 } from "drizzle-orm";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/notifications.ts
async function createNotification(data) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(notifications).values(data);
  const id = result[0]?.insertId ?? result.insertId;
  const rows = await db.select().from(notifications).where(eq2(notifications.id, id)).limit(1);
  return rows[0] ?? null;
}
async function getNotificationsForUser(userId, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq2(notifications.userId, userId)).orderBy(desc2(notifications.createdAt)).limit(limit);
}
async function countUnreadNotifications(userId) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select().from(notifications).where(and2(eq2(notifications.userId, userId), eq2(notifications.isRead, false)));
  return rows.length;
}
async function markNotificationRead(id, userId) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(and2(eq2(notifications.id, id), eq2(notifications.userId, userId)));
}
async function markAllNotificationsRead(userId) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(and2(eq2(notifications.userId, userId), eq2(notifications.isRead, false)));
}
async function deleteNotification(id, userId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(notifications).where(and2(eq2(notifications.id, id), eq2(notifications.userId, userId)));
}
async function deleteAllNotifications(userId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(notifications).where(eq2(notifications.userId, userId));
}
async function savePushSubscription(userId, endpoint, p256dh, auth) {
  const db = await getDb();
  if (!db) return;
  await db.delete(pushSubscriptions).where(and2(eq2(pushSubscriptions.userId, userId), eq2(pushSubscriptions.endpoint, endpoint)));
  await db.insert(pushSubscriptions).values({ userId, endpoint, p256dh, auth });
}
async function removePushSubscription(userId, endpoint) {
  const db = await getDb();
  if (!db) return;
  await db.delete(pushSubscriptions).where(and2(eq2(pushSubscriptions.userId, userId), eq2(pushSubscriptions.endpoint, endpoint)));
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
function calcDashboard(txs, categories2) {
  const catMap = new Map(categories2.map((c) => [c.id, c]));
  let totalIncome = 0;
  let totalExpense = 0;
  let fixedExpense = 0;
  let variableExpense = 0;
  const byCategory = {};
  const byDay = {};
  for (const t2 of txs) {
    const amount = parseFloat(t2.amount);
    const cat = catMap.get(t2.categoryId) ?? { name: "Outros", color: "#6b7280", icon: "tag" };
    if (!byCategory[t2.categoryId]) {
      byCategory[t2.categoryId] = { name: cat.name, color: cat.color, icon: cat.icon, income: 0, expense: 0 };
    }
    const day = typeof t2.transactionDate === "string" ? t2.transactionDate : t2.transactionDate?.toISOString?.()?.split("T")[0] ?? "";
    if (!byDay[day]) byDay[day] = { income: 0, expense: 0 };
    if (t2.type === "income") {
      totalIncome += amount;
      byCategory[t2.categoryId].income += amount;
      byDay[day].income += amount;
    } else {
      totalExpense += amount;
      byCategory[t2.categoryId].expense += amount;
      byDay[day].expense += amount;
      if (t2.expenseType === "fixed") fixedExpense += amount;
      else variableExpense += amount;
    }
  }
  const balance = totalIncome - totalExpense;
  const categoryBreakdown = Object.entries(byCategory).map(([id, v]) => ({
    categoryId: Number(id),
    ...v,
    total: v.income + v.expense
  }));
  const dailyEvolution = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date2, v]) => ({ date: date2, ...v }));
  return {
    totalIncome,
    totalExpense,
    balance,
    fixedExpense,
    variableExpense,
    categoryBreakdown,
    dailyEvolution
  };
}
var DEFAULT_CATEGORIES = [
  { name: "Sal\xE1rio", icon: "briefcase", color: "#10b981", type: "income", isDefault: true },
  { name: "Renda Extra", icon: "plus-circle", color: "#06b6d4", type: "income", isDefault: true },
  { name: "Investimentos", icon: "trending-up", color: "#8b5cf6", type: "income", isDefault: true },
  { name: "Alimenta\xE7\xE3o", icon: "utensils", color: "#f59e0b", type: "expense", isDefault: true },
  { name: "Moradia", icon: "home", color: "#ef4444", type: "expense", isDefault: true },
  { name: "Transporte", icon: "car", color: "#3b82f6", type: "expense", isDefault: true },
  { name: "Sa\xFAde", icon: "heart", color: "#ec4899", type: "expense", isDefault: true },
  { name: "Educa\xE7\xE3o", icon: "book", color: "#6366f1", type: "expense", isDefault: true },
  { name: "Lazer", icon: "smile", color: "#f97316", type: "expense", isDefault: true },
  { name: "Vestu\xE1rio", icon: "shirt", color: "#84cc16", type: "expense", isDefault: true },
  { name: "Assinaturas", icon: "repeat", color: "#a855f7", type: "expense", isDefault: true },
  { name: "Outros", icon: "tag", color: "#6b7280", type: "both", isDefault: true }
];
var DEFAULT_INVESTMENT_CATEGORIES = [
  { name: "Renda Fixa", icon: "shield", color: "#10b981", isDefault: true },
  { name: "Renda Vari\xE1vel", icon: "trending-up", color: "#3b82f6", isDefault: true },
  { name: "Criptomoedas", icon: "bitcoin", color: "#f59e0b", isDefault: true },
  { name: "Fundos Imobili\xE1rios", icon: "building", color: "#8b5cf6", isDefault: true },
  { name: "Previd\xEAncia", icon: "umbrella", color: "#06b6d4", isDefault: true },
  { name: "Poupan\xE7a", icon: "piggy-bank", color: "#ec4899", isDefault: true },
  { name: "A\xE7\xF5es", icon: "bar-chart-2", color: "#ef4444", isDefault: true },
  { name: "Outros", icon: "wallet", color: "#6b7280", isDefault: true }
];
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  // ─── Categories ─────────────────────────────────────────────────────────────
  categories: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const cats = await getCategoriesForUser(ctx.user.id);
      if (cats.length === 0) {
        for (const cat of DEFAULT_CATEGORIES) {
          await createCategory({ ...cat, userId: null });
        }
        return getCategoriesForUser(ctx.user.id);
      }
      return cats;
    }),
    create: protectedProcedure.input(
      z2.object({
        name: z2.string().min(1).max(100),
        icon: z2.string().default("tag"),
        color: z2.string().default("#6366f1"),
        type: z2.enum(["income", "expense", "both"]).default("both")
      })
    ).mutation(async ({ ctx, input }) => {
      return createCategory({ ...input, userId: ctx.user.id, isDefault: false });
    }),
    update: protectedProcedure.input(
      z2.object({
        id: z2.number(),
        name: z2.string().min(1).max(100).optional(),
        icon: z2.string().optional(),
        color: z2.string().optional(),
        type: z2.enum(["income", "expense", "both"]).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateCategory(id, ctx.user.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      await deleteCategory(input.id, ctx.user.id);
      return { success: true };
    })
  }),
  // ─── Transactions ────────────────────────────────────────────────────────────
  transactions: router({
    list: protectedProcedure.input(z2.object({ year: z2.number(), month: z2.number() })).query(async ({ ctx, input }) => {
      return getTransactions(ctx.user.id, input);
    }),
    create: protectedProcedure.input(
      z2.object({
        categoryId: z2.number(),
        type: z2.enum(["income", "expense"]),
        amount: z2.number().positive(),
        description: z2.string().min(1).max(500),
        paymentMethod: z2.enum(["pix", "credit", "debit", "cash", "boleto"]),
        expenseType: z2.enum(["fixed", "variable"]).default("variable"),
        transactionDate: z2.string(),
        notes: z2.string().optional(),
        installments: z2.number().int().min(1).max(48).default(1)
      })
    ).mutation(async ({ ctx, input }) => {
      const { installments, amount, transactionDate, ...rest } = input;
      if (installments > 1 && input.paymentMethod === "credit") {
        const groupId = nanoid();
        const installmentAmount = amount / installments;
        const baseDate = /* @__PURE__ */ new Date(transactionDate + "T12:00:00");
        const records = Array.from({ length: installments }, (_, i) => {
          const d = new Date(baseDate);
          d.setMonth(d.getMonth() + i);
          return {
            ...rest,
            userId: ctx.user.id,
            amount: installmentAmount.toFixed(2),
            transactionDate: d,
            installmentGroupId: groupId,
            installmentNumber: i + 1,
            totalInstallments: installments,
            isInstallment: true,
            description: `${rest.description} (${i + 1}/${installments})`
          };
        });
        await createTransactions(records);
        return { success: true, installments };
      }
      await createTransaction({
        ...rest,
        userId: ctx.user.id,
        amount: amount.toFixed(2),
        transactionDate,
        isInstallment: false
      });
      return { success: true, installments: 1 };
    }),
    update: protectedProcedure.input(
      z2.object({
        id: z2.number(),
        categoryId: z2.number().optional(),
        type: z2.enum(["income", "expense"]).optional(),
        amount: z2.number().positive().optional(),
        description: z2.string().min(1).max(500).optional(),
        paymentMethod: z2.enum(["pix", "credit", "debit", "cash", "boleto"]).optional(),
        expenseType: z2.enum(["fixed", "variable"]).optional(),
        transactionDate: z2.string().optional(),
        notes: z2.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const { id, amount, ...rest } = input;
      const data = { ...rest };
      if (amount !== void 0) data.amount = amount.toFixed(2);
      await updateTransaction(id, ctx.user.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number(), deleteGroup: z2.boolean().default(false) })).mutation(async ({ ctx, input }) => {
      if (input.deleteGroup) {
        const txs = await getAllTransactionsForUser(ctx.user.id);
        const tx = txs.find((t2) => t2.id === input.id);
        if (tx?.installmentGroupId) {
          await deleteInstallmentGroup(tx.installmentGroupId, ctx.user.id);
          return { success: true };
        }
      }
      await deleteTransaction(input.id, ctx.user.id);
      return { success: true };
    })
  }),
  // ─── Dashboard ───────────────────────────────────────────────────────────────
  dashboard: router({
    monthly: protectedProcedure.input(z2.object({ year: z2.number(), month: z2.number(), consolidated: z2.boolean().default(false) })).query(async ({ ctx, input }) => {
      let userIds = [ctx.user.id];
      if (input.consolidated) {
        const family = await getFamilyGroupForUser(ctx.user.id);
        if (family) {
          userIds = family.members.map((m) => m.userId);
        }
      }
      const txs = await getMonthlyTransactionsByUserIds(userIds, input.year, input.month);
      const cats = await getCategoriesForUser(ctx.user.id);
      const result = calcDashboard(txs, cats);
      let perUser;
      if (input.consolidated && userIds.length > 1) {
        perUser = {};
        for (const uid of userIds) {
          const userTxs = txs.filter((t2) => t2.userId === uid);
          perUser[uid] = calcDashboard(userTxs, cats);
        }
      }
      return { ...result, userIds, perUser: perUser ?? null };
    }),
    history: protectedProcedure.input(z2.object({ months: z2.number().default(6) })).query(async ({ ctx, input }) => {
      const txs = await getTransactionHistoryForUser(ctx.user.id, input.months);
      const byMonth = {};
      for (const t2 of txs) {
        const dateStr = typeof t2.transactionDate === "string" ? t2.transactionDate : t2.transactionDate?.toISOString?.()?.split("T")[0] ?? "";
        const key = dateStr.substring(0, 7);
        if (!byMonth[key]) byMonth[key] = { income: 0, expense: 0, balance: 0 };
        const amount = parseFloat(t2.amount);
        if (t2.type === "income") byMonth[key].income += amount;
        else byMonth[key].expense += amount;
      }
      return Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v, balance: v.income - v.expense }));
    })
  }),
  // ─── Investments ─────────────────────────────────────────────────────────────
  investments: router({
    categories: protectedProcedure.query(async ({ ctx }) => {
      const cats = await getInvestmentCategoriesForUser(ctx.user.id);
      if (cats.length === 0) {
        const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
        const { investmentCategories: investmentCategories2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const db = await getDb2();
        if (db) {
          await db.insert(investmentCategories2).values(DEFAULT_INVESTMENT_CATEGORIES);
        }
        return getInvestmentCategoriesForUser(ctx.user.id);
      }
      return cats;
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      return getInvestmentsForUser(ctx.user.id);
    }),
    create: protectedProcedure.input(
      z2.object({
        categoryId: z2.number(),
        name: z2.string().min(1).max(255),
        amount: z2.number().positive(),
        investmentDate: z2.string(),
        notes: z2.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      return createInvestment({
        ...input,
        userId: ctx.user.id,
        amount: input.amount.toFixed(2),
        investmentDate: input.investmentDate
      });
    }),
    update: protectedProcedure.input(
      z2.object({
        id: z2.number(),
        categoryId: z2.number().optional(),
        name: z2.string().min(1).max(255).optional(),
        amount: z2.number().positive().optional(),
        investmentDate: z2.string().optional(),
        notes: z2.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const { id, amount, ...rest } = input;
      const data = { ...rest };
      if (amount !== void 0) data.amount = amount.toFixed(2);
      await updateInvestment(id, ctx.user.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      await deleteInvestment(input.id, ctx.user.id);
      return { success: true };
    }),
    goals: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        return getInvestmentGoalsForUser(ctx.user.id);
      }),
      upsert: protectedProcedure.input(
        z2.object({
          title: z2.string().min(1),
          targetAmount: z2.number().positive(),
          period: z2.enum(["monthly", "annual"]),
          year: z2.number(),
          month: z2.number().optional()
        })
      ).mutation(async ({ ctx, input }) => {
        await upsertInvestmentGoal({
          ...input,
          userId: ctx.user.id,
          targetAmount: input.targetAmount.toFixed(2)
        });
        return { success: true };
      })
    })
  }),
  // ─── Family / Consolidated ───────────────────────────────────────────────────
  family: router({
    info: protectedProcedure.query(async ({ ctx }) => {
      const family = await getFamilyGroupForUser(ctx.user.id);
      if (!family) return null;
      const members = await Promise.all(
        family.members.map(async (m) => {
          const user = await getUserById(m.userId);
          return { ...m, user: user ? { id: user.id, name: user.name, email: user.email } : null };
        })
      );
      return { group: family.group, members };
    }),
    create: protectedProcedure.input(z2.object({ name: z2.string().min(1) })).mutation(async ({ ctx, input }) => {
      const existing = await getFamilyGroupForUser(ctx.user.id);
      if (existing) throw new Error("Voc\xEA j\xE1 faz parte de um grupo familiar");
      const group = await createFamilyGroup(ctx.user.id, input.name);
      return group;
    }),
    invite: protectedProcedure.input(z2.object({ origin: z2.string() })).mutation(async ({ ctx, input }) => {
      const family = await getFamilyGroupForUser(ctx.user.id);
      if (!family) throw new Error("Crie um grupo familiar primeiro");
      const code = nanoid(12);
      await createFamilyInvite(family.group.id, ctx.user.id, code);
      return { inviteUrl: `${input.origin}/convite/${code}` };
    }),
    join: protectedProcedure.input(z2.object({ inviteCode: z2.string() })).mutation(async ({ ctx, input }) => {
      const result = await acceptFamilyInvite(input.inviteCode, ctx.user.id);
      if (!result.success) throw new Error("Convite inv\xE1lido ou expirado");
      return result;
    })
  }),
  // ─── Settings ────────────────────────────────────────────────────────────────
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getUserSettings(ctx.user.id);
    }),
    update: protectedProcedure.input(
      z2.object({
        alertThresholdPercent: z2.number().min(1).max(100).optional(),
        monthlyIncomeEstimate: z2.number().positive().optional(),
        emailNotifications: z2.boolean().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const data = {};
      if (input.alertThresholdPercent !== void 0)
        data.alertThresholdPercent = input.alertThresholdPercent;
      if (input.monthlyIncomeEstimate !== void 0)
        data.monthlyIncomeEstimate = input.monthlyIncomeEstimate.toFixed(2);
      if (input.emailNotifications !== void 0)
        data.emailNotifications = input.emailNotifications;
      await upsertUserSettings(ctx.user.id, data);
      return { success: true };
    })
  }),
  // ─── Offline Sync ──────────────────────────────────────────────────────────────
  sync: router({
    /**
     * Batch sync endpoint: receives an array of queued operations and processes them.
     * Returns per-operation results so the client can remove successfully processed items.
     */
    batch: protectedProcedure.input(
      z2.object({
        operations: z2.array(
          z2.object({
            localId: z2.string().optional(),
            procedure: z2.string(),
            input: z2.unknown(),
            enqueuedAt: z2.number()
          })
        )
      })
    ).mutation(async ({ ctx, input }) => {
      const results = [];
      for (const op of input.operations) {
        try {
          switch (op.procedure) {
            case "transactions.create": {
              const data = op.input;
              const cats = await getCategoriesForUser(ctx.user.id);
              const categoryExists = cats.some((c) => c.id === data.categoryId);
              if (!categoryExists) throw new Error("Categoria n\xE3o encontrada");
              const txDate = new Date(data.transactionDate);
              const installments = data.installments ?? 1;
              if (installments > 1 && data.paymentMethod === "credit") {
                const groupId = nanoid();
                const txList = [];
                for (let i = 0; i < installments; i++) {
                  const d = new Date(txDate);
                  d.setMonth(d.getMonth() + i);
                  txList.push({
                    userId: ctx.user.id,
                    description: `${data.description} (${i + 1}/${installments})`,
                    amount: (data.amount / installments).toFixed(2),
                    type: data.type,
                    categoryId: data.categoryId,
                    paymentMethod: data.paymentMethod,
                    expenseType: data.expenseType ?? "variable",
                    transactionDate: d,
                    notes: data.notes ?? null,
                    isInstallment: true,
                    installmentNumber: i + 1,
                    totalInstallments: installments,
                    installmentGroupId: groupId
                  });
                }
                await createTransactions(txList);
              } else {
                await createTransaction({
                  userId: ctx.user.id,
                  description: data.description,
                  amount: data.amount.toFixed(2),
                  type: data.type,
                  categoryId: data.categoryId,
                  paymentMethod: data.paymentMethod,
                  expenseType: data.expenseType ?? "variable",
                  transactionDate: new Date(data.transactionDate),
                  notes: data.notes ?? null,
                  isInstallment: false,
                  installmentNumber: null,
                  totalInstallments: null,
                  installmentGroupId: null
                });
              }
              results.push({ localId: op.localId, success: true });
              break;
            }
            case "transactions.delete": {
              const data = op.input;
              if (data.deleteGroup && data.id) {
                await deleteInstallmentGroup(data.id, ctx.user.id);
              } else if (data.id) {
                await deleteTransaction(data.id, ctx.user.id);
              }
              results.push({ localId: op.localId, success: true });
              break;
            }
            default:
              results.push({ localId: op.localId, success: false, error: `Unknown procedure: ${op.procedure}` });
          }
        } catch (err) {
          results.push({ localId: op.localId, success: false, error: err?.message ?? "Unknown error" });
        }
      }
      return { results };
    })
  }),
  // ─── Recurring Transactions ──────────────────────────────────────────────────
  recurring: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getRecurringTransactionsForUser(ctx.user.id);
    }),
    create: protectedProcedure.input(z2.object({
      description: z2.string().min(1),
      amount: z2.number().positive(),
      type: z2.enum(["income", "expense"]),
      categoryId: z2.number().int().positive(),
      paymentMethod: z2.enum(["pix", "credit", "debit", "cash", "boleto"]),
      expenseType: z2.enum(["fixed", "variable"]).default("fixed"),
      dayOfMonth: z2.number().int().min(1).max(28),
      notes: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      return createRecurringTransaction({
        userId: ctx.user.id,
        categoryId: input.categoryId,
        type: input.type,
        amount: String(input.amount),
        description: input.description,
        paymentMethod: input.paymentMethod,
        expenseType: input.expenseType,
        dayOfMonth: input.dayOfMonth,
        notes: input.notes ?? null,
        isActive: true
      });
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number().int().positive(),
      description: z2.string().min(1).optional(),
      amount: z2.number().positive().optional(),
      categoryId: z2.number().int().positive().optional(),
      paymentMethod: z2.enum(["pix", "credit", "debit", "cash", "boleto"]).optional(),
      expenseType: z2.enum(["fixed", "variable"]).optional(),
      dayOfMonth: z2.number().int().min(1).max(28).optional(),
      notes: z2.string().optional(),
      isActive: z2.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updateData = { ...data };
      if (data.amount !== void 0) updateData.amount = String(data.amount);
      await updateRecurringTransaction(id, ctx.user.id, updateData);
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await deleteRecurringTransaction(input.id, ctx.user.id);
      return { success: true };
    }),
    generate: protectedProcedure.input(z2.object({ year: z2.number().int(), month: z2.number().int().min(1).max(12) })).mutation(async ({ ctx, input }) => {
      const count = await generateRecurringForMonth(ctx.user.id, input.year, input.month);
      return { generated: count };
    })
  }),
  // ─── AI Insights ─────────────────────────────────────────────────────────────
  insights: router({
    analyze: protectedProcedure.input(z2.object({ year: z2.number(), month: z2.number() })).mutation(async ({ ctx, input }) => {
      const txs = await getTransactions(ctx.user.id, input);
      const cats = await getCategoriesForUser(ctx.user.id);
      const settings = await getUserSettings(ctx.user.id);
      const dashboard = calcDashboard(txs, cats);
      const monthName = new Date(input.year, input.month - 1, 1).toLocaleString("pt-BR", { month: "long" });
      const catSummary = dashboard.categoryBreakdown.filter((c) => c.expense > 0).sort((a, b) => b.expense - a.expense).slice(0, 5).map((c) => `${c.name}: R$ ${c.expense.toFixed(2)}`).join(", ");
      const incomeEstimate = settings?.monthlyIncomeEstimate ? parseFloat(settings.monthlyIncomeEstimate) : dashboard.totalIncome;
      const commitPercent = incomeEstimate > 0 ? (dashboard.totalExpense / incomeEstimate * 100).toFixed(1) : "N/A";
      const prompt = `Voc\xEA \xE9 um consultor financeiro pessoal especialista. Analise os dados financeiros de ${monthName}/${input.year} e forne\xE7a uma an\xE1lise detalhada em portugu\xEAs brasileiro.

Dados do m\xEAs:
- Total de Entradas: R$ ${dashboard.totalIncome.toFixed(2)}
- Total de Sa\xEDdas: R$ ${dashboard.totalExpense.toFixed(2)}
- Saldo: R$ ${dashboard.balance.toFixed(2)}
- Gastos Fixos: R$ ${dashboard.fixedExpense.toFixed(2)}
- Gastos Vari\xE1veis: R$ ${dashboard.variableExpense.toFixed(2)}
- Percentual comprometido da renda: ${commitPercent}%
- Principais categorias de gasto: ${catSummary || "Nenhum gasto registrado"}

Forne\xE7a:
1. Uma an\xE1lise do comportamento financeiro do m\xEAs (2-3 par\xE1grafos)
2. Os pontos positivos e negativos
3. 3 sugest\xF5es pr\xE1ticas de economia ou melhoria
4. Uma previs\xE3o ou alerta para o pr\xF3ximo m\xEAs

Seja direto, pr\xE1tico e use linguagem acess\xEDvel. Formate com markdown.`;
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "Voc\xEA \xE9 um consultor financeiro pessoal especialista em finan\xE7as pessoais brasileiras. Responda sempre em portugu\xEAs do Brasil." },
          { role: "user", content: prompt }
        ]
      });
      const rawContent = response.choices?.[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : "N\xE3o foi poss\xEDvel gerar an\xE1lise.";
      return { analysis: content, month: monthName, year: input.year };
    })
  }),
  notifications: router({
    // Listar notificações do usuário
    list: protectedProcedure.input(z2.object({ limit: z2.number().min(1).max(100).optional() }).optional()).query(async ({ ctx, input }) => {
      return getNotificationsForUser(ctx.user.id, input?.limit ?? 50);
    }),
    // Contar não lidas
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      const count = await countUnreadNotifications(ctx.user.id);
      return { count };
    }),
    // Marcar uma como lida
    markRead: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      await markNotificationRead(input.id, ctx.user.id);
      return { success: true };
    }),
    // Marcar todas como lidas
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),
    // Deletar uma notificação
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      await deleteNotification(input.id, ctx.user.id);
      return { success: true };
    }),
    // Deletar todas as notificações
    deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
      await deleteAllNotifications(ctx.user.id);
      return { success: true };
    }),
    // Criar notificação manual (para testes)
    create: protectedProcedure.input(z2.object({
      title: z2.string().min(1),
      body: z2.string().min(1),
      type: z2.enum(["alert", "goal", "recurring", "summary", "reminder", "info"]).optional(),
      link: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      return createNotification({
        userId: ctx.user.id,
        title: input.title,
        body: input.body,
        type: input.type ?? "info",
        link: input.link ?? null,
        isRead: false
      });
    }),
    // Salvar push subscription
    subscribePush: protectedProcedure.input(z2.object({
      endpoint: z2.string(),
      p256dh: z2.string(),
      auth: z2.string()
    })).mutation(async ({ ctx, input }) => {
      await savePushSubscription(ctx.user.id, input.endpoint, input.p256dh, input.auth);
      return { success: true };
    }),
    // Remover push subscription
    unsubscribePush: protectedProcedure.input(z2.object({ endpoint: z2.string() })).mutation(async ({ ctx, input }) => {
      await removePushSubscription(ctx.user.id, input.endpoint);
      return { success: true };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid as nanoid2 } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  base: "/financas/",
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: "dist",
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid2()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
