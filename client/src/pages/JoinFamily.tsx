import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Loader2, CheckCircle, XCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function JoinFamily() {
  const { code } = useParams<{ code: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  const joinMutation = trpc.family.join.useMutation({
    onSuccess: () => {
      setTimeout(() => navigate("/familia"), 2000);
    },
  });

  useEffect(() => {
    if (!loading && isAuthenticated && code && !joinMutation.isSuccess && !joinMutation.isPending && !joinMutation.isError) {
      joinMutation.mutate({ inviteCode: code });
    }
  }, [loading, isAuthenticated, code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="bg-card border-border max-w-sm w-full">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-lg font-bold">Convite Familiar</h2>
            <p className="text-sm text-muted-foreground">
              Você foi convidado para um grupo familiar. Faça login para aceitar o convite.
            </p>
            <Button className="w-full" onClick={() => { window.location.href = getLoginUrl(); }}>
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="bg-card border-border max-w-sm w-full">
        <CardContent className="p-6 text-center space-y-4">
          {joinMutation.isPending && (
            <>
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Processando convite...</p>
            </>
          )}
          {joinMutation.isSuccess && (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold">Bem-vindo ao grupo!</h2>
              <p className="text-sm text-muted-foreground">Você entrou no grupo familiar com sucesso. Redirecionando...</p>
            </>
          )}
          {joinMutation.isError && (
            <>
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-lg font-bold">Convite inválido</h2>
              <p className="text-sm text-muted-foreground">
                {joinMutation.error?.message ?? "O link de convite é inválido ou expirou."}
              </p>
              <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
                Ir para o Dashboard
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
