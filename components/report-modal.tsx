"use client";

import { X, Printer, ShieldCheck, Download, Calendar, School, Activity } from "lucide-react";
import { MOCK_METRICS, MOCK_SCHOOLS, MOCK_INCIDENTS } from "@/data/mock-data";

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
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col max-h-[92vh] w-full max-w-3xl rounded-2xl border border-white/[0.12] bg-[#0c101a] overflow-hidden shadow-2xl">
        {/* Header Actions */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#070a12] px-6 py-3.5 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
              DOCUMENTO OFICIAL
            </span>
            <span className="text-xs text-slate-400">Municipio de Catriel · Río Negro</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 shadow transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.08] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-8 text-slate-200 space-y-6 bg-[#0a0e18] print:bg-white print:text-black">
          {/* Institutional Letterhead */}
          <div className="border-b border-white/10 pb-6 flex items-start justify-between">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-blue-400 font-bold">
                SE7EN STUDIO · DEPARTAMENTO DE SEGURIDAD URBANA
              </p>
              <h1 className="mt-1 text-xl font-bold text-white print:text-black">
                {reportTitle}
              </h1>
              <p className="text-xs text-slate-400 print:text-neutral-600 mt-1">
                Concejo Deliberante de Catriel · Ordenanza Corredor Escolar Cuidado (Radio 200m)
              </p>
            </div>
            <div className="text-right font-mono text-xs text-slate-400 print:text-neutral-600">
              <p>Período: <strong className="text-white print:text-black">{period}</strong></p>
              <p>Emisión: {new Date().toLocaleDateString("es-AR")}</p>
              <p className="text-[10px] text-emerald-400">ESTADO: CERTIFICADO</p>
            </div>
          </div>

          {/* Key Executive Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/[0.08] bg-[#0f1424] p-4 text-center">
              <span className="font-mono text-[10px] uppercase text-slate-400">Disponibilidad SLA</span>
              <p className="mt-1 font-mono text-2xl font-bold text-emerald-400">
                {MOCK_METRICS.system_uptime_percentage}%
              </p>
              <span className="text-[10px] text-slate-500">Objetivo contractual: 98%</span>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#0f1424] p-4 text-center">
              <span className="font-mono text-[10px] uppercase text-slate-400">Perímetro Cubierto</span>
              <p className="mt-1 font-mono text-2xl font-bold text-cyan-400">
                {MOCK_METRICS.corridor_meters_covered}m
              </p>
              <span className="text-[10px] text-slate-500">Radio 200m por escuela</span>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#0f1424] p-4 text-center">
              <span className="font-mono text-[10px] uppercase text-slate-400">Cámaras Operativas</span>
              <p className="mt-1 font-mono text-2xl font-bold text-blue-400">
                {MOCK_METRICS.cameras_online} / {MOCK_METRICS.total_cameras}
              </p>
              <span className="text-[10px] text-slate-500">92% online ininterrumpido</span>
            </div>
          </div>

          {/* Schools Breakdown Table */}
          <div>
            <h3 className="text-sm font-bold text-white print:text-black mb-3">
              1. Cobertura por Establecimiento Educativo
            </h3>
            <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#070a12] text-[10px] font-mono uppercase text-slate-400">
                    <th className="p-3">Código</th>
                    <th className="p-3">Establecimiento</th>
                    <th className="p-3">Barrio</th>
                    <th className="p-3">Radio</th>
                    <th className="p-3 text-right">Cámaras</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {MOCK_SCHOOLS.map((s) => (
                    <tr key={s.id}>
                      <td className="p-3 font-mono font-bold text-blue-400">{s.code}</td>
                      <td className="p-3 text-white print:text-black">{s.name}</td>
                      <td className="p-3 text-slate-400">{s.neighborhood}</td>
                      <td className="p-3 font-mono text-emerald-400">200 metros</td>
                      <td className="p-3 text-right font-mono font-semibold">{s.cameras_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Privacy & Compliance Sign-off */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              <span>Certificación de Privacidad y No Intrusión Biométrica</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Se deja expresa constancia de que la plataforma <strong>SE7EN MONITOR</strong> no procesa datos biométricos, no realiza reconocimiento facial de menores ni almacena imágenes de alumnos, operando estrictamente bajo protocolos de circuito cerrado preventivo para la seguridad urbana de Catriel.
            </p>
          </div>

          {/* Signatures */}
          <div className="pt-8 border-t border-white/10 grid grid-cols-2 gap-8 text-center text-xs text-slate-400">
            <div>
              <div className="h-10 mx-auto w-32 border-b border-slate-600 mb-2" />
              <p className="font-semibold text-slate-200">Franco Riquero</p>
              <p className="text-[10px]">Lead Architect · Se7en Studio</p>
            </div>
            <div>
              <div className="h-10 mx-auto w-32 border-b border-slate-600 mb-2" />
              <p className="font-semibold text-slate-200">Centro de Monitoreo Urbano</p>
              <p className="text-[10px]">Municipio de Catriel · Río Negro</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

