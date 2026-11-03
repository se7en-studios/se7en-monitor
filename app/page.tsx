"use client";

import Link from "next/link";
import {
  School,
  Cctv,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ArrowRight,
  Video,
  Radio,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { DashboardCharts } from "@/components/dashboard-charts";
import { ActivityFeed } from "@/components/activity-feed";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
  btnGhost,
  btnPrimary,
  btnSecondary,
} from "@/components/ui";
import { useCollection, byId, byNewest } from "@/lib/firebase/data";
import { useAuth } from "@/lib/firebase/auth-context";
import { can } from "@/lib/roles";
import { computeMetrics } from "@/lib/metrics";
import type {
  ActivityEvent,
  Camera,
  Incident,
  School as SchoolDoc,
} from "@/types/monitor";

const sortActivity = byNewest("timestamp");
const CAMERAS_SHOWN = 5;
// ponytail: Firestore ordena los textos ISO viejos antes que los Timestamp nuevos; con pocos
// registros viejos alcanza este margen. Si crecen, migrar 	imestamp viejos a Timestamp.
const ACTIVITY_QUERY = { orderByField: "timestamp", limit: 50 };

export default function DashboardPage() {
  const { data: schools, loading: loadingSchools } =
    useCollection<SchoolDoc>("schools");
  const { data: cameras, loading: loadingCameras } = useCollection<Camera>(
    "cameras",
    byId,
  );
  const { profile } = useAuth();
  const { data: incidents, loading: loadingIncidents } =
    useCollection<Incident>("incidents", undefined, {
      enabled: can.handleIncidents(profile?.role),
    });
  const { data: activity, loading: loadingActivity } =
    useCollection<ActivityEvent>("activity_logs", sortActivity, ACTIVITY_QUERY);
  const metrics = computeMetrics(schools, cameras, incidents);
  const loadingMetrics = loadingSchools || loadingCameras || loadingIncidents;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Corredor Escolar Cuidado · Catriel"
        title="Tablero central de"
        accent="operaciones"
        right={
          <>
            <Link href="/monitor/live" className={btnPrimary}>
              <Video className="h-4 w-4" />
              Ver grilla en vivo
            </Link>
            <Link href="/map" className={btnSecondary}>
              <MapPin className="h-4 w-4" />
              Mapa de corredores
            </Link>
          </>
        }
      >
        Monitoreo perimetral preventivo en un radio de 200 metros alrededor de
        los establecimientos educativos.
      </PageHeader>

      {loadingMetrics ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[150px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Escuelas registradas"
            value={metrics.total_schools}
            subtitle="Catriel urbano"
            icon={<School className="h-5 w-5" />}
          />
          <StatCard
            title="Cámaras operativas"
            value={metrics.cameras_online}
            subtitle={`de ${metrics.total_cameras} instaladas`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            highlightColor="emerald"
            trend={{
              value: `${Math.round(metrics.system_uptime_percentage)}%`,
              isPositive: true,
              label: "tasa de operatividad",
            }}
          />
          <StatCard
            title="Con alerta o sin señal"
            value={metrics.cameras_offline + metrics.cameras_warning}
            subtitle={`${metrics.cameras_warning} alerta · ${metrics.cameras_offline} sin señal`}
            icon={<AlertTriangle className="h-5 w-5" />}
            highlightColor="rose"
            trend={{
              value: String(metrics.cameras_offline + metrics.cameras_warning),
              isPositive: false,
              label: "requieren inspección",
            }}
          />
          <StatCard
            title="Disponibilidad"
            value={`${metrics.system_uptime_percentage}%`}
            subtitle="cámaras en línea ahora"
            icon={<Activity className="h-5 w-5" />}
          />
        </div>
      )}

      {loadingMetrics ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Skeleton className="h-[340px] rounded-xl" />
          <Skeleton className="h-[340px] rounded-xl" />
        </div>
      ) : (
        <DashboardCharts metrics={metrics} incidents={incidents} />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Dispositivos prioritarios"
          icon={<Cctv className="h-4 w-4" />}
          count={loadingCameras ? undefined : cameras.length}
          action={
            <Link
              href="/monitor/cameras"
              className={`${btnGhost} px-2.5 py-1.5 text-[12px]`}
            >
              Ver todas
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <PriorityCameras cameras={cameras} loading={loadingCameras} />
        </Card>
        <ActivityFeed
          events={activity.slice(0, 20)}
          loading={loadingActivity}
        />
      </div>
    </div>
  );
}

function PriorityCameras({
  cameras,
  loading,
}: {
  cameras: Camera[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: CAMERAS_SHOWN }, (_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }
  if (!cameras.length) {
    return (
      <div className="p-4">
        <EmptyState
          icon={<Cctv className="h-6 w-6" />}
          title="Todavía no hay cámaras"
          action={
            <Link href="/monitor/cameras" className={btnPrimary}>
              Agregar cámara
            </Link>
          }
        >
          Cuando registres cámaras o conectes un celular, aparecen acá con su
          estado.
        </EmptyState>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-[var(--line)]">
      {cameras.slice(0, CAMERAS_SHOWN).map((cam) => (
        <li
          key={cam.id}
          className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent-soft text-accent">
              {cam.device_type === "mobile_webrtc" ? (
                <Radio className="h-4 w-4" />
              ) : (
                <Cctv className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                <span className="truncate">{cam.name}</span>
                <span className="shrink-0 font-mono text-[11px] text-muted">
                  {cam.identifier}
                </span>
              </p>
              <p className="truncate text-[12px] text-muted">
                {cam.school_name} · {cam.location_detail}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right font-mono text-[11px] text-muted sm:block">
              {/* Resolución configurada al dar de alta; los FPS no se miden, no se muestran. */}
              <p className="text-foreground/85">{cam.resolution}</p>
            </div>
            <StatusBadge status={cam.status} size="sm" />
            <Link
              href={`/monitor/live?cam=${cam.id}`}
              aria-label={`Ver ${cam.name} en vivo`}
              title="Ver en vivo"
              className="focus-ring rounded-full p-1.5 text-muted transition-colors hover:bg-white/[0.06] hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
