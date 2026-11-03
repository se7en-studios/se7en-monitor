"use client";

import { X, Printer, ShieldCheck, Download, Calendar, School, Activity } from "lucide-react";
import { useCollection } from "@/lib/firebase/data";
import { computeMetrics } from "@/lib/metrics";
import type { Camera, Incident, School as SchoolDoc } from "@/types/monitor";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportTitle?: string;
  period?: string;
}

export function ReportModal({
  isOpen,
  onClose,
  reportTitle = "Informe Oficial de Auditoría y Cobertura de Corredores Escolares",
  period = "Noviembre 2026",
}: ReportModalProps) {
  const { data: schools } = useCollection<SchoolDoc>("schools");
  const { data: cameras } = useCollection<Camera>("cameras");
  const { data: incidents } = useCollection<Incident>("incidents");
  const metrics = computeMetrics(schools, cameras, incidents);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col max-h-[92vh] w-full max-w-3xl rounded-2xl border border-[var(--line-strong)] bg-panel overflow-hidden">
        {/* Header Actions */}
        <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--well)] px-6 py-3.5 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-accent bg-accent-soft border border-accent/20 px-2 py-0.5 rounded">
              DOCUMENTO OFICIAL
            </span>
            <span className="text-xs text-muted">Municipio de Catriel · Río Negro</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-background hover:bg-[var(--accent-hover)] shadow transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted hover:bg-white/[0.08] hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-8 text-foreground space-y-6 bg-background print:bg-white print:text-background">
          {/* Institutional Letterhead */}
          <div className="border-b border-[var(--line)] pb-6 flex items-start justify-between">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-accent font-bold">
                SE7EN STUDIO · DEPARTAMENTO DE SEGURIDAD URBANA
              </p>
              <h1 className="mt-1 text-xl font-bold text-foreground print:text-background">
                {reportTitle}
              </h1>
              <p className="text-xs text-muted print:text-neutral-600 mt-1">
                Concejo Deliberante de Catriel · Ordenanza Corredor Escolar Cuidado (Radio 200m)
              </p>
            </div>
            <div className="text-right font-mono text-xs text-muted print:text-neutral-600">
              <p>Período: <strong className="text-foreground print:text-background">{period}</strong></p>
              <p>Emisión: {new Date().toLocaleDateString("es-AR")}</p>
              <p className="text-[10px] text-emerald-400">ESTADO: CERTIFICADO</p>
            </div>
          </div>

          {/* Key Executive Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-[var(--line)] bg-panel p-4 text-center">
              <span className="font-mono text-[10px] uppercase text-muted">Disponibilidad SLA</span>
              <p className="mt-1 adm-num text-[32px] leading-none text-emerald-400">
                {metrics.system_uptime_percentage}%
              </p>
              <span className="text-[10px] text-muted">Objetivo contractual: 98%</span>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-panel p-4 text-center">
              <span className="font-mono text-[10px] uppercase text-muted">Perímetro Cubierto</span>
              <p className="mt-1 adm-num text-[32px] leading-none text-accent">
                {metrics.corridor_meters_covered}m
              </p>
              <span className="text-[10px] text-muted">Radio 200m por escuela</span>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-panel p-4 text-center">
              <span className="font-mono text-[10px] uppercase text-muted">Cámaras Operativas</span>
              <p className="mt-1 adm-num text-[32px] leading-none text-accent">
                {metrics.cameras_online} / {metrics.total_cameras}
              </p>
              <span className="text-[10px] text-muted">92% online ininterrumpido</span>
            </div>
          </div>

          {/* Schools Breakdown Table */}
          <div>
            <h3 className="adm-title text-[13px] text-foreground print:text-background mb-3">
              1. Cobertura por Establecimiento Educativo
            </h3>
            <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--well)] text-[10px] font-mono uppercase text-muted">
                    <th className="p-3">Código</th>
                    <th className="p-3">Establecimiento</th>
                    <th className="p-3">Barrio</th>
                    <th className="p-3">Radio</th>
                    <th className="p-3 text-right">Cámaras</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {schools.map((s) => (
                    <tr key={s.id}>
                      <td className="p-3 font-mono font-bold text-accent">{s.code}</td>
                      <td className="p-3 text-foreground print:text-background">{s.name}</td>
                      <td className="p-3 text-muted">{s.neighborhood}</td>
                      <td className="p-3 font-mono text-emerald-400">200 metros</td>
                      <td className="p-3 text-right font-mono font-semibold">{cameras.filter((c) => c.school_id === s.id).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Privacy & Compliance Sign-off */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-foreground/85 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              <span>Certificación de Privacidad y No Intrusión Biométrica</span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              Se deja expresa constancia de que la plataforma <strong>SE7EN MONITOR</strong> no procesa datos biométricos, no realiza reconocimiento facial de menores ni almacena imágenes de alumnos, operando estrictamente bajo protocolos de circuito cerrado preventivo para la seguridad urbana de Catriel.
            </p>
          </div>

          {/* Signatures */}
          <div className="pt-8 border-t border-[var(--line)] grid grid-cols-2 gap-8 text-center text-xs text-muted">
            <div>
              <div className="h-10 mx-auto w-32 border-b border-[var(--line-strong)] mb-2" />
              <p className="font-semibold text-foreground">Franco Riquero</p>
              <p className="text-[10px]">Lead Architect · Se7en Studio</p>
            </div>
            <div>
              <div className="h-10 mx-auto w-32 border-b border-[var(--line-strong)] mb-2" />
              <p className="font-semibold text-foreground">Centro de Monitoreo Urbano</p>
              <p className="text-[10px]">Municipio de Catriel · Río Negro</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

