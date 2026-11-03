import type { Camera, DashboardMetrics, Incident, School } from "@/types/monitor";

const CLOSED_INCIDENT_STATES: Incident["status"][] = ["resuelto", "cerrado"];

export function computeMetrics(
  schools: School[],
  cameras: Camera[],
  incidents: Incident[]
): DashboardMetrics {
  const online = cameras.filter((c) => c.status === "online").length;
  return {
    total_schools: schools.length,
    total_cameras: cameras.length,
    cameras_online: online,
    cameras_offline: cameras.filter((c) => c.status === "offline").length,
    cameras_warning: cameras.filter((c) => c.status === "alerta" || c.status === "mantenimiento")
      .length,
    active_incidents: incidents.filter((i) => !CLOSED_INCIDENT_STATES.includes(i.status)).length,
    // Disponibilidad instantánea (cámaras online / instaladas), no histórica.
    system_uptime_percentage: cameras.length
      ? Math.round((online / cameras.length) * 1000) / 10
      : 0,
    corridor_meters_covered: schools.reduce((sum, s) => sum + s.perimeter_radius_meters, 0),
  };
}
