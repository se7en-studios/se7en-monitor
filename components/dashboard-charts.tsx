"use client";

import { ShieldCheck, Activity, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { DashboardMetrics, Incident } from "@/types/monitor";

interface DashboardChartsProps {
  metrics: DashboardMetrics;
  incidents: Incident[];
}

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAYS_SHOWN = 7;
const CLOSED_STATES: Incident["status"][] = ["resuelto", "cerrado"];

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function lastDays(incidents: Incident[]) {
  const counts = new Map<string, number>();
  for (const inc of incidents) {
    const key = dayKey(new Date(inc.reported_at));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const today = new Date();
  const days = Array.from({ length: DAYS_SHOWN }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (DAYS_SHOWN - 1 - i));
    const isToday = i === DAYS_SHOWN - 1;
    return {
      day: isToday ? "Hoy" : DAY_LABELS[date.getDay()],
      incidents: counts.get(dayKey(date)) ?? 0,
      active: isToday,
    };
  });
  const max = Math.max(1, ...days.map((d) => d.incidents));
  return days.map((d) => ({
    ...d,
    height: `${Math.max(8, (d.incidents / max) * 100)}%`,
  }));
}

const pct = (part: number, total: number) => (total ? (part / total) * 100 : 0);

const TILES = [
  { key: "online", label: "En línea", note: "Transmisión OK", tone: "emerald" },
  {
    key: "warning",
    label: "Alerta",
    note: "Alerta o mantenimiento",
    tone: "amber",
  },
  { key: "offline", label: "Sin señal", note: "Desconectada", tone: "rose" },
] as const;

const TONE = {
  emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
  amber: "border-amber-500/20 bg-amber-500/5 text-amber-300",
  rose: "border-rose-500/20 bg-rose-500/5 text-rose-300",
};

export function DashboardCharts({ metrics, incidents }: DashboardChartsProps) {
  const days = lastDays(incidents);
  const weekTotal = days.reduce((sum, d) => sum + d.incidents, 0);
  const resolved = incidents.filter((i) =>
    CLOSED_STATES.includes(i.status),
  ).length;
  const {
    total_cameras: total,
    cameras_online: online,
    cameras_warning: warning,
    cameras_offline: offline,
  } = metrics;
  const counts = { online, warning, offline };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card
        title="Estado de las cámaras"
        action={
          <span className="flex items-center gap-1.5 font-mono text-[12px] text-emerald-400">
            <Activity className="h-3.5 w-3.5" />
            {Math.round(pct(online, total))}% en línea
          </span>
        }
      >
        <div className="space-y-4 p-4">
          <p className="text-[12px] text-muted">
            Red de videovigilancia en {metrics.total_schools} establecimientos
          </p>
          <div
            className="flex h-3 w-full overflow-hidden rounded-full border border-[var(--line)] bg-[var(--well)]"
            role="img"
            aria-label={`${online} en línea, ${warning} en alerta, ${offline} sin señal`}
          >
            <div
              style={{ width: `${pct(online, total)}%` }}
              className="h-full bg-emerald-500"
            />
            <div
              style={{ width: `${pct(warning, total)}%` }}
              className="h-full bg-amber-400"
            />
            <div
              style={{ width: `${pct(offline, total)}%` }}
              className="h-full bg-rose-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {TILES.map((t) => (
              <div
                key={t.key}
                className={cn(
                  "rounded-lg border p-3 text-center",
                  TONE[t.tone],
                )}
              >
                <p className="font-mono text-[10.5px] tracking-[0.1em] uppercase">
                  {t.label}
                </p>
                <p className="adm-num mt-1 text-[32px] leading-none">
                  {counts[t.key]}
                </p>
                <p className="mt-0.5 hidden text-[11px] text-muted sm:block">
                  {t.note}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-accent/20 bg-accent-soft p-3 text-[12px]">
            <span className="flex items-center gap-2 text-foreground/85">
              <ShieldCheck className="h-4 w-4 text-accent" />
              Perímetro de 200 m cubierto
            </span>
            <span className="font-mono font-medium text-accent">
              {metrics.corridor_meters_covered.toLocaleString("es-AR")} m de
              radio
            </span>
          </div>
        </div>
      </Card>

      <Card
        title="Incidentes, últimos 7 días"
        action={
          <span className="flex items-center gap-1 font-mono text-[12px] text-muted">
            <TrendingUp className="h-3.5 w-3.5 text-accent" />
            Total: {weekTotal}
          </span>
        }
      >
        <div className="p-4">
          <div className="flex h-40 items-end justify-between gap-1 pt-4">
            {days.map((d, index) => (
              <div
                key={index}
                className="group flex flex-1 flex-col items-center gap-2"
              >
                <span className="font-mono text-[11px] text-muted">
                  {d.incidents}
                </span>
                <div className="flex h-28 w-full max-w-[28px] items-end rounded-md bg-[var(--well)] p-1">
                  <div
                    style={{ height: d.height }}
                    className={cn(
                      "w-full rounded transition-all duration-300",
                      d.active ? "bg-accent" : "bg-accent/50",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "font-mono text-[11px]",
                    d.active ? "font-bold text-accent" : "text-muted",
                  )}
                >
                  {d.day}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-3 text-[12px] text-muted">
            <span>{incidents.length} incidentes en total</span>
            <span className="font-mono font-medium text-emerald-400">
              {Math.round(pct(resolved, incidents.length))}% resueltos o
              cerrados
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
