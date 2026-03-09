import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatMonthYear, getCurrentYearMonth, percentOf } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  Sparkles,
  Users,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { formatMonthShort } from "@/lib/utils";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const COLORS = [
  "#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#a855f7",
];

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
}: {
  title: string;
  value: string;
  icon: any;
  trend?: string;
  variant?: "default" | "income" | "expense" | "balance";
}) {
  const colors = {
    default: "text-foreground",
    income: "text-emerald-400",
    expense: "text-red-400",
    balance: "text-blue-400",
  };

  return (
    <Card className="bg-card border-border/50 hover:border-border transition-colors overflow-hidden">
      <CardContent className="p-3 sm:p-5">
        <div className="flex items-start justify-between mb-3 gap-2">
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider flex-1 min-w-0">{title}</p>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
            <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${colors[variant]}`} />
          </div>
        </div>
        <div className="min-w-0 max-w-full overflow-hidden">
          <p className={`font-bold ${colors[variant]} break-words text-[clamp(16px,4vw,28px)] leading-tight`}>
            {value}
          </p>
        </div>
        {trend && <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 break-words">{trend}</p>}
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-xs">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const now = getCurrentYearMonth();
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const [consolidated, setConsolidated] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  const dashboardQuery = trpc.dashboard.monthly.useQuery(
    { year, month, consolidated },
    { staleTime: 30_000 }
  );

  const historyQuery = trpc.dashboard.history.useQuery(
    { months: 6 },
    { staleTime: 60_000 }
  );

  const familyQuery = trpc.family.info.useQuery(undefined, { staleTime: 60_000 });

  const insightsMutation = trpc.insights.analyze.useMutation({
    onSuccess: () => setShowInsights(true),
    onError: () => toast.error("Erro ao gerar análise. Tente novamente."),
  });

  const data = dashboardQuery.data;
  const settings = trpc.settings.get.useQuery(undefined, { staleTime: 60_000 });
  const alertThreshold = settings.data?.alertThresholdPercent ?? 80;
  const incomeEstimate = settings.data?.monthlyIncomeEstimate
    ? parseFloat(settings.data.monthlyIncomeEstimate)
    : data?.totalIncome ?? 0;

  const commitPercent = incomeEstimate > 0 && data
    ? (data.totalExpense / incomeEstimate) * 100
    : 0;

  const isOverBudget = commitPercent >= alertThreshold;

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const pieData = useMemo(() => {
    if (!data) return [];
    return data.categoryBreakdown
      .filter((c) => c.expense > 0)
      .sort((a, b) => b.expense - a.expense)
      .slice(0, 8)
      .map((c, i) => ({
        name: c.name,
        value: c.expense,
        color: c.color || COLORS[i % COLORS.length],
      }));
  }, [data]);

  const dailyData = useMemo(() => {
    if (!data) return [];
    let cumBalance = 0;
    return data.dailyEvolution.map((d) => {
      cumBalance += d.income - d.expense;
      return {
        date: d.date.split("-")[2],
        Entradas: d.income,
        Saídas: d.expense,
        Saldo: cumBalance,
      };
    });
  }, [data]);

  const hasFamily = !!familyQuery.data;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visão geral das suas finanças
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {hasFamily && (
            <Tabs
              value={consolidated ? "consolidated" : "personal"}
              onValueChange={(v) => setConsolidated(v === "consolidated")}
            >
              <TabsList className="h-8">
                <TabsTrigger value="personal" className="text-xs px-3 h-6">
                  Pessoal
                </TabsTrigger>
                <TabsTrigger value="consolidated" className="text-xs px-3 h-6 gap-1">
                  <Users className="w-3 h-3" />
                  Família
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Month Navigation */}
          <div className="flex items-center gap-1 bg-card border border-border rounded-xl px-2 py-1">
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={prevMonth}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-sm font-medium px-2 min-w-[140px] text-center capitalize">
              {formatMonthYear(year, month)}
            </span>
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={nextMonth}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Alert */}
      {isOverBudget && data && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm">
            <strong>Atenção!</strong> Você comprometeu {commitPercent.toFixed(1)}% da sua renda estimada este mês.
            Limite definido: {alertThreshold}%.
          </p>
        </div>
      )}

      {dashboardQuery.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="Entradas"
              value={formatCurrency(data?.totalIncome ?? 0)}
              icon={TrendingUp}
              variant="income"
              trend={`${percentOf(data?.totalIncome ?? 0, (data?.totalIncome ?? 0) + (data?.totalExpense ?? 0))} do total`}
            />
            <StatCard
              title="Saídas"
              value={formatCurrency(data?.totalExpense ?? 0)}
              icon={TrendingDown}
              variant="expense"
              trend={`${percentOf(data?.totalExpense ?? 0, data?.totalIncome ?? 0)} das entradas`}
            />
            <StatCard
              title="Saldo"
              value={formatCurrency(data?.balance ?? 0)}
              icon={Wallet}
              variant="balance"
              trend={(data?.balance ?? 0) >= 0 ? "Positivo" : "Negativo"}
            />
            <StatCard
              title="% Comprometido"
              value={`${commitPercent.toFixed(1)}%`}
              icon={isOverBudget ? AlertTriangle : TrendingUp}
              variant={isOverBudget ? "expense" : "income"}
              trend={`Limite: ${alertThreshold}%`}
            />
          </div>

          {/* Fixo vs Variável */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Gastos Fixos</p>
                <p className="text-xl font-bold text-amber-400">{formatCurrency(data?.fixedExpense ?? 0)}</p>
                <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${data?.totalExpense ? Math.min(100, (data.fixedExpense / data.totalExpense) * 100) : 0}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {percentOf(data?.fixedExpense ?? 0, data?.totalExpense ?? 0)} das saídas
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Gastos Variáveis</p>
                <p className="text-xl font-bold text-purple-400">{formatCurrency(data?.variableExpense ?? 0)}</p>
                <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-400 rounded-full transition-all"
                    style={{ width: `${data?.totalExpense ? Math.min(100, (data.variableExpense / data.totalExpense) * 100) : 0}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {percentOf(data?.variableExpense ?? 0, data?.totalExpense ?? 0)} das saídas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pie Chart */}
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Gastos por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                    Nenhum gasto registrado
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={180}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: any) => formatCurrency(v)}
                          contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-1.5">
                      {pieData.slice(0, 6).map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                          <span className="text-xs text-muted-foreground truncate flex-1">{item.name}</span>
                          <span className="text-xs font-medium">{formatCurrency(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Entradas vs Saídas por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                {dailyData.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                    Nenhuma movimentação registrada
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Entradas" fill="#10b981" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Saídas" fill="#ef4444" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Area Chart - Saldo Evolution */}
          {dailyData.length > 0 && (
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Evolução do Saldo no Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="Saldo" stroke="#3b82f6" fill="url(#balanceGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* History Chart */}
          {historyQuery.data && historyQuery.data.length > 1 && (
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Histórico dos Últimos Meses</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={historyQuery.data.map((h) => ({
                      month: formatMonthShort(h.month),
                      Entradas: h.income,
                      Saídas: h.expense,
                    }))}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Entradas" fill="#10b981" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Saídas" fill="#ef4444" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* AI Insights */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">Análise Inteligente com IA</CardTitle>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => insightsMutation.mutate({ year, month })}
                  disabled={insightsMutation.isPending}
                >
                  {insightsMutation.isPending ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Analisando...</>
                  ) : (
                    <><RefreshCw className="w-3 h-3" /> Gerar Análise</>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showInsights && insightsMutation.data ? (
                <div className="prose prose-sm prose-invert max-w-none text-sm text-muted-foreground">
                  <Streamdown>{insightsMutation.data.analysis}</Streamdown>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Clique em "Gerar Análise" para obter insights personalizados sobre seus gastos, sugestões de economia e previsões baseadas no seu histórico financeiro.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
