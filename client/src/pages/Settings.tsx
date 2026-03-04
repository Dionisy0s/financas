import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings2, Bell, DollarSign, AlertTriangle, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

export default function Settings() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const settingsQuery = trpc.settings.get.useQuery();
  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => { utils.settings.get.invalidate(); toast.success("Configurações salvas!"); },
    onError: (e) => toast.error(e.message),
  });

  const [alertThreshold, setAlertThreshold] = useState(80);
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);

  useEffect(() => {
    if (settingsQuery.data) {
      setAlertThreshold(settingsQuery.data.alertThresholdPercent ?? 80);
      setMonthlyIncome(settingsQuery.data.monthlyIncomeEstimate ?? "");
      setEmailNotifications(settingsQuery.data.emailNotifications ?? true);
    }
  }, [settingsQuery.data]);

  const handleSave = () => {
    updateMutation.mutate({
      alertThresholdPercent: alertThreshold,
      monthlyIncomeEstimate: monthlyIncome ? parseFloat(monthlyIncome) : undefined,
      emailNotifications,
    });
  };

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
    : "U";

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Configurações
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Personalize sua experiência financeira</p>
      </div>

      {/* Profile */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary" />
            Perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14">
              <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user?.name ?? "Usuário"}</p>
              <p className="text-sm text-muted-foreground">{user?.email ?? ""}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Settings */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            Configurações Financeiras
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs">Renda Mensal Estimada (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              placeholder="Ex: 5000,00"
              className="bg-secondary border-border"
            />
            <p className="text-[10px] text-muted-foreground">
              Usada para calcular o percentual comprometido da renda no dashboard.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Alert Settings */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Alertas de Gastos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-xs">Limite de Alerta</Label>
              <span className="text-sm font-bold text-amber-400">{alertThreshold}%</span>
            </div>
            <Slider
              value={[alertThreshold]}
              onValueChange={([v]) => setAlertThreshold(v)}
              min={10}
              max={100}
              step={5}
              className="w-full"
            />
            <p className="text-[10px] text-muted-foreground">
              Você receberá um alerta visual quando seus gastos ultrapassarem {alertThreshold}% da renda estimada.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Notificações por Email</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Receba alertas quando limites forem ultrapassados
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={updateMutation.isPending}
        className="w-full gap-2"
      >
        {updateMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        Salvar Configurações
      </Button>
    </div>
  );
}
