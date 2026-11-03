"use client";

import { Cctv, ShieldCheck, Activity, TrendingUp } from "lucide-react";
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Chart 1: Estado de Cámaras y Cobertura */}
      <div className="rounded-xl border border-[var(--line)] bg-panel p-5">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
          <div>
            <h3 className="adm-title text-[13px] text-foreground">
              Cámaras Operativas vs. Desconectadas
            </h3>
            <p className="text-xs text-muted">
              Red de videovigilancia en {metrics.total_schools} establecimientos
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
            <Activity className="h-3.5 w-3.5" />
            <span>{Math.round(pct(online, total))}% Online</span>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1.5 font-mono">
              <span className="text-foreground/85">
                {online} Operativas ({Math.round(pct(online, total))}%)
              </span>
              <span className="text-rose-400">{offline} Offline</span>
              <span className="text-amber-400">{warning} Alerta</span>
            </div>
            <div className="h-3.5 w-full rounded-full bg-panel-3 overflow-hidden flex p-0.5 border border-[var(--line)]">
              <div
                style={{ width: `${pct(online, total)}%` }}
                className="h-full bg-emerald-500 rounded-l-full"
                title={`${online} operativas`}
              />
              <div
                style={{ width: `${pct(warning, total)}%` }}
                className="h-full bg-amber-400"
                title={`${warning} en alerta o mantenimiento`}
              />
              <div
                style={{ width: `${pct(offline, total)}%` }}
                className="h-full bg-rose-500 rounded-r-full"
                title={`${offline} desconectadas`}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
              <p className="text-[10px] font-mono uppercase text-emerald-400">
                En Línea
              </p>
              <p className="mt-1 adm-num text-[32px] leading-none text-emerald-300">
                {online}
              </p>
              <p className="text-[10px] text-muted">Transmisión OK</p>
            </div>

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-center">
              <p className="text-[10px] font-mono uppercase text-amber-400">
                Alerta
              </p>
              <p className="mt-1 adm-num text-[32px] leading-none text-amber-300">
                {warning}
              </p>
              <p className="text-[10px] text-muted">
                Alerta o mantenimiento
              </p>
            </div>

            <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-center">
              <p className="text-[10px] font-mono uppercase text-rose-400">
                Desconectada
              </p>
              <p className="mt-1 adm-num text-[32px] leading-none text-rose-300">
                {offline}
              </p>
              <p className="text-[10px] text-muted">Sin señal</p>
            </div>
          </div>

          <div className="rounded-lg border border-accent/20 bg-accent-soft p-3 flex items-center justify-between text-xs">
            <span className="text-foreground/85 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" />
              Perímetro seguro 200m cubierto
            </span>
            <span className="font-mono font-bold text-accent">
              {metrics.corridor_meters_covered.toLocaleString("es-AR")} mts de
              radio
            </span>
          </div>
        </div>
      </div>

      {/* Chart 2: Incidentes por día */}
      <div className="rounded-xl border border-[var(--line)] bg-panel p-5">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
          <div>
            <h3 className="adm-title text-[13px] text-foreground">
              Incidentes Registrados (Últimos 7 días)
            </h3>
            <p className="text-xs text-muted">
              Corredores escolares y accesos a instituciones
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted font-mono">
            <TrendingUp className="h-3.5 w-3.5 text-accent" />
            <span>Total: {weekTotal}</span>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-end justify-between h-40 pt-4 px-2">
            {days.map((d, index) => (
              <div
                key={index}
                className="flex flex-col items-center gap-2 flex-1 group"
              >
                <span className="text-[10px] font-mono text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.incidents}
                </span>
                <div className="w-full max-w-[28px] h-32 bg-panel-3/60 rounded-md flex items-end p-1">
                  <div
                    style={{ height: d.height }}
                    className={`w-full rounded transition-all duration-300 group-hover:brightness-125 ${
 d.active
 ?"bg-accent"
 :"bg-accent/50"
 }`}
                  />
                </div>
                <span
                  className={`text-[11px] font-mono ${
 d.active ?"text-accent font-bold" :"text-muted"
 }`}
                >
                  {d.day}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-3 text-xs text-muted">
            <span>{incidents.length} incidentes en total</span>
            <span className="text-emerald-400 font-mono font-medium">
              {Math.round(pct(resolved, incidents.length))}% resueltos o
              cerrados
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
