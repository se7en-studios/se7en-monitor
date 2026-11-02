import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "online" | "offline" | "mantenimiento" | "alerta" | "operativo" | "atencion_requerida" | "en_obra";
  size?: "sm" | "md";
  showDot?: boolean;
}

export function StatusBadge({ status, size = "md", showDot = true }: StatusBadgeProps) {
  const config = {
    online: {
      label: "ONLINE",
      bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-400 animate-live-pulse",
    },
    operativo: {
      label: "OPERATIVO",
      bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-400",
    },
    alerta: {
      label: "ALERTA",
      bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      dot: "bg-amber-400",
    },
    atencion_requerida: {
      label: "ATENCIÓN",
      bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      dot: "bg-amber-400",
    },
    offline: {
      label: "OFFLINE",
      bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      dot: "bg-rose-400",
    },
    mantenimiento: {
      label: "MANTENIMIENTO",
      bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      dot: "bg-blue-400",
    },
    en_obra: {
      label: "EN OBRA",
      bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      dot: "bg-indigo-400",
    },
  }[status] || {
    label: status.toUpperCase(),
    bg: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-mono font-medium tracking-wider uppercase",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        config.bg
      )}
    >
      {showDot && <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />}
      {config.label}
    </span>
  );
}
