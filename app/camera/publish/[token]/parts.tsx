"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import type { ClaimResult } from "@/lib/firebase/device-pairing";
import type { PeerStatus } from "@/lib/firebase/webrtc";

export type LinkState = ClaimResult["state"] | "checking";
export type Broadcast = "idle" | PeerStatus | "error";

const BROADCAST_LABEL: Record<Broadcast, string> = {
  idle: "En espera",
  waiting: "Esperando que el centro de monitoreo abra la vista",
  connecting: "Conectando…",
  live: "Transmitiendo",
  taken: "Conectando…",
  error: "Error",
};

/** Sin https el navegador no permite usar la cámara: `mediaDevices` ni existe. */
export const isInsecure = () =>
  typeof window !== "undefined" &&
  (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia);

export interface BlockerInfo {
  title: string;
  text: string;
  retry?: boolean;
  spinner?: boolean;
}

const LINK_BLOCKERS: Partial<Record<LinkState, BlockerInfo>> = {
  checking: { title: "Verificando el enlace…", text: "", spinner: true },
  invalid: {
    title: "Este enlace ya no sirve",
    text: "Venció o fue revocado por la administración. Pedí un enlace nuevo en el centro de monitoreo y escanealo otra vez.",
  },
  claimed: {
    title: "Este enlace ya está en uso",
    text: "Cada enlace queda atado al primer celular que lo abre. Si este es el celular correcto, pedí un enlace nuevo en el centro de monitoreo.",
  },
  disabled: {
    title: "La vinculación no está habilitada",
    text: "Falta activar el acceso anónimo en Firebase Authentication. Avisale a la administración del sistema.",
  },
  offline: {
    title: "Sin conexión",
    text: "No pudimos verificar el enlace. Revisá internet y recargá la página.",
  },
};

export function blockerFor(
  link: LinkState,
  cameraError: string | null,
): BlockerInfo | null {
  const fromLink = LINK_BLOCKERS[link];
  if (fromLink) return fromLink;
  if (isInsecure())
    return {
      title: "El navegador bloquea la cámara",
      text: "Solo se puede usar la cámara desde una dirección segura (https). Abrí el enlace que empieza con https:// que te dio el centro de monitoreo.",
    };
  if (cameraError)
    return {
      title: "No se pudo abrir la cámara",
      text: cameraError,
      retry: true,
    };
  return null;
}

export function Blocker({
  title,
  text,
  spinner,
  onRetry,
}: BlockerInfo & { onRetry?: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/90 p-6 text-center">
      {spinner ? (
        <Loader2 className="h-8 w-8 animate-spin text-muted" />
      ) : (
        <AlertCircle className="h-10 w-10 text-red-400" />
      )}
      <h1 className="text-[15px] font-semibold">{title}</h1>
      {text && (
        <p className="max-w-xs text-[13px] leading-relaxed text-muted">
          {text}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-background"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

export function StatusPill({ status }: { status: Broadcast }) {
  const tone =
    status === "live"
      ? "bg-red-600 text-white"
      : status === "error"
        ? "border border-red-500/50 text-red-300"
        : status === "idle"
          ? "bg-white/[0.06] text-muted"
          : "border border-amber-500/40 text-amber-300";
  return (
    <span
      className={`max-w-[55%] rounded-full px-2.5 py-1 text-right text-[11px] font-semibold ${tone}`}
    >
      {BROADCAST_LABEL[status]}
    </span>
  );
}
