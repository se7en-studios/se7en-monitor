"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Search,
  Plus,
  Clock,
  Shield,
  CheckCircle,
  FileText,
  User,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { MOCK_INCIDENTS } from "@/data/mock-data";
import { Incident, IncidentStatus, IncidentPriority } from "@/types/monitor";
import { NewIncidentModal } from "@/components/new-incident-modal";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.school_name && inc.school_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      inc.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || inc.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || inc.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleAddIncident = (newInc: Incident) => {
    setIncidents([newInc, ...incidents]);
  };

  const cycleStatus = (id: string, currentStatus: IncidentStatus) => {
    const nextStatusMap: Record<IncidentStatus, IncidentStatus> = {
      nuevo: "en_revision",
      en_revision: "en_proceso",
      en_proceso: "resuelto",
      resuelto: "cerrado",
      cerrado: "nuevo",
    };

    setIncidents(
      incidents.map((i) =>
        i.id === id ? { ...i, status: nextStatusMap[currentStatus] } : i
      )
    );
  };

  const getPriorityBadge = (p: IncidentPriority) => {
    switch (p) {
      case "critica":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "alta":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "media":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "baja":
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  const getStatusBadge = (s: IncidentStatus) => {
    switch (s) {
      case "nuevo":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      case "en_revision":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "en_proceso":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "resuelto":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "cerrado":
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-amber-400 uppercase tracking-wider">
              REGISTRO Y SEGUIMIENTO OPERATIVO
            </span>
            <span className="text-xs text-slate-500">· {incidents.length} Registros Activos</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            CRM de Incidentes y Novedades
          </h1>
          <p className="text-xs text-slate-400">
            Bitácora de eventos en el corredor escolar, intervenciones de guardia y mantenimiento
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Reportar Incidente</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#0c101a] p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código, escuela, descripción..."
            className="w-full rounded-lg border border-white/[0.08] bg-[#070a12] py-2 pl-9 pr-4 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-xs text-slate-300 focus:border-blue-500/50 focus:outline-none"
          >
            <option value="all">Todos los Estados</option>
            <option value="nuevo">Nuevo</option>
            <option value="en_revision">En Revisión</option>
            <option value="en_proceso">En Proceso</option>
            <option value="resuelto">Resuelto</option>
            <option value="cerrado">Cerrado</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-xs text-slate-300 focus:border-blue-500/50 focus:outline-none"
          >
            <option value="all">Todas las Prioridades</option>
            <option value="critica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-3">
        {filteredIncidents.map((inc) => (
          <div
            key={inc.id}
            className="rounded-xl border border-white/[0.08] bg-[#0c101a] p-5 hover:border-white/[0.14] transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-blue-400">
                  {inc.code}
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-xs font-semibold text-white">
                  {inc.school_name}
                </span>
                {inc.camera_name && (
                  <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
                    ({inc.camera_name})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-mono font-bold uppercase",
                    getPriorityBadge(inc.priority)
                  )}
                >
                  {inc.priority}
                </span>

                <button
                  onClick={() => cycleStatus(inc.id, inc.status)}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase transition-transform active:scale-95 cursor-pointer hover:brightness-125",
                    getStatusBadge(inc.status)
                  )}
                  title="Haga clic para avanzar de estado"
                >
                  {inc.status.replace("_", " ")} ↻
                </button>
              </div>
            </div>

            <div className="mt-3">
              <h3 className="text-sm font-semibold text-white">{inc.title}</h3>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                {inc.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-blue-400" />
                  <span>Asignado a: <strong className="text-slate-200">{inc.assigned_to}</strong></span>
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatDate(inc.reported_at)}</span>
                </span>
              </div>

              {inc.notes && (
                <span className="text-[11px] italic text-slate-400">
                  Nota: {inc.notes}
                </span>
              )}
            </div>
          </div>
        ))}

        {filteredIncidents.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold">No hay incidentes con los filtros seleccionados</p>
          </div>
        )}
      </div>

      <NewIncidentModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onAddIncident={handleAddIncident}
      />
    </div>
  );
}
