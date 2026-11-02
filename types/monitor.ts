export type EducationalLevel = "inicial" | "primario" | "secundario" | "tecnico" | "superior";

export type SchoolStatus = "operativo" | "en_obra" | "atencion_requerida";

export interface School {
  id: string;
  code: string; // ej: "ESC-204"
  name: string;
  address: string;
  neighborhood: string;
  city: string;
  province: string;
  lat: number;
  lng: number;
  educational_level: EducationalLevel;
  principal_name: string;
  phone: string;
  email: string;
  perimeter_radius_meters: number; // Por ordenanza Catriel: 200m
  cameras_count: number;
  status: SchoolStatus;
  created_at: string;
}

export type CameraStatus = "online" | "offline" | "mantenimiento" | "alerta";
export type CameraLocationType = "perimetro_exterior" | "acceso_principal" | "patio_general" | "corredor_escolar" | "porton_secundario";
export type CameraDeviceType = "mobile_webrtc" | "ip_dome" | "ip_bullet" | "ptz_exterior";

export interface Camera {
  id: string;
  school_id: string;
  school_name?: string;
  identifier: string; // ej: "CAM-CAT-014"
  name: string;
  location_type: CameraLocationType;
  location_detail: string;
  device_type: CameraDeviceType;
  status: CameraStatus;
  last_heartbeat: string | null;
  ip_address?: string;
  stream_type: "webrtc" | "rtsp" | "hls";
  stream_url?: string;
  publish_token?: string;
  resolution: string;
  fps: number;
  battery_level?: number;
  is_live: boolean;
  installed_at: string;
}

export type IncidentPriority = "baja" | "media" | "alta" | "critica";
export type IncidentStatus = "nuevo" | "en_revision" | "en_proceso" | "resuelto" | "cerrado";
export type IncidentType =
  | "perimetro_vulnerable"
  | "persona_sospechosa"
  | "aglomeracion_no_habitual"
  | "corte_suministro"
  | "obstruccion_camara"
  | "accidente_transito_escolar"
  | "alarma_vecinal";

export interface Incident {
  id: string;
  school_id: string;
  school_name?: string;
  camera_id?: string;
  camera_name?: string;
  code: string; // ej: "INC-2026-0042"
  type: IncidentType;
  title: string;
  description: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  assigned_to: string;
  reported_at: string;
  resolved_at?: string | null;
  notes?: string;
}

export type AlertSeverity = "info" | "warning" | "critical";

export interface SystemAlert {
  id: string;
  school_id?: string;
  camera_id?: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface ActivityEvent {
  id: string;
  event_type:
    | "camera_connected"
    | "camera_disconnected"
    | "incident_created"
    | "incident_resolved"
    | "school_registered"
    | "device_paired"
    | "maintenance_completed";
  title: string;
  description: string;
  entity_type: "camera" | "school" | "incident" | "maintenance";
  entity_id?: string;
  actor: string;
  timestamp: string;
}

export interface MaintenanceTicket {
  id: string;
  code: string;
  school_id: string;
  school_name: string;
  camera_id: string;
  camera_name: string;
  technician: string;
  title: string;
  priority: "normal" | "urgente";
  status: "pendiente" | "en_curso" | "completado";
  scheduled_for: string;
  created_at: string;
}

export interface SystemUser {
  id: string;
  email: string;
  full_name: string;
  role: "super_admin" | "municipal_admin" | "monitoring_operator" | "maintenance_tech" | "viewer";
  avatar_url?: string;
  last_sign_in?: string;
  created_at: string;
}

export interface DashboardMetrics {
  total_schools: number;
  total_cameras: number;
  cameras_online: number;
  cameras_offline: number;
  cameras_warning: number;
  active_incidents: number;
  system_uptime_percentage: number;
  corridor_meters_covered: number;
}

