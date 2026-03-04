import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    upsertUser: vi.fn(),
    getUserByOpenId: vi.fn(),
    getUserById: vi.fn(),
    getTransactions: vi.fn().mockResolvedValue([]),
    getCategoriesForUser: vi.fn().mockResolvedValue([]),
    getUserSettings: vi.fn().mockResolvedValue(null),
    createTransaction: vi.fn(),
    createTransactions: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
    deleteInstallmentGroup: vi.fn(),
    getAllTransactionsForUser: vi.fn().mockResolvedValue([]),
    getMonthlyTransactionsByUserIds: vi.fn().mockResolvedValue([]),
    getTransactionHistoryForUser: vi.fn().mockResolvedValue([]),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    getInvestmentsForUser: vi.fn().mockResolvedValue([]),
    createInvestment: vi.fn(),
    updateInvestment: vi.fn(),
    deleteInvestment: vi.fn(),
    getInvestmentCategoriesForUser: vi.fn().mockResolvedValue([]),
    getInvestmentGoalsForUser: vi.fn().mockResolvedValue([]),
    upsertInvestmentGoal: vi.fn(),
    upsertUserSettings: vi.fn(),
    getFamilyGroupForUser: vi.fn().mockResolvedValue(null),
    createFamilyGroup: vi.fn(),
    createFamilyInvite: vi.fn(),
    acceptFamilyInvite: vi.fn().mockResolvedValue({ success: false }),
    getRecurringTransactionsForUser: vi.fn().mockResolvedValue([]),
    createRecurringTransaction: vi.fn().mockResolvedValue({ id: 1, description: "Salário", amount: "5000.00", type: "income", isActive: true }),
    updateRecurringTransaction: vi.fn().mockResolvedValue(undefined),
    deleteRecurringTransaction: vi.fn().mockResolvedValue(undefined),
    generateRecurringForMonth: vi.fn().mockResolvedValue(3),
  };
});

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({ choices: [{ message: { content: "Análise mock" } }] }),
}));

// ─── Context ──────────────────────────────────────────────────────────────────

function makeCtx(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("recurring.list", () => {
  it("returns empty array when no recurring transactions", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.recurring.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });
});

describe("recurring.create", () => {
  it("creates a recurring income transaction", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.recurring.create({
      description: "Salário",
      amount: 5000,
      type: "income",
      categoryId: 1,
      paymentMethod: "pix",
      expenseType: "fixed",
      dayOfMonth: 5,
    });
    expect(result).toBeDefined();
    expect(result?.description).toBe("Salário");
  });

  it("creates a recurring expense transaction", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.recurring.create({
      description: "Aluguel",
      amount: 1200,
      type: "expense",
      categoryId: 2,
      paymentMethod: "boleto",
      expenseType: "fixed",
      dayOfMonth: 10,
    });
    expect(result).toBeDefined();
  });

  it("rejects invalid dayOfMonth > 28", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.recurring.create({
        description: "Test",
        amount: 100,
        type: "expense",
        categoryId: 1,
        paymentMethod: "pix",
        expenseType: "fixed",
        dayOfMonth: 31, // invalid
      })
    ).rejects.toThrow();
  });

  it("rejects negative amount", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.recurring.create({
        description: "Test",
        amount: -100,
        type: "expense",
        categoryId: 1,
        paymentMethod: "pix",
        expenseType: "fixed",
        dayOfMonth: 5,
      })
    ).rejects.toThrow();
  });
});

describe("recurring.update", () => {
  it("updates a recurring transaction", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.recurring.update({ id: 1, isActive: false });
    expect(result.success).toBe(true);
  });
});

describe("recurring.delete", () => {
  it("deletes a recurring transaction", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.recurring.delete({ id: 1 });
    expect(result.success).toBe(true);
  });
});

describe("recurring.generate", () => {
  it("generates transactions for the current month", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.recurring.generate({ year: 2026, month: 3 });
    expect(result.generated).toBe(3);
  });

  it("rejects invalid month", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.recurring.generate({ year: 2026, month: 13 })
    ).rejects.toThrow();
  });
});
