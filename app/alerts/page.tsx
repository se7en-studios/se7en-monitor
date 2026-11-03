"use client";

import { Bell, CheckCircle2, AlertOctagon, Info, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import { useCollection, patchDoc, byNewest } from "@/lib/firebase/data";
import { can } from "@/lib/roles";
import type { SystemAlert } from "@/types/monitor";
import { formatTimeAgo } from "@/lib/utils";

const sortAlerts = byNewest("timestamp");

export default function AlertsPage() {
  const { profile } = useAuth();
  const { data: alerts, loading } = useCollection<SystemAlert>("alerts", sortAlerts);
  const canHandle = can.handleIncidents(profile?.role);

  const toggleAcknowledge = (alert: SystemAlert) =>
    patchDoc("alerts", alert.id, { acknowledged: !alert.acknowledged }).catch((err) =>
      console.error("[alerts]", err)
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-xs font-semibold text-rose-400 uppercase tracking-wider">
            SISTEMA DE NOTIFICACIONES CRÍTICAS
          </span>
          <h1 className="mt-1 adm-display text-[clamp(28px,3.6vw,44px)] text-foreground">
            Alertas del Sistema
          </h1>
          <p className="text-xs text-muted">
            Eventos generados por sensores perimetrales y pérdida de enlace en escuelas de Catriel
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {loading && <p className="text-xs text-muted">Cargando…</p>}
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-xl border p-4.5 transition-all flex items-start justify-between gap-4 ${
 alert.severity ==="critical"
 ?"border-rose-500/30 bg-rose-500/5"
 : alert.severity ==="warning"
 ?"border-amber-500/30 bg-amber-500/5"
 :"border-accent/30 bg-accent-soft"
 }`}
          >
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5">
                {alert.severity === "critical" ? (
                  <AlertOctagon className="h-5 w-5 text-rose-400" />
                ) : alert.severity === "warning" ? (
                  <ShieldAlert className="h-5 w-5 text-amber-400" />
                ) : (
                  <Info className="h-5 w-5 text-accent" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="adm-title text-[13px] text-foreground">{alert.title}</h3>
                  <span className="font-mono text-[10px] text-muted">
                    {formatTimeAgo(alert.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-foreground/85 mt-1">{alert.message}</p>
              </div>
            </div>

            <button
              disabled={!canHandle}
              onClick={() => toggleAcknowledge(alert)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors shrink-0 ${
 alert.acknowledged
 ?"border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
 :"border-[var(--line)] bg-white/[0.05] text-foreground/85 hover:bg-white/[0.1]"
 }`}
            >
              {alert.acknowledged ? "Reconocida" : "Reconocer"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

