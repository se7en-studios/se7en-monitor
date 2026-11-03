"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Cctv, Loader2, X } from "lucide-react";
import type {
  Camera,
  CameraDeviceType,
  CameraLocationType,
  School,
} from "@/types/monitor";
import { newId, useCollection } from "@/lib/firebase/data";
import { distanceMeters } from "@/lib/geo";
import { DEVICE_LABELS, LOCATION_LABELS } from "@/lib/camera-labels";
import { describeError } from "@/components/toast";
import { btnPrimary, btnSecondary, input, label } from "@/components/ui";

interface AddCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Guarda la cámara. Si falla, el modal muestra el motivo y queda abierto. */
  onAddCamera: (camera: Camera) => Promise<void>;
}

const RESOLUTIONS = ["720p HD", "1080p FHD", "2K QHD", "4K UHD"];
const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const parseCoord = (s: string) => Number.parseFloat(s.replace(",", "."));

interface Draft {
  identifier: string;
  name: string;
  deviceType: CameraDeviceType;
  locationType: CameraLocationType;
  detail: string;
  ip: string;
  resolution: string;
  lat: string;
  lng: string;
}

const EMPTY: Draft = {
  identifier: "",
  name: "",
  deviceType: "ip_dome",
  locationType: "acceso_principal",
  detail: "",
  ip: "",
  resolution: "1080p FHD",
  lat: "",
  lng: "",
};

function validate(
  d: Draft,
  schoolId: string,
  isOutside: boolean,
  hasCoords: boolean,
): string | null {
  if (!d.identifier.trim())
    return "Escribí el identificador (ej: CAM-204-NORTE).";
  if (d.name.trim().length < 3) return "Escribí un nombre descriptivo.";
  if (!schoolId) return "Elegí la escuela.";
  if (!hasCoords) return "Cargá la ubicación (latitud y longitud).";
  if (isOutside)
    return "La cámara está fuera del corredor escolar de la escuela.";
  if (d.ip.trim() && !IPV4.test(d.ip.trim()))
    return "La dirección IP no es válida.";
  return null;
}

function buildCamera(
  d: Draft,
  school: School,
  lat: number,
  lng: number,
): Camera {
  const isMobile = d.deviceType === "mobile_webrtc";
  const ip = d.ip.trim();
  return {
    id: newId("cam"),
    school_id: school.id,
    school_name: school.name,
    identifier: d.identifier.trim().toUpperCase(),
    name: d.name.trim(),
    location_type: d.locationType,
    location_detail: d.detail.trim(),
    device_type: d.deviceType,
    // Recién dada de alta no transmite todavía.
    status: "offline",
    last_heartbeat: null,
    lat,
    lng,
    // Firestore no acepta `undefined`: la IP solo va si se cargó.
    ...(!isMobile && ip ? { ip_address: ip } : {}),
    stream_type: isMobile ? "webrtc" : "rtsp",
    resolution: isMobile ? "720p HD" : d.resolution,
    fps: 30,
    is_live: false,
    installed_at: new Date().toISOString().slice(0, 10),
  };
}

export function AddCameraModal({
  isOpen,
  onClose,
  onAddCamera,
}: AddCameraModalProps) {
  const { data: schools } = useCollection<School>("schools");
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [pickedSchool, setPickedSchool] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const schoolId = pickedSchool || schools[0]?.id || "";
  const school = schools.find((s) => s.id === schoolId);
  const lat = parseCoord(draft.lat);
  const lng = parseCoord(draft.lng);
  const hasCoords =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180;
  const distance =
    school && hasCoords ? distanceMeters(school, { lat, lng }) : null;
  const radius = school?.perimeter_radius_meters ?? 200;
  const isOutside = distance !== null && distance > radius;
  const isMobile = draft.deviceType === "mobile_webrtc";

  if (!isOpen) return null;

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const close = () => {
    setDraft(EMPTY);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validate(draft, schoolId, isOutside, hasCoords);
    setError(problem);
    if (problem || !school || busy) return;
    setBusy(true);
    try {
      await onAddCamera(buildCamera(draft, school, lat, lng));
      close();
    } catch (err) {
      console.error("[cámaras] alta", err);
      setError(describeError(err, "No se pudo dar de alta la cámara."));
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
          <Cctv className="h-5 w-5 text-accent" />
          <h2 className="adm-title text-[15px] text-foreground">
            Agregar cámara
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field id="ac-id" text="Identificador">
            <input
              id="ac-id"
              className={input}
              placeholder="ej: CAM-204-NORTE"
              value={draft.identifier}
              onChange={(e) => set({ identifier: e.target.value })}
            />
          </Field>
          <Field id="ac-type" text="Tipo de dispositivo">
            <select
              id="ac-type"
              className={input}
              value={draft.deviceType}
              onChange={(e) =>
                set({ deviceType: e.target.value as CameraDeviceType })
              }
            >
              {(Object.keys(DEVICE_LABELS) as CameraDeviceType[]).map((t) => (
                <option key={t} value={t}>
                  {DEVICE_LABELS[t]}
                  {t === "mobile_webrtc" ? " (transmite video)" : ""}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field id="ac-name" text="Nombre">
          <input
            id="ac-name"
            className={input}
            placeholder="ej: Portón de ingreso turno mañana"
            value={draft.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </Field>

        <Field id="ac-school" text="Escuela">
          <select
            id="ac-school"
            className={input}
            value={schoolId}
            onChange={(e) => setPickedSchool(e.target.value)}
          >
            {schools.length === 0 && (
              <option value="">No hay escuelas registradas</option>
            )}
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </Field>

        <div>
          <div className="flex items-center justify-between">
            <span className={label}>Ubicación (latitud, longitud)</span>
            {school && (
              <button
                type="button"
                onClick={() =>
                  set({ lat: String(school.lat), lng: String(school.lng) })
                }
                className="text-[12px] text-accent hover:underline"
              >
                Partir de la escuela
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              aria-label="Latitud"
              inputMode="decimal"
              className={input}
              placeholder="-37.8785"
              value={draft.lat}
              onChange={(e) => set({ lat: e.target.value })}
            />
            <input
              aria-label="Longitud"
              inputMode="decimal"
              className={input}
              placeholder="-67.7955"
              value={draft.lng}
              onChange={(e) => set({ lng: e.target.value })}
            />
          </div>
          {distance !== null && (
            <p
              role={isOutside ? "alert" : undefined}
              className={`mt-1.5 text-[12px] ${isOutside ? "text-red-400" : "text-emerald-300"}`}
            >
              {isOutside
                ? `Fuera del corredor: está a ${Math.round(distance)} m de la escuela y el límite es ${radius} m.`
                : `Dentro del corredor: a ${Math.round(distance)} m de la escuela (límite ${radius} m).`}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field id="ac-zone" text="Zona">
            <select
              id="ac-zone"
              className={input}
              value={draft.locationType}
              onChange={(e) =>
                set({ locationType: e.target.value as CameraLocationType })
              }
            >
              {(Object.keys(LOCATION_LABELS) as CameraLocationType[]).map(
                (l) => (
                  <option key={l} value={l}>
                    {LOCATION_LABELS[l]}
                  </option>
                ),
              )}
            </select>
          </Field>
          {!isMobile && (
            <Field id="ac-res" text="Resolución">
              <select
                id="ac-res"
                className={input}
                value={draft.resolution}
                onChange={(e) => set({ resolution: e.target.value })}
              >
                {RESOLUTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>

        {!isMobile && (
          <Field id="ac-ip" text="Dirección IP (opcional)">
            <input
              id="ac-ip"
              className={input}
              inputMode="decimal"
              placeholder="ej: 192.168.10.55"
              value={draft.ip}
              onChange={(e) => set({ ip: e.target.value })}
            />
          </Field>
        )}
        <Field id="ac-detail" text="Detalle de montaje (opcional)">
          <input
            id="ac-detail"
            className={input}
            placeholder="ej: Poste de alumbrado N° 42 esq. Rawson"
            value={draft.detail}
            onChange={(e) => set({ detail: e.target.value })}
          />
        </Field>

        {isMobile && (
          <p className="text-[12px] text-muted">
            Después del alta, generá el enlace con «Vincular celular» y abrilo
            en el teléfono.
          </p>
        )}
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
          <button
            type="submit"
            className={btnPrimary}
            disabled={busy || isOutside}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Dar de alta la cámara
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
  children: ReactNode;
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
