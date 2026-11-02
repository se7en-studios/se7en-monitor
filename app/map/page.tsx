"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  MapPin,
  Cctv,
  School,
  Layers,
  Compass,
  Shield,
  Radio,
  ExternalLink,
  Video,
} from "lucide-react";
import { MOCK_SCHOOLS, MOCK_CAMERAS } from "@/data/mock-data";
import { StatusBadge } from "@/components/status-badge";
import { School as SchoolType, Camera as CameraType } from "@/types/monitor";

// Dynamic import for Leaflet map to prevent SSR window/navigator errors
const InteractiveMap = dynamic(
  () => import("@/components/interactive-map").then((mod) => mod.InteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#070b13] text-slate-500 font-mono text-xs">
        <Compass className="h-6 w-6 animate-spin text-blue-500 mr-2" />
        Cargando capas cartográficas de Catriel...
      </div>
    ),
  }
);

export default function MonitoringMapPage() {
  const [schools] = useState<SchoolType[]>(MOCK_SCHOOLS);
  const [cameras] = useState<CameraType[]>(MOCK_CAMERAS);
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
            Perímetros preventivos de 200 metros alrededor de las escuelas de Catriel (Río Negro) y cámaras geolocalizadas
          </p>
        </div>

        {/* Map Layer Filters */}
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0c101a] p-1.5 text-xs">
          <button
            onClick={() => setShowRadius(!showRadius)}
            className={`rounded px-3 py-1.5 font-medium transition-colors ${
              showRadius
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Radio 200m ({showRadius ? "ON" : "OFF"})
          </button>
          <button
            onClick={() => setShowCameras(!showCameras)}
            className={`rounded px-3 py-1.5 font-medium transition-colors ${
              showCameras
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Cámaras ({showCameras ? "ON" : "OFF"})
          </button>
        </div>
      </div>

      {/* Main Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Viewport Container */}
        <div className="lg:col-span-3 relative h-[620px] w-full rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl">
          <InteractiveMap
            schools={schools}
            cameras={cameras}
            selectedEntity={selectedEntity}
            onSelectEntity={(entity) => setSelectedEntity(entity)}
            showRadius={showRadius}
            showCameras={showCameras}
          />

          {/* Bottom Tactical Legend */}
          <div className="absolute bottom-4 left-4 z-[400] flex flex-wrap items-center gap-3.5 rounded-xl border border-white/[0.1] bg-[#0c101a]/95 backdrop-blur-md px-4 py-2.5 text-xs shadow-xl">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-3 w-3 rounded-full bg-blue-600 border border-white" />
              Escuela
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Cámara Online
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
              Móvil WebRTC
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full border border-sky-400 border-dashed" />
              Radio Ley 200m
            </span>
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="lg:col-span-1 rounded-2xl border border-white/[0.08] bg-[#0c101a] p-5 flex flex-col justify-between">
          {selectedEntity ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <span className="font-mono text-[10px] uppercase text-slate-400 tracking-wider">
                  {"code" in selectedEntity ? "ESTABLECIMIENTO EDUCATIVO" : "DISPOSITIVO DE VIDEO"}
                </span>
                <StatusBadge status={selectedEntity.status} size="sm" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">
                  {"name" in selectedEntity && selectedEntity.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {"address" in selectedEntity
                    ? `${selectedEntity.address}, ${selectedEntity.neighborhood}`
                    : ("location_detail" in selectedEntity && selectedEntity.location_detail)}
                </p>
              </div>

              {"code" in selectedEntity ? (
                /* School Detailed Attributes */
                <div className="space-y-3.5 text-xs">
                  <div className="p-3 rounded-xl bg-blue-600/10 border border-blue-500/20">
                    <span className="font-mono text-cyan-400 text-[10px] uppercase font-bold tracking-wider">
                      ORDENANZA CORREDOR CUIDADO
                    </span>
                    <p className="text-white font-bold text-sm mt-0.5">200 metros perimétricos</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Cobertura integral en accesos, paradas de colectivo y veredas escolares.
                    </p>
                  </div>

                  <div>
                    <span className="font-mono text-slate-500 text-[10px] uppercase">Código Oficial</span>
                    <p className="text-slate-200 font-mono font-medium mt-0.5">{selectedEntity.code}</p>
                  </div>

                  <div>
                    <span className="font-mono text-slate-500 text-[10px] uppercase">Cámaras Operativas</span>
                    <p className="text-slate-200 font-mono mt-0.5">{selectedEntity.cameras_count} dispositivos</p>
                  </div>

                  <div>
                    <span className="font-mono text-slate-500 text-[10px] uppercase">Responsable Institucional</span>
                    <p className="text-slate-200 mt-0.5">{selectedEntity.principal_name}</p>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/schools`}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] transition-colors"
                    >
                      <School className="h-3.5 w-3.5 text-blue-400" />
                      <span>Ver Ficha Institucional</span>
                    </Link>
                  </div>
                </div>
              ) : (
                /* Camera Attributes */
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-mono text-slate-500 text-[10px] uppercase">Identificador</span>
                    <p className="text-blue-400 font-mono font-bold mt-0.5">{selectedEntity.identifier}</p>
                  </div>
                  <div>
                    <span className="font-mono text-slate-500 text-[10px] uppercase">Transmisión</span>
                    <p className="text-slate-200 font-mono mt-0.5">{selectedEntity.stream_type.toUpperCase()} · {selectedEntity.resolution}</p>
                  </div>
                  <div>
                    <span className="font-mono text-slate-500 text-[10px] uppercase">Establecimiento</span>
                    <p className="text-slate-200 mt-0.5">{selectedEntity.school_name}</p>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/monitor/live?cam=${selectedEntity.id}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
                    >
                      <Video className="h-3.5 w-3.5" />
                      <span>Abrir Monitoreo en Vivo</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 text-xs">
              Hacé clic sobre un pin en el mapa para inspeccionar el radio o la cámara
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] text-slate-500 flex items-center justify-between">
            <span>Catriel GIS v2.1</span>
            <span className="font-mono text-[10px]">EPSG:4326</span>
          </div>
        </div>
      </div>
    </div>
  );
}
