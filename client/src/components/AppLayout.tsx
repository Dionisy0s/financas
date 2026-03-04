import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tag,
  TrendingUp,
  FileText,
  Users,
  Settings,
  TrendingUpIcon,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transacoes", icon: ArrowLeftRight, label: "Transações" },
  { href: "/categorias", icon: Tag, label: "Categorias" },
  { href: "/investimentos", icon: TrendingUp, label: "Investimentos" },
  { href: "/relatorios", icon: FileText, label: "Relatórios" },
  { href: "/familia", icon: Users, label: "Família" },
  { href: "/configuracoes", icon: Settings, label: "Configurações" },
];

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: any;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer group",
          active
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        <Icon
          className={cn(
            "w-4 h-4 flex-shrink-0 transition-colors",
            active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
          )}
        />
        <span>{label}</span>
        {active && <ChevronRight className="w-3 h-3 ml-auto text-primary" />}
      </div>
    </Link>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <TrendingUpIcon className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-sm tracking-tight text-sidebar-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              FINANÇAS
            </p>
            <p className="text-[10px] text-muted-foreground">Planejamento Pessoal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={location === item.href}
            onClick={() => setMobileOpen(false)}
          />
        ))}
      </nav>

      {/* User Profile */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-secondary transition-colors">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.name ?? "Usuário"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email ?? ""}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => logoutMutation.mutate()}
            title="Sair"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col bg-sidebar border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col lg:hidden transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-end px-4 py-3 border-b border-sidebar-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <SidebarContent />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="w-8 h-8"
          >
            <Menu className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <TrendingUpIcon className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              FINANÇAS
            </span>
          </div>
          <Avatar className="w-7 h-7">
            <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
