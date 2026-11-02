import { FileBarChart, Download, Calendar, ShieldCheck, Activity } from "lucide-react";

export default function ReportsPage() {
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
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            Reportes e Informes Oficiales
          </h1>
          <p className="text-xs text-slate-400">
            Métricas de transparencia para el Concejo Deliberante y autoridades educativas
          </p>
        </div>

        <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors">
          <Calendar className="h-4 w-4" />
          <span>Generar Reporte Personalizado</span>
        </button>
      </div>

      <div className="space-y-3">
        {reports.map((rep, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-white/[0.08] bg-[#0c101a] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/[0.14] transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                <FileBarChart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{rep.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Período: {rep.period} · Disponibilidad: <span className="text-emerald-400 font-mono">{rep.uptime}</span> · {rep.incidents} incidentes registrados
                </p>
              </div>
            </div>

            <button className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#070a12] px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.05] shrink-0">
              <Download className="h-4 w-4 text-blue-400" />
              <span>Descargar ({rep.size})</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

