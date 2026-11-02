"use client";

import { useState } from "react";
import { X, AlertTriangle, ShieldAlert, Clock, User } from "lucide-react";
import { Incident, IncidentPriority, IncidentType } from "@/types/monitor";
import { MOCK_SCHOOLS, MOCK_CAMERAS } from "@/data/mock-data";

interface NewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIncident: (incident: Incident) => void;
}

export function NewIncidentModal({ isOpen, onClose, onAddIncident }: NewIncidentModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [schoolId, setSchoolId] = useState(MOCK_SCHOOLS[0].id);
  const [cameraId, setCameraId] = useState(MOCK_CAMERAS[0].id);
  const [type, setType] = useState<IncidentType>("perimetro_vulnerable");
  const [priority, setPriority] = useState<IncidentPriority>("media");
  const [assignedTo, setAssignedTo] = useState("Guardia Urbana Catriel");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    const school = MOCK_SCHOOLS.find((s) => s.id === schoolId);
    const camera = MOCK_CAMERAS.find((c) => c.id === cameraId);

    const newIncident: Incident = {
      id: "inc-" + Math.random().toString(36).substring(2, 7),
      code: `INC-2026-${Math.floor(100 + Math.random() * 900)}`,
      school_id: schoolId,
      school_name: school?.name || "Escuela Catriel",
      camera_id: cameraId,
      camera_name: camera?.name || "Cámara perimetral",
      type,
      title,
      description,
      priority,
      status: "nuevo",
      assigned_to: assignedTo,
      reported_at: new Date().toISOString(),
      notes,
    };

    onAddIncident(newIncident);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.12] bg-[#0c101a] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.08] hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Reportar Incidente Escolar</h3>
            <p className="text-xs text-slate-400">
              Apertura de caso en el Corredor Escolar Cuidado de Catriel
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as IncidentPriority)}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-xs text-white focus:border-blue-500/50 focus:outline-none"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica (Intervención Inmediata)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Tipo de Suceso
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as IncidentType)}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-xs text-white focus:border-blue-500/50 focus:outline-none"
              >
                <option value="perimetro_vulnerable">Perímetro Vulnerable</option>
                <option value="persona_sospechosa">Persona Sospechosa en Vereda</option>
                <option value="aglomeracion_no_habitual">Aglomeración no Habitual</option>
                <option value="accidente_transito_escolar">Tránsito / Cruce Peatonal</option>
                <option value="obstruccion_camara">Obstrucción Visual de Cámara</option>
                <option value="corte_suministro">Corte de Energía Eléctrica</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Título del Incidente
            </label>
            <input
              type="text"
              required
              placeholder="ej: Vehículo detenido indebidamente sobre senda escolar"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Escuela Afectada
              </label>
              <select
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-xs text-white focus:border-blue-500/50 focus:outline-none"
              >
                {MOCK_SCHOOLS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Cámara Asociada
              </label>
              <select
                value={cameraId}
                onChange={(e) => setCameraId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-xs text-white focus:border-blue-500/50 focus:outline-none"
              >
                {MOCK_CAMERAS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.identifier} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Descripción y Circunstancias
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describa lo observado en la pantalla de monitoreo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Asignar Guardia / Cuadrilla de Intervención
            </label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.05]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500 shadow-lg shadow-amber-600/20"
            >
              Registrar y Notificar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
