"use client";

import { Clock, User } from "lucide-react";
import type {
  Incident,
  IncidentPriority,
  IncidentStatus,
} from "@/types/monitor";
import {
  INCIDENT_PRIORITY_LABELS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_TYPE_LABELS,
} from "@/lib/incident-labels";
import { cn, formatDate, formatTimeAgo } from "@/lib/utils";

const PRIORITY_TONE: Record<IncidentPriority, string> = {
  critica: "bg-red-500/10 text-red-400 border-red-500/30",
  alta: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  media: "bg-accent-soft text-accent border-accent/30",
  baja: "text-muted border-[var(--line-strong)]",
};

const STATUSES = Object.keys(INCIDENT_STATUS_LABELS) as IncidentStatus[];

interface IncidentCardProps {
  incident: Incident;
  canHandle: boolean;
  busy: boolean;
  onChangeStatus: (status: IncidentStatus) => void;
}

export function IncidentCard({
  incident: inc,
  canHandle,
  busy,
  onChangeStatus,
}: IncidentCardProps) {
  return (
    <article className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
          <span className="font-mono font-semibold text-accent">
            {inc.code}
          </span>
          <span className="font-medium text-foreground">
            {inc.school_name ?? "Sin escuela"}
          </span>
          {inc.camera_name && (
            <span className="font-mono text-muted">{inc.camera_name}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 font-mono text-[10.5px] uppercase",
              PRIORITY_TONE[inc.priority],
            )}
          >
            {INCIDENT_PRIORITY_LABELS[inc.priority] ?? inc.priority}
          </span>
          <select
            aria-label={`Estado de ${inc.code}`}
            value={inc.status}
            disabled={!canHandle || busy}
            onChange={(e) => onChangeStatus(e.target.value as IncidentStatus)}
            className="focus-ring rounded-full border border-[var(--line-strong)] bg-[var(--well)] px-2.5 py-1 text-[12px] text-foreground disabled:opacity-60"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {INCIDENT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3">
        <p className="font-mono text-[11px] text-muted uppercase">
          {INCIDENT_TYPE_LABELS[inc.type] ?? inc.type}
        </p>
        <h3 className="adm-title mt-0.5 text-[15px] text-foreground">
          {inc.title}
        </h3>
        <p className="mt-1 text-[13px] leading-relaxed text-foreground/85">
          {inc.description}
        </p>
        {inc.notes && (
          <p className="mt-1 text-[12px] text-muted italic">
            Nota: {inc.notes}
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--line)] pt-3 text-[12px] text-muted">
        <span className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" /> Asignado a{" "}
          <strong className="text-foreground">
            {inc.assigned_to || "nadie"}
          </strong>
        </span>
        <span className="flex items-center gap-1.5 font-mono">
          <Clock className="h-3.5 w-3.5" /> {formatDate(inc.reported_at)}
        </span>
        {inc.updated_at && (
          <span>
            Último cambio {formatTimeAgo(inc.updated_at)}
            {inc.updated_by && ` por ${inc.updated_by}`}
          </span>
        )}
      </div>
    </article>
  );
}
