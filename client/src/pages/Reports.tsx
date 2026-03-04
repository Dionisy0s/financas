import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatMonthYear, getCurrentYearMonth, formatDate, getPaymentMethodLabel, getExpenseTypeLabel } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FileText, Download, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { formatMonthShort } from "@/lib/utils";
import { toast } from "sonner";

function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return toast.error("Nenhum dado para exportar");
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      if (typeof val === "string" && val.includes(",")) return `"${val}"`;
      return val ?? "";
    }).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Relatório exportado com sucesso!");
}

export default function Reports() {
  const now = getCurrentYearMonth();
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);

  const txQuery = trpc.transactions.list.useQuery({ year, month });
  const catsQuery = trpc.categories.list.useQuery();
  const historyQuery = trpc.dashboard.history.useQuery({ months: 12 });
  const dashboardQuery = trpc.dashboard.monthly.useQuery({ year, month, consolidated: false });

  const catMap = useMemo(() => {
    const m = new Map<number, string>();
    (catsQuery.data ?? []).forEach((c) => m.set(c.id, c.name));
    return m;
  }, [catsQuery.data]);

  const handleExportCSV = () => {
    const rows = (txQuery.data ?? []).map((t) => ({
      Data: typeof t.transactionDate === "string" ? t.transactionDate : (t.transactionDate as any)?.toISOString?.()?.split("T")[0] ?? "",
      Descrição: t.description,
      Tipo: t.type === "income" ? "Entrada" : "Saída",
      Valor: parseFloat(t.amount).toFixed(2),
      Categoria: catMap.get(t.categoryId) ?? "Outros",
      Pagamento: getPaymentMethodLabel(t.paymentMethod),
      "Fixo/Variável": getExpenseTypeLabel(t.expenseType),
      Observações: t.notes ?? "",
    }));
    exportToCSV(rows, `financas-${year}-${String(month).padStart(2, "0")}.csv`);
  };

  const years = Array.from({ length: 5 }, (_, i) => now.year - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const historyData = (historyQuery.data ?? []).map((h) => ({
    month: formatMonthShort(h.month),
    Entradas: h.income,
    Saídas: h.expense,
    Saldo: h.balance,
  }));

  const data = dashboardQuery.data;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Relatórios
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Análise detalhada do histórico financeiro</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
            <SelectTrigger className="w-32 bg-card border-border h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {new Date(2024, m - 1, 1).toLocaleDateString("pt-BR", { month: "long" })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-24 bg-card border-border h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5" />
            CSV
          </Button>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Entradas</p>
            </div>
            <p className="text-xl font-bold text-emerald-400">{formatCurrency(data?.totalIncome ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Saídas</p>
            </div>
            <p className="text-xl font-bold text-red-400">{formatCurrency(data?.totalExpense ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Saldo</p>
            </div>
            <p className={`text-xl font-bold ${(data?.balance ?? 0) >= 0 ? "text-blue-400" : "text-red-400"}`}>
              {formatCurrency(data?.balance ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Annual History Chart */}
      {historyData.length > 0 && (
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Histórico Anual (últimos 12 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={historyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: any) => formatCurrency(v)}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                />
                <Bar dataKey="Entradas" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Saídas" fill="#ef4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      {data && data.categoryBreakdown.length > 0 && (
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Gastos por Categoria — {formatMonthYear(year, month)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.categoryBreakdown
                .filter((c) => c.expense > 0)
                .sort((a, b) => b.expense - a.expense)
                .map((cat) => (
                  <div key={cat.categoryId} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                    <span className="text-sm flex-1">{cat.name}</span>
                    <div className="flex-1 max-w-[200px]">
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${data.totalExpense > 0 ? Math.min(100, (cat.expense / data.totalExpense) * 100) : 0}%`,
                            background: cat.color,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {data.totalExpense > 0 ? `${((cat.expense / data.totalExpense) * 100).toFixed(0)}%` : "0%"}
                    </span>
                    <span className="text-sm font-medium w-24 text-right">{formatCurrency(cat.expense)}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction List */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Transações — {formatMonthYear(year, month)}
            </CardTitle>
            <span className="text-xs text-muted-foreground">{txQuery.data?.length ?? 0} registros</span>
          </div>
        </CardHeader>
        <CardContent>
          {txQuery.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (txQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transação neste período</p>
          ) : (
            <div className="divide-y divide-border/50">
              {(txQuery.data ?? []).map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 py-2.5">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: tx.type === "income" ? "#10b981" : "#ef4444" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{tx.description}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {catMap.get(tx.categoryId) ?? "Outros"} · {formatDate(tx.transactionDate as any)} · {getPaymentMethodLabel(tx.paymentMethod)}
                    </p>
                  </div>
                  <p className={`text-xs font-semibold flex-shrink-0 ${tx.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
