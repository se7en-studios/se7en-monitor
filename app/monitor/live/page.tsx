"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  Smartphone,
  Video,
} from "lucide-react";
import { useCollection } from "@/lib/firebase/data";
import { useAuth } from "@/lib/firebase/auth-context";
import { logAccess } from "@/lib/firebase/audit";
import { can } from "@/lib/roles";
import { CameraTile } from "@/components/camera-tile";
import { ConnectMobileModal } from "@/components/connect-mobile-modal";
import {
  EmptyState,
  PageHeader,
  Segmented,
  Skeleton,
  btnPrimary,
  btnSecondary,
  input,
} from "@/components/ui";
import type { Camera } from "@/types/monitor";
import { cn } from "@/lib/utils";

type Layout = "1" | "4" | "9";
const LAYOUTS = [
  { id: "1", label: "1x1" },
  { id: "4", label: "2x2" },
  { id: "9", label: "3x3" },
] as const;
const GRID: Record<Layout, string> = {
  "1": "grid-cols-1 max-w-4xl mx-auto",
  "4": "grid-cols-1 md:grid-cols-2",
  "9": "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
};

/** Primero los celulares (los únicos con video real), después por identificador. */
const sortForLive = (a: Camera, b: Camera) =>
  Number(b.device_type === "mobile_webrtc") -
    Number(a.device_type === "mobile_webrtc") ||
  a.identifier.localeCompare(b.identifier);

export default function LiveMonitoringPage() {
  const { profile } = useAuth();
  const canPair = can.editInfrastructure(profile?.role);
  const { data: cameras, loading } = useCollection<Camera>(
    "cameras",
    sortForLive,
  );
  const [layout, setLayout] = useState<Layout>("4");
  const [schoolId, setSchoolId] = useState("all");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isConnectOpen, setIsConnectOpen] = useState(false);

  useLiveAccessLog(profile);
  useInitialCameraFromUrl(setExpandedId);

  const schools = useMemo(
    () =>
      [
        ...new Map(
          cameras.map((c) => [c.school_id, c.school_name ?? c.school_id]),
        ),
      ].sort((a, b) => a[1].localeCompare(b[1])),
    [cameras],
  );
  const filtered = cameras.filter(
    (c) => schoolId === "all" || c.school_id === schoolId,
  );
  const expanded = cameras.find((c) => c.id === expandedId) ?? null;
  useExpandedAccessLog(expanded, profile);

  const size = Number(layout);
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pages - 1);
  const visible = expanded
    ? [expanded]
    : filtered.slice(current * size, (current + 1) * size);

  const changeLayout = (l: Layout) => {
    setLayout(l);
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Corredor escolar"
        title="Monitoreo en"
        accent="vivo"
        right={
          canPair && (
            <button
              className={btnPrimary}
              onClick={() => setIsConnectOpen(true)}
            >
              <Smartphone className="h-4 w-4" /> Vincular celular
            </button>
          )
        }
      >
        Los celulares vinculados transmiten video en vivo. Las cámaras IP están
        registradas, pero su video todavía no está integrado al panel.
      </PageHeader>

      {!expanded && cameras.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            label="Vista"
            value={layout}
            onChange={changeLayout}
            options={LAYOUTS}
          />
          <select
            aria-label="Filtrar por escuela"
            className={cn(input, "w-auto rounded-full")}
            value={schoolId}
            onChange={(e) => {
              setSchoolId(e.target.value);
              setPage(0);
            }}
          >
            <option value="all">Todas las escuelas</option>
            {schools.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <Pager
            page={current}
            pages={pages}
            total={filtered.length}
            onChange={setPage}
          />
        </div>
      )}

      {loading ? (
        <div className={cn("grid gap-4", GRID["4"])}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-video" />
          ))}
        </div>
      ) : cameras.length === 0 ? (
        <EmptyState
          icon={<Video className="h-6 w-6" />}
          title="Todavía no hay cámaras registradas"
          action={
            canPair && (
              <Link href="/monitor/cameras" className={btnSecondary}>
                Ir a Cámaras
              </Link>
            )
          }
        >
          Dá de alta una cámara (o un celular) en la sección Cámaras para verla
          acá.
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState title="Esta escuela no tiene cámaras" />
      ) : (
        <div className={cn("grid gap-4", expanded ? GRID["1"] : GRID[layout])}>
          {visible.map((cam) => (
            <CameraTile
              key={cam.id}
              camera={cam}
              isExpanded={cam.id === expandedId}
              onToggleExpand={() =>
                setExpandedId(cam.id === expandedId ? null : cam.id)
              }
              onOpenPairModal={
                canPair ? () => setIsConnectOpen(true) : undefined
              }
            />
          ))}
        </div>
      )}

      <p className="flex items-start gap-2 text-[12px] text-muted">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        El video va directo del celular a esta pantalla y no se graba. Cada vez
        que alguien abre esta vista o amplía una cámara queda registrado en la
        auditoría.
      </p>

      <ConnectMobileModal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
      />
    </div>
  );
}

function Pager({
  page,
  pages,
  total,
  onChange,
}: {
  page: number;
  pages: number;
  total: number;
  onChange: (p: number) => void;
}) {
  if (pages <= 1) return <span className="adm-label">{total} cámaras</span>;
  return (
    <div className="flex items-center gap-2 text-[12px] text-muted">
      <button
        className={btnSecondary}
        aria-label="Página anterior"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span>
        Página {page + 1} de {pages} · {total} cámaras
      </span>
      <button
        className={btnSecondary}
        aria-label="Página siguiente"
        disabled={page >= pages - 1}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

type Who = { id: string; full_name: string; role: string } | null;

/** Entrar al monitoreo en vivo queda registrado (una vez por visita a la pantalla). */
function useLiveAccessLog(profile: Who) {
  const id = profile?.id;
  useEffect(() => {
    if (!profile) return;
    void logAccess(
      { action: "ver_monitoreo_en_vivo" },
      { name: profile.full_name, role: profile.role },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
}

/** Ampliar una cámara queda registrado como «vio una cámara». */
function useExpandedAccessLog(camera: Camera | null, profile: Who) {
  const camId = camera?.id;
  const id = profile?.id;
  useEffect(() => {
    if (!camera || !profile) return;
    void logAccess(
      {
        action: "ver_camara",
        camera_id: camera.id,
        camera_name: camera.name,
        school_name: camera.school_name,
      },
      { name: profile.full_name, role: profile.role },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camId, id]);
}

/** `/monitor/live?cam=<id>` (desde Cámaras) abre esa cámara ampliada. */
function useInitialCameraFromUrl(setExpandedId: (id: string) => void) {
  useEffect(() => {
    const cam = new URLSearchParams(window.location.search).get("cam");
    if (cam) setExpandedId(cam);
  }, [setExpandedId]);
}
