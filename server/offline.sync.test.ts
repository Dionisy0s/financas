/**
 * Tests for the offline sync batch endpoint
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    upsertUser: vi.fn(),
    getUserByOpenId: vi.fn(),
    getTransactions: vi.fn().mockResolvedValue([]),
    getCategoriesForUser: vi.fn().mockResolvedValue([
      { id: 1, name: "Alimentação", color: "#22c55e", icon: "utensils", type: "expense", userId: 1, isDefault: true },
    ]),
    createTransaction: vi.fn().mockResolvedValue({ id: 100 }),
    createTransactions: vi.fn().mockResolvedValue([]),
    deleteTransaction: vi.fn().mockResolvedValue(undefined),
    deleteInstallmentGroup: vi.fn().mockResolvedValue(undefined),
    getInvestmentsForUser: vi.fn().mockResolvedValue([]),
    getInvestmentCategoriesForUser: vi.fn().mockResolvedValue([]),
    getInvestmentGoalsForUser: vi.fn().mockResolvedValue([]),
    getFamilyGroupForUser: vi.fn().mockResolvedValue(null),
    getUserSettings: vi.fn().mockResolvedValue(null),
    upsertUserSettings: vi.fn().mockResolvedValue(undefined),
    getMonthlyTransactionsByUserIds: vi.fn().mockResolvedValue([]),
    getTransactionHistoryForUser: vi.fn().mockResolvedValue([]),
    getAllTransactionsForUser: vi.fn().mockResolvedValue([]),
    getUserById: vi.fn().mockResolvedValue(null),
    createFamilyGroup: vi.fn().mockResolvedValue({ id: 1 }),
    createFamilyInvite: vi.fn().mockResolvedValue({ code: "abc123" }),
    acceptFamilyInvite: vi.fn().mockResolvedValue(undefined),
    createCategory: vi.fn().mockResolvedValue({ id: 10 }),
    updateCategory: vi.fn().mockResolvedValue(undefined),
    deleteCategory: vi.fn().mockResolvedValue(undefined),
    createInvestment: vi.fn().mockResolvedValue({ id: 1 }),
    updateInvestment: vi.fn().mockResolvedValue(undefined),
    deleteInvestment: vi.fn().mockResolvedValue(undefined),
    upsertInvestmentGoal: vi.fn().mockResolvedValue(undefined),
    updateTransaction: vi.fn().mockResolvedValue(undefined),
  };
});

// ─── Mock LLM ─────────────────────────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Mock analysis" } }],
  }),
}));

// ─── Mock notification ────────────────────────────────────────────────────────
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
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
describe("sync.batch", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
    vi.clearAllMocks();
  });

  it("processes a single transaction.create operation successfully", async () => {
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sync.batch({
      operations: [
        {
          localId: "local_123",
          procedure: "transactions.create",
          input: {
            description: "Supermercado",
            amount: 150.0,
            type: "expense",
            categoryId: 1,
            paymentMethod: "pix",
            expenseType: "variable",
            transactionDate: "2025-03-01",
            notes: null,
            installments: 1,
          },
          enqueuedAt: Date.now(),
        },
      ],
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.success).toBe(true);
    expect(result.results[0]?.localId).toBe("local_123");
  });

  it("returns error for unknown procedure", async () => {
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sync.batch({
      operations: [
        {
          localId: "local_456",
          procedure: "unknown.procedure",
          input: {},
          enqueuedAt: Date.now(),
        },
      ],
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.success).toBe(false);
    expect(result.results[0]?.error).toContain("Unknown procedure");
  });

  it("handles multiple operations and returns results for each", async () => {
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sync.batch({
      operations: [
        {
          localId: "local_1",
          procedure: "transactions.create",
          input: {
            description: "Salário",
            amount: 5000.0,
            type: "income",
            categoryId: 1,
            paymentMethod: "pix",
            expenseType: "fixed",
            transactionDate: "2025-03-05",
            notes: null,
            installments: 1,
          },
          enqueuedAt: Date.now(),
        },
        {
          localId: "local_2",
          procedure: "transactions.delete",
          input: { id: 99, deleteGroup: false },
          enqueuedAt: Date.now() + 1,
        },
      ],
    });

    expect(result.results).toHaveLength(2);
    expect(result.results[0]?.success).toBe(true);
    expect(result.results[1]?.success).toBe(true);
  });

  it("returns error when category does not exist", async () => {
    const { getCategoriesForUser } = await import("./db");
    vi.mocked(getCategoriesForUser).mockResolvedValueOnce([]);

    const caller = appRouter.createCaller(ctx);

    const result = await caller.sync.batch({
      operations: [
        {
          localId: "local_bad",
          procedure: "transactions.create",
          input: {
            description: "Test",
            amount: 100,
            type: "expense",
            categoryId: 999, // non-existent
            paymentMethod: "cash",
            expenseType: "variable",
            transactionDate: "2025-03-01",
            notes: null,
            installments: 1,
          },
          enqueuedAt: Date.now(),
        },
      ],
    });

    expect(result.results[0]?.success).toBe(false);
    expect(result.results[0]?.error).toContain("Categoria");
  });

  it("processes an empty operations array without errors", async () => {
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sync.batch({ operations: [] });

    expect(result.results).toHaveLength(0);
  });
});
