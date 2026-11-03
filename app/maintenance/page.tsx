"use client";

import { useState, type FormEvent } from "react";
import { Plus, Clock, User, X } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import { useCollection, saveDoc, patchDoc, newId, logActivity, byNewest } from "@/lib/firebase/data";
import { can } from "@/lib/roles";
import type { Camera, MaintenanceTicket } from "@/types/monitor";

const sortTickets = byNewest("created_at");
const INPUT =
  "w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-sm text-white outline-none focus:border-blue-500/60";
const NEXT_STATUS: Record<MaintenanceTicket["status"], MaintenanceTicket["status"]> = {
  pendiente: "en_curso",
  en_curso: "completado",
  completado: "pendiente",
};
const STATUS_LABEL: Record<MaintenanceTicket["status"], string> = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  completado: "Completado",
};

function NewTicketModal({ cameras, onClose }: { cameras: Camera[]; onClose: () => void }) {
  const [cameraId, setCameraId] = useState(cameras[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [technician, setTechnician] = useState("");
  const [priority, setPriority] = useState<MaintenanceTicket["priority"]>("normal");
  const [scheduledFor, setScheduledFor] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const camera = cameras.find((c) => c.id === cameraId);
    if (!camera) return;
    setBusy(true);
    setError(null);
    const ticket: MaintenanceTicket = {
      id: newId("tkt"),
      code: `MNT-2026-${Math.floor(100 + Math.random() * 900)}`,
      school_id: camera.school_id,
      school_name: camera.school_name ?? "",
      camera_id: camera.id,
      camera_name: camera.name,
      technician: technician.trim(),
      title: title.trim(),
      priority,
      status: "pendiente",
      scheduled_for: scheduledFor,
      created_at: new Date().toISOString(),
    };
    try {
      await saveDoc("maintenance_tickets", ticket);
      logActivity({
        event_type: "maintenance_completed",
        title: "Orden de trabajo creada",
        description: `${ticket.code} · ${ticket.title}`,
        entity_type: "maintenance",
        entity_id: ticket.id,
      });
      onClose();
    } catch (err) {
      console.error("[maintenance]", err);
      setError("No se pudo crear la orden. Revisá tus permisos.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-4 rounded-xl border border-white/[0.08] bg-[#0c101a] p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Nueva orden de trabajo</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
        <select className={INPUT} value={cameraId} onChange={(e) => setCameraId(e.target.value)}>
          {cameras.map((c) => (
            <option key={c.id} value={c.id}>
              {c.identifier} · {c.name}
            </option>
          ))}
        </select>
        <input className={INPUT} required placeholder="Trabajo a realizar" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className={INPUT} required placeholder="Técnico asignado" value={technician} onChange={(e) => setTechnician(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <select className={INPUT} value={priority} onChange={(e) => setPriority(e.target.value as MaintenanceTicket["priority"])}>
            <option value="normal">Normal</option>
            <option value="urgente">Urgente</option>
          </select>
          <input className={INPUT} required type="date" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
        </div>
        {error && (
          <p role="alert" className="text-xs text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !cameraId}
          className="w-full rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
        >
          Crear orden
        </button>
      </form>
    </div>
  );
}

export default function MaintenancePage() {
  const { profile } = useAuth();
  const canHandle = can.handleMaintenance(profile?.role);
  const { data: tickets, loading } = useCollection<MaintenanceTicket>("maintenance_tickets", sortTickets);
  const { data: cameras } = useCollection<Camera>("cameras");
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          disabled={!canHandle || cameras.length === 0}
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Ticket de Trabajo</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading && <p className="text-xs text-slate-500">Cargando…</p>}
        {tickets.map((ticket) => (
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

            <div className="flex justify-end">
              <button
                disabled={!canHandle}
                onClick={() =>
                  patchDoc("maintenance_tickets", ticket.id, { status: NEXT_STATUS[ticket.status] }).catch(
                    (err) => console.error("[maintenance]", err)
                  )
                }
                className="rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-1 text-[11px] font-medium text-slate-200 hover:bg-white/[0.1] disabled:opacity-60"
              >
                {STATUS_LABEL[ticket.status]}
              </button>
            </div>
          </div>
        ))}
      </div>
    {isModalOpen && <NewTicketModal cameras={cameras} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

