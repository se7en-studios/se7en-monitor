"use client";

import { useEffect, useState } from "react";
import {
  X,
  Maximize2,
  Minimize2,
  Camera as CameraIcon,
  Eye,
  Volume2,
  VolumeX,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Shield,
  Activity,
  Radio,
} from "lucide-react";
import { Camera } from "@/types/monitor";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/lib/firebase/auth-context";
import { logAccess } from "@/lib/firebase/audit";

interface CameraFullscreenModalProps {
  camera: Camera | null;
  onClose: () => void;
}

export function CameraFullscreenModal({ camera, onClose }: CameraFullscreenModalProps) {
  const [isNightVision, setIsNightVision] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const { profile } = useAuth();

  // Cada vez que alguien abre una cámara en pantalla completa queda registrado.
  const cameraId = camera?.id;
  useEffect(() => {
    if (!camera || !profile) return;
    void logAccess(
      {
        action: "ver_camara",
        camera_id: camera.id,
        camera_name: camera.name,
        school_name: camera.school_name,
      },
      { name: profile.full_name, role: profile.role }
    );
    // Solo al abrir o cambiar de cámara, no en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraId, profile?.id]);

  if (!camera) return null;

  const handleResetPTZ = () => {
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg p-2 sm:p-6 animate-in fade-in duration-200">
      <div className="relative flex flex-col h-full max-h-[95vh] w-full max-w-6xl rounded-2xl border border-[var(--line-strong)] bg-background overflow-hidden">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--well)] px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-accent bg-accent-soft border border-accent/20 px-2 py-0.5 rounded">
              {camera.identifier}
            </span>
            <div>
              <h2 className="adm-title text-[13px] text-foreground">{camera.name}</h2>
              <p className="text-[11px] text-muted">
                {camera.school_name} · {camera.location_detail}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={camera.status} size="sm" />
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted hover:bg-white/[0.08] hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Center Video Viewport Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {/* Simulated Video Frame with PTZ transforms and Night Vision filter */}
          <div
            className={`relative h-full w-full flex items-center justify-center transition-all duration-300 ${
 isNightVision ?"brightness-125 contrast-125 grayscale hue-rotate-90 invert-0" :""
 }`}
            style={{
              transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
            }}
          >
            {/* Tactical Grid Overlay */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
                backgroundSize: "40px 40px",
              }}
            />

            {/* Simulated Live Stream Content */}
            <div className="text-center p-8">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent-soft border border-accent/30 text-accent mb-4 animate-pulse">
                {camera.device_type === "mobile_webrtc" ? (
                  <Radio className="h-10 w-10 text-accent" />
                ) : (
                  <Eye className="h-10 w-10" />
                )}
              </div>
              <p className="font-mono text-sm font-semibold text-foreground">
                STREAM EN VIVO · CIRCUITO CERRADO
              </p>
              <p className="text-xs font-mono text-muted mt-1">
                {camera.resolution} @ {camera.fps} FPS · LATENCIA: 28ms · CERO PÉRDIDA
              </p>
            </div>

            {/* Top Left Camera HUD */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 font-mono text-[10px] text-emerald-400 bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg border border-[var(--line)]">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-live-pulse" />
                ENCRIPTADO P2P (WEBRTC)
              </span>
              <span>ZOOM: {zoomLevel.toFixed(1)}x · PAN: {panX}° TILT: {panY}°</span>
              <span className="text-muted">BITRATE: 3.8 Mbps (H.264/Opus)</span>
            </div>

          </div>
        </div>

        {/* Bottom Operator Control Bar & PTZ Remote */}
        <div className="border-t border-[var(--line)] bg-[var(--well)] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Quick Filter Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNightVision(!isNightVision)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
 isNightVision
 ?"border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
 :"border-[var(--line)] bg-white/[0.04] text-foreground/85 hover:bg-white/[0.08]"
 }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Visión Nocturna IR ({isNightVision ? "ON" : "OFF"})</span>
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-foreground/85 hover:bg-white/[0.08]"
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5 text-muted" /> : <Volume2 className="h-3.5 w-3.5 text-accent" />}
              <span>{isMuted ? "Sin Audio" : "Audio Activo"}</span>
            </button>

            <button
              disabled
              title="Las capturas están deshabilitadas: el sistema transmite en vivo y no guarda imágenes de menores."
              className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-[var(--line)] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-muted opacity-60"
            >
              <CameraIcon className="h-3.5 w-3.5" />
              <span>Capturas deshabilitadas</span>
            </button>
          </div>

          {/* PTZ Pan/Tilt/Zoom D-Pad */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase text-muted hidden sm:inline">
              Control PTZ 360°
            </span>

            <div className="flex items-center gap-1 bg-panel border border-[var(--line)] rounded-xl p-1">
              <button
                onClick={() => setPanX((prev) => prev - 15)}
                className="p-1.5 rounded-lg text-muted hover:bg-white/[0.08] hover:text-foreground"
                title="Girar Izquierda"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPanY((prev) => prev - 15)}
                className="p-1.5 rounded-lg text-muted hover:bg-white/[0.08] hover:text-foreground"
                title="Inclinar Arriba"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPanY((prev) => prev + 15)}
                className="p-1.5 rounded-lg text-muted hover:bg-white/[0.08] hover:text-foreground"
                title="Inclinar Abajo"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPanX((prev) => prev + 15)}
                className="p-1.5 rounded-lg text-muted hover:bg-white/[0.08] hover:text-foreground"
                title="Girar Derecha"
              >
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="h-4 w-px bg-white/10 mx-1" />

              <button
                onClick={() => setZoomLevel((prev) => Math.min(prev + 0.5, 4))}
                className="p-1.5 rounded-lg text-muted hover:bg-white/[0.08] hover:text-foreground"
                title="Acercar (Zoom In)"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoomLevel((prev) => Math.max(prev - 0.5, 1))}
                className="p-1.5 rounded-lg text-muted hover:bg-white/[0.08] hover:text-foreground"
                title="Alejar (Zoom Out)"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={handleResetPTZ}
                className="p-1.5 rounded-lg text-muted hover:bg-white/[0.08] hover:text-foreground"
                title="Restablecer Posición"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

