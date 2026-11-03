"use client";

import { useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import type { Camera, CameraLocationType } from "@/types/monitor";
import { patchDoc } from "@/lib/firebase/data";
import { LOCATION_LABELS } from "@/lib/camera-labels";
import { describeError, useToast } from "@/components/toast";
import { btnPrimary, btnSecondary, input, label } from "@/components/ui";

/** Editar nombre, zona y detalle de montaje de una cámara existente. */
export function EditCameraModal({
  camera,
  onClose,
}: {
  camera: Camera;
  onClose: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(camera.name);
  const [locationType, setLocationType] = useState<CameraLocationType>(
    camera.location_type,
  );
  const [detail, setDetail] = useState(camera.location_detail ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 3)
      return setError("Escribí un nombre descriptivo.");
    if (busy) return;
    setBusy(true);
    try {
      await patchDoc("cameras", camera.id, {
        name: name.trim(),
        location_type: locationType,
        location_detail: detail.trim(),
      });
      toast.success("Cámara actualizada");
      onClose();
    } catch (err) {
      console.error("[cámaras] edición", err);
      setError(describeError(err, "No se pudo guardar la cámara."));
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
            Editar {camera.identifier}
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
          <label htmlFor="ec-name" className={label}>
            Nombre
          </label>
          <input
            id="ec-name"
            className={input}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="ec-zone" className={label}>
            Zona
          </label>
          <select
            id="ec-zone"
            className={input}
            value={locationType}
            onChange={(e) =>
              setLocationType(e.target.value as CameraLocationType)
            }
          >
            {(Object.keys(LOCATION_LABELS) as CameraLocationType[]).map((l) => (
              <option key={l} value={l}>
                {LOCATION_LABELS[l]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ec-detail" className={label}>
            Detalle de montaje
          </label>
          <input
            id="ec-detail"
            className={input}
            placeholder="ej: Poste de alumbrado esquina Rawson"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
          />
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
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
