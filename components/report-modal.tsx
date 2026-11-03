"use client";

import { createPortal } from "react-dom";
import { X, Printer } from "lucide-react";
import { useCollection } from "@/lib/firebase/data";
import { REPORT_KINDS, type ReportKind } from "@/lib/reports";
import type { Camera, Incident, School } from "@/types/monitor";
import {
  AuditSection,
  AvailabilitySection,
  CoverageSection,
  PolicySection,
  PrivacyStatement,
} from "@/components/report-sections";

interface ReportModalProps {
  /** Qué informe mostrar. null = cerrado. */
  kind: ReportKind | null;
  onClose: () => void;
}

export function ReportModal({ kind, onClose }: ReportModalProps) {
  const { data: schools } = useCollection<School>("schools");
  const { data: cameras } = useCollection<Camera>("cameras");
  const { data: incidents } = useCollection<Incident>("incidents");

  if (!kind || typeof document === "undefined") return null;

  const { title } = REPORT_KINDS[kind];
  const today = new Date().toLocaleDateString("es-AR");

  // En un portal para que, al imprimir, salga solo el documento (ver @media print en globals.css).
  return createPortal(
    <div className="report-print-root fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
      <div className="report-frame relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-panel">
        <div className="print-hidden flex items-center justify-between border-b border-[var(--line)] bg-[var(--well)] px-6 py-3.5">
          <span className="adm-label">Informe · Municipio de Catriel</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-background transition-colors hover:bg-foreground"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="rounded-lg p-1.5 text-muted hover:bg-white/[0.08] hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="report-scroll flex-1 space-y-6 overflow-y-auto bg-background p-8 text-foreground">
          <header className="flex items-start justify-between gap-6 border-b border-[var(--line)] pb-6">
            <div>
              <p className="adm-label">
                Se7en Monitor · Corredor Escolar Cuidado
              </p>
              <h1 className="adm-display mt-3 text-[26px] text-foreground">
                {title}
              </h1>
              <p className="mt-2 text-xs text-muted">
                Concejo Deliberante de Catriel · Radio de 200 metros alrededor
                de los establecimientos
              </p>
            </div>
            <div className="shrink-0 text-right font-mono text-xs text-muted">
              <p>
                Datos al corte del{" "}
                <strong className="text-foreground">{today}</strong>
              </p>
            </div>
          </header>

          {kind === "coverage" && (
            <CoverageSection schools={schools} cameras={cameras} />
          )}
          {kind === "availability" && (
            <AvailabilitySection cameras={cameras} incidents={incidents} />
          )}
          {kind === "audit" && <AuditSection />}

          <PolicySection n={2} />
          <PrivacyStatement n={3} />

          <div className="grid grid-cols-2 gap-8 border-t border-[var(--line)] pt-8 text-center text-xs text-muted">
            <div>
              <div className="mx-auto mb-2 h-10 w-40 border-b border-[var(--line-strong)]" />
              <p>Responsable técnico</p>
            </div>
            <div>
              <div className="mx-auto mb-2 h-10 w-40 border-b border-[var(--line-strong)]" />
              <p>Responsable municipal</p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
