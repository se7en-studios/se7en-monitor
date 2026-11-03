"use client";

import Link from "next/link";
import {
  School,
  Cctv,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Shield,
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
import { useCollection, byId, byNewest } from "@/lib/firebase/data";
import { computeMetrics } from "@/lib/metrics";
import type {
  ActivityEvent,
  Camera,
  Incident,
  School as SchoolDoc,
} from "@/types/monitor";

const sortActivity = byNewest("timestamp");

export default function DashboardPage() {
  const { data: schools } = useCollection<SchoolDoc>("schools");
  const { data: cameras } = useCollection<Camera>("cameras", byId);
  const { data: incidents } = useCollection<Incident>("incidents");
  const { data: activity } = useCollection<ActivityEvent>(
    "activity_logs",
    sortActivity,
  );
  const metrics = computeMetrics(schools, cameras, incidents);
  const uptime = metrics.system_uptime_percentage;

  return (
    <div className="space-y-8">
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-accent-soft px-2 py-0.5 font-mono text-[11px] font-semibold text-accent border border-accent/20">
              PROGRAMA CORREDOR ESCOLAR CUIDADO
            </span>
            <span className="text-xs text-muted">
              Ordenanza Catriel 2026
            </span>
          </div>
          <h1 className="mt-3 adm-display text-[clamp(28px,3.6vw,44px)] text-foreground">
            Tablero central de <span className="adm-serif">operaciones</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            Monitoreo perimetral preventivo en radio de 200 metros alrededor de
            los establecimientos educativos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/monitor/live"
            className="inline-flex items-center gap-2 rounded-full bg-accent hover:bg-[var(--accent-hover)] px-4 py-2.5 text-xs font-semibold text-background transition-all"
          >
            <Video className="h-4 w-4" />
            <span>Ver Grilla en Vivo</span>
          </Link>
          <Link
            href="/map"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-panel px-4 py-2.5 text-xs font-semibold text-foreground/85 hover:bg-white/[0.05] transition-colors"
          >
            <MapPin className="h-4 w-4 text-accent" />
            <span>Mapa de Corredores</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Escuelas Registradas"
          value={metrics.total_schools}
          subtitle="Catriel urbano"
          icon={<School className="h-5 w-5" />}
          highlightColor="indigo"
        />

        <StatCard
          title="Cámaras Operativas"
          value={metrics.cameras_online}
          subtitle={`de ${metrics.total_cameras} instaladas`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          highlightColor="emerald"
          trend={{
            value: `${Math.round(uptime)}%`,
            isPositive: true,
            label: "tasa de operatividad",
          }}
        />

        <StatCard
          title="Cámaras con Alerta / Offline"
          value={metrics.cameras_offline + metrics.cameras_warning}
          subtitle={`${metrics.cameras_warning} alerta · ${metrics.cameras_offline} offline`}
          icon={<AlertTriangle className="h-5 w-5" />}
          highlightColor="rose"
          trend={{
            value: String(metrics.cameras_offline + metrics.cameras_warning),
            isPositive: false,
            label: "requieren inspección",
          }}
        />

        <StatCard
          title="Disponibilidad del Sistema"
          value={`${metrics.system_uptime_percentage}%`}
          subtitle="cámaras en línea ahora"
          icon={<Activity className="h-5 w-5" />}
          highlightColor="blue"
        />
      </div>

      {/* Charts Section */}
      <DashboardCharts metrics={metrics} incidents={incidents} />

      {/* Two Column Layout: Quick Camera Status & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Dispositivos en el Corredor */}
        <div className="lg:col-span-2 rounded-xl border border-[var(--line)] bg-panel p-5">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
            <div>
              <h3 className="adm-title text-[13px] text-foreground">
                Dispositivos de Monitoreo Prioritarios
              </h3>
              <p className="text-xs text-muted">
                Puntos de control perimetral y transmisión móvil activa
              </p>
            </div>
            <Link
              href="/monitor/cameras"
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent"
            >
              <span>Ver todas ({cameras.length})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-[var(--line)]">
            {cameras.slice(0, 5).map((cam) => (
              <div
                key={cam.id}
                className="flex items-center justify-between py-3.5 hover:bg-white/[0.02] px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft border border-accent/20 text-accent">
                    {cam.device_type === "mobile_webrtc" ? (
                      <Radio className="h-4 w-4 text-accent animate-pulse" />
                    ) : (
                      <Cctv className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-foreground">
                        {cam.name}
                      </p>
                      <span className="font-mono text-[10px] text-muted">
                        {cam.identifier}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted mt-0.5">
                      {cam.school_name} · {cam.location_detail}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-[11px] font-mono text-foreground/85">
                      {cam.resolution}
                    </p>
                    <p className="text-[10px] text-muted font-mono">
                      {cam.fps} FPS
                    </p>
                  </div>
                  <StatusBadge status={cam.status} size="sm" />
                  <Link
                    href={`/monitor/live?focus=${cam.id}`}
                    className="rounded-lg p-1.5 text-muted hover:bg-white/[0.06] hover:text-foreground"
                    title="Ver en vivo"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Real-time Activity Feed */}
        <div className="lg:col-span-1">
          <ActivityFeed events={activity.slice(0, 20)} />
        </div>
      </div>
    </div>
  );
}
