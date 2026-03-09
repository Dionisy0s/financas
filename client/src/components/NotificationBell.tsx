import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Bell, Check, CheckCheck, Trash2, X, AlertTriangle, Target, RefreshCw, BarChart2, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

type NotifType = "alert" | "goal" | "recurring" | "summary" | "reminder" | "info";

const TYPE_CONFIG: Record<NotifType, { icon: React.ElementType; color: string; bg: string }> = {
  alert:     { icon: AlertTriangle, color: "text-red-400",    bg: "bg-red-500/10" },
  goal:      { icon: Target,        color: "text-emerald-400", bg: "bg-emerald-500/10" },
  recurring: { icon: RefreshCw,     color: "text-blue-400",   bg: "bg-blue-500/10" },
  summary:   { icon: BarChart2,     color: "text-purple-400", bg: "bg-purple-500/10" },
  reminder:  { icon: Clock,         color: "text-amber-400",  bg: "bg-amber-500/10" },
  info:      { icon: Info,          color: "text-sky-400",    bg: "bg-sky-500/10" },
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const listQuery = trpc.notifications.list.useQuery({ limit: 30 }, { refetchInterval: 30000 });
  const unreadQuery = trpc.notifications.unreadCount.useQuery(undefined, { refetchInterval: 30000 });

  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const markAllReadMutation = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
      toast.success("Todas marcadas como lidas");
    },
  });

  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const deleteAllMutation = trpc.notifications.deleteAll.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
      toast.success("Histórico limpo");
    },
  });

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const unread = unreadQuery.data?.count ?? 0;
  const notifications = listQuery.data ?? [];

  const handleOpen = () => {
    setOpen((v) => !v);
  };

  const handleMarkRead = (id: number) => {
    markReadMutation.mutate({ id });
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        aria-label="Notificações"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute left-full top-0 ml-2 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Notificações</span>
              {unread > 0 && (
                <Badge className="h-4 text-[10px] bg-red-500/20 text-red-400 border-red-500/30 px-1.5">
                  {unread} nova{unread > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => deleteAllMutation.mutate()}
                  className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Limpar histórico"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <ScrollArea className="max-h-96">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Bell className="w-8 h-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {notifications.map((n) => {
                  const cfg = TYPE_CONFIG[n.type as NotifType] ?? TYPE_CONFIG.info;
                  const Icon = cfg.icon;
                  const timeAgo = formatDistanceToNow(new Date(n.createdAt), {
                    addSuffix: true,
                    locale: ptBR,
                  });
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 transition-colors group",
                        !n.isRead ? "bg-primary/5" : "hover:bg-secondary/30"
                      )}
                    >
                      {/* Icon */}
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", cfg.bg)}>
                        <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-medium leading-tight", !n.isRead ? "text-foreground" : "text-muted-foreground")}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                          {n.body}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.isRead && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            className="p-1 rounded text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            title="Marcar como lida"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteMutation.mutate({ id: n.id })}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Remover"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Unread dot */}
                      {!n.isRead && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
