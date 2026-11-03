"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { btnGhost, btnPrimary } from "@/components/ui";
import { X, Printer } from "lucide-react";
import { useCollection } from "@/lib/firebase/data";
import { useAuth } from "@/lib/firebase/auth-context";
import { can } from "@/lib/roles";
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
  const { profile } = useAuth();
  const canIncidents = can.handleIncidents(profile?.role);
  const { data: incidents } = useCollection<Incident>("incidents", undefined, {
    enabled: canIncidents,
  });

  // Escape cierra el informe.
  useEffect(() => {
    if (!kind) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [kind, onClose]);

  if (!kind || typeof document === "undefined") return null;

  const { title } = REPORT_KINDS[kind];
  const today = new Date().toLocaleDateString("es-AR");

  // En un portal para que, al imprimir, salga solo el documento (ver @media print en globals.css).
  return createPortal(
    <div
      className="report-print-root fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-2 backdrop-blur-md sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="report-frame relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-panel">
        <div className="print-hidden flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--well)] px-4 py-3 sm:px-6">
          <span className="adm-label hidden sm:inline">
            Informe · Municipio de Catriel
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className={btnPrimary}
            >
              <Printer className="h-4 w-4" />
              Imprimir o guardar PDF
            </button>
            <button
              type="button"
              autoFocus
              onClick={onClose}
              aria-label="Cerrar el informe"
              className={`${btnGhost} h-9 w-9 px-0`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="report-scroll flex-1 space-y-6 overflow-y-auto bg-background p-5 text-foreground sm:p-8">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] pb-6 sm:gap-6">
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
            <AvailabilitySection
              cameras={cameras}
              incidents={canIncidents ? incidents : null}
            />
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
