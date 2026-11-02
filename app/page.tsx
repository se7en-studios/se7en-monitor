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
import {
  MOCK_METRICS,
  MOCK_CAMERAS,
  MOCK_ACTIVITY,
  MOCK_SCHOOLS,
} from "@/data/mock-data";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-400 border border-blue-500/20">
              PROGRAMA CORREDOR ESCOLAR CUIDADO
            </span>
            <span className="text-xs text-slate-500">Ordenanza Catriel 2026</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Tablero Central de Operaciones
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Monitoreo perimetral preventivo en radio de 200 metros alrededor de los establecimientos educativos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/monitor/live"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 transition-all"
          >
            <Video className="h-4 w-4" />
            <span>Ver Grilla en Vivo</span>
          </Link>
          <Link
            href="/map"
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0e131f] px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/[0.05] transition-colors"
          >
            <MapPin className="h-4 w-4 text-cyan-400" />
            <span>Mapa de Corredores</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Escuelas Registradas"
          value={MOCK_METRICS.total_schools}
          subtitle="Catriel urbano"
          icon={<School className="h-5 w-5" />}
          highlightColor="indigo"
          trend={{ value: "+1", isPositive: true, label: "incorporada este mes" }}
        />

        <StatCard
          title="Cámaras Operativas"
          value={MOCK_METRICS.cameras_online}
          subtitle={`de ${MOCK_METRICS.total_cameras} instaladas`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          highlightColor="emerald"
          trend={{ value: "92%", isPositive: true, label: "tasa de operatividad" }}
        />

        <StatCard
          title="Cámaras con Alerta / Offline"
          value={MOCK_METRICS.cameras_offline + MOCK_METRICS.cameras_warning}
          subtitle="1 alerta · 1 offline"
          icon={<AlertTriangle className="h-5 w-5" />}
          highlightColor="rose"
          trend={{ value: "2", isPositive: false, label: "requieren inspección" }}
        />

        <StatCard
          title="Disponibilidad del Sistema"
          value={`${MOCK_METRICS.system_uptime_percentage}%`}
          subtitle="SLA mensual"
          icon={<Activity className="h-5 w-5" />}
          highlightColor="blue"
          trend={{ value: "+0.4%", isPositive: true, label: "sobre el objetivo (98%)" }}
        />
      </div>

      {/* Charts Section */}
      <DashboardCharts />

      {/* Two Column Layout: Quick Camera Status & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Dispositivos en el Corredor */}
        <div className="lg:col-span-2 rounded-xl border border-white/[0.08] bg-[#0e131f] p-5">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Dispositivos de Monitoreo Prioritarios
              </h3>
              <p className="text-xs text-slate-400">
                Puntos de control perimetral y transmisión móvil activa
              </p>
            </div>
            <Link
              href="/monitor/cameras"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              <span>Ver todas ({MOCK_CAMERAS.length})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-white/[0.04]">
            {MOCK_CAMERAS.slice(0, 5).map((cam) => (
              <div
                key={cam.id}
                className="flex items-center justify-between py-3.5 hover:bg-white/[0.02] px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    {cam.device_type === "mobile_webrtc" ? (
                      <Radio className="h-4 w-4 text-cyan-400 animate-pulse" />
                    ) : (
                      <Cctv className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-white">{cam.name}</p>
                      <span className="font-mono text-[10px] text-slate-400">
                        {cam.identifier}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {cam.school_name} · {cam.location_detail}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-[11px] font-mono text-slate-300">{cam.resolution}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{cam.fps} FPS</p>
                  </div>
                  <StatusBadge status={cam.status} size="sm" />
                  <Link
                    href={`/monitor/live?focus=${cam.id}`}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white"
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
          <ActivityFeed events={MOCK_ACTIVITY} />
        </div>
      </div>
    </div>
  );
}

