"use client";

import { useState, type FormEvent } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import type {
  Camera,
  Incident,
  IncidentPriority,
  IncidentType,
  School,
} from "@/types/monitor";
import { newId, useCollection } from "@/lib/firebase/data";
import {
  INCIDENT_PRIORITY_LABELS,
  INCIDENT_TYPE_LABELS,
} from "@/lib/incident-labels";
import { describeError } from "@/components/toast";
import { btnPrimary, btnSecondary, input, label } from "@/components/ui";

interface NewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Guarda el incidente. Si falla, el modal muestra el motivo y queda abierto. */
  onAddIncident: (incident: Incident) => Promise<void>;
}

interface Draft {
  title: string;
  description: string;
  schoolId: string;
  cameraId: string;
  type: IncidentType;
  priority: IncidentPriority;
  assignedTo: string;
}

const EMPTY: Draft = {
  title: "",
  description: "",
  schoolId: "",
  cameraId: "",
  type: "perimetro_vulnerable",
  priority: "media",
  assignedTo: "",
};

/** Código legible y sin choques: INC-<año>-<4 caracteres al azar>. */
const incidentCode = () =>
  `INC-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

function buildIncident(
  d: Draft,
  schools: School[],
  cameras: Camera[],
): Incident {
  const school = schools.find((s) => s.id === d.schoolId);
  const camera = cameras.find((c) => c.id === d.cameraId);
  // Firestore no acepta `undefined`: los campos de cámara solo van si hay cámara.
  return {
    id: newId("inc"),
    code: incidentCode(),
    school_id: d.schoolId,
    school_name: school?.name ?? "",
    ...(camera ? { camera_id: camera.id, camera_name: camera.name } : {}),
    type: d.type,
    title: d.title.trim(),
    description: d.description.trim(),
    priority: d.priority,
    status: "nuevo",
    assigned_to: d.assignedTo.trim(),
    reported_at: new Date().toISOString(),
    resolved_at: null,
  };
}

function validate(d: Draft): string | null {
  if (!d.schoolId) return "Elegí la escuela.";
  if (d.title.trim().length < 5)
    return "Escribí un título (al menos 5 caracteres).";
  if (d.description.trim().length < 10)
    return "Describí lo que pasó (al menos 10 caracteres).";
  return null;
}

export function NewIncidentModal({
  isOpen,
  onClose,
  onAddIncident,
}: NewIncidentModalProps) {
  const { data: schools } = useCollection<School>("schools");
  const { data: cameras } = useCollection<Camera>("cameras");
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const schoolCameras = cameras.filter((c) => c.school_id === draft.schoolId);
  const close = () => {
    setDraft(EMPTY);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validate(draft);
    setError(problem);
    if (problem || busy) return;
    setBusy(true);
    try {
      await onAddIncident(buildIncident(draft, schools, cameras));
      close();
    } catch (err) {
      console.error("[incidentes] alta", err);
      setError(describeError(err, "No se pudo registrar el incidente."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="relative max-h-[94vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-[var(--line-strong)] bg-[var(--panel)] p-6"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <h2 className="adm-title text-[15px] text-foreground">
            Reportar incidente
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field id="ni-priority" text="Prioridad">
            <select
              id="ni-priority"
              className={input}
              value={draft.priority}
              onChange={(e) =>
                set({ priority: e.target.value as IncidentPriority })
              }
            >
              {(
                Object.keys(INCIDENT_PRIORITY_LABELS) as IncidentPriority[]
              ).map((p) => (
                <option key={p} value={p}>
                  {INCIDENT_PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </Field>
          <Field id="ni-type" text="Tipo">
            <select
              id="ni-type"
              className={input}
              value={draft.type}
              onChange={(e) => set({ type: e.target.value as IncidentType })}
            >
              {(Object.keys(INCIDENT_TYPE_LABELS) as IncidentType[]).map(
                (t) => (
                  <option key={t} value={t}>
                    {INCIDENT_TYPE_LABELS[t]}
                  </option>
                ),
              )}
            </select>
          </Field>
          <Field id="ni-school" text="Escuela">
            <select
              id="ni-school"
              className={input}
              value={draft.schoolId}
              onChange={(e) => set({ schoolId: e.target.value, cameraId: "" })}
            >
              <option value="">Elegí una escuela</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field id="ni-camera" text="Cámara (opcional)">
            <select
              id="ni-camera"
              className={input}
              value={draft.cameraId}
              disabled={!draft.schoolId}
              onChange={(e) => set({ cameraId: e.target.value })}
            >
              <option value="">Sin cámara asociada</option>
              {schoolCameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.identifier} · {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field id="ni-title" text="Título">
          <input
            id="ni-title"
            className={input}
            placeholder="ej: Vehículo detenido sobre la senda escolar"
            value={draft.title}
            onChange={(e) => set({ title: e.target.value })}
          />
        </Field>
        <Field id="ni-desc" text="Qué pasó">
          <textarea
            id="ni-desc"
            rows={3}
            className={input}
            placeholder="Lo que se vio, dónde y a qué hora"
            value={draft.description}
            onChange={(e) => set({ description: e.target.value })}
          />
        </Field>
        <Field id="ni-assigned" text="Asignado a (opcional)">
          <input
            id="ni-assigned"
            className={input}
            placeholder="ej: Guardia Urbana"
            value={draft.assignedTo}
            onChange={(e) => set({ assignedTo: e.target.value })}
          />
        </Field>

        {error && (
          <p role="alert" className="text-[13px] text-red-400">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-[var(--line)] pt-4">
          <button
            type="button"
            className={btnSecondary}
            onClick={close}
            disabled={busy}
          >
            Cancelar
          </button>
          <button type="submit" className={btnPrimary} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Registrar incidente
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  id,
  text,
  children,
}: {
  id: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={label}>
        {text}
      </label>
      {children}
    </div>
  );
}
