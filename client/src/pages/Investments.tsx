import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useOfflineInvestments } from "@/hooks/useOfflineInvestments";
import { formatCurrency, formatDate, percentOf } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, Trash2, TrendingUp, Target, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

function InvestmentForm({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const catsQuery = trpc.investments.categories.useQuery();
  const { createInvestment, isCreating } = useOfflineInvestments();

  const [form, setForm] = useState({
    categoryId: "",
    name: "",
    amount: "",
    investmentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) return toast.error("Selecione uma categoria");
    createInvestment({
      categoryId: parseInt(form.categoryId),
      name: form.name,
      amount: parseFloat(form.amount),
      investmentDate: form.investmentDate,
      notes: form.notes || undefined,
    }).then(() => onSuccess()).catch(() => {});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Nome do Investimento *</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Ex: Tesouro Direto, Bitcoin..."
          required
          className="bg-secondary border-border"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Valor (R$) *</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="0,00"
            required
            className="bg-secondary border-border"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Data *</Label>
          <Input
            type="date"
            value={form.investmentDate}
            onChange={(e) => setForm((f) => ({ ...f, investmentDate: e.target.value }))}
            required
            className="bg-secondary border-border"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Categoria *</Label>
        <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {(catsQuery.data ?? []).map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Observações</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Notas adicionais..."
          className="bg-secondary border-border resize-none h-16 text-sm"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={isCreating}>
          {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

function GoalForm({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const utils = trpc.useUtils();
  const upsertMutation = trpc.investments.goals.upsert.useMutation({
    onSuccess: () => { utils.investments.goals.list.invalidate(); toast.success("Meta salva!"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const now = new Date();
  const [form, setForm] = useState({
    title: "",
    targetAmount: "",
    period: "monthly" as "monthly" | "annual",
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate({
      title: form.title,
      targetAmount: parseFloat(form.targetAmount),
      period: form.period,
      year: parseInt(form.year),
      month: form.period === "monthly" ? parseInt(form.month) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Título da Meta *</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Ex: Meta de investimento mensal"
          required
          className="bg-secondary border-border"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Valor Alvo (R$) *</Label>
        <Input
          type="number"
          step="0.01"
          min="1"
          value={form.targetAmount}
          onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
          placeholder="0,00"
          required
          className="bg-secondary border-border"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Período</Label>
          <Select value={form.period} onValueChange={(v: any) => setForm((f) => ({ ...f, period: v }))}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensal</SelectItem>
              <SelectItem value="annual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Ano</Label>
          <Input
            type="number"
            value={form.year}
            onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
            className="bg-secondary border-border"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={upsertMutation.isPending}>
          {upsertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Meta"}
        </Button>
      </div>
    </form>
  );
}

export default function Investments() {
  const investmentsQuery = trpc.investments.list.useQuery();
  const catsQuery = trpc.investments.categories.useQuery();
  const goalsQuery = trpc.investments.goals.list.useQuery();
  const { deleteInvestment, isDeleting } = useOfflineInvestments();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const catMap = useMemo(() => {
    const m = new Map<number, { name: string; color: string }>();
    (catsQuery.data ?? []).forEach((c) => m.set(c.id, { name: c.name, color: c.color ?? "#10b981" }));
    return m;
  }, [catsQuery.data]);

  const totalInvested = useMemo(
    () => (investmentsQuery.data ?? []).reduce((s, i) => s + parseFloat(i.amount), 0),
    [investmentsQuery.data]
  );

  const byCategory = useMemo(() => {
    const map: Record<number, { name: string; color: string; total: number }> = {};
    (investmentsQuery.data ?? []).forEach((inv) => {
      const cat = catMap.get(inv.categoryId);
      if (!map[inv.categoryId]) {
        map[inv.categoryId] = { name: cat?.name ?? "Outros", color: cat?.color ?? "#6b7280", total: 0 };
      }
      map[inv.categoryId].total += parseFloat(inv.amount);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [investmentsQuery.data, catMap]);

  const now = new Date();
  const currentGoals = (goalsQuery.data ?? []).filter(
    (g) => g.year === now.getFullYear() && (g.period === "annual" || g.month === now.getMonth() + 1)
  );

  const thisMonthInvested = useMemo(() => {
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;
    return (investmentsQuery.data ?? [])
      .filter((i) => {
        const d = typeof i.investmentDate === "string" ? i.investmentDate : (i.investmentDate as any)?.toISOString?.()?.split("T")[0] ?? "";
        return d >= start && d <= end;
      })
      .reduce((s, i) => s + parseFloat(i.amount), 0);
  }, [investmentsQuery.data]);

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Investimentos
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Acompanhe sua carteira de investimentos</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Target className="w-4 h-4" />
                Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-sm">
              <DialogHeader><DialogTitle>Definir Meta</DialogTitle></DialogHeader>
              <GoalForm onSuccess={() => setGoalDialogOpen(false)} onClose={() => setGoalDialogOpen(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-md">
              <DialogHeader><DialogTitle>Novo Investimento</DialogTitle></DialogHeader>
              <InvestmentForm onSuccess={() => setDialogOpen(false)} onClose={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Investido</p>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalInvested)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Este Mês</p>
            </div>
            <p className="text-2xl font-bold text-blue-400">{formatCurrency(thisMonthInvested)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals */}
      {currentGoals.length > 0 && (
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Metas de Investimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentGoals.map((goal) => {
              const target = parseFloat(goal.targetAmount);
              const current = goal.period === "monthly" ? thisMonthInvested : totalInvested;
              const pct = Math.min(100, target > 0 ? (current / target) * 100 : 0);
              return (
                <div key={goal.id}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm font-medium">{goal.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(current)} / {formatCurrency(target)}
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <p className="text-[10px] text-muted-foreground mt-1">{pct.toFixed(1)}% da meta atingida</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Distribution Chart */}
      {byCategory.length > 0 && (
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="45%" height={180}>
                <PieChart>
                  <Pie data={byCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="total">
                    {byCategory.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => formatCurrency(v)}
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {byCategory.map((cat: any) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                    <span className="text-xs text-muted-foreground flex-1 truncate">{cat.name}</span>
                    <span className="text-xs font-medium">{percentOf(cat.total, totalInvested)}</span>
                    <span className="text-xs text-muted-foreground">{formatCurrency(cat.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Histórico de Investimentos</CardTitle>
        </CardHeader>
        <CardContent>
          {investmentsQuery.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (investmentsQuery.data ?? []).length === 0 ? (
            <div className="text-center py-10">
              <TrendingUp className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum investimento registrado</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {(investmentsQuery.data ?? []).map((inv) => {
                const cat = catMap.get(inv.categoryId);
                return (
                  <div key={inv.id} className="flex items-center gap-3 py-3 hover:bg-secondary/20 rounded-lg px-2 transition-colors">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat?.color ?? "#10b981" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{inv.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {cat?.name ?? "Outros"} · {formatDate(inv.investmentDate as any)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-400">{formatCurrency(inv.amount)}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteId(inv.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir investimento</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => { deleteInvestment(deleteId!).then(() => setDeleteId(null)); }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
