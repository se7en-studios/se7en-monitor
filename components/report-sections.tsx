"use client";

import { ShieldCheck } from "lucide-react";
import { useCollection, useDocument, byNewest } from "@/lib/firebase/data";
import { cameraCoverage } from "@/lib/geo";
import { ACCESS_ACTION_LABELS } from "@/lib/audit-labels";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import {
  POLICY_COLLECTION,
  POLICY_FIELDS,
  POLICY_ID,
  emptyPolicy,
} from "@/lib/policy";
import type {
  AccessAction,
  AccessLog,
  Camera,
  Incident,
  OperationalPolicy,
  School,
} from "@/types/monitor";

const CLOSED: Incident["status"][] = ["resuelto", "cerrado"];
const MANAGEMENT_LABELS = { estatal: "Estatal", privada: "Privada" } as const;
const sortLogs = byNewest("at");

const TABLE = "w-full border-collapse text-left text-xs";
const TH = "border-b border-[var(--line)] bg-[var(--well)] p-3";
const TD = "p-3";

export function ReportStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-panel p-4">
      <p className="adm-label">{label}</p>
      <p className="adm-num mt-2 text-[32px] leading-none text-foreground">
        {value}
      </p>
      {hint && <p className="mt-1.5 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

export function SectionTitle({
  n,
  children,
}: {
  n: number;
  children: React.ReactNode;
}) {
  return (
    <h3 className="adm-title mb-3 text-[13px] text-foreground">
      {n}. {children}
    </h3>
  );
}

/** Resumen de cobertura: lo usan la página de informes y el informe de cobertura. */
export function coverageStats(schools: School[], cameras: Camera[]) {
  const schoolById = new Map(schools.map((s) => [s.id, s]));
  const verified = cameras.filter(
    (c) => cameraCoverage(c, schoolById.get(c.school_id)) === "dentro",
  );
  const covered = schools.filter((s) =>
    verified.some((c) => c.school_id === s.id),
  );
  return {
    verifiedCameras: verified.length,
    schoolsCovered: covered.length,
    schoolsUncovered: schools.length - covered.length,
  };
}

export function CoverageSection({
  schools,
  cameras,
}: {
  schools: School[];
  cameras: Camera[];
}) {
  const stats = coverageStats(schools, cameras);
  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ReportStat label="Establecimientos" value={schools.length} />
        <ReportStat
          label="Con cobertura"
          value={stats.schoolsCovered}
          hint="≥ 1 cámara verificada"
        />
        <ReportStat label="Sin cobertura" value={stats.schoolsUncovered} />
        <ReportStat
          label="Cámaras verificadas"
          value={`${stats.verifiedCameras}/${cameras.length}`}
          hint="Dentro del radio"
        />
      </div>
      <SectionTitle n={1}>Cobertura por establecimiento</SectionTitle>
      <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
        <table className={TABLE}>
          <thead>
            <tr className="text-[10px] font-mono uppercase text-muted">
              <th className={TH}>Código</th>
              <th className={TH}>Establecimiento</th>
              <th className={TH}>Gestión</th>
              <th className={TH}>Radio</th>
              <th className={`${TH} text-right`}>Instaladas</th>
              <th className={`${TH} text-right`}>En radio</th>
              <th className={`${TH} text-right`}>En línea</th>
              <th className={TH}>Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {schools.map((s) => {
              const own = cameras.filter((c) => c.school_id === s.id);
              const inside = own.filter(
                (c) => cameraCoverage(c, s) === "dentro",
              ).length;
              const online = own.filter((c) => c.status === "online").length;
              return (
                <tr key={s.id}>
                  <td className={`${TD} font-mono font-bold text-accent`}>
                    {s.code}
                  </td>
                  <td className={`${TD} text-foreground`}>{s.name}</td>
                  <td className={`${TD} text-muted`}>
                    {s.management
                      ? MANAGEMENT_LABELS[s.management]
                      : "Sin dato"}
                  </td>
                  <td className={`${TD} font-mono`}>
                    {s.perimeter_radius_meters} m
                  </td>
                  <td className={`${TD} text-right font-mono`}>{own.length}</td>
                  <td className={`${TD} text-right font-mono`}>{inside}</td>
                  <td className={`${TD} text-right font-mono`}>{online}</td>
                  <td
                    className={`${TD} ${inside ? "text-emerald-300" : "text-amber-300"}`}
                  >
                    {inside ? "Con cobertura" : "Sin cobertura"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AvailabilitySection({
  cameras,
  incidents,
}: {
  cameras: Camera[];
  incidents: Incident[];
}) {
  const online = cameras.filter((c) => c.status === "online").length;
  const down = cameras.filter((c) => c.status !== "online");
  const open = incidents.filter((i) => !CLOSED.includes(i.status));
  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ReportStat
          label="En línea ahora"
          value={`${online}/${cameras.length}`}
          hint="Medición instantánea"
        />
        <ReportStat label="Sin señal / alerta" value={down.length} />
        <ReportStat label="Incidentes abiertos" value={open.length} />
        <ReportStat label="Incidentes totales" value={incidents.length} />
      </div>
      <SectionTitle n={1}>Cámaras que no están en línea</SectionTitle>
      {down.length === 0 ? (
        <p className="text-xs text-muted">
          Todas las cámaras instaladas están en línea.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
          <table className={TABLE}>
            <thead>
              <tr className="text-[10px] font-mono uppercase text-muted">
                <th className={TH}>Cámara</th>
                <th className={TH}>Establecimiento</th>
                <th className={TH}>Estado</th>
                <th className={TH}>Última señal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {down.map((c) => (
                <tr key={c.id}>
                  <td className={`${TD} text-foreground`}>
                    <span className="font-mono font-bold text-accent">
                      {c.identifier}
                    </span>{" "}
                    · {c.name}
                  </td>
                  <td className={`${TD} text-muted`}>{c.school_name}</td>
                  <td className={`${TD} uppercase`}>{c.status}</td>
                  <td className={`${TD} font-mono text-muted`}>
                    {c.last_heartbeat
                      ? new Date(c.last_heartbeat).toLocaleString("es-AR")
                      : "Nunca"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** Solo se monta para quien puede leer la auditoría (las reglas de Firestore lo exigen). */
export function AuditSection() {
  const { data: logs, loading } = useCollection<AccessLog>(
    "access_logs",
    sortLogs,
  );
  const byAction = new Map<AccessAction, number>();
  const people = new Set<string>();
  for (const l of logs) {
    byAction.set(l.action, (byAction.get(l.action) ?? 0) + 1);
    people.add(l.actor_email);
  }
  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ReportStat
          label="Accesos registrados"
          value={loading ? "…" : logs.length}
        />
        <ReportStat label="Personas distintas" value={people.size} />
        <ReportStat
          label="Vistas de cámara"
          value={byAction.get("ver_camara") ?? 0}
        />
        <ReportStat label="Ingresos" value={byAction.get("login") ?? 0} />
      </div>
      <SectionTitle n={1}>Últimos accesos</SectionTitle>
      <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
        <table className={TABLE}>
          <thead>
            <tr className="text-[10px] font-mono uppercase text-muted">
              <th className={TH}>Fecha</th>
              <th className={TH}>Persona</th>
              <th className={TH}>Acción</th>
              <th className={TH}>Cámara</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className={`${TD} text-muted`}>
                  Todavía no hay accesos registrados.
                </td>
              </tr>
            )}
            {logs.slice(0, 25).map((l) => (
              <tr key={l.id}>
                <td className={`${TD} whitespace-nowrap font-mono text-muted`}>
                  {new Date(l.at).toLocaleString("es-AR")}
                </td>
                <td className={`${TD} text-foreground`}>
                  {l.actor_name} ·{" "}
                  {ROLE_LABELS[l.actor_role as Role] ?? l.actor_role}
                </td>
                <td className={TD}>
                  {ACCESS_ACTION_LABELS[l.action] ?? l.action}
                </td>
                <td className={`${TD} text-muted`}>{l.camera_name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function PolicySection({ n }: { n: number }) {
  const { data } = useDocument<OperationalPolicy>(POLICY_COLLECTION, POLICY_ID);
  const policy = data ?? emptyPolicy();
  return (
    <section>
      <SectionTitle n={n}>Marco operativo</SectionTitle>
      <dl className="grid gap-2 sm:grid-cols-2">
        {POLICY_FIELDS.map((f) => (
          <div
            key={f.key}
            className="rounded-lg border border-[var(--line)] p-3"
          >
            <dt className="adm-label">{f.label}</dt>
            <dd
              className={`mt-1 text-xs ${policy[f.key] ? "text-foreground" : "text-amber-300"}`}
            >
              {policy[f.key] || "Sin definir"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function PrivacyStatement({ n }: { n: number }) {
  return (
    <section className="space-y-1.5 rounded-xl border border-[var(--line)] p-4 text-xs">
      <div className="flex items-center gap-2 font-semibold text-emerald-300">
        <ShieldCheck className="h-4 w-4" />
        <span>{n}. Privacidad de niñas, niños y adolescentes</span>
      </div>
      <p className="text-[11px] leading-relaxed text-muted">
        La plataforma transmite en vivo y no graba ni almacena video. No procesa
        datos biométricos ni realiza reconocimiento facial. Las capturas de
        pantalla están deshabilitadas. Cada ingreso y cada vista de cámara queda
        en un registro de auditoría que no se puede modificar.
      </p>
    </section>
  );
}
