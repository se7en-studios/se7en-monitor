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
import { useCollection } from "@/lib/firebase/data";
import { StatusBadge } from "@/components/status-badge";
import { School as SchoolType, Camera as CameraType } from "@/types/monitor";

// Dynamic import for Leaflet map to prevent SSR window/navigator errors
const InteractiveMap = dynamic(
  () => import("@/components/interactive-map").then((mod) => mod.InteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-background text-muted font-mono text-xs">
        <Compass className="h-6 w-6 animate-spin text-accent mr-2" />
        Cargando capas cartográficas de Catriel...
      </div>
    ),
  }
);

export default function MonitoringMapPage() {
  const { data: schools } = useCollection<SchoolType>("schools");
  const { data: cameras } = useCollection<CameraType>("cameras");
  const [pickedEntity, setSelectedEntity] = useState<SchoolType | CameraType | null>(null);
  const selectedEntity = pickedEntity ?? schools[0] ?? null;
  const [showRadius, setShowRadius] = useState(true);
  const [showCameras, setShowCameras] = useState(true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="adm-label">
              SISTEMA DE INFORMACIÓN GEOGRÁFICA (GIS)
            </span>
          </div>
          <h1 className="mt-1 adm-display text-[clamp(28px,3.6vw,44px)] text-foreground">
            Mapa de Cobertura y Corredores Escolares
          </h1>
          <p className="text-xs text-muted">
            Perímetros preventivos de 200 metros alrededor de las escuelas de Catriel (Río Negro) y cámaras geolocalizadas
          </p>
        </div>

        {/* Map Layer Filters */}
        <div className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-panel p-1.5 text-xs">
          <button
            onClick={() => setShowRadius(!showRadius)}
            className={`rounded px-3 py-1.5 font-medium transition-colors ${
 showRadius
 ?"bg-accent text-background"
 :"text-muted hover:text-background"
 }`}
          >
            Radio 200m ({showRadius ? "ON" : "OFF"})
          </button>
          <button
            onClick={() => setShowCameras(!showCameras)}
            className={`rounded px-3 py-1.5 font-medium transition-colors ${
 showCameras
 ?"bg-accent text-background"
 :"text-muted hover:text-background"
 }`}
          >
            Cámaras ({showCameras ? "ON" : "OFF"})
          </button>
        </div>
      </div>

      {/* Main Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Viewport Container */}
        <div className="lg:col-span-3 relative h-[620px] w-full rounded-2xl border border-[var(--line)] overflow-hidden">
          <InteractiveMap
            schools={schools}
            cameras={cameras}
            selectedEntity={selectedEntity}
            onSelectEntity={(entity) => setSelectedEntity(entity)}
            showRadius={showRadius}
            showCameras={showCameras}
          />

          {/* Bottom Tactical Legend */}
          <div className="absolute bottom-4 left-4 z-[400] flex flex-wrap items-center gap-3.5 rounded-xl border border-[var(--line)] bg-panel/95 backdrop-blur-md px-4 py-2.5 text-xs">
            <span className="flex items-center gap-1.5 text-foreground/85">
              <span className="h-3 w-3 rounded-full bg-accent border border-white" />
              Escuela
            </span>
            <span className="flex items-center gap-1.5 text-foreground/85">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Cámara Online
            </span>
            <span className="flex items-center gap-1.5 text-foreground/85">
              <span className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
              Móvil WebRTC
            </span>
            <span className="flex items-center gap-1.5 text-foreground/85">
              <span className="h-2.5 w-2.5 rounded-full border border-sky-400 border-dashed" />
              Radio Ley 200m
            </span>
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="lg:col-span-1 rounded-2xl border border-[var(--line)] bg-panel p-5 flex flex-col justify-between">
          {selectedEntity ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <span className="font-mono text-[10px] uppercase text-muted tracking-wider">
                  {"code" in selectedEntity ? "ESTABLECIMIENTO EDUCATIVO" : "DISPOSITIVO DE VIDEO"}
                </span>
                <StatusBadge status={selectedEntity.status} size="sm" />
              </div>

              <div>
                <h3 className="adm-title text-[13px] text-foreground">
                  {"name" in selectedEntity && selectedEntity.name}
                </h3>
                <p className="text-xs text-muted mt-1">
                  {"address" in selectedEntity
                    ? `${selectedEntity.address}, ${selectedEntity.neighborhood}`
                    : ("location_detail" in selectedEntity && selectedEntity.location_detail)}
                </p>
              </div>

              {"code" in selectedEntity ? (
                /* School Detailed Attributes */
                <div className="space-y-3.5 text-xs">
                  <div className="p-3 rounded-xl bg-accent-soft border border-accent/20">
                    <span className="font-mono text-accent text-[10px] uppercase font-bold tracking-wider">
                      ORDENANZA CORREDOR CUIDADO
                    </span>
                    <p className="text-foreground font-bold text-sm mt-0.5">200 metros perimétricos</p>
                    <p className="text-[11px] text-muted mt-1">
                      Cobertura integral en accesos, paradas de colectivo y veredas escolares.
                    </p>
                  </div>

                  <div>
                    <span className="font-mono text-muted text-[10px] uppercase">Código Oficial</span>
                    <p className="text-foreground font-mono font-medium mt-0.5">{selectedEntity.code}</p>
                  </div>

                  <div>
                    <span className="font-mono text-muted text-[10px] uppercase">Cámaras Operativas</span>
                    <p className="text-foreground font-mono mt-0.5">{cameras.filter((c) => c.school_id === selectedEntity.id).length} dispositivos</p>
                  </div>

                  <div>
                    <span className="font-mono text-muted text-[10px] uppercase">Responsable Institucional</span>
                    <p className="text-foreground mt-0.5">{selectedEntity.principal_name}</p>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/schools`}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--line)] bg-white/[0.03] py-2 text-xs font-semibold text-foreground hover:bg-white/[0.08] transition-colors"
                    >
                      <School className="h-3.5 w-3.5 text-accent" />
                      <span>Ver Ficha Institucional</span>
                    </Link>
                  </div>
                </div>
              ) : (
                /* Camera Attributes */
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-mono text-muted text-[10px] uppercase">Identificador</span>
                    <p className="text-accent font-mono font-bold mt-0.5">{selectedEntity.identifier}</p>
                  </div>
                  <div>
                    <span className="font-mono text-muted text-[10px] uppercase">Transmisión</span>
                    <p className="text-foreground font-mono mt-0.5">{selectedEntity.stream_type.toUpperCase()} · {selectedEntity.resolution}</p>
                  </div>
                  <div>
                    <span className="font-mono text-muted text-[10px] uppercase">Establecimiento</span>
                    <p className="text-foreground mt-0.5">{selectedEntity.school_name}</p>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/monitor/live?cam=${selectedEntity.id}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent py-2.5 text-xs font-semibold text-background hover:bg-[var(--accent-hover)] transition-colors"
                    >
                      <Video className="h-3.5 w-3.5" />
                      <span>Abrir Monitoreo en Vivo</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center text-muted text-xs">
              Hacé clic sobre un pin en el mapa para inspeccionar el radio o la cámara
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-[var(--line)] text-[11px] text-muted flex items-center justify-between">
            <span>Catriel GIS v2.1</span>
            <span className="font-mono text-[10px]">EPSG:4326</span>
          </div>
        </div>
      </div>
    </div>
  );
}
