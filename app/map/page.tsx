"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { School as SchoolIcon } from "lucide-react";
import { useCollection } from "@/lib/firebase/data";
import { useAuth } from "@/lib/firebase/auth-context";
import { can } from "@/lib/roles";
import {
  Chip,
  EmptyState,
  PageHeader,
  Skeleton,
  btnPrimary,
} from "@/components/ui";
import { MapPanel } from "./map-panel";
import type {
  School as SchoolType,
  Camera as CameraType,
} from "@/types/monitor";

// Leaflet usa window: el mapa se carga solo en el navegador.
const InteractiveMap = dynamic(
  () =>
    import("@/components/interactive-map").then((mod) => mod.InteractiveMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full rounded-none" />,
  },
);

const MAP_BOX =
  "relative h-[58vh] min-h-[360px] w-full overflow-hidden rounded-2xl border border-[var(--line)] lg:h-[620px]";

export default function MonitoringMapPage() {
  const { profile } = useAuth();
  const { data: schools, loading: loadingSchools } =
    useCollection<SchoolType>("schools");
  const { data: cameras, loading: loadingCameras } =
    useCollection<CameraType>("cameras");
  const [picked, setPicked] = useState<SchoolType | CameraType | null>(null);
  const [showRadius, setShowRadius] = useState(true);
  const [showCameras, setShowCameras] = useState(true);
  const loading = loadingSchools || loadingCameras;
  const selectedEntity = picked ?? schools[0] ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mapa · Catriel, Río Negro"
        title="Cobertura y"
        accent="corredores"
        right={
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Capas del mapa"
          >
            <Chip on={showRadius} onClick={() => setShowRadius((v) => !v)}>
              Radio de 200 m
            </Chip>
            <Chip on={showCameras} onClick={() => setShowCameras((v) => !v)}>
              Cámaras
            </Chip>
          </div>
        }
      >
        Perímetros preventivos de 200 metros alrededor de las escuelas y las
        cámaras geolocalizadas.
      </PageHeader>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <Skeleton className={`${MAP_BOX} lg:col-span-3`} />
          <Skeleton className="h-[360px] rounded-xl" />
        </div>
      ) : schools.length === 0 ? (
        <div className="adm-in">
          <EmptyState
            icon={<SchoolIcon className="h-7 w-7" />}
            title="Sin escuelas para mostrar"
            action={
              can.editInfrastructure(profile?.role) ? (
                <Link href="/schools" className={btnPrimary}>
                  Registrar escuela
                </Link>
              ) : undefined
            }
          >
            El mapa dibuja el corredor de cada escuela registrada y las cámaras
            que tiene alrededor.
          </EmptyState>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className={`adm-in ${MAP_BOX} lg:col-span-3`}>
            <InteractiveMap
              schools={schools}
              cameras={cameras}
              selectedEntity={selectedEntity}
              onSelectEntity={setPicked}
              showRadius={showRadius}
              showCameras={showCameras}
            />
            <Legend />
          </div>
          <MapPanel entity={selectedEntity} cameras={cameras} />
        </div>
      )}
    </div>
  );
}

/** Referencias: el estado de la cámara se distingue por forma, no solo por color. */
function Legend() {
  const item = "flex items-center gap-1.5 text-foreground/85";
  const swatch = "inline-block h-3 w-3 border-2 border-background";
  return (
    <div className="absolute bottom-3 left-3 z-[400] flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-x-3.5 gap-y-1.5 rounded-xl border border-[var(--line)] bg-panel/95 px-3 py-2 text-[12px]">
      <span className={item}>
        <span
          className={`${swatch} rounded-full border-foreground bg-accent`}
        />
        Escuela
      </span>
      <span className={item}>
        <span className={`${swatch} rounded-full bg-[var(--ok)]`} />
        En línea
      </span>
      <span className={item}>
        <span
          className={`${swatch} rotate-45 rounded-[2px] bg-[var(--warn)]`}
        />
        Alerta o mant.
      </span>
      <span className={item}>
        <span className={`${swatch} rounded-[2px] bg-[var(--bad)]`} />
        Sin señal
      </span>
      <span className={item}>
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />
        Celular
      </span>
      <span className={`${item} hidden sm:flex`}>
        <span className="inline-block h-3 w-3 rounded-full border border-dashed border-accent" />
        Radio 200 m
      </span>
    </div>
  );
}
