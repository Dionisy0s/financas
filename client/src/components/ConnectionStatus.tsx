import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOfflineSyncContext } from '@/contexts/OfflineSyncContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type Props = {
  /** If true, shows expanded label; if false, shows icon only */
  expanded?: boolean;
};

export function ConnectionStatus({ expanded = true }: Props) {
  const { isOnline, syncStatus, pendingCount, triggerSync } = useOfflineSyncContext();

  const statusConfig = {
    idle: {
      icon: isOnline ? Wifi : WifiOff,
      color: isOnline ? 'text-emerald-400' : 'text-amber-400',
      dotColor: isOnline ? 'bg-emerald-400' : 'bg-amber-400',
      label: isOnline ? 'Online' : 'Offline',
      tooltip: isOnline
        ? pendingCount > 0
          ? `Online — ${pendingCount} operação${pendingCount > 1 ? 'ões' : ''} pendente${pendingCount > 1 ? 's' : ''}`
          : 'Conectado'
        : `Sem conexão — ${pendingCount} operação${pendingCount > 1 ? 'ões' : ''} pendente${pendingCount > 1 ? 's' : ''}`,
    },
    syncing: {
      icon: RefreshCw,
      color: 'text-blue-400',
      dotColor: 'bg-blue-400',
      label: 'Sincronizando...',
      tooltip: 'Sincronizando dados com o servidor',
    },
    success: {
      icon: CheckCircle,
      color: 'text-emerald-400',
      dotColor: 'bg-emerald-400',
      label: 'Sincronizado',
      tooltip: 'Dados sincronizados com sucesso',
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-400',
      dotColor: 'bg-red-400',
      label: 'Erro na sync',
      tooltip: 'Erro ao sincronizar. Clique para tentar novamente.',
    },
  };

  const config = statusConfig[syncStatus];
  const Icon = config.icon;
  const isAnimating = syncStatus === 'syncing';
  const isClickable = (syncStatus === 'error' || (isOnline && pendingCount > 0)) && syncStatus !== 'syncing';

  const content = (
    <button
      onClick={isClickable ? triggerSync : undefined}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-md transition-all w-full',
        isClickable && 'hover:bg-secondary cursor-pointer',
        !isClickable && 'cursor-default'
      )}
    >
      {/* Status dot */}
      <span className="relative flex-shrink-0">
        <span className={cn('w-2 h-2 rounded-full block', config.dotColor)} />
        {isAnimating && (
          <span className={cn('absolute inset-0 w-2 h-2 rounded-full animate-ping', config.dotColor, 'opacity-75')} />
        )}
      </span>

      {expanded && (
        <span className={cn('text-xs font-medium', config.color)}>
          {config.label}
          {pendingCount > 0 && syncStatus === 'idle' && (
            <span className="ml-1 text-muted-foreground">({pendingCount})</span>
          )}
        </span>
      )}

      {expanded && isAnimating && (
        <RefreshCw className={cn('w-3 h-3 ml-auto', config.color, 'animate-spin')} />
      )}
    </button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {config.tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
