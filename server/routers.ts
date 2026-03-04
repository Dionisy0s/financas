import { COOKIE_NAME } from "@shared/const";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  acceptFamilyInvite,
  createCategory,
  createFamilyGroup,
  createFamilyInvite,
  createInvestment,
  createTransaction,
  createTransactions,
  deleteCategory,
  deleteInstallmentGroup,
  deleteInvestment,
  deleteTransaction,
  getAllTransactionsForUser,
  getCategoriesForUser,
  getFamilyGroupForUser,
  getInvestmentCategoriesForUser,
  getInvestmentGoalsForUser,
  getInvestmentsForUser,
  getMonthlyTransactionsByUserIds,
  getTransactionHistoryForUser,
  getTransactions,
  getUserById,
  getUserSettings,
  updateCategory,
  updateInvestment,
  updateTransaction,
  upsertInvestmentGoal,
  upsertUserSettings,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcDashboard(txs: any[], categories: any[]) {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  let totalIncome = 0;
  let totalExpense = 0;
  let fixedExpense = 0;
  let variableExpense = 0;
  const byCategory: Record<number, { name: string; color: string; icon: string; income: number; expense: number }> = {};
  const byDay: Record<string, { income: number; expense: number }> = {};

  for (const t of txs) {
    const amount = parseFloat(t.amount);
    const cat = catMap.get(t.categoryId) ?? { name: "Outros", color: "#6b7280", icon: "tag" };
    if (!byCategory[t.categoryId]) {
      byCategory[t.categoryId] = { name: cat.name, color: cat.color, icon: cat.icon, income: 0, expense: 0 };
    }
    const day = typeof t.transactionDate === "string" ? t.transactionDate : t.transactionDate?.toISOString?.()?.split("T")[0] ?? "";
    if (!byDay[day]) byDay[day] = { income: 0, expense: 0 };

    if (t.type === "income") {
      totalIncome += amount;
      byCategory[t.categoryId].income += amount;
      byDay[day].income += amount;
    } else {
      totalExpense += amount;
      byCategory[t.categoryId].expense += amount;
      byDay[day].expense += amount;
      if (t.expenseType === "fixed") fixedExpense += amount;
      else variableExpense += amount;
    }
  }

  const balance = totalIncome - totalExpense;
  const categoryBreakdown = Object.entries(byCategory).map(([id, v]) => ({
    categoryId: Number(id),
    ...v,
    total: v.income + v.expense,
  }));

  const dailyEvolution = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  return {
    totalIncome,
    totalExpense,
    balance,
    fixedExpense,
    variableExpense,
    categoryBreakdown,
    dailyEvolution,
  };
}

// ─── Seed default categories ──────────────────────────────────────────────────

const DEFAULT_CATEGORIES = [
  { name: "Salário", icon: "briefcase", color: "#10b981", type: "income" as const, isDefault: true },
  { name: "Renda Extra", icon: "plus-circle", color: "#06b6d4", type: "income" as const, isDefault: true },
  { name: "Investimentos", icon: "trending-up", color: "#8b5cf6", type: "income" as const, isDefault: true },
  { name: "Alimentação", icon: "utensils", color: "#f59e0b", type: "expense" as const, isDefault: true },
  { name: "Moradia", icon: "home", color: "#ef4444", type: "expense" as const, isDefault: true },
  { name: "Transporte", icon: "car", color: "#3b82f6", type: "expense" as const, isDefault: true },
  { name: "Saúde", icon: "heart", color: "#ec4899", type: "expense" as const, isDefault: true },
  { name: "Educação", icon: "book", color: "#6366f1", type: "expense" as const, isDefault: true },
  { name: "Lazer", icon: "smile", color: "#f97316", type: "expense" as const, isDefault: true },
  { name: "Vestuário", icon: "shirt", color: "#84cc16", type: "expense" as const, isDefault: true },
  { name: "Assinaturas", icon: "repeat", color: "#a855f7", type: "expense" as const, isDefault: true },
  { name: "Outros", icon: "tag", color: "#6b7280", type: "both" as const, isDefault: true },
];

const DEFAULT_INVESTMENT_CATEGORIES = [
  { name: "Renda Fixa", icon: "shield", color: "#10b981", isDefault: true },
  { name: "Renda Variável", icon: "trending-up", color: "#3b82f6", isDefault: true },
  { name: "Criptomoedas", icon: "bitcoin", color: "#f59e0b", isDefault: true },
  { name: "Fundos Imobiliários", icon: "building", color: "#8b5cf6", isDefault: true },
  { name: "Previdência", icon: "umbrella", color: "#06b6d4", isDefault: true },
  { name: "Poupança", icon: "piggy-bank", color: "#ec4899", isDefault: true },
  { name: "Ações", icon: "bar-chart-2", color: "#ef4444", isDefault: true },
  { name: "Outros", icon: "wallet", color: "#6b7280", isDefault: true },
];

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Categories ─────────────────────────────────────────────────────────────
  categories: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const cats = await getCategoriesForUser(ctx.user.id);
      // Seed defaults if none exist
      if (cats.length === 0) {
        for (const cat of DEFAULT_CATEGORIES) {
          await createCategory({ ...cat, userId: null });
        }
        return getCategoriesForUser(ctx.user.id);
      }
      return cats;
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(100),
          icon: z.string().default("tag"),
          color: z.string().default("#6366f1"),
          type: z.enum(["income", "expense", "both"]).default("both"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createCategory({ ...input, userId: ctx.user.id, isDefault: false });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(100).optional(),
          icon: z.string().optional(),
          color: z.string().optional(),
          type: z.enum(["income", "expense", "both"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateCategory(id, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteCategory(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Transactions ────────────────────────────────────────────────────────────
  transactions: router({
    list: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number() }))
      .query(async ({ ctx, input }) => {
        return getTransactions(ctx.user.id, input);
      }),

    create: protectedProcedure
      .input(
        z.object({
          categoryId: z.number(),
          type: z.enum(["income", "expense"]),
          amount: z.number().positive(),
          description: z.string().min(1).max(500),
          paymentMethod: z.enum(["pix", "credit", "debit", "cash", "boleto"]),
          expenseType: z.enum(["fixed", "variable"]).default("variable"),
          transactionDate: z.string(),
          notes: z.string().optional(),
          installments: z.number().int().min(1).max(48).default(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { installments, amount, transactionDate, ...rest } = input;

        if (installments > 1 && input.paymentMethod === "credit") {
          const groupId = nanoid();
          const installmentAmount = amount / installments;
          const baseDate = new Date(transactionDate + "T12:00:00");
          const records = Array.from({ length: installments }, (_, i) => {
            const d = new Date(baseDate);
            d.setMonth(d.getMonth() + i);
            return {
              ...rest,
              userId: ctx.user.id,
              amount: installmentAmount.toFixed(2),
              transactionDate: d as any,
              installmentGroupId: groupId,
              installmentNumber: i + 1,
              totalInstallments: installments,
              isInstallment: true,
              description: `${rest.description} (${i + 1}/${installments})`,
            };
          });
          await createTransactions(records);
          return { success: true, installments };
        }

        await createTransaction({
          ...rest,
          userId: ctx.user.id,
          amount: amount.toFixed(2),
          transactionDate: transactionDate as any,
          isInstallment: false,
        });
        return { success: true, installments: 1 };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          categoryId: z.number().optional(),
          type: z.enum(["income", "expense"]).optional(),
          amount: z.number().positive().optional(),
          description: z.string().min(1).max(500).optional(),
          paymentMethod: z.enum(["pix", "credit", "debit", "cash", "boleto"]).optional(),
          expenseType: z.enum(["fixed", "variable"]).optional(),
          transactionDate: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, amount, ...rest } = input;
        const data: any = { ...rest };
        if (amount !== undefined) data.amount = amount.toFixed(2);
        await updateTransaction(id, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number(), deleteGroup: z.boolean().default(false) }))
      .mutation(async ({ ctx, input }) => {
        if (input.deleteGroup) {
          // Get the transaction to find groupId
          const txs = await getAllTransactionsForUser(ctx.user.id);
          const tx = txs.find((t) => t.id === input.id);
          if (tx?.installmentGroupId) {
            await deleteInstallmentGroup(tx.installmentGroupId, ctx.user.id);
            return { success: true };
          }
        }
        await deleteTransaction(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Dashboard ───────────────────────────────────────────────────────────────
  dashboard: router({
    monthly: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number(), consolidated: z.boolean().default(false) }))
      .query(async ({ ctx, input }) => {
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

        // Build per-user breakdown for consolidated view
        let perUser: Record<number, ReturnType<typeof calcDashboard>> | undefined;
        if (input.consolidated && userIds.length > 1) {
          perUser = {};
          for (const uid of userIds) {
            const userTxs = txs.filter((t) => t.userId === uid);
            perUser[uid] = calcDashboard(userTxs, cats);
          }
        }

        return { ...result, userIds, perUser: perUser ?? null };
      }),

    history: protectedProcedure
      .input(z.object({ months: z.number().default(6) }))
      .query(async ({ ctx, input }) => {
        const txs = await getTransactionHistoryForUser(ctx.user.id, input.months);
        // Group by month
        const byMonth: Record<string, { income: number; expense: number; balance: number }> = {};
        for (const t of txs) {
          const dateStr = typeof t.transactionDate === "string" ? t.transactionDate : (t.transactionDate as any)?.toISOString?.()?.split("T")[0] ?? "";
          const key = dateStr.substring(0, 7); // YYYY-MM
          if (!byMonth[key]) byMonth[key] = { income: 0, expense: 0, balance: 0 };
          const amount = parseFloat(t.amount);
          if (t.type === "income") byMonth[key].income += amount;
          else byMonth[key].expense += amount;
        }
        return Object.entries(byMonth)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, v]) => ({ month, ...v, balance: v.income - v.expense }));
      }),
  }),

  // ─── Investments ─────────────────────────────────────────────────────────────
  investments: router({
    categories: protectedProcedure.query(async ({ ctx }) => {
      const cats = await getInvestmentCategoriesForUser(ctx.user.id);
      if (cats.length === 0) {
        const { getDb } = await import("./db");
        const { investmentCategories } = await import("../drizzle/schema");
        const db = await getDb();
        if (db) {
          await db.insert(investmentCategories).values(DEFAULT_INVESTMENT_CATEGORIES);
        }
        return getInvestmentCategoriesForUser(ctx.user.id);
      }
      return cats;
    }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return getInvestmentsForUser(ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          categoryId: z.number(),
          name: z.string().min(1).max(255),
          amount: z.number().positive(),
          investmentDate: z.string(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createInvestment({
          ...input,
          userId: ctx.user.id,
          amount: input.amount.toFixed(2),
          investmentDate: input.investmentDate as any,
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          categoryId: z.number().optional(),
          name: z.string().min(1).max(255).optional(),
          amount: z.number().positive().optional(),
          investmentDate: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, amount, ...rest } = input;
        const data: any = { ...rest };
        if (amount !== undefined) data.amount = amount.toFixed(2);
        await updateInvestment(id, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteInvestment(input.id, ctx.user.id);
        return { success: true };
      }),

    goals: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        return getInvestmentGoalsForUser(ctx.user.id);
      }),

      upsert: protectedProcedure
        .input(
          z.object({
            title: z.string().min(1),
            targetAmount: z.number().positive(),
            period: z.enum(["monthly", "annual"]),
            year: z.number(),
            month: z.number().optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          await upsertInvestmentGoal({
            ...input,
            userId: ctx.user.id,
            targetAmount: input.targetAmount.toFixed(2),
          });
          return { success: true };
        }),
    }),
  }),

  // ─── Family / Consolidated ───────────────────────────────────────────────────
  family: router({
    info: protectedProcedure.query(async ({ ctx }) => {
      const family = await getFamilyGroupForUser(ctx.user.id);
      if (!family) return null;
      // Enrich members with user info
      const members = await Promise.all(
        family.members.map(async (m) => {
          const user = await getUserById(m.userId);
          return { ...m, user: user ? { id: user.id, name: user.name, email: user.email } : null };
        })
      );
      return { group: family.group, members };
    }),

    create: protectedProcedure
      .input(z.object({ name: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getFamilyGroupForUser(ctx.user.id);
        if (existing) throw new Error("Você já faz parte de um grupo familiar");
        const group = await createFamilyGroup(ctx.user.id, input.name);
        return group;
      }),

    invite: protectedProcedure
      .input(z.object({ origin: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const family = await getFamilyGroupForUser(ctx.user.id);
        if (!family) throw new Error("Crie um grupo familiar primeiro");
        const code = nanoid(12);
        await createFamilyInvite(family.group.id, ctx.user.id, code);
        return { inviteUrl: `${input.origin}/convite/${code}` };
      }),

    join: protectedProcedure
      .input(z.object({ inviteCode: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const result = await acceptFamilyInvite(input.inviteCode, ctx.user.id);
        if (!result.success) throw new Error("Convite inválido ou expirado");
        return result;
      }),
  }),

  // ─── Settings ────────────────────────────────────────────────────────────────
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getUserSettings(ctx.user.id);
    }),

    update: protectedProcedure
      .input(
        z.object({
          alertThresholdPercent: z.number().min(1).max(100).optional(),
          monthlyIncomeEstimate: z.number().positive().optional(),
          emailNotifications: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const data: any = {};
        if (input.alertThresholdPercent !== undefined)
          data.alertThresholdPercent = input.alertThresholdPercent;
        if (input.monthlyIncomeEstimate !== undefined)
          data.monthlyIncomeEstimate = input.monthlyIncomeEstimate.toFixed(2);
        if (input.emailNotifications !== undefined)
          data.emailNotifications = input.emailNotifications;
        await upsertUserSettings(ctx.user.id, data);
        return { success: true };
      }),
  }),

  // ─── Offline Sync ──────────────────────────────────────────────────────────────
  sync: router({
    /**
     * Batch sync endpoint: receives an array of queued operations and processes them.
     * Returns per-operation results so the client can remove successfully processed items.
     */
    batch: protectedProcedure
      .input(
        z.object({
          operations: z.array(
            z.object({
              localId: z.string().optional(),
              procedure: z.string(),
              input: z.unknown(),
              enqueuedAt: z.number(),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const results: Array<{ localId?: string; success: boolean; error?: string }> = [];

        for (const op of input.operations) {
          try {
            // Route each operation to the appropriate handler
            switch (op.procedure) {
              case 'transactions.create': {
                const data = op.input as any;
                const cats = await getCategoriesForUser(ctx.user.id);
                const categoryExists = cats.some((c: any) => c.id === data.categoryId);
                if (!categoryExists) throw new Error('Categoria não encontrada');

                const txDate = new Date(data.transactionDate);
                const installments = data.installments ?? 1;

                if (installments > 1 && data.paymentMethod === 'credit') {
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
                      expenseType: data.expenseType ?? 'variable',
                      transactionDate: d,
                      notes: data.notes ?? null,
                      isInstallment: true,
                      installmentNumber: i + 1,
                      totalInstallments: installments,
                      installmentGroupId: groupId,
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
                    expenseType: data.expenseType ?? 'variable',
                    transactionDate: new Date(data.transactionDate),
                    notes: data.notes ?? null,
                    isInstallment: false,
                    installmentNumber: null,
                    totalInstallments: null,
                    installmentGroupId: null,
                  });
                }
                results.push({ localId: op.localId, success: true });
                break;
              }
              case 'transactions.delete': {
                const data = op.input as any;
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
          } catch (err: any) {
            results.push({ localId: op.localId, success: false, error: err?.message ?? 'Unknown error' });
          }
        }

        return { results };
      }),
  }),

  // ─── AI Insights ─────────────────────────────────────────────────────────────
  insights: router({
    analyze: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const txs = await getTransactions(ctx.user.id, input);
        const cats = await getCategoriesForUser(ctx.user.id);
        const settings = await getUserSettings(ctx.user.id);
        const dashboard = calcDashboard(txs, cats);

        const monthName = new Date(input.year, input.month - 1, 1).toLocaleString("pt-BR", { month: "long" });
        const catSummary = dashboard.categoryBreakdown
          .filter((c) => c.expense > 0)
          .sort((a, b) => b.expense - a.expense)
          .slice(0, 5)
          .map((c) => `${c.name}: R$ ${c.expense.toFixed(2)}`)
          .join(", ");

        const incomeEstimate = settings?.monthlyIncomeEstimate
          ? parseFloat(settings.monthlyIncomeEstimate)
          : dashboard.totalIncome;

        const commitPercent =
          incomeEstimate > 0
            ? ((dashboard.totalExpense / incomeEstimate) * 100).toFixed(1)
            : "N/A";

        const prompt = `Você é um consultor financeiro pessoal especialista. Analise os dados financeiros de ${monthName}/${input.year} e forneça uma análise detalhada em português brasileiro.

Dados do mês:
- Total de Entradas: R$ ${dashboard.totalIncome.toFixed(2)}
- Total de Saídas: R$ ${dashboard.totalExpense.toFixed(2)}
- Saldo: R$ ${dashboard.balance.toFixed(2)}
- Gastos Fixos: R$ ${dashboard.fixedExpense.toFixed(2)}
- Gastos Variáveis: R$ ${dashboard.variableExpense.toFixed(2)}
- Percentual comprometido da renda: ${commitPercent}%
- Principais categorias de gasto: ${catSummary || "Nenhum gasto registrado"}

Forneça:
1. Uma análise do comportamento financeiro do mês (2-3 parágrafos)
2. Os pontos positivos e negativos
3. 3 sugestões práticas de economia ou melhoria
4. Uma previsão ou alerta para o próximo mês

Seja direto, prático e use linguagem acessível. Formate com markdown.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um consultor financeiro pessoal especialista em finanças pessoais brasileiras. Responda sempre em português do Brasil." },
            { role: "user", content: prompt },
          ],
        });

        const rawContent = response.choices?.[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : "Não foi possível gerar análise.";
        return { analysis: content, month: monthName, year: input.year };
      }),
  }),
});

export type AppRouter = typeof appRouter;
