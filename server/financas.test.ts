import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock all database helpers
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  getUserById: vi.fn().mockResolvedValue(undefined),
  getCategoriesForUser: vi.fn().mockResolvedValue([
    { id: 1, name: "Alimentação", icon: "utensils", color: "#10b981", type: "expense", isDefault: true, userId: null },
    { id: 2, name: "Salário", icon: "briefcase", color: "#3b82f6", type: "income", isDefault: true, userId: null },
  ]),
  createCategory: vi.fn().mockResolvedValue({ id: 10, name: "Teste", icon: "tag", color: "#6366f1", type: "both", isDefault: false, userId: 1 }),
  updateCategory: vi.fn().mockResolvedValue(undefined),
  deleteCategory: vi.fn().mockResolvedValue(undefined),
  getTransactions: vi.fn().mockResolvedValue([]),
  getTransactionsByUserIds: vi.fn().mockResolvedValue([]),
  getAllTransactionsForUser: vi.fn().mockResolvedValue([]),
  createTransaction: vi.fn().mockResolvedValue({ id: 1, amount: "100.00", type: "expense", description: "Test" }),
  createTransactions: vi.fn().mockResolvedValue(undefined),
  updateTransaction: vi.fn().mockResolvedValue(undefined),
  deleteTransaction: vi.fn().mockResolvedValue(undefined),
  deleteInstallmentGroup: vi.fn().mockResolvedValue(undefined),
  getInvestmentCategoriesForUser: vi.fn().mockResolvedValue([
    { id: 1, name: "Renda Fixa", color: "#10b981", userId: null },
    { id: 2, name: "Renda Variável", color: "#3b82f6", userId: null },
  ]),
  getInvestmentsForUser: vi.fn().mockResolvedValue([]),
  createInvestment: vi.fn().mockResolvedValue({ id: 1, name: "Tesouro Direto", amount: "1000.00" }),
  updateInvestment: vi.fn().mockResolvedValue(undefined),
  deleteInvestment: vi.fn().mockResolvedValue(undefined),
  getInvestmentGoalsForUser: vi.fn().mockResolvedValue([]),
  upsertInvestmentGoal: vi.fn().mockResolvedValue({ id: 1, title: "Meta Mensal", targetAmount: "500.00" }),
  getUserSettings: vi.fn().mockResolvedValue(null),
  upsertUserSettings: vi.fn().mockResolvedValue(undefined),
  getFamilyGroupForUser: vi.fn().mockResolvedValue(null),
  createFamilyGroup: vi.fn().mockResolvedValue({ id: 1, name: "Minha Família" }),
  createFamilyInvite: vi.fn().mockResolvedValue(undefined),
  acceptFamilyInvite: vi.fn().mockResolvedValue({ success: true }),
  getMonthlyTransactionsByUserIds: vi.fn().mockResolvedValue([]),
  getTransactionHistoryForUser: vi.fn().mockResolvedValue([]),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Análise financeira de teste." } }],
  }),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Auth ────────────────────────────────────────────────────────────────────
describe("auth", () => {
  it("me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    expect(await caller.auth.me()).toBeNull();
  });

  it("me returns user when authenticated", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.auth.me();
    expect(result?.id).toBe(1);
    expect(result?.email).toBe("test@example.com");
  });

  it("logout clears session cookie and returns success", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(ctx.res.clearCookie).toHaveBeenCalled();
  });
});

// ─── Categories ──────────────────────────────────────────────────────────────
describe("categories", () => {
  it("list returns categories for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.categories.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0].name).toBe("Alimentação");
  });

  it("list throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.categories.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("create adds a new category and returns it", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.categories.create({ name: "Teste", icon: "tag", color: "#6366f1", type: "both" });
    expect(result.name).toBe("Teste");
    expect(result.id).toBe(10);
  });
});

// ─── Transactions ─────────────────────────────────────────────────────────────
describe("transactions", () => {
  it("list returns empty array when no transactions exist", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.transactions.list({ year: 2026, month: 3 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("list throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.transactions.list({ year: 2026, month: 3 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

// ─── Dashboard ───────────────────────────────────────────────────────────────
describe("dashboard", () => {
  it("monthly returns summary with required fields", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.dashboard.monthly({ year: 2026, month: 3, consolidated: false });
    expect(result).toHaveProperty("totalIncome");
    expect(result).toHaveProperty("totalExpense");
    expect(result).toHaveProperty("balance");
    expect(result).toHaveProperty("fixedExpense");
    expect(result).toHaveProperty("variableExpense");
    expect(result).toHaveProperty("categoryBreakdown");
  });

  it("monthly throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.dashboard.monthly({ year: 2026, month: 3, consolidated: false })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("history returns array", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.dashboard.history({ months: 6 });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Investments ─────────────────────────────────────────────────────────────
describe("investments", () => {
  it("list returns empty array when no investments exist", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.investments.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("categories returns investment categories", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.investments.categories();
    expect(result.length).toBe(2);
    expect(result[0].name).toBe("Renda Fixa");
  });

  it("list throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.investments.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

// ─── Settings ────────────────────────────────────────────────────────────────
describe("settings", () => {
  it("get returns null when no settings configured", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.settings.get();
    expect(result).toBeNull();
  });

  it("get throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.settings.get()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

// ─── Family ──────────────────────────────────────────────────────────────────
describe("family", () => {
  it("info returns null when user has no family group", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.family.info();
    expect(result).toBeNull();
  });

  it("info throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.family.info()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
