"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import { useCollection, byNewest } from "@/lib/firebase/data";
import { can, ROLE_LABELS, type Role } from "@/lib/roles";
import { ACCESS_ACTION_LABELS } from "@/lib/audit-labels";
import type { AccessAction, AccessLog } from "@/types/monitor";
import { btnSecondary } from "@/components/ui";

const sortLogs = byNewest("at");
/** Se traen los últimos N registros; «Cargar más» suma otra tanda. */
const PAGE_SIZE = 500;
const SELECT =
  "focus-ring rounded-full border border-[var(--line)] bg-panel px-3 py-2 text-[13px] text-foreground";

const formatAt = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "medium",
  });

const csvCell = (v: string) => `"${v.replaceAll('"', '""')}"`;

function exportCsv(rows: AccessLog[]) {
  const header = [
    "Fecha",
    "Persona",
    "Email",
    "Rol",
    "Acción",
    "Cámara",
    "Escuela",
  ];
  const lines = rows.map((r) =>
    [
      formatAt(r.at),
      r.actor_name,
      r.actor_email,
      ROLE_LABELS[r.actor_role as Role] ?? r.actor_role,
      ACCESS_ACTION_LABELS[r.action] ?? r.action,
      r.camera_name ?? "",
      r.school_name ?? "",
    ]
      .map(csvCell)
      .join(","),
  );
  const blob = new Blob(
    ["﻿" + [header.map(csvCell).join(","), ...lines].join("\n")],
    {
      type: "text/csv;charset=utf-8",
    },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `auditoria-accesos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AuditPage() {
  const { profile } = useAuth();
  const [max, setMax] = useState(PAGE_SIZE);
  const {
    data: logs,
    loading,
    error,
    hasMore,
  } = useCollection<AccessLog>("access_logs", sortLogs, {
    orderByField: "at",
    limit: max,
  });
  const [action, setAction] = useState<AccessAction | "all">("all");
  const [person, setPerson] = useState("all");

  const people = useMemo(
    () => [...new Set(logs.map((l) => l.actor_email))].sort(),
    [logs],
  );
  const filtered = useMemo(
    () =>
      logs.filter(
        (l) =>
          (action === "all" || l.action === action) &&
          (person === "all" || l.actor_email === person),
      ),
    [logs, action, person],
  );

  if (!can.viewAudit(profile?.role)) {
    return (
      <p className="text-sm text-muted">
        Solo la administración puede ver la auditoría de accesos.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header className="adm-in flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="adm-label mb-3">Transparencia y control</p>
          <h1 className="adm-display text-[clamp(28px,3.6vw,44px)] text-foreground">
            Auditoría de <span className="adm-serif">accesos</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
            Quién ingresó al sistema y qué cámaras vio. El registro no se puede
            editar ni borrar.
          </p>
        </div>
        <button
          onClick={() => exportCsv(filtered)}
          disabled={filtered.length === 0}
          className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-[var(--line-strong)] px-3.5 py-2 text-[13px] font-semibold text-foreground hover:border-foreground disabled:opacity-40"
        >
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </header>

      <div className="adm-in flex flex-wrap gap-2">
        <select
          className={SELECT}
          value={action}
          onChange={(e) => setAction(e.target.value as AccessAction | "all")}
          aria-label="Filtrar por acción"
        >
          <option value="all">Todas las acciones</option>
          {(Object.keys(ACCESS_ACTION_LABELS) as AccessAction[]).map((a) => (
            <option key={a} value={a}>
              {ACCESS_ACTION_LABELS[a]}
            </option>
          ))}
        </select>
        <select
          className={SELECT}
          value={person}
          onChange={(e) => setPerson(e.target.value)}
          aria-label="Filtrar por persona"
        >
          <option value="all">Todas las personas</option>
          {people.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <span className="adm-label self-center">
          {filtered.length} registros
          {hasMore && ` · de los últimos ${logs.length}`}
        </span>
      </div>

      {error && (
        <p className="text-xs text-red-400">
          No se pudo cargar la auditoría: {error}
        </p>
      )}

      <div className="adm-in overflow-x-auto rounded-xl border border-[var(--line)] bg-panel">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--line)] text-muted">
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Persona</th>
              <th className="px-4 py-3">Acción</th>
              <th className="px-4 py-3">Cámara / escuela</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)] text-[13px]">
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-muted">
                  {logs.length
                    ? "No hay registros con estos filtros."
                    : "Todavía no hay accesos registrados."}
                </td>
              </tr>
            )}
            {filtered.map((l) => (
              <tr key={l.id} className="hover:bg-white/[0.02]">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-muted">
                  {formatAt(l.at)}
                </td>
                <td className="px-4 py-3">
                  <span className="block font-medium text-foreground">
                    {l.actor_name}
                  </span>
                  <span className="block text-[11px] text-muted">
                    {ROLE_LABELS[l.actor_role as Role] ?? l.actor_role}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground/85">
                  {ACCESS_ACTION_LABELS[l.action] ?? l.action}
                </td>
                <td className="px-4 py-3 text-muted">
                  {l.camera_name
                    ? `${l.camera_name} · ${l.school_name ?? ""}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            className={btnSecondary}
            disabled={loading}
            onClick={() => setMax((m) => m + PAGE_SIZE)}
          >
            Cargar más registros
          </button>
        </div>
      )}
    </div>
  );
}
