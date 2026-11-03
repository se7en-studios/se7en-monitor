"use client";

import { useState } from "react";
import {
  Grid2X2,
  Grid3X3,
  Maximize2,
  Volume2,
  VolumeX,
  Radio,
  Video,
  VideoOff,
  Smartphone,
  ExternalLink,
  Shield,
  RefreshCw,
} from "lucide-react";
import { useCollection, byId } from "@/lib/firebase/data";
import { StatusBadge } from "@/components/status-badge";
import { ConnectMobileModal } from "@/components/connect-mobile-modal";
import { WebRTCReceiverTile } from "@/components/webrtc-receiver-tile";
import { CameraFullscreenModal } from "@/components/camera-fullscreen-modal";
import { Camera } from "@/types/monitor";
import { cn } from "@/lib/utils";

export default function LiveMonitoringPage() {
  const [gridLayout, setGridLayout] = useState<"1x1" | "2x2" | "3x3">("2x2");
  const [isMuted, setIsMuted] = useState(true);
  const [fullscreenCamera, setFullscreenCamera] = useState<Camera | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const { data: cameras } = useCollection<Camera>("cameras", byId);

  const displayedCameras =
    gridLayout === "1x1"
      ? cameras.slice(0, 1)
      : gridLayout === "2x2"
      ? cameras.slice(0, 4)
      : cameras.slice(0, 9);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-live-pulse" />
            <span className="font-mono text-xs font-bold text-rose-400 uppercase tracking-wider">
              CENTRO DE MONITOREO EN TIEMPO REAL
            </span>
          </div>
          <h1 className="mt-1 adm-display text-[clamp(28px,3.6vw,44px)] text-foreground">
            Monitoreo en Vivo — Corredor Escolar
          </h1>
          <p className="text-xs text-muted">
            Transmisiones WebRTC activas y telemetría de accesos escolares de Catriel
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              isMuted
                ? "border-[var(--line)] bg-panel text-muted hover:text-foreground"
                : "border-accent/30 bg-accent/20 text-accent"
            )}
            title="Audio silenciado por defecto por directiva de privacidad"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            <span className="hidden sm:inline">
              {isMuted ? "Audio Silenciado" : "Audio Activo"}
            </span>
          </button>

          {/* Grid Layout Switcher */}
          <div className="flex items-center rounded-lg border border-[var(--line)] bg-panel p-1">
            <button
              onClick={() => setGridLayout("1x1")}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-mono font-medium transition-colors",
                gridLayout === "1x1"
                  ? "bg-accent text-background"
                  : "text-muted hover:text-foreground"
              )}
            >
              1x1
            </button>
            <button
              onClick={() => setGridLayout("2x2")}
              className={cn(
                "flex items-center gap-1 rounded px-2.5 py-1 text-xs font-mono font-medium transition-colors",
                gridLayout === "2x2"
                  ? "bg-accent text-background"
                  : "text-muted hover:text-foreground"
              )}
            >
              <Grid2X2 className="h-3.5 w-3.5" />
              <span>2x2</span>
            </button>
            <button
              onClick={() => setGridLayout("3x3")}
              className={cn(
                "flex items-center gap-1 rounded px-2.5 py-1 text-xs font-mono font-medium transition-colors",
                gridLayout === "3x3"
                  ? "bg-accent text-background"
                  : "text-muted hover:text-foreground"
              )}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
              <span>3x3</span>
            </button>
          </div>

          {/* Quick Mobile Broadcaster Button */}
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-background hover:bg-[var(--accent-hover)] transition-colors"
          >
            <Smartphone className="h-4 w-4" />
            <span className="hidden md:inline">Transmitir Celular</span>
          </button>
        </div>
      </div>

      {/* Grid of Cameras */}
      <div
        className={cn(
          "grid gap-4",
          gridLayout === "1x1" && "grid-cols-1 max-w-4xl mx-auto",
          gridLayout === "2x2" && "grid-cols-1 md:grid-cols-2",
          gridLayout === "3x3" && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {displayedCameras.map((cam) => {
          const isMobileDevice = cam.device_type === "mobile_webrtc";

          return (
            <div
              key={cam.id}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-panel transition-all hover:border-[var(--line-strong)]"
            >
              {/* Camera Header Bar */}
              <div className="flex items-center justify-between border-b border-[var(--line)] bg-background px-4 py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground text-xs">
                    {cam.identifier}
                  </span>
                  <span className="text-muted">|</span>
                  <span className="text-foreground/85 font-medium truncate max-w-[150px]">
                    {cam.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {cam.is_live && (
                    <span className="flex items-center gap-1 rounded bg-rose-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-rose-400 border border-rose-500/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-live-pulse" />
                      LIVE
                    </span>
                  )}
                  <StatusBadge status={cam.status} size="sm" showDot={false} />
                </div>
              </div>

              {/* Video Frame Container */}
              {isMobileDevice ? (
                <WebRTCReceiverTile
                  token={cam.publish_token || "demo-mobile-token-se7en"}
                  onOpenPairModal={() => setIsConnectModalOpen(true)}
                  isMuted={isMuted}
                />
              ) : (
                <div className="relative aspect-video w-full bg-background flex items-center justify-center overflow-hidden">
                  {cam.status === "offline" ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-muted">
                      <VideoOff className="h-8 w-8 text-rose-500/60 mb-2" />
                      <p className="text-xs font-semibold text-rose-400">
                        Cámara Sin Señal de Red
                      </p>
                      <p className="text-[10px] text-muted mt-0.5">
                        Último ping registrado: hace 2 horas
                      </p>
                    </div>
                  ) : (
                    <div className="relative h-full w-full bg-panel p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-mono text-muted bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded">
                        <span className="text-emerald-400">{cam.school_name}</span>
                        <span>{cam.resolution} · {cam.fps} FPS</span>
                      </div>

                      <div className="flex flex-col items-center justify-center">
                        <div className="h-10 w-10 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                          <Video className="h-5 w-5" />
                        </div>
                        <p className="mt-2 text-xs font-medium text-foreground/85">
                          {cam.location_detail}
                        </p>
                        <p className="text-[10px] font-mono text-muted">
                          Canal Seguro RTSP/WebRTC Encriptado
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[9px] font-mono text-muted bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded">
                        <span>IP: {cam.ip_address || "DHCP Dinámico"}</span>
                        <span className="text-emerald-400">LATENCIA: 42ms</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Card Footer */}
              <div className="flex items-center justify-between bg-background px-4 py-2 border-t border-[var(--line)] text-[11px] text-muted">
                <span className="truncate">{cam.school_name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted">
                    Radio 200m
                  </span>
                  <button
                    onClick={() => setFullscreenCamera(cam)}
                    className="rounded p-1 text-muted hover:bg-white/[0.08] hover:text-foreground transition-colors"
                    title="Maximizar en modo teatro / PTZ"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Statement */}
      <div className="rounded-xl border border-[var(--line)] bg-panel p-4 text-xs text-muted flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Shield className="h-4 w-4 text-accent shrink-0" />
          <span>
            Transmisiones encriptadas WebRTC punto a punto. Prohibida la redistribución pública según directivas de protección a la niñez y normativas de seguridad escolar de Catriel.
          </span>
        </div>
        <span className="font-mono text-[11px] text-muted hidden sm:inline">
          Catriel Seguro 2026
        </span>
      </div>

      <ConnectMobileModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />

      <CameraFullscreenModal
        camera={fullscreenCamera}
        onClose={() => setFullscreenCamera(null)}
      />
    </div>
  );
}
