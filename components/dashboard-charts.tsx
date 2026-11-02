"use client";

import { Cctv, ShieldCheck, Activity, TrendingUp } from "lucide-react";

export function DashboardCharts() {
  const days = [
    { day: "Lun", incidents: 1, height: "25%" },
    { day: "Mar", incidents: 3, height: "65%" },
    { day: "Mié", incidents: 0, height: "10%" },
    { day: "Jue", incidents: 2, height: "45%" },
    { day: "Vie", incidents: 4, height: "85%" },
    { day: "Sáb", incidents: 1, height: "25%" },
    { day: "Hoy", incidents: 2, height: "45%", active: true },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Chart 1: Estado de Cámaras y Cobertura */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0e131f] p-5">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Cámaras Operativas vs. Desconectadas
            </h3>
            <p className="text-xs text-slate-400">
              Red de videovigilancia en los 5 establecimientos
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
            <Activity className="h-3.5 w-3.5" />
            <span>92% Online</span>
          </div>
        </div>

        {/* Visual representation */}
        <div className="mt-5 space-y-4">
          {/* Progress bar breakdown */}
          <div>
            <div className="flex justify-between text-xs mb-1.5 font-mono">
              <span className="text-slate-300">23 Operativas (92%)</span>
              <span className="text-rose-400">1 Offline</span>
              <span className="text-amber-400">1 Alerta</span>
            </div>
            <div className="h-3.5 w-full rounded-full bg-slate-800 overflow-hidden flex p-0.5 border border-white/[0.06]">
              <div
                style={{ width: "92%" }}
                className="h-full bg-emerald-500 rounded-l-full"
                title="92% Operativas"
              />
              <div
                style={{ width: "4%" }}
                className="h-full bg-amber-400"
                title="4% Alerta"
              />
              <div
                style={{ width: "4%" }}
                className="h-full bg-rose-500 rounded-r-full"
                title="4% Desconectadas"
              />
            </div>
          </div>

          {/* Quick metric tiles */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
              <p className="text-[10px] font-mono uppercase text-emerald-400">
                En Línea
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-emerald-300">
                23
              </p>
              <p className="text-[10px] text-slate-500">Transmisión OK</p>
            </div>

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-center">
              <p className="text-[10px] font-mono uppercase text-amber-400">
                Alerta
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-amber-300">
                1
              </p>
              <p className="text-[10px] text-slate-500">Óptica sucia</p>
            </div>

            <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-center">
              <p className="text-[10px] font-mono uppercase text-rose-400">
                Desconectada
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-rose-300">
                1
              </p>
              <p className="text-[10px] text-slate-500">ESC-195</p>
            </div>
          </div>

          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 flex items-center justify-between text-xs">
            <span className="text-slate-300 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-400" />
              Perímetro seguro 200m cubierto
            </span>
            <span className="font-mono font-bold text-blue-400">1.200 mts lineales</span>
          </div>
        </div>
      </div>

      {/* Chart 2: Incidentes por día */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0e131f] p-5">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Incidentes Registrados (Últimos 7 días)
            </h3>
            <p className="text-xs text-slate-400">
              Corredores escolares y accesos a instituciones
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
            <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
            <span>Total: 13</span>
          </div>
        </div>

        {/* Bar chart representation */}
        <div className="mt-5">
          <div className="flex items-end justify-between h-40 pt-4 px-2">
            {days.map((d, index) => (
              <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
                <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.incidents}
                </span>
                <div className="w-full max-w-[28px] h-32 bg-slate-800/60 rounded-md flex items-end p-1">
                  <div
                    style={{ height: d.height }}
                    className={`w-full rounded transition-all duration-300 group-hover:brightness-125 ${
                      d.active
                        ? "bg-gradient-to-t from-blue-600 to-cyan-400 shadow-md shadow-blue-500/30"
                        : "bg-blue-500/50"
                    }`}
                  />
                </div>
                <span
                  className={`text-[11px] font-mono ${
                    d.active ? "text-blue-400 font-bold" : "text-slate-400"
                  }`}
                >
                  {d.day}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-slate-400">
            <span>Mayor incidencia: Horario de salida escolar (17:00 a 18:30)</span>
            <span className="text-emerald-400 font-mono font-medium">85% Resueltos en &lt; 2h</span>
          </div>
        </div>
      </div>
    </div>
  );
}
