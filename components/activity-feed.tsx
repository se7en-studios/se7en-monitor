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
import { cn } from "@/lib/utils";

interface ActivityFeedProps {
  events: ActivityEvent[];
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  const getIcon = (type: ActivityEvent["event_type"]) => {
    switch (type) {
      case "camera_connected":
        return <Video className="h-4 w-4 text-emerald-400" />;
      case "camera_disconnected":
        return <Video className="h-4 w-4 text-rose-400" />;
      case "device_paired":
        return <Smartphone className="h-4 w-4 text-accent" />;
      case "incident_created":
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case "incident_resolved":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case "maintenance_completed":
        return <Wrench className="h-4 w-4 text-accent" />;
      case "school_registered":
        return <School className="h-4 w-4 text-accent" />;
      default:
        return <Radio className="h-4 w-4 text-muted" />;
    }
  };

  return (
    <div className="rounded-xl border border-[var(--line)] bg-panel p-5">
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <div>
          <h3 className="adm-title text-[13px] text-foreground">Actividad en Tiempo Real</h3>
          <p className="text-xs text-muted">
            Eventos auditados y telemetría de la red escolar
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-live-pulse" />
          EN VIVO
        </span>
      </div>

      <div className="mt-4 divide-y divide-[var(--line)]">
        {events.map((event) => (
          <div key={event.id} className="flex items-start gap-3.5 py-3 group">
            <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] border border-[var(--line)] shrink-0 group-hover:border-[var(--line-strong)] transition-colors">
              {getIcon(event.event_type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground truncate">
                  {event.title}
                </p>
                <span className="text-[10px] font-mono text-muted whitespace-nowrap">
                  {formatTimeAgo(event.timestamp)}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted line-clamp-2">
                {event.description}
              </p>
              <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-muted">
                <span>Por: {event.actor}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

