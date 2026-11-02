"use client";

import { useState } from "react";
import {
  MapPin,
  Cctv,
  School,
  Layers,
  ZoomIn,
  ZoomOut,
  Compass,
  Shield,
  Radio,
  Eye,
} from "lucide-react";
import { MOCK_SCHOOLS, MOCK_CAMERAS } from "@/data/mock-data";
import { StatusBadge } from "@/components/status-badge";
import { School as SchoolType, Camera as CameraType } from "@/types/monitor";

export default function MonitoringMapPage() {
  const [selectedEntity, setSelectedEntity] = useState<SchoolType | CameraType | null>(
    MOCK_SCHOOLS[0]
  );
  const [showRadius, setShowRadius] = useState(true);
  const [showCameras, setShowCameras] = useState(true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-blue-400 uppercase tracking-wider">
              SISTEMA DE INFORMACIÓN GEOGRÁFICA (GIS)
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            Mapa de Cobertura y Corredores Escolares
          </h1>
          <p className="text-xs text-slate-400">
            Perímetros de seguridad de 200 metros alrededor de las escuelas de Catriel y despliegue de cámaras
          </p>
        </div>

        {/* Map Layer Filters */}
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0c101a] p-1.5 text-xs">
          <button
            onClick={() => setShowRadius(!showRadius)}
            className={`rounded px-2.5 py-1 font-medium transition-colors ${
              showRadius
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Radio 200m ({showRadius ? "ON" : "OFF"})
          </button>
          <button
            onClick={() => setShowCameras(!showCameras)}
            className={`rounded px-2.5 py-1 font-medium transition-colors ${
              showCameras
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Cámaras ({showCameras ? "ON" : "OFF"})
          </button>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Viewport Container */}
        <div className="lg:col-span-3 relative h-[600px] w-full rounded-2xl border border-white/[0.08] bg-[#070b13] overflow-hidden shadow-2xl">
          {/* Subtle Grid Background resembling digital tactical GIS map */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
              backgroundSize: "32px 32px",
            }}
          />

          {/* Map Compass & Watermark */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0c101a]/85 backdrop-blur-md px-3 py-1.5 text-xs text-slate-300">
            <Compass className="h-4 w-4 text-blue-400 animate-spin-slow" />
            <span className="font-mono text-[11px]">CATRIEL, RN · 37°52&apos;42&quot;S 67°47&apos;43&quot;W</span>
          </div>

          <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#0c101a]/85 text-slate-300 hover:bg-white/[0.08]">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#0c101a]/85 text-slate-300 hover:bg-white/[0.08]">
              <ZoomOut className="h-4 w-4" />
            </button>
          </div>

          {/* SVG Canvas for 200m radii and school nodes */}
          <svg className="absolute inset-0 h-full w-full pointer-events-none">
            <defs>
              {/* Radial gradient for 200m perimeter highlight */}
              <radialGradient id="perimeterGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                <stop offset="70%" stopColor="#2563eb" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* School nodes and 200m radius circles */}
            {showRadius && (
              <>
                {/* Escuela 204 */}
                <circle cx="280" cy="240" r="110" fill="url(#perimeterGlow)" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 4" />
                {/* CEM 21 */}
                <circle cx="480" cy="340" r="110" fill="url(#perimeterGlow)" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 4" />
                {/* Jardín 43 */}
                <circle cx="210" cy="160" r="95" fill="url(#perimeterGlow)" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 4" />
                {/* CET 7 */}
                <circle cx="620" cy="420" r="120" fill="url(#perimeterGlow)" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 4" />
                {/* Escuela 195 */}
                <circle cx="360" cy="490" r="105" fill="url(#perimeterGlow)" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7" />
              </>
            )}
          </svg>

          {/* Interactive School Pins */}
          <div className="absolute inset-0 pointer-events-auto">
            {/* ESCUELA 204 */}
            <div
              onClick={() => setSelectedEntity(MOCK_SCHOOLS[0])}
              style={{ left: "280px", top: "240px" }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-500/50 group-hover:scale-125 transition-transform border-2 border-white">
                <School className="h-5 w-5" />
              </div>
              <div className="absolute top-11 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0c101a] border border-white/[0.1] px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg">
                Escuela N° 204
              </div>
            </div>

            {/* CEM 21 */}
            <div
              onClick={() => setSelectedEntity(MOCK_SCHOOLS[1])}
              style={{ left: "480px", top: "340px" }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-500/50 group-hover:scale-125 transition-transform border-2 border-white">
                <School className="h-5 w-5" />
              </div>
              <div className="absolute top-11 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0c101a] border border-white/[0.1] px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg">
                CEM N° 21
              </div>
            </div>

            {/* JARDIN 43 */}
            <div
              onClick={() => setSelectedEntity(MOCK_SCHOOLS[2])}
              style={{ left: "210px", top: "160px" }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-500/50 group-hover:scale-125 transition-transform border-2 border-white">
                <School className="h-4 w-4" />
              </div>
              <div className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0c101a] border border-white/[0.1] px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg">
                Jardín N° 43
              </div>
            </div>

            {/* CET 7 */}
            <div
              onClick={() => setSelectedEntity(MOCK_SCHOOLS[3])}
              style={{ left: "620px", top: "420px" }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-500/50 group-hover:scale-125 transition-transform border-2 border-white">
                <School className="h-5 w-5" />
              </div>
              <div className="absolute top-11 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0c101a] border border-white/[0.1] px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg">
                C.E.T. N° 7
              </div>
            </div>

            {/* ESCUELA 195 */}
            <div
              onClick={() => setSelectedEntity(MOCK_SCHOOLS[4])}
              style={{ left: "360px", top: "490px" }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-600 text-white shadow-xl shadow-amber-500/50 group-hover:scale-125 transition-transform border-2 border-white">
                <School className="h-5 w-5" />
              </div>
              <div className="absolute top-11 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0c101a] border border-white/[0.1] px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg">
                Escuela N° 195 (Atención)
              </div>
            </div>

            {/* Camera pins around schools */}
            {showCameras && (
              <>
                {/* Cam 1 */}
                <div
                  onClick={() => setSelectedEntity(MOCK_CAMERAS[0])}
                  style={{ left: "260px", top: "220px" }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  title="CAM-204-ACC (Online)"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-black font-bold shadow-md group-hover:scale-150 transition-transform">
                    <Cctv className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Cam 2 */}
                <div
                  onClick={() => setSelectedEntity(MOCK_CAMERAS[1])}
                  style={{ left: "330px", top: "270px" }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  title="CAM-204-CORR (Online)"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-black font-bold shadow-md group-hover:scale-150 transition-transform">
                    <Cctv className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Mobile Camera Transmitter (Patrulla) */}
                <div
                  onClick={() => setSelectedEntity(MOCK_CAMERAS[7])}
                  style={{ left: "430px", top: "290px" }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  title="CAM-MOB-DEMO (Móvil WebRTC)"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400 text-black font-bold shadow-lg animate-pulse group-hover:scale-150 transition-transform">
                    <Radio className="h-4 w-4" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bottom Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-3 rounded-lg border border-white/[0.08] bg-[#0c101a]/90 backdrop-blur-md px-3.5 py-2 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-3 w-3 rounded-full bg-blue-500 border border-white/20" />
              Escuela
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              Cámara Online
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse" />
              Móvil WebRTC
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-3 w-3 rounded-full border border-sky-400 border-dashed" />
              Radio 200m
            </span>
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="lg:col-span-1 rounded-2xl border border-white/[0.08] bg-[#0c101a] p-5">
          {selectedEntity ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <span className="font-mono text-[10px] uppercase text-slate-400">
                  {"code" in selectedEntity ? "ESTABLECIMIENTO" : "DISPOSITIVO"}
                </span>
                <StatusBadge status={selectedEntity.status} size="sm" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">
                  {"name" in selectedEntity && selectedEntity.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {"address" in selectedEntity
                    ? `${selectedEntity.address}, ${selectedEntity.neighborhood}`
                    : ("location_detail" in selectedEntity && selectedEntity.location_detail)}
                </p>
              </div>

              {"code" in selectedEntity ? (
                /* School Info */
                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <span className="font-mono text-slate-500 text-[10px] uppercase">Radio de Cobertura</span>
                    <p className="text-cyan-400 font-mono font-bold mt-0.5">200 metros perimetrales</p>
                  </div>
                  <div>
                    <span className="font-mono text-slate-500 text-[10px] uppercase">Cámaras Instaladas</span>
                    <p className="text-slate-200 font-mono mt-0.5">{selectedEntity.cameras_count} dispositivos activos</p>
                  </div>
                  <div>
                    <span className="font-mono text-slate-500 text-[10px] uppercase">Responsable</span>
                    <p className="text-slate-200 mt-0.5">{selectedEntity.principal_name}</p>
                  </div>
                </div>
              ) : (
                /* Camera Info */
                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <span className="font-mono text-slate-500 text-[10px] uppercase">ID de Dispositivo</span>
                    <p className="text-blue-400 font-mono mt-0.5">{selectedEntity.identifier}</p>
                  </div>
                  <div>
                    <span className="font-mono text-slate-500 text-[10px] uppercase">Tipo de Stream</span>
                    <p className="text-slate-200 font-mono mt-0.5">{selectedEntity.stream_type.toUpperCase()} · {selectedEntity.resolution}</p>
                  </div>
                  <div>
                    <span className="font-mono text-slate-500 text-[10px] uppercase">Escuela de Destino</span>
                    <p className="text-slate-200 mt-0.5">{selectedEntity.school_name}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              Haga clic sobre una escuela o cámara en el mapa para ver sus detalles
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
