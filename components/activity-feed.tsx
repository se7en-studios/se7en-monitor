import { ActivityEvent } from "@/types/monitor";
import { formatTimeAgo } from "@/lib/utils";
import {
  Video,
  AlertTriangle,
  CheckCircle2,
  School,
  Smartphone,
  Wrench,
  Radio,
} from "lucide-react";
import { Card, EmptyState, Skeleton } from "@/components/ui";

interface ActivityFeedProps {
  events: ActivityEvent[];
  loading?: boolean;
}

const ICONS: Partial<Record<ActivityEvent["event_type"], React.ReactNode>> = {
  camera_connected: <Video className="h-4 w-4 text-emerald-400" />,
  camera_disconnected: <Video className="h-4 w-4 text-rose-400" />,
  device_paired: <Smartphone className="h-4 w-4 text-accent" />,
  incident_created: <AlertTriangle className="h-4 w-4 text-amber-400" />,
  incident_resolved: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  maintenance_completed: <Wrench className="h-4 w-4 text-accent" />,
  school_registered: <School className="h-4 w-4 text-accent" />,
};

export function ActivityFeed({ events, loading = false }: ActivityFeedProps) {
  return (
    <Card
      title="Actividad"
      action={
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
          <span
            aria-hidden
            className="animate-live-pulse h-2 w-2 rounded-full bg-emerald-400"
          />
          EN VIVO
        </span>
      }
    >
      {loading ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={<Radio className="h-6 w-6" />}
            title="Sin actividad todavía"
          >
            Las conexiones de cámaras, incidentes y cambios en la red aparecen
            acá a medida que pasan.
          </EmptyState>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--line)] px-4">
          {events.map((event) => (
            <li key={event.id} className="flex items-start gap-3 py-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-white/[0.04]">
                {ICONS[event.event_type] ?? (
                  <Radio className="h-4 w-4 text-muted" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[13px] font-medium text-foreground">
                    {event.title}
                  </p>
                  <span className="font-mono text-[11px] whitespace-nowrap text-muted">
                    {formatTimeAgo(event.timestamp)}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[12px] text-muted">
                  {event.description}
                </p>
                <p className="mt-1 font-mono text-[11px] text-muted">
                  Por: {event.actor}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
