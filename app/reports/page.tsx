"use client";

import { useState } from "react";
import { FileBarChart, Download, Calendar, ShieldCheck, Activity, Eye } from "lucide-react";
import { ReportModal } from "@/components/report-modal";

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<{
    title: string;
    period: string;
  } | null>(null);

  const reports = [
    {
      title: "Informe Mensual de Disponibilidad y SLA Escolar",
      period: "Octubre 2026",
      uptime: "98.8%",
      incidents: 14,
      size: "2.4 MB PDF",
    },
    {
      title: "Auditoría de Acceso a Grabaciones y Cumplimiento de Privacidad",
      period: "Tercer Trimestre 2026",
      uptime: "100%",
      incidents: 0,
      size: "1.8 MB PDF",
    },
    {
      title: "Evaluación de Cobertura de Corredor Escolar (200m) - Concejo Catriel",
      period: "Septiembre 2026",
      uptime: "97.5%",
      incidents: 19,
      size: "3.1 MB PDF",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            AUDITORÍA Y RENDICIÓN DE FONDOS PÚBLICOS
          </span>
          <h1 className="mt-1 adm-display text-[clamp(28px,3.6vw,44px)] text-foreground">
            Reportes e Informes Oficiales
          </h1>
          <p className="text-xs text-muted">
            Métricas de transparencia para el Concejo Deliberante y autoridades educativas
          </p>
        </div>

        <button
          onClick={() =>
            setSelectedReport({
              title: "Informe Personalizado de Auditoría Municipal",
              period: "Noviembre 2026",
            })
          }
          className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-2 text-xs font-semibold text-background hover:bg-[var(--accent-hover)] transition-colors"
        >
          <Calendar className="h-4 w-4" />
          <span>Generar Reporte Personalizado</span>
        </button>
      </div>

      <div className="space-y-3">
        {reports.map((rep, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-[var(--line)] bg-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[var(--line-strong)] transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft border border-accent/20 text-accent shrink-0">
                <FileBarChart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="adm-title text-[13px] text-foreground">{rep.title}</h3>
                <p className="text-xs text-muted mt-0.5">
                  Período: {rep.period} · Disponibilidad: <span className="text-emerald-400 font-mono">{rep.uptime}</span> · {rep.incidents} incidentes registrados
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() =>
                  setSelectedReport({
                    title: rep.title,
                    period: rep.period,
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/25 transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span>Ver e Imprimir</span>
              </button>

              <button
                onClick={() =>
                  setSelectedReport({
                    title: rep.title,
                    period: rep.period,
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--well)] px-3 py-2 text-xs font-medium text-foreground/85 hover:bg-white/[0.05]"
              >
                <Download className="h-4 w-4 text-accent" />
                <span>PDF ({rep.size})</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <ReportModal
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        reportTitle={selectedReport?.title}
        period={selectedReport?.period}
      />
    </div>
  );
}
