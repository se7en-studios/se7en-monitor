"use client";

import { useState } from "react";
import { X, School, ShieldCheck, Loader2 } from "lucide-react";
import { newId } from "@/lib/firebase/data";
import { describeError } from "@/components/toast";
import {
  School as SchoolType,
  EducationalLevel,
  SchoolManagement,
} from "@/types/monitor";

interface AddSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Si devuelve una promesa, el modal espera, muestra el error si falla y no se cierra. */
  onAddSchool: (school: SchoolType) => void | Promise<void>;
}

const parseCoord = (s: string) => Number.parseFloat(s.replace(",", "."));

// Mismo formato que exigen las reglas de Firestore: mayúsculas, números y guiones.
const CODE_RE = /^[A-Z0-9-]{1,20}$/;
const normalizeCode = (s: string) =>
  s.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);

export function AddSchoolModal({
  isOpen,
  onClose,
  onAddSchool,
}: AddSchoolModalProps) {
  const [latText, setLatText] = useState("");
  const [lngText, setLngText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("Centro");
  const [level, setLevel] = useState<EducationalLevel>("primario");
  const [management, setManagement] = useState<SchoolManagement>("estatal");
  const [principalName, setPrincipalName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  if (!isOpen) return null;

  const lat = parseCoord(latText);
  const lng = parseCoord(lngText);
  const hasCoords =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !address.trim())
      return setError("Completá código, nombre y dirección.");
    if (!CODE_RE.test(code.trim()))
      return setError("El código solo admite mayúsculas, números y guiones (ej: ESC-218).");
    // La ubicación define el corredor de 200 m: no se puede inventar.
    if (!hasCoords)
      return setError(
        "Cargá la ubicación real de la escuela (latitud y longitud).",
      );
    if (busy) return;

    const newSchool: SchoolType = {
      id: newId("sch"),
      code: code.trim().toUpperCase(),
      name: name.trim(),
      address: address.trim(),
      neighborhood: neighborhood.trim(),
      city: "Catriel",
      province: "Río Negro",
      lat,
      lng,
      educational_level: level,
      management,
      principal_name: principalName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      perimeter_radius_meters: 200,
      cameras_count: 0,
      status: "operativo",
      created_at: new Date().toISOString(),
    };

    setBusy(true);
    setError(null);
    try {
      await onAddSchool(newSchool);
      onClose();
    } catch (err) {
      console.error("[escuelas] alta", err);
      setError(describeError(err, "No se pudo registrar la escuela."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--line-strong)] bg-panel p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted hover:bg-white/[0.08] hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 border border-accent/30 text-accent">
            <School className="h-5 w-5" />
          </div>
          <div>
            <h3 className="adm-title text-[13px] text-foreground">
              Registrar Establecimiento Educativo
            </h3>
            <p className="text-xs text-muted">
              Incorporación al programa de Corredor Escolar Cuidado de Catriel
              (Radio 200m)
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="as-code"
                className="text-[11px] font-mono uppercase tracking-wider text-muted"
              >
                Código Institucional
              </label>
              <input
                id="as-code"
                type="text"
                maxLength={20}
                autoCapitalize="characters"
                required
                placeholder="ej: ESC-218"
                value={code}
                onChange={(e) => setCode(normalizeCode(e.target.value))}
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--well)] px-3 py-2 text-xs text-foreground placeholder:text-muted/60 focus:border-accent/50 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="as-level"
                className="text-[11px] font-mono uppercase tracking-wider text-muted"
              >
                Nivel Educativo
              </label>
              <select
                id="as-level"
                value={level}
                onChange={(e) => setLevel(e.target.value as EducationalLevel)}
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--well)] px-3 py-2 text-xs text-foreground focus:border-accent/50 focus:outline-none"
              >
                <option value="inicial">Inicial / Jardín</option>
                <option value="primario">Primario</option>
                <option value="secundario">Secundario (CEM/ESRN)</option>
                <option value="tecnico">Técnico (CET)</option>
                <option value="superior">Superior</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="as-management"
              className="text-[11px] font-mono uppercase tracking-wider text-muted"
            >
              Gestión
            </label>
            <select
              id="as-management"
              value={management}
              onChange={(e) =>
                setManagement(e.target.value as SchoolManagement)
              }
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--well)] px-3 py-2 text-xs text-foreground focus:border-accent/50 focus:outline-none"
            >
              <option value="estatal">Estatal (pública)</option>
              <option value="privada">Privada</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="as-name"
              className="text-[11px] font-mono uppercase tracking-wider text-muted"
            >
              Nombre Oficial de la Escuela
            </label>
            <input
              id="as-name"
              type="text"
              maxLength={120}
              required
              placeholder="ej: Escuela Primaria N° 218 Barrio Rawson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--well)] px-3 py-2 text-xs text-foreground placeholder:text-muted/60 focus:border-accent/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="as-address"
                className="text-[11px] font-mono uppercase tracking-wider text-muted"
              >
                Dirección
              </label>
              <input
                id="as-address"
                type="text"
                maxLength={200}
                required
                placeholder="Calle y altura"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--well)] px-3 py-2 text-xs text-foreground placeholder:text-muted/60 focus:border-accent/50 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="as-neighborhood"
                className="text-[11px] font-mono uppercase tracking-wider text-muted"
              >
                Barrio (Catriel)
              </label>
              <input
                id="as-neighborhood"
                type="text"
                placeholder="ej: Rawson / Preiss"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--well)] px-3 py-2 text-xs text-foreground placeholder:text-muted/60 focus:border-accent/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="as-principal"
                className="text-[11px] font-mono uppercase tracking-wider text-muted"
              >
                Directivo / Responsable
              </label>
              <input
                id="as-principal"
                type="text"
                placeholder="Nombre del director"
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--well)] px-3 py-2 text-xs text-foreground placeholder:text-muted/60 focus:border-accent/50 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="as-phone"
                className="text-[11px] font-mono uppercase tracking-wider text-muted"
              >
                Teléfono Institucional
              </label>
              <input
                id="as-phone"
                type="tel"
                placeholder="(0299) 491-..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--well)] px-3 py-2 text-xs text-foreground placeholder:text-muted/60 focus:border-accent/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="as-lat"
                className="text-[11px] font-mono uppercase tracking-wider text-muted"
              >
                Latitud
              </label>
              <input
                id="as-lat"
                inputMode="decimal"
                placeholder="-37.8785"
                value={latText}
                onChange={(e) => setLatText(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--well)] px-3 py-2 text-xs text-foreground placeholder:text-muted/60 focus:border-accent/50 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="as-lng"
                className="text-[11px] font-mono uppercase tracking-wider text-muted"
              >
                Longitud
              </label>
              <input
                id="as-lng"
                inputMode="decimal"
                placeholder="-67.7955"
                value={lngText}
                onChange={(e) => setLngText(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--well)] px-3 py-2 text-xs text-foreground placeholder:text-muted/60 focus:border-accent/50 focus:outline-none"
              />
            </div>
          </div>
          <p className="-mt-2 text-[11px] text-muted">
            Tip: en Google Maps, mantené apretado sobre la escuela y copiá las
            coordenadas.
          </p>

          <div>
            <label
              htmlFor="as-email"
              className="text-[11px] font-mono uppercase tracking-wider text-muted"
            >
              Email institucional (opcional)
            </label>
            <input
              id="as-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--well)] px-3 py-2 text-xs text-foreground placeholder:text-muted/60 focus:border-accent/50 focus:outline-none"
            />
          </div>

          {error && (
            <p role="alert" className="text-[13px] text-red-400">
              {error}
            </p>
          )}

          <div className="rounded-xl border border-accent/20 bg-accent-soft p-3 text-xs text-foreground/85 flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
            <span>
              Radio perimetral legal asignado automáticamente a{" "}
              <strong>200 metros</strong>.
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--line)]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--line)] px-4 py-2 text-xs font-medium text-foreground/85 hover:bg-white/[0.05]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-background hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Dar de alta la escuela
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
