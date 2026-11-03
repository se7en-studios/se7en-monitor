"use client";

import { useState } from "react";
import { FileBarChart, Eye, Lock } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import { useCollection } from "@/lib/firebase/data";
import { can } from "@/lib/roles";
import { REPORT_KINDS, type ReportKind } from "@/lib/reports";
import { ReportModal } from "@/components/report-modal";
import { coverageStats } from "@/components/report-sections";
import { PageHeader, Skeleton, btnSecondary } from "@/components/ui";
import type { Camera, Incident, School } from "@/types/monitor";

const CLOSED: Incident["status"][] = ["resuelto", "cerrado"];

export default function ReportsPage() {
  const { profile } = useAuth();
  const { data: schools, loading: l1 } = useCollection<School>("schools");
  const { data: cameras, loading: l2 } = useCollection<Camera>("cameras");
  const { data: incidents, loading: l3 } = useCollection<Incident>("incidents");
  const [selected, setSelected] = useState<ReportKind | null>(null);
  const loading = l1 || l2 || l3;

  const coverage = coverageStats(schools, cameras);
  const online = cameras.filter((c) => c.status === "online").length;
  const open = incidents.filter((i) => !CLOSED.includes(i.status)).length;

  // El resumen de cada informe sale de los datos de hoy, no de cifras escritas a mano.
  const cards: { kind: ReportKind; figures: string; allowed: boolean }[] = [
    {
      kind: "coverage",
      figures: `${coverage.schoolsCovered} de ${schools.length} escuelas con cobertura verificada · ${coverage.verifiedCameras} de ${cameras.length} cámaras dentro del radio`,
      allowed: true,
    },
    {
      kind: "availability",
      figures: `${online} de ${cameras.length} cámaras en línea · ${open} incidentes abiertos`,
      allowed: true,
    },
    {
      kind: "audit",
      figures: "Solo para Super Admin y Administrador Municipal",
      allowed: can.viewAudit(profile?.role),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Transparencia y rendición de cuentas"
        title="Informes"
        accent="oficiales"
      >
        Generados con los datos de hoy, listos para imprimir o guardar como PDF
        y presentar ante el Concejo Deliberante y las autoridades educativas.
      </PageHeader>

      <ul className="space-y-3">
        {cards.map(({ kind, figures, allowed }) => (
          <li
            key={kind}
            className="adm-in flex flex-col justify-between gap-4 rounded-xl border border-[var(--line)] bg-panel p-4 transition-colors hover:border-[var(--line-strong)] sm:flex-row sm:items-center sm:p-5"
          >
            <div className="flex min-w-0 items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent-soft text-accent">
                <FileBarChart className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="adm-title text-[13px] text-foreground">
                  {REPORT_KINDS[kind].title}
                </h2>
                <p className="mt-0.5 text-[13px] text-muted">
                  {REPORT_KINDS[kind].summary}
                </p>
                {loading && kind !== "audit" ? (
                  <Skeleton className="mt-2 h-4 w-64 max-w-full" />
                ) : (
                  <p className="mt-1.5 font-mono text-[12px] text-foreground/85">
                    {figures}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelected(kind)}
              disabled={!allowed}
              className={`${btnSecondary} shrink-0 self-start sm:self-auto`}
            >
              {allowed ? (
                <Eye className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              {allowed ? "Ver e imprimir" : "Sin permiso"}
            </button>
          </li>
        ))}
      </ul>

      <ReportModal kind={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
