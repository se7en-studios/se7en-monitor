"use client";

import { useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import {
  currentUid,
  logActivity,
  newId,
  saveDoc,
} from "@/lib/firebase/data";
import { randomCode } from "@/lib/ids";
import type { Camera, MaintenanceTicket } from "@/types/monitor";
import { describeError, useToast } from "@/components/toast";
import { btnPrimary, btnSecondary, input, label } from "@/components/ui";

const ticketCode = () => `MNT-${new Date().getFullYear()}-${randomCode(6)}`;

export function NewTicketModal({
  cameras,
  onClose,
}: {
  cameras: Camera[];
  onClose: () => void;
}) {
  const toast = useToast();
  const [cameraId, setCameraId] = useState(cameras[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [technician, setTechnician] = useState("");
  const [priority, setPriority] =
    useState<MaintenanceTicket["priority"]>("normal");
  const [scheduledFor, setScheduledFor] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const camera = cameras.find((c) => c.id === cameraId);
    if (!camera) return setError("Elegí la cámara.");
    if (title.trim().length < 4)
      return setError("Describí el trabajo a realizar.");
    if (!technician.trim()) return setError("Indicá quién lo hace.");
    if (!scheduledFor) return setError("Elegí la fecha.");
    if (busy) return;
    setBusy(true);
    setError(null);
    const ticket: MaintenanceTicket = {
      id: newId("tkt"),
      code: ticketCode(),
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
      reported_by: currentUid(),
    };
    try {
      await saveDoc("maintenance_tickets", ticket);
      toast.success(`Orden ${ticket.code} creada`);
      void logActivity({
        event_type: "maintenance_completed",
        title: "Orden de trabajo creada",
        description: `${ticket.code} · ${ticket.title}`,
        entity_type: "maintenance",
        entity_id: ticket.id,
      });
      onClose();
    } catch (err) {
      console.error("[mantenimiento] alta", err);
      setError(describeError(err, "No se pudo crear la orden."));
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <form
        onSubmit={onSubmit}
        noValidate
        className="w-full max-w-md space-y-4 rounded-2xl border border-[var(--line-strong)] bg-[var(--panel)] p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="adm-title text-[15px] text-foreground">
            Nueva orden de trabajo
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div>
          <label htmlFor="nt-cam" className={label}>
            Cámara
          </label>
          <select
            id="nt-cam"
            className={input}
            value={cameraId}
            onChange={(e) => setCameraId(e.target.value)}
          >
            {cameras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.identifier} · {c.name} ({c.school_name ?? "sin escuela"})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="nt-title" className={label}>
            Trabajo a realizar
          </label>
          <input
            id="nt-title"
            maxLength={200}
            className={input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="nt-tech" className={label}>
            Técnico asignado
          </label>
          <input
            id="nt-tech"
            maxLength={120}
            className={input}
            value={technician}
            onChange={(e) => setTechnician(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="nt-prio" className={label}>
              Prioridad
            </label>
            <select
              id="nt-prio"
              className={input}
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as MaintenanceTicket["priority"])
              }
            >
              <option value="normal">Normal</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
          <div>
            <label htmlFor="nt-date" className={label}>
              Fecha
            </label>
            <input
              id="nt-date"
              type="date"
              className={input}
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
            />
          </div>
        </div>
        {error && (
          <p role="alert" className="text-[13px] text-red-400">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className={btnSecondary}
            onClick={onClose}
            disabled={busy}
          >
            Cancelar
          </button>
          <button type="submit" className={btnPrimary} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Crear orden
          </button>
        </div>
      </form>
    </div>
  );
}
