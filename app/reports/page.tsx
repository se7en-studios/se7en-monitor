"use client";

import { useState } from "react";
import { FileBarChart, Eye } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import { useCollection } from "@/lib/firebase/data";
import { can } from "@/lib/roles";
import { REPORT_KINDS, type ReportKind } from "@/lib/reports";
import { ReportModal } from "@/components/report-modal";
import { coverageStats } from "@/components/report-sections";
import type { Camera, Incident, School } from "@/types/monitor";

const CLOSED: Incident["status"][] = ["resuelto", "cerrado"];

export default function ReportsPage() {
  const { profile } = useAuth();
  const { data: schools } = useCollection<School>("schools");
  const { data: cameras } = useCollection<Camera>("cameras");
  const { data: incidents } = useCollection<Incident>("incidents");
  const [selected, setSelected] = useState<ReportKind | null>(null);

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
      <header className="adm-in">
        <p className="adm-label mb-3">Transparencia y rendición de cuentas</p>
        <h1 className="adm-display text-[clamp(28px,3.6vw,44px)] text-foreground">
          Informes <span className="adm-serif">oficiales</span>
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
          Generados con los datos de hoy, listos para imprimir o guardar como
          PDF y presentar ante el Concejo Deliberante y las autoridades
          educativas.
        </p>
      </header>

      <div className="space-y-3">
        {cards.map(({ kind, figures, allowed }) => (
          <div
            key={kind}
            className="adm-in flex flex-col justify-between gap-4 rounded-xl border border-[var(--line)] bg-panel p-5 transition-colors hover:border-[var(--line-strong)] sm:flex-row sm:items-center"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent-soft text-accent">
                <FileBarChart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="adm-title text-[13px] text-foreground">
                  {REPORT_KINDS[kind].title}
                </h3>
                <p className="mt-0.5 text-xs text-muted">
                  {REPORT_KINDS[kind].summary}
                </p>
                <p className="mt-1.5 font-mono text-[11px] text-foreground/85">
                  {figures}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelected(kind)}
              disabled={!allowed}
              className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3.5 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Eye className="h-4 w-4" />
              <span>Ver e imprimir</span>
            </button>
          </div>
        ))}
      </div>

      <ReportModal kind={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
