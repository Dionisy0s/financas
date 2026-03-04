import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, UserPlus, Link2, Copy, CheckCircle, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Family() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const familyQuery = trpc.family.info.useQuery();
  const [groupName, setGroupName] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const createMutation = trpc.family.create.useMutation({
    onSuccess: () => { utils.family.info.invalidate(); toast.success("Grupo familiar criado!"); },
    onError: (e) => toast.error(e.message),
  });

  const inviteMutation = trpc.family.invite.useMutation({
    onSuccess: (data) => {
      setInviteUrl(data.inviteUrl);
      setInviteDialogOpen(true);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copiado!");
  };

  const family = familyQuery.data;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Família
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gerencie seu grupo familiar para visão consolidada das finanças
        </p>
      </div>

      {familyQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !family ? (
        /* Create Group */
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Criar Grupo Familiar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Crie um grupo familiar para compartilhar e consolidar as finanças com sua esposa ou outros membros da família.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do Grupo</Label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ex: Família Silva"
                className="bg-secondary border-border"
              />
            </div>
            <Button
              onClick={() => createMutation.mutate({ name: groupName || "Minha Família" })}
              disabled={createMutation.isPending}
              className="w-full"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Users className="w-4 h-4 mr-2" />}
              Criar Grupo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Group Info */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {family.group.name}
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => inviteMutation.mutate({ origin: window.location.origin })}
                  disabled={inviteMutation.isPending}
                >
                  {inviteMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  Convidar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {family.members.map((member) => {
                  const initials = member.user?.name
                    ? member.user.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
                    : "?";
                  const isMe = member.userId === user?.id;
                  return (
                    <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {member.user?.name ?? "Usuário"}
                            {isMe && <span className="text-muted-foreground text-xs"> (você)</span>}
                          </p>
                          {member.role === "owner" && (
                            <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{member.user?.email ?? ""}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] px-1.5">
                        {member.role === "owner" ? "Dono" : "Membro"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex gap-3">
              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-primary">Visão Consolidada Ativa</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No Dashboard, ative a aba "Família" para ver o saldo consolidado de todos os membros do grupo.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              Link de Convite
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Compartilhe este link com sua esposa ou familiar. O link expira em 7 dias.
            </p>
            <div className="flex gap-2">
              <Input
                value={inviteUrl}
                readOnly
                className="bg-secondary border-border text-xs"
              />
              <Button size="icon" variant="outline" onClick={handleCopy} className="flex-shrink-0">
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <Button className="w-full" onClick={() => setInviteDialogOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
