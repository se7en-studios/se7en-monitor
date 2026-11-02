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
  const colorMap = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20 group-hover:border-blue-500/40",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 group-hover:border-emerald-500/40",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20 group-hover:border-amber-500/40",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20 group-hover:border-rose-500/40",
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20 group-hover:border-indigo-500/40",
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0e131f] p-5 transition-all duration-300 hover:border-white/[0.16] hover:bg-[#121929] hover:shadow-xl hover:shadow-black/40">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tracking-tight text-white">
              {value}
            </span>
            {subtitle && (
              <span className="text-xs text-slate-400">
                {subtitle}
              </span>
            )}
          </div>
        </div>
        <div className={cn("rounded-lg border p-2.5 transition-colors", colorMap[highlightColor])}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "font-mono font-semibold",
              trend.isPositive ? "text-emerald-400" : "text-rose-400"
            )}
          >
            {trend.value}
          </span>
          <span className="text-slate-500">{trend.label || "vs. período anterior"}</span>
        </div>
      )}
    </div>
  );
}

