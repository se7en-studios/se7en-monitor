import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  highlightColor?: "blue" | "emerald" | "amber" | "rose" | "indigo";
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  highlightColor = "blue",
}: StatCardProps) {
  const toneText = {
    blue: "text-accent",
    indigo: "text-accent",
    emerald: "text-emerald-300",
    amber: "text-amber-300",
    rose: "text-red-400",
  };

  return (
    <div className="adm-in rounded-xl border border-[var(--line)] bg-panel p-4 transition-colors hover:border-[var(--line-strong)]">
      <p className="adm-label flex items-center justify-between gap-2">
        <span className="truncate">{title}</span>
        <span className={cn("shrink-0", toneText[highlightColor])}>{icon}</span>
      </p>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="adm-num text-[44px] leading-none text-foreground">{value}</span>
        {subtitle && <span className="text-[12px] text-muted">{subtitle}</span>}
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-[var(--line)] pt-3 text-[12px]">
          <span
            className={cn(
              "font-mono font-medium",
              trend.isPositive ? "text-emerald-300" : "text-red-400"
            )}
          >
            {trend.value}
          </span>
          <span className="text-muted">{trend.label || "vs. período anterior"}</span>
        </div>
      )}
    </div>
  );
}
