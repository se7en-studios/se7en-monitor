"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { Radio, Shield, Square, SwitchCamera } from "lucide-react";
import { claimPairing, type ClaimResult } from "@/lib/firebase/device-pairing";
import {
  describeSignalingError,
  startBroadcaster,
  toError,
  type BroadcasterHandle,
  type DevicePairing,
} from "@/lib/firebase/webrtc";
import {
  Blocker,
  StatusPill,
  blockerFor,
  isInsecure,
  type Broadcast,
  type LinkState,
} from "./parts";

type Facing = "environment" | "user";

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

/** Abre el enlace: sesión anónima + reclamo del enlace para este celular. */
function useDeviceLink(token: string): ClaimResult | null {
  const [result, setResult] = useState<ClaimResult | null>(null);
  useEffect(() => {
    let cancelled = false;
    void claimPairing(token).then((r) => !cancelled && setResult(r));
    return () => {
      cancelled = true;
    };
  }, [token]);
  return result;
}

function useCameraPreview(enabled: boolean, facing: Facing) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || isInsecure()) return;
    // `active` es local a esta corrida del efecto: el cleanup apaga justo esta cámara.
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

/**
 * Transmisión del celular. Usa refs para no depender de closures viejas: cambiar de
 * cámara reemplaza la pista (replaceTrack) sin cortar, y al salir se corta todo.
 */
function useBroadcast(
  pairing: DevicePairing | null,
  stream: MediaStream | null,
) {
  const [status, setStatus] = useState<Broadcast>("idle");
  const [error, setError] = useState<string | null>(null);
  const handleRef = useRef<BroadcasterHandle | null>(null);
  const streamRef = useRef(stream);
  const generation = useRef(0); // cada start/stop invalida los anteriores

  const halt = useCallback(() => {
    generation.current += 1;
    handleRef.current?.stop();
    handleRef.current = null;
  }, []);

  useEffect(() => {
    streamRef.current = stream;
    if (stream) handleRef.current?.setStream(stream);
  }, [stream]);

  useEffect(() => halt, [halt]);

  const fail = useCallback(
    (err: Error) => {
      console.error("[publicar] transmisión", err);
      halt();
      setError(describeSignalingError(err));
      setStatus("error");
    },
    [halt],
  );

  const start = useCallback(async () => {
    const initial = streamRef.current;
    if (!pairing || !initial || handleRef.current) return;
    const gen = ++generation.current;
    setError(null);
    setStatus("connecting");
    try {
      const handle = await startBroadcaster({
        pairing,
        localStream: initial,
        onStatus: (s) => gen === generation.current && setStatus(s),
        onError: (err) => gen === generation.current && fail(err),
      });
      if (gen !== generation.current) return handle.stop();
      handleRef.current = handle;
      const latest = streamRef.current;
      if (latest && latest !== initial) handle.setStream(latest);
    } catch (err) {
      if (gen === generation.current) fail(toError(err));
    }
  }, [pairing, fail]);

  const stop = useCallback(() => {
    halt();
    setStatus("idle");
  }, [halt]);

  return { status, error, start, stop };
}

export default function MobilePublisherPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const claim = useDeviceLink(token);
  const link: LinkState = claim?.state ?? "checking";
  const pairing = claim?.state === "valid" ? claim.pairing : null;
  const [facing, setFacing] = useState<Facing>("environment");
  const preview = useCameraPreview(link === "valid", facing);
  const broadcast = useBroadcast(pairing, preview.stream);

  const isOn = broadcast.status !== "idle" && broadcast.status !== "error";
  const blocker = blockerFor(link, preview.error);

  return (
    <div className="flex min-h-screen flex-col gap-4 bg-black p-4 text-foreground select-none">
      <header className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-accent" />
          <div>
            <p className="text-[13px] font-semibold">Consola transmisora</p>
            <p className="text-[11px] text-muted">
              {pairing?.cameraName || "Corredor Escolar · Catriel"}
            </p>
          </div>
        </div>
        <StatusPill status={broadcast.status} />
      </header>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-zinc-950">
        <video
          ref={preview.videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover ${facing === "user" ? "scale-x-[-1]" : ""}`}
        />
        {blocker && (
          <Blocker
            {...blocker}
            onRetry={blocker.retry ? preview.retry : undefined}
          />
        )}
        {!blocker && (
          <button
            onClick={() =>
              setFacing(facing === "environment" ? "user" : "environment")
            }
            aria-label="Cambiar entre cámara frontal y trasera"
            className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line-strong)] bg-black/60"
          >
            <SwitchCamera className="h-5 w-5" />
          </button>
        )}
      </div>

      {broadcast.error && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/40 p-3 text-[13px] text-red-300"
        >
          {broadcast.error}
        </p>
      )}

      {isOn ? (
        <button
          onClick={broadcast.stop}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 text-[15px] font-bold text-white"
        >
          <Square className="h-5 w-5" /> Detener transmisión
        </button>
      ) : (
        <button
          onClick={() => void broadcast.start()}
          disabled={!preview.stream || !!blocker}
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
