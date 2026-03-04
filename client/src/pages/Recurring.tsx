import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, getCurrentYearMonth } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pencil, Trash2, RefreshCw, CalendarClock, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { toast } from "sonner";

const PAYMENT_METHODS = [
  { value: "pix", label: "PIX" },
  { value: "credit", label: "Crédito" },
  { value: "debit", label: "Débito" },
  { value: "cash", label: "Dinheiro" },
  { value: "boleto", label: "Boleto" },
];

type RecurringForm = {
  description: string;
  amount: string;
  type: "income" | "expense";
  categoryId: string;
  paymentMethod: string;
  expenseType: "fixed" | "variable";
  dayOfMonth: string;
  notes: string;
};

const emptyForm: RecurringForm = {
  description: "",
  amount: "",
  type: "expense",
  categoryId: "",
  paymentMethod: "pix",
  expenseType: "fixed",
  dayOfMonth: "1",
  notes: "",
};

function RecurringForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: RecurringForm;
  onSave: (data: RecurringForm) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<RecurringForm>(initial ?? emptyForm);
  const catsQuery = trpc.categories.list.useQuery();
  const categories = useMemo(
    () => (catsQuery.data ?? []).filter((c) => c.type === form.type || c.type === "both"),
    [catsQuery.data, form.type]
  );

  const set = (k: keyof RecurringForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) return toast.error("Informe a descrição");
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0)
      return toast.error("Informe um valor válido");
    if (!form.categoryId) return toast.error("Selecione uma categoria");
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Descrição</Label>
          <Input
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Ex: Salário, Aluguel, Netflix..."
            className="bg-secondary/30 border-border/50 h-9"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Tipo</Label>
          <Select value={form.type} onValueChange={(v) => { set("type", v); set("categoryId", ""); }}>
            <SelectTrigger className="bg-secondary/30 border-border/50 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Entrada</SelectItem>
              <SelectItem value="expense">Saída</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Valor (R$)</Label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            placeholder="0,00"
            className="bg-secondary/30 border-border/50 h-9"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Categoria</Label>
          <Select value={form.categoryId} onValueChange={(v) => set("categoryId", v)}>
            <SelectTrigger className="bg-secondary/30 border-border/50 h-9 text-sm">
              <SelectValue placeholder="Selecionar..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Dia do mês</Label>
          <Input
            type="number"
            min="1"
            max="28"
            value={form.dayOfMonth}
            onChange={(e) => set("dayOfMonth", e.target.value)}
            className="bg-secondary/30 border-border/50 h-9"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Pagamento</Label>
          <Select value={form.paymentMethod} onValueChange={(v) => set("paymentMethod", v)}>
            <SelectTrigger className="bg-secondary/30 border-border/50 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Fixo/Variável</Label>
          <Select value={form.expenseType} onValueChange={(v) => set("expenseType", v as any)}>
            <SelectTrigger className="bg-secondary/30 border-border/50 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixo</SelectItem>
              <SelectItem value="variable">Variável</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Observações (opcional)</Label>
          <Input
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Notas adicionais..."
            className="bg-secondary/30 border-border/50 h-9"
          />
        </div>
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" size="sm" disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          {initial ? "Salvar" : "Criar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function Recurring() {
  const utils = trpc.useUtils();
  const now = getCurrentYearMonth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const listQuery = trpc.recurring.list.useQuery();
  const catsQuery = trpc.categories.list.useQuery();

  const catMap = useMemo(() => {
    const m = new Map<number, string>();
    (catsQuery.data ?? []).forEach((c) => m.set(c.id, c.name));
    return m;
  }, [catsQuery.data]);

  const createMutation = trpc.recurring.create.useMutation({
    onSuccess: () => {
      utils.recurring.list.invalidate();
      toast.success("Recorrência criada!");
      setDialogOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.recurring.update.useMutation({
    onSuccess: () => {
      utils.recurring.list.invalidate();
      toast.success("Recorrência atualizada!");
      setDialogOpen(false);
      setEditItem(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.recurring.delete.useMutation({
    onSuccess: () => {
      utils.recurring.list.invalidate();
      toast.success("Recorrência removida");
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const generateMutation = trpc.recurring.generate.useMutation({
    onSuccess: (data) => {
      utils.transactions.list.invalidate();
      if (data.generated === 0) {
        toast.info("Nenhuma transação nova gerada (já geradas ou sem recorrências ativas)");
      } else {
        toast.success(`${data.generated} transação(ões) gerada(s) para ${now.month}/${now.year}!`);
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.recurring.update.useMutation({
    onSuccess: () => utils.recurring.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const handleSave = (form: RecurringForm) => {
    const payload = {
      description: form.description,
      amount: parseFloat(form.amount),
      type: form.type,
      categoryId: parseInt(form.categoryId),
      paymentMethod: form.paymentMethod as any,
      expenseType: form.expenseType,
      dayOfMonth: parseInt(form.dayOfMonth),
      notes: form.notes || undefined,
    };
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const items = listQuery.data ?? [];
  const totalMonthly = items
    .filter((i) => i.isActive)
    .reduce((sum, i) => {
      const amt = parseFloat(i.amount);
      return i.type === "income" ? sum + amt : sum - amt;
    }, 0);

  const activeIncome = items.filter((i) => i.isActive && i.type === "income").reduce((s, i) => s + parseFloat(i.amount), 0);
  const activeExpense = items.filter((i) => i.isActive && i.type === "expense").reduce((s, i) => s + parseFloat(i.amount), 0);

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Recorrências
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie transações automáticas mensais
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-8 border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
            onClick={() => generateMutation.mutate({ year: now.year, month: now.month })}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Gerar {now.month}/{now.year}
          </Button>
          <Button
            size="sm"
            className="gap-1.5 h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => { setEditItem(null); setDialogOpen(true); }}
          >
            <Plus className="w-3.5 h-3.5" />
            Nova
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Entradas/mês</p>
            </div>
            <p className="text-lg font-bold text-emerald-400">{formatCurrency(activeIncome)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Saídas/mês</p>
            </div>
            <p className="text-lg font-bold text-red-400">{formatCurrency(activeExpense)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CalendarClock className="w-3.5 h-3.5 text-blue-400" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Saldo recorrente</p>
            </div>
            <p className={`text-lg font-bold ${totalMonthly >= 0 ? "text-blue-400" : "text-red-400"}`}>
              {formatCurrency(totalMonthly)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="bg-amber-500/5 border-amber-500/20">
        <CardContent className="p-3 flex items-start gap-3">
          <RefreshCw className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-amber-300">Como funciona</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Clique em <strong className="text-amber-400">Gerar {now.month}/{now.year}</strong> para criar automaticamente as transações deste mês com base nas recorrências ativas. Cada recorrência é gerada apenas uma vez por mês.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-primary" />
            Recorrências Cadastradas
            <Badge variant="secondary" className="text-xs">{items.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {listQuery.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <CalendarClock className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">Nenhuma recorrência cadastrada</p>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => { setEditItem(null); setDialogOpen(true); }}
              >
                <Plus className="w-3.5 h-3.5" />
                Criar primeira recorrência
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: item.type === "income" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)" }}
                  >
                    {item.type === "income"
                      ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                      : <TrendingDown className="w-4 h-4 text-red-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{item.description}</p>
                      {!item.isActive && (
                        <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">Pausada</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {catMap.get(item.categoryId) ?? "—"} · Dia {item.dayOfMonth} · {item.paymentMethod.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className={`text-sm font-semibold ${item.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                      {item.type === "income" ? "+" : "-"}{formatCurrency(item.amount)}
                    </p>
                    <Switch
                      checked={item.isActive}
                      onCheckedChange={(v) => toggleMutation.mutate({ id: item.id, isActive: v })}
                      className="scale-75"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setEditItem(item);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteId(item.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setDialogOpen(false); setEditItem(null); } }}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editItem ? "Editar Recorrência" : "Nova Recorrência"}
            </DialogTitle>
          </DialogHeader>
          <RecurringForm
            initial={editItem ? {
              description: editItem.description,
              amount: editItem.amount,
              type: editItem.type,
              categoryId: String(editItem.categoryId),
              paymentMethod: editItem.paymentMethod,
              expenseType: editItem.expenseType,
              dayOfMonth: String(editItem.dayOfMonth),
              notes: editItem.notes ?? "",
            } : undefined}
            onSave={handleSave}
            onCancel={() => { setDialogOpen(false); setEditItem(null); }}
            isPending={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover recorrência</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? As transações já geradas não serão afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate({ id: deleteId! })}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
