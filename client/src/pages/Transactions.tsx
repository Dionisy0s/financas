import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useOfflineTransactions } from "@/hooks/useOfflineTransactions";
import { useOfflineSyncContext } from "@/contexts/OfflineSyncContext";
import {
  formatCurrency,
  formatDate,
  formatMonthYear,
  getCurrentYearMonth,
  getPaymentMethodLabel,
  getExpenseTypeLabel,
} from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  TrendingDown,
  Loader2,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";

const PAYMENT_ICONS: Record<string, any> = {
  pix: Smartphone,
  credit: CreditCard,
  debit: CreditCard,
  cash: Banknote,
  boleto: FileText,
};

function TransactionForm({
  onSuccess,
  onClose,
}: {
  onSuccess: () => void;
  onClose: () => void;
}) {
  const categoriesQuery = trpc.categories.list.useQuery();
  const { createTransaction, isCreating } = useOfflineTransactions();

  const [form, setForm] = useState({
    type: "expense" as "income" | "expense",
    amount: "",
    description: "",
    categoryId: "",
    paymentMethod: "pix" as "pix" | "credit" | "debit" | "cash" | "boleto",
    expenseType: "variable" as "fixed" | "variable",
    transactionDate: new Date().toISOString().split("T")[0],
    notes: "",
    installments: "1",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) return toast.error("Selecione uma categoria");
    createTransaction({
      type: form.type,
      amount: parseFloat(form.amount),
      description: form.description,
      categoryId: parseInt(form.categoryId),
      paymentMethod: form.paymentMethod,
      expenseType: form.expenseType,
      transactionDate: form.transactionDate,
      notes: form.notes || undefined,
      installments: parseInt(form.installments),
    }).then(() => onSuccess()).catch(() => {});
  };

  const categories = categoriesQuery.data ?? [];
  const filteredCats = categories.filter(
    (c) => c.type === form.type || c.type === "both"
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type Toggle */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={form.type === "income" ? "default" : "outline"}
          className={form.type === "income" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
          onClick={() => setForm((f) => ({ ...f, type: "income" }))}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Entrada
        </Button>
        <Button
          type="button"
          variant={form.type === "expense" ? "default" : "outline"}
          className={form.type === "expense" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
          onClick={() => setForm((f) => ({ ...f, type: "expense" }))}
        >
          <TrendingDown className="w-4 h-4 mr-2" />
          Saída
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Valor (R$) *</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0,00"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            required
            className="bg-secondary border-border"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Data *</Label>
          <Input
            type="date"
            value={form.transactionDate}
            onChange={(e) => setForm((f) => ({ ...f, transactionDate: e.target.value }))}
            required
            className="bg-secondary border-border"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Descrição *</Label>
        <Input
          placeholder="Ex: Supermercado, Salário..."
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          required
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Categoria *</Label>
        <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {filteredCats.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Forma de Pagamento *</Label>
          <Select
            value={form.paymentMethod}
            onValueChange={(v: any) => setForm((f) => ({ ...f, paymentMethod: v, installments: v !== "credit" ? "1" : f.installments }))}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="credit">Crédito</SelectItem>
              <SelectItem value="debit">Débito</SelectItem>
              <SelectItem value="cash">Dinheiro</SelectItem>
              <SelectItem value="boleto">Boleto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Tipo</Label>
          <Select
            value={form.expenseType}
            onValueChange={(v: any) => setForm((f) => ({ ...f, expenseType: v }))}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixo</SelectItem>
              <SelectItem value="variable">Variável</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {form.paymentMethod === "credit" && form.type === "expense" && (
        <div className="space-y-1.5">
          <Label className="text-xs">Parcelas</Label>
          <Select
            value={form.installments}
            onValueChange={(v) => setForm((f) => ({ ...f, installments: v }))}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n === 1 ? "À vista" : `${n}x de ${form.amount ? formatCurrency(parseFloat(form.amount) / n) : "..."}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs">Observações (opcional)</Label>
        <Textarea
          placeholder="Notas adicionais..."
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          className="bg-secondary border-border resize-none h-16 text-sm"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={isCreating}>
          {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

export default function Transactions() {
  const now = getCurrentYearMonth();
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);

  const txQuery = trpc.transactions.list.useQuery({ year, month });
  const categoriesQuery = trpc.categories.list.useQuery();
  const { deleteTransaction, isDeleting } = useOfflineTransactions();
  const { isOnline } = useOfflineSyncContext();

  const catMap = useMemo(() => {
    const m = new Map<number, { name: string; color: string }>();
    (categoriesQuery.data ?? []).forEach((c) => m.set(c.id, { name: c.name, color: c.color ?? "#6b7280" }));
    return m;
  }, [categoriesQuery.data]);

  const filtered = useMemo(() => {
    let txs = txQuery.data ?? [];
    if (typeFilter !== "all") txs = txs.filter((t) => t.type === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      txs = txs.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          catMap.get(t.categoryId)?.name.toLowerCase().includes(q)
      );
    }
    return txs;
  }, [txQuery.data, typeFilter, search, catMap]);

  const totalIncome = filtered.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + parseFloat(t.amount), 0);
  const totalExpense = filtered.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + parseFloat(t.amount), 0);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Transações
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie suas entradas e saídas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-card border border-border rounded-xl px-2 py-1">
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={prevMonth}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-sm font-medium px-2 min-w-[130px] text-center capitalize">
              {formatMonthYear(year, month)}
            </span>
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={nextMonth}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" />
                Nova
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Transação</DialogTitle>
              </DialogHeader>
              <TransactionForm
                onSuccess={() => setDialogOpen(false)}
                onClose={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-card border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Entradas</p>
            <p className="text-base font-bold text-emerald-400">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Saídas</p>
            <p className="text-base font-bold text-red-400">{formatCurrency(totalExpense)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Saldo</p>
            <p className={`text-base font-bold ${totalIncome - totalExpense >= 0 ? "text-blue-400" : "text-red-400"}`}>
              {formatCurrency(totalIncome - totalExpense)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar transações..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "income", "expense"] as const).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={typeFilter === t ? "default" : "outline"}
              onClick={() => setTypeFilter(t)}
              className="text-xs"
            >
              {t === "all" ? "Todos" : t === "income" ? "Entradas" : "Saídas"}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      <Card className="bg-card border-border/50">
        {txQuery.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ArrowUpDown className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma transação encontrada</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {search ? "Tente outro termo de busca" : "Adicione sua primeira transação"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((tx) => {
              const cat = catMap.get(tx.categoryId);
              const PayIcon = PAYMENT_ICONS[tx.paymentMethod] ?? Banknote;
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors">
                  {/* Category dot */}
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: cat?.color ?? "#6b7280" }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{tx.description}</p>
                      {tx.isInstallment && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 flex-shrink-0">
                          {tx.installmentNumber}/{tx.totalInstallments}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{cat?.name ?? "Outros"}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground">{formatDate(tx.transactionDate as any)}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <PayIcon className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{getPaymentMethodLabel(tx.paymentMethod)}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1 py-0 h-4 ${tx.expenseType === "fixed" ? "text-amber-400 border-amber-400/30" : "text-purple-400 border-purple-400/30"}`}
                      >
                        {getExpenseTypeLabel(tx.expenseType)}
                      </Badge>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-semibold ${tx.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                      {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </p>
                  </div>

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                    onClick={() => {
                      setDeleteId(tx.id);
                      if (tx.isInstallment && tx.installmentGroupId) {
                        setDeleteGroupId(tx.installmentGroupId);
                      } else {
                        setDeleteGroupId(null);
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transação</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteGroupId
                ? "Esta transação faz parte de um parcelamento. Deseja excluir apenas esta parcela ou todas as parcelas?"
                : "Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={deleteGroupId ? "flex-col sm:flex-row gap-2" : ""}>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {deleteGroupId && (
              <Button
                variant="outline"
                onClick={() => {
                  deleteTransaction({ id: deleteId!, deleteGroup: false }).then(() => { setDeleteId(null); setDeleteGroupId(null); });
                  setDeleteGroupId(null);
                }}
              >
                Só esta parcela
              </Button>
            )}
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                deleteTransaction({ id: deleteId!, deleteGroup: !!deleteGroupId }).then(() => { setDeleteId(null); setDeleteGroupId(null); });
                setDeleteGroupId(null);
              }}
            >
              {deleteGroupId ? "Excluir todas" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
