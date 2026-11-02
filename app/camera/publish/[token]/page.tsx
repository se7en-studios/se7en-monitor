"use client";

import { use, useEffect, useRef, useState } from "react";
import {
  Camera,
  SwitchCamera,
  Radio,
  Square,
  Shield,
  AlertCircle,
  Volume2,
  VolumeX,
  Battery,
  Wifi,
  Sparkles,
} from "lucide-react";
import { startBroadcaster, WebRTCConnectionState } from "@/lib/firebase/webrtc";

export default function MobilePublisherPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [status, setStatus] = useState<"standby" | "connecting" | "live">("standby");
  const [connectionState, setConnectionState] = useState<WebRTCConnectionState | null>(null);

  const broadcasterRef = useRef<{ stop: () => void } | null>(null);

  // Initialize camera preview
  const startCamera = async (mode: "environment" | "user") => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      setErrorMsg(null);
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false, // Muted by default for educational safety
      });

      setStream(newStream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      setHasPermission(false);
      const message = err instanceof Error ? err.message : "No se pudo acceder a la cámara";
      setErrorMsg(`No se pudo acceder a la cámara: ${message}`);
    }
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (broadcasterRef.current) {
        broadcasterRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const toggleFacingMode = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
  };

  const handleStartBroadcast = async () => {
    if (!stream) return;

    setStatus("connecting");
    try {
      const broadcaster = await startBroadcaster({
        sessionId: token,
        localStream: stream,
        onStateChange: (state) => {
          setConnectionState(state);
          if (state === "connected") {
            setStatus("live");
            setIsBroadcasting(true);
          } else if (state === "failed" || state === "closed") {
            setStatus("standby");
            setIsBroadcasting(false);
          }
        },
        onError: (err) => {
          setErrorMsg(err.message);
          setStatus("standby");
          setIsBroadcasting(false);
        },
      });

      broadcasterRef.current = broadcaster;
      setIsBroadcasting(true);
      setStatus("live");
    } catch (err) {
      console.error("Broadcast start failed:", err);
      setStatus("standby");
      setIsBroadcasting(false);
    }
  };

  const handleStopBroadcast = () => {
    if (broadcasterRef.current) {
      broadcasterRef.current.stop();
      broadcasterRef.current = null;
    }
    setIsBroadcasting(false);
    setStatus("standby");
    setConnectionState(null);
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-black text-white p-4 select-none">
      {/* Top Mobile Bar HUD */}
      <div className="z-20 flex items-center justify-between rounded-xl bg-black/60 backdrop-blur-md p-3 border border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/40">
            <Radio className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold leading-tight">SE7EN TRANSMITTER</p>
            <p className="text-[10px] font-mono text-slate-400">
              Firebase WebRTC · Catriel Escuelas
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2">
          {status === "live" ? (
            <span className="flex items-center gap-1.5 rounded-full bg-rose-500 px-2.5 py-0.5 text-[10px] font-mono font-bold text-white uppercase tracking-wider animate-pulse">
              <span className="h-2 w-2 rounded-full bg-white" />
              EMITIENDO EN VIVO
            </span>
          ) : status === "connecting" ? (
            <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-mono text-amber-400">
              SEÑALIZANDO...
            </span>
          ) : (
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-mono text-slate-400">
              EN ESPERA
            </span>
          )}
        </div>
      </div>

      {/* Main Viewport / Camera Preview */}
      <div className="relative my-4 flex-1 overflow-hidden rounded-2xl border border-white/15 bg-zinc-950 flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover ${
            facingMode === "user" ? "scale-x-[-1]" : ""
          }`}
        />

        {/* Permission Request State */}
        {hasPermission === false && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
            <AlertCircle className="h-12 w-12 text-rose-500 mb-3" />
            <h3 className="text-base font-bold text-white">Permiso de Cámara Requerido</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Por favor habilite los permisos de cámara en su navegador para transmitir video al centro de monitoreo.
            </p>
            <button
              onClick={() => startCamera(facingMode)}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Active Broadcast On-Screen Overlay */}
        {isBroadcasting && (
          <div className="absolute top-3 left-3 z-10 rounded-md bg-black/70 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>ENLACE ACTIVO · {connectionState ? connectionState.toUpperCase() : "OK"}</span>
          </div>
        )}

        {/* Camera switch button floating on preview */}
        <button
          onClick={toggleFacingMode}
          className="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-lg active:scale-95 transition-transform"
          title="Cambiar a cámara frontal o trasera"
        >
          <SwitchCamera className="h-5 w-5" />
        </button>
      </div>

      {/* Bottom Action Control Bar */}
      <div className="z-20 flex flex-col gap-3">
        {/* Main Big Broadcast Button */}
        {!isBroadcasting ? (
          <button
            onClick={handleStartBroadcast}
            disabled={!hasPermission}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-xl shadow-blue-600/30 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Radio className="h-5 w-5 animate-pulse" />
            INICIAR TRANSMISIÓN AL DASHBOARD
          </button>
        ) : (
          <button
            onClick={handleStopBroadcast}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-rose-600 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-xl shadow-rose-600/30 active:scale-[0.98] transition-all"
          >
            <Square className="h-5 w-5" />
            DETENER TRANSMISIÓN
          </button>
        )}

        {/* Security / Educational Privacy Note */}
        <div className="flex items-center justify-center gap-2 text-center text-[11px] text-slate-500">
          <Shield className="h-3.5 w-3.5 text-emerald-500" />
          <span>Canal P2P WebRTC Encriptado · Firestore Signaling</span>
        </div>
      </div>
    </div>
  );
}
