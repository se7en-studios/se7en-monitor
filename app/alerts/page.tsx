"use client";

import { useState } from "react";
import { AlertOctagon, Bell, Info, Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import {
  byNewest,
  currentActor,
  patchDoc,
  useCollection,
} from "@/lib/firebase/data";
import { can } from "@/lib/roles";
import type { AlertSeverity, SystemAlert } from "@/types/monitor";
import { describeError, useToast } from "@/components/toast";
import {
  Chip,
  EmptyState,
  PageHeader,
  Segmented,
  Skeleton,
  btnSecondary,
} from "@/components/ui";
import { cn, formatDate, formatTimeAgo } from "@/lib/utils";

const sortAlerts = byNewest("timestamp");

type AckFilter = "pending" | "acknowledged" | "all";
const ACK_OPTIONS = [
  { id: "pending", label: "Pendientes" },
  { id: "acknowledged", label: "Reconocidas" },
  { id: "all", label: "Todas" },
] as const;

const SEVERITY: Record<
  AlertSeverity,
  { label: string; tone: string; icon: React.ReactNode }
> = {
  critical: {
    label: "Crítica",
    tone: "border-red-500/30",
    icon: <AlertOctagon className="h-5 w-5 text-red-400" />,
  },
  warning: {
    label: "Advertencia",
    tone: "border-amber-500/30",
    icon: <ShieldAlert className="h-5 w-5 text-amber-400" />,
  },
  info: {
    label: "Informativa",
    tone: "border-[var(--line)]",
    icon: <Info className="h-5 w-5 text-accent" />,
  },
};
const SEVERITIES = Object.keys(SEVERITY) as AlertSeverity[];

export default function AlertsPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const canHandle = can.handleIncidents(profile?.role);
  const { data: alerts, loading } = useCollection<SystemAlert>(
    "alerts",
    sortAlerts,
  );
  const [ack, setAck] = useState<AckFilter>("pending");
  const [severities, setSeverities] = useState<AlertSeverity[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggleSeverity = (s: AlertSeverity) =>
    setSeverities((list) =>
      list.includes(s) ? list.filter((x) => x !== s) : [...list, s],
    );

  const filtered = alerts.filter(
    (a) =>
      (ack === "all" ||
        (ack === "pending" ? !a.acknowledged : a.acknowledged)) &&
      (severities.length === 0 || severities.includes(a.severity)),
  );
  const pending = alerts.filter((a) => !a.acknowledged).length;

  const toggleAcknowledge = async (alert: SystemAlert) => {
    const next = !alert.acknowledged;
    setBusyId(alert.id);
    try {
      await patchDoc("alerts", alert.id, {
        acknowledged: next,
        acknowledged_by: next ? currentActor() : null,
        acknowledged_at: next ? new Date().toISOString() : null,
      });
      toast.success(
        next ? "Alerta reconocida" : "La alerta volvió a pendientes",
      );
    } catch (err) {
      console.error("[alertas]", err);
      toast.error(describeError(err, "No se pudo actualizar la alerta."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${pending} pendientes`}
        title="Alertas del"
        accent="sistema"
      >
        Avisos de cámaras y del corredor escolar. Reconocer una alerta deja
        registrado quién la vio y cuándo.
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Estado de la alerta"
          value={ack}
          onChange={setAck}
          options={ACK_OPTIONS}
        />
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Severidad"
        >
          {SEVERITIES.map((s) => (
            <Chip
              key={s}
              on={severities.includes(s)}
              onClick={() => toggleSeverity(s)}
            >
              {SEVERITY[s].label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {loading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}
        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={<Bell className="h-6 w-6" />}
            title={
              ack === "pending"
                ? "No hay alertas pendientes"
                : "No hay alertas con estos filtros"
            }
          />
        )}
        {filtered.map((alert) => (
          <AlertRow
            key={alert.id}
            alert={alert}
            canHandle={canHandle}
            busy={busyId === alert.id}
            onToggle={() => void toggleAcknowledge(alert)}
          />
        ))}
      </div>
    </div>
  );
}

function AlertRow({
  alert,
  canHandle,
  busy,
  onToggle,
}: {
  alert: SystemAlert;
  canHandle: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  const sev = SEVERITY[alert.severity] ?? SEVERITY.info;
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-4 rounded-xl border bg-[var(--panel)] p-4",
        sev.tone,
        alert.acknowledged && "opacity-75",
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5">{sev.icon}</span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="adm-title text-[13px] text-foreground">
              {alert.title}
            </h3>
            <span
              className="font-mono text-[11px] text-muted"
              title={formatDate(alert.timestamp)}
            >
              {formatTimeAgo(alert.timestamp)}
            </span>
          </div>
          <p className="mt-1 text-[13px] text-foreground/85">{alert.message}</p>
          {alert.acknowledged && alert.acknowledged_at && (
            <p className="mt-1 text-[12px] text-muted">
              Reconocida {formatTimeAgo(alert.acknowledged_at)}
              {alert.acknowledged_by && ` por ${alert.acknowledged_by}`}
            </p>
          )}
        </div>
      </div>
      {canHandle && (
        <button className={btnSecondary} disabled={busy} onClick={onToggle}>
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {alert.acknowledged ? "Marcar pendiente" : "Reconocer"}
        </button>
      )}
    </div>
  );
}
