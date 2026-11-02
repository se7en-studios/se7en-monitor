"use client";

import { Wrench, Plus, Clock, User, CheckCircle2 } from "lucide-react";
import { MOCK_TICKETS } from "@/data/mock-data";

export default function MaintenancePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            SOPORTE DE INFRAESTRUCTURA
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            Mantenimiento y Cuadrillas
          </h1>
          <p className="text-xs text-slate-400">
            Seguimiento de reparaciones, limpieza de ópticas y tendido de fibra en Catriel
          </p>
        </div>

        <button
          onClick={() => alert("Crear nueva orden de trabajo de mantenimiento")}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Ticket de Trabajo</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_TICKETS.map((ticket) => (
          <div
            key={ticket.id}
            className="rounded-xl border border-white/[0.08] bg-[#0c101a] p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <span className="font-mono text-xs font-bold text-blue-400">
                {ticket.code}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${
                  ticket.priority === "urgente"
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                }`}
              >
                {ticket.priority}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">{ticket.title}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {ticket.school_name} · {ticket.camera_name}
              </p>
            </div>

            <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-blue-400" />
                <span>{ticket.technician}</span>
              </span>

              <span className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
                <Clock className="h-3.5 w-3.5" />
                <span>{ticket.scheduled_for}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
