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
import { MOCK_CAMERAS } from "@/data/mock-data";
import { StatusBadge } from "@/components/status-badge";
import { ConnectMobileModal } from "@/components/connect-mobile-modal";
import { cn } from "@/lib/utils";

export default function LiveMonitoringPage() {
  const [gridLayout, setGridLayout] = useState<"1x1" | "2x2" | "3x3">("2x2");
  const [isMuted, setIsMuted] = useState(true);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const displayedCameras =
    gridLayout === "1x1"
      ? MOCK_CAMERAS.slice(0, 1)
      : gridLayout === "2x2"
      ? MOCK_CAMERAS.slice(0, 4)
      : MOCK_CAMERAS.slice(0, 9);

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
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            Monitoreo en Vivo — Corredor Escolar
          </h1>
          <p className="text-xs text-slate-400">
            Transmisiones activas punto a punto y telemetría de accesos escolares
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio toggle (Muted by default for privacy & compliance) */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              isMuted
                ? "border-white/[0.08] bg-[#0e131f] text-slate-400 hover:text-white"
                : "border-blue-500/30 bg-blue-600/20 text-blue-400"
            )}
            title="Audio silenciado por defecto por directiva de privacidad"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            <span className="hidden sm:inline">
              {isMuted ? "Audio Silenciado" : "Audio Activo"}
            </span>
          </button>

          {/* Grid Layout Switcher */}
          <div className="flex items-center rounded-lg border border-white/[0.08] bg-[#0e131f] p-1">
            <button
              onClick={() => setGridLayout("1x1")}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-mono font-medium transition-colors",
                gridLayout === "1x1"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              1x1
            </button>
            <button
              onClick={() => setGridLayout("2x2")}
              className={cn(
                "flex items-center gap-1 rounded px-2.5 py-1 text-xs font-mono font-medium transition-colors",
                gridLayout === "2x2"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
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
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
              <span>3x3</span>
            </button>
          </div>

          {/* Quick Mobile Broadcaster Button */}
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
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
              className="group relative flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c101a] shadow-lg transition-all hover:border-white/[0.18]"
            >
              {/* Camera Header Bar */}
              <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#080c14] px-4 py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white text-xs">
                    {cam.identifier}
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-300 font-medium truncate max-w-[150px]">
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
              <div className="relative aspect-video w-full bg-[#05080e] flex items-center justify-center overflow-hidden">
                {isMobileDevice ? (
                  /* Mobile WebRTC Stream Placeholder or Active Receiver */
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
                      <Smartphone className="h-7 w-7" />
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white">
                      Receptor WebRTC para Dispositivo Móvil
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400 max-w-xs leading-tight">
                      Escaneá el código QR desde tu teléfono para emitir video en vivo a este visor
                    </p>
                    <button
                      onClick={() => setIsConnectModalOpen(true)}
                      className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-600/20 px-3 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-600/30"
                    >
                      <Radio className="h-3.5 w-3.5" />
                      Vincular Teléfono Celular
                    </button>
                  </div>
                ) : cam.status === "offline" ? (
                  /* Professional Offline State */
                  <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
                    <VideoOff className="h-8 w-8 text-rose-500/60 mb-2" />
                    <p className="text-xs font-semibold text-rose-400">
                      Cámara Sin Señal de Red
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Último ping registrado: hace 2 horas
                    </p>
                  </div>
                ) : (
                  /* Active Camera Simulation (No fake footage, realistic test pattern/standby) */
                  <div className="relative h-full w-full bg-gradient-to-b from-[#0e1627] to-[#080d17] p-4 flex flex-col justify-between">
                    {/* Timestamp & Location Overlay */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded">
                      <span className="text-emerald-400">{cam.school_name}</span>
                      <span>{cam.resolution} · {cam.fps} FPS</span>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                      <div className="h-10 w-10 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Video className="h-5 w-5" />
                      </div>
                      <p className="mt-2 text-xs font-medium text-slate-300">
                        {cam.location_detail}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500">
                        Canal Seguro RTSP/WebRTC Encriptado
                      </p>
                    </div>

                    {/* Bottom Telemetry Overlay */}
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded">
                      <span>IP: {cam.ip_address || "DHCP Dinámico"}</span>
                      <span className="text-emerald-400">LATENCIA: 42ms</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between bg-[#080c14] px-4 py-2 border-t border-white/[0.04] text-[11px] text-slate-400">
                <span className="truncate">{cam.school_name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-500">
                    Radio 200m
                  </span>
                  <button
                    onClick={() => setSelectedCameraId(cam.id)}
                    className="rounded p-1 text-slate-400 hover:bg-white/[0.08] hover:text-white"
                    title="Maximizar cámara"
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
      <div className="rounded-xl border border-white/[0.06] bg-[#0c101a] p-4 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Shield className="h-4 w-4 text-blue-400 shrink-0" />
          <span>
            Transmisiones encriptadas de circuito cerrado. Prohibida la redistribución pública según directivas de protección a la niñez y normativas de seguridad escolar.
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-500 hidden sm:inline">
          Catriel Seguro 2026
        </span>
      </div>

      <ConnectMobileModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </div>
  );
}
