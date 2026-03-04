import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PRESET_COLORS = [
  "#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#a855f7",
  "#6b7280", "#14b8a6", "#f43f5e", "#0ea5e9", "#d97706",
];

const PRESET_ICONS = [
  "tag", "briefcase", "home", "car", "utensils", "heart", "book",
  "smile", "shirt", "repeat", "trending-up", "plus-circle", "wallet",
  "shopping-cart", "coffee", "music", "plane", "gift", "phone",
];

function CategoryForm({
  initial,
  onSuccess,
  onClose,
}: {
  initial?: { id: number; name: string; icon: string; color: string; type: string };
  onSuccess: () => void;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    icon: initial?.icon ?? "tag",
    color: initial?.color ?? "#6366f1",
    type: (initial?.type ?? "both") as "income" | "expense" | "both",
  });

  const createMutation = trpc.categories.create.useMutation({
    onSuccess: () => { utils.categories.list.invalidate(); toast.success("Categoria criada!"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.categories.update.useMutation({
    onSuccess: () => { utils.categories.list.invalidate(); toast.success("Categoria atualizada!"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initial) {
      updateMutation.mutate({ id: initial.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Nome *</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Nome da categoria"
          required
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Tipo</Label>
        <Select value={form.type} onValueChange={(v: any) => setForm((f) => ({ ...f, type: v }))}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="income">Entrada</SelectItem>
            <SelectItem value="expense">Saída</SelectItem>
            <SelectItem value="both">Ambos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Cor</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${form.color === c ? "ring-2 ring-offset-2 ring-offset-card ring-white scale-110" : ""}`}
              style={{ background: c }}
              onClick={() => setForm((f) => ({ ...f, color: c }))}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : initial ? "Salvar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}

export default function Categories() {
  const utils = trpc.useUtils();
  const categoriesQuery = trpc.categories.list.useQuery();
  const deleteMutation = trpc.categories.delete.useMutation({
    onSuccess: () => { utils.categories.list.invalidate(); toast.success("Categoria excluída"); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const categories = categoriesQuery.data ?? [];
  const defaultCats = categories.filter((c) => c.isDefault || c.userId === null);
  const customCats = categories.filter((c) => !c.isDefault && c.userId !== null);

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Categorias
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie suas categorias de transações
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditItem(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              Nova
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-sm">
            <DialogHeader>
              <DialogTitle>{editItem ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
            </DialogHeader>
            <CategoryForm
              initial={editItem}
              onSuccess={() => { setDialogOpen(false); setEditItem(null); }}
              onClose={() => { setDialogOpen(false); setEditItem(null); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Custom Categories */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            Minhas Categorias
            <Badge variant="secondary" className="text-xs">{customCats.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customCats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma categoria personalizada. Crie uma acima!
            </p>
          ) : (
            <div className="space-y-2">
              {customCats.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color ?? "#6b7280" }} />
                  <span className="flex-1 text-sm font-medium">{cat.name}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {cat.type === "income" ? "Entrada" : cat.type === "expense" ? "Saída" : "Ambos"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-muted-foreground hover:text-foreground"
                    onClick={() => { setEditItem(cat); setDialogOpen(true); }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteId(cat.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Default Categories */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Tag className="w-4 h-4 text-muted-foreground" />
            Categorias Padrão
            <Badge variant="secondary" className="text-xs">{defaultCats.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {defaultCats.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/30 border border-border/30"
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color ?? "#6b7280" }} />
                <span className="text-xs font-medium truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Esta ação não pode ser desfeita. As transações associadas manterão a referência.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate({ id: deleteId! })}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
