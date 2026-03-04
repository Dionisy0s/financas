import { getLoginUrl } from "@/const";
import { TrendingUp, Shield, Users, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Login() {
  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            FINANÇAS
          </span>
        </div>
        <Button onClick={handleLogin} variant="outline" size="sm" className="gap-2">
          Entrar
          <ArrowRight className="w-3 h-3" />
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Controle financeiro completo
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Suas finanças,{" "}
            <span className="text-primary">sob controle</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            Gerencie entradas e saídas, acompanhe investimentos, visualize relatórios detalhados e tome decisões financeiras mais inteligentes — você e sua família juntos.
          </p>

          {/* CTA */}
          <Button
            onClick={handleLogin}
            size="lg"
            className="gap-2 text-base px-8 py-6 rounded-xl shadow-lg shadow-primary/25"
          >
            Começar agora
            <ArrowRight className="w-4 h-4" />
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            Gratuito · Seguro · Sem cartão de crédito
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-20">
          {[
            {
              icon: BarChart3,
              title: "Dashboard Inteligente",
              desc: "Visualize entradas, saídas e saldo com gráficos detalhados por categoria e período.",
            },
            {
              icon: Users,
              title: "Visão Familiar",
              desc: "Separe as finanças de cada membro e veja o consolidado total da família.",
            },
            {
              icon: Shield,
              title: "Investimentos",
              desc: "Acompanhe seus investimentos, metas e distribuição por categoria.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl bg-card border border-border/50 text-left hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-muted-foreground border-t border-border/50">
        © {new Date().getFullYear()} FINANÇAS · Planejamento Financeiro Pessoal
      </footer>
    </div>
  );
}
