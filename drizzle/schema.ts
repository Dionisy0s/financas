import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  date,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Grupos familiares para visão consolidada
export const familyGroups = mysqlTable("family_groups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerId: int("ownerId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FamilyGroup = typeof familyGroups.$inferSelect;

// Membros do grupo familiar
export const familyMembers = mysqlTable("family_members", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "member"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type FamilyMember = typeof familyMembers.$inferSelect;

// Convites para grupo familiar
export const familyInvites = mysqlTable("family_invites", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  invitedByUserId: int("invitedByUserId").notNull(),
  inviteCode: varchar("inviteCode", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 320 }),
  status: mysqlEnum("status", ["pending", "accepted", "expired"]).default("pending").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FamilyInvite = typeof familyInvites.$inferSelect;

// Categorias de transações
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // null = categoria padrão do sistema
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }).default("tag"),
  color: varchar("color", { length: 20 }).default("#6366f1"),
  type: mysqlEnum("type", ["income", "expense", "both"]).default("both").notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// Transações financeiras
export const transactions = mysqlTable("transactions", {
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
  installmentGroupId: varchar("installmentGroupId", { length: 64 }), // agrupa parcelas
  installmentNumber: int("installmentNumber"), // número da parcela atual
  totalInstallments: int("totalInstallments"), // total de parcelas
  isInstallment: boolean("isInstallment").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// Categorias de investimentos
export const investmentCategories = mysqlTable("investment_categories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // null = padrão do sistema
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }).default("trending-up"),
  color: varchar("color", { length: 20 }).default("#10b981"),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvestmentCategory = typeof investmentCategories.$inferSelect;

// Investimentos
export const investments = mysqlTable("investments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  investmentDate: date("investmentDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = typeof investments.$inferInsert;

// Metas de investimento
export const investmentGoals = mysqlTable("investment_goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  targetAmount: decimal("targetAmount", { precision: 15, scale: 2 }).notNull(),
  period: mysqlEnum("period", ["monthly", "annual"]).default("monthly").notNull(),
  year: int("year").notNull(),
  month: int("month"), // null = meta anual
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InvestmentGoal = typeof investmentGoals.$inferSelect;

// Configurações do usuário
export const userSettings = mysqlTable("user_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  alertThresholdPercent: int("alertThresholdPercent").default(80), // % da renda para alertar
  monthlyIncomeEstimate: decimal("monthlyIncomeEstimate", { precision: 15, scale: 2 }),
  emailNotifications: boolean("emailNotifications").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
