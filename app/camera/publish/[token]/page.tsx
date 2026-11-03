"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Loader2,
  Radio,
  Shield,
  Square,
  SwitchCamera,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  describeSignalingError,
  startBroadcaster,
  type PeerHandle,
  type PeerStatus,
} from "@/lib/firebase/webrtc";

type Facing = "environment" | "user";
type LinkState = "checking" | "valid" | "invalid" | "offline";
type Broadcast = "idle" | PeerStatus | "error";

const BROADCAST_LABEL: Record<Broadcast, string> = {
  idle: "En espera",
  waiting: "Esperando que el centro de monitoreo abra la vista",
  connecting: "Conectando…",
  live: "Transmitiendo",
  taken: "Conectando…",
  error: "Error",
};

/** Mensaje claro cuando el navegador no da la cámara. */
function describeCameraError(err: unknown): string {
  const name = (err as { name?: string })?.name ?? "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Bloqueaste el permiso de cámara. Tocá el candado de la barra de direcciones, permití la cámara y volvé a intentar.";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "No encontramos una cámara en este dispositivo.";
  if (name === "NotReadableError")
    return "Otra aplicación está usando la cámara. Cerrala y volvé a intentar.";
  return "No se pudo abrir la cámara. Volvé a intentar.";
}

/** Sin https el navegador no permite usar la cámara: `mediaDevices` ni existe. */
const isInsecure = () =>
  typeof window !== "undefined" &&
  (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia);

/**
 * Comprueba el enlace sin login: las reglas solo dejan leer la sesión si la vinculación
 * existe y no venció, así que un permiso denegado significa enlace vencido o revocado.
 */
function useLinkState(token: string): LinkState {
  const [state, setState] = useState<LinkState>("checking");
  useEffect(() => {
    getDoc(doc(db, "camera_sessions", token))
      .then(() => setState("valid"))
      .catch((err) => {
        const code = (err as { code?: string })?.code;
        if (code !== "permission-denied")
          console.error("[publicar] enlace", err);
        setState(code === "permission-denied" ? "invalid" : "offline");
      });
  }, [token]);
  return state;
}

function useCameraPreview(enabled: boolean, facing: Facing) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || isInsecure()) return;
    let active: MediaStream | null = null;
    let cancelled = false;
    setError(null);
    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false, // sin audio: privacidad de los chicos
      })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        active = s;
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch((err) => {
        console.error("[publicar] cámara", err);
        if (!cancelled) setError(describeCameraError(err));
      });
    return () => {
      cancelled = true;
      active?.getTracks().forEach((t) => t.stop());
      setStream(null);
    };
  }, [enabled, facing, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { videoRef, stream, error, retry };
}

export default function MobilePublisherPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const link = useLinkState(token);
  const [facing, setFacing] = useState<Facing>("environment");
  const {
    videoRef,
    stream,
    error: cameraError,
    retry,
  } = useCameraPreview(link === "valid", facing);
  const [broadcast, setBroadcast] = useState<Broadcast>("idle");
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const handleRef = useRef<PeerHandle | null>(null);

  const stop = useCallback(() => {
    handleRef.current?.stop();
    handleRef.current = null;
    setBroadcast("idle");
  }, []);

  // Si cambia la cámara (frontal/trasera) o se sale de la página, se corta la transmisión.
  useEffect(() => stop, [stream, stop]);

  const start = () => {
    if (!stream) return;
    setBroadcastError(null);
    setBroadcast("connecting");
    handleRef.current = startBroadcaster({
      sessionId: token,
      localStream: stream,
      onStatus: setBroadcast,
      onError: (err) => {
        console.error("[publicar] transmisión", err);
        handleRef.current?.stop();
        handleRef.current = null;
        setBroadcastError(describeSignalingError(err));
        setBroadcast("error");
      },
    });
  };

  const isOn = broadcast !== "idle" && broadcast !== "error";
  const blocker = blockerFor(link, cameraError);

  return (
    <div className="flex min-h-screen flex-col gap-4 bg-black p-4 text-foreground select-none">
      <header className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-accent" />
          <div>
            <p className="text-[13px] font-semibold">Consola transmisora</p>
            <p className="text-[11px] text-muted">Corredor Escolar · Catriel</p>
          </div>
        </div>
        <StatusPill status={broadcast} />
      </header>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-zinc-950">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover ${facing === "user" ? "scale-x-[-1]" : ""}`}
        />
        {blocker && (
          <Blocker {...blocker} onRetry={blocker.retry ? retry : undefined} />
        )}
        {!blocker && (
          <button
            onClick={() =>
              setFacing(facing === "environment" ? "user" : "environment")
            }
            disabled={isOn}
            aria-label="Cambiar entre cámara frontal y trasera"
            className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line-strong)] bg-black/60 disabled:opacity-40"
          >
            <SwitchCamera className="h-5 w-5" />
          </button>
        )}
      </div>

      {broadcastError && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/40 p-3 text-[13px] text-red-300"
        >
          {broadcastError}
        </p>
      )}

      {isOn ? (
        <button
          onClick={stop}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 text-[15px] font-bold text-white"
        >
          <Square className="h-5 w-5" /> Detener transmisión
        </button>
      ) : (
        <button
          onClick={start}
          disabled={!stream || !!blocker}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-[15px] font-bold text-background disabled:opacity-40"
        >
          <Radio className="h-5 w-5" /> Iniciar transmisión
        </button>
      )}

      <p className="flex items-center justify-center gap-2 text-center text-[11px] text-muted">
        <Shield className="h-3.5 w-3.5 text-emerald-400" />
        El video va directo al centro de monitoreo, sin audio y sin grabarse.
      </p>
    </div>
  );
}

interface BlockerInfo {
  title: string;
  text: string;
  retry?: boolean;
  spinner?: boolean;
}

function blockerFor(
  link: LinkState,
  cameraError: string | null,
): BlockerInfo | null {
  if (link === "checking")
    return { title: "Verificando el enlace…", text: "", spinner: true };
  if (link === "invalid")
    return {
      title: "Este enlace ya no sirve",
      text: "Venció o fue revocado por la administración. Pedí un enlace nuevo en el centro de monitoreo y escanealo otra vez.",
    };
  if (link === "offline")
    return {
      title: "Sin conexión",
      text: "No pudimos verificar el enlace. Revisá internet y recargá la página.",
    };
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

function Blocker({
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

function StatusPill({ status }: { status: Broadcast }) {
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
