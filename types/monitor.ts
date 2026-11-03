import type { StoredDate } from "@/lib/time";

export type EducationalLevel =
  "inicial" | "primario" | "secundario" | "tecnico" | "superior";

export type SchoolStatus = "operativo" | "en_obra" | "atencion_requerida";

export type SchoolManagement = "estatal" | "privada";

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
  /** Gestión estatal o privada. Falta en datos viejos: se muestra como "Sin dato". */
  management?: SchoolManagement;
  principal_name: string;
  phone: string;
  email: string;
  perimeter_radius_meters: number; // Por ordenanza Catriel: 200m
  cameras_count: number;
  status: SchoolStatus;
  created_at: string;
}

export type CameraStatus = "online" | "offline" | "mantenimiento" | "alerta";
export type CameraLocationType =
  | "perimetro_exterior"
  | "acceso_principal"
  | "patio_general"
  | "corredor_escolar"
  | "porton_secundario";
export type CameraDeviceType =
  "mobile_webrtc" | "ip_dome" | "ip_bullet" | "ptz_exterior";

export interface Camera {
  id: string;
  school_id: string;
  school_name?: string;
  identifier: string; // ej: "CAM-CAT-014"
  name: string;
  location_type: CameraLocationType;
  location_detail: string;
  /** Posición real de la cámara. Falta en datos viejos: no se puede verificar el radio. */
  lat?: number;
  lng?: number;
  device_type: CameraDeviceType;
  status: CameraStatus;
  last_heartbeat: string | null;
  ip_address?: string;
  stream_type: "webrtc" | "rtsp" | "hls";
  stream_url?: string;
  resolution: string;
  fps: number;
  battery_level?: number;
  is_live: boolean;
  installed_at: string;
}

export type IncidentPriority = "baja" | "media" | "alta" | "critica";
export type IncidentStatus =
  "nuevo" | "en_revision" | "en_proceso" | "resuelto" | "cerrado";
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
  /** uid de quien lo reportó. Falta en datos viejos. */
  reported_by?: string;
  resolved_at?: string | null;
  notes?: string;
  /** Último cambio de estado. Falta en datos viejos. */
  updated_at?: string;
  updated_by?: string;
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
  /** Quién y cuándo la reconoció. Falta en datos viejos. */
  acknowledged_by?: string | null;
  acknowledged_at?: string | null;
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
  /** Email de quien lo hizo (lo validan las reglas). */
  actor: string;
  actor_uid?: string;
  /** Timestamp del servidor (nuevo) o ISO (datos viejos). */
  timestamp: StoredDate;
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
  /** uid de quien la creó. Falta en datos viejos. */
  reported_by?: string;
  notes?: string;
  /** Último cambio de estado. Falta en datos viejos. */
  updated_at?: string;
  updated_by?: string;
}

export interface SystemUser {
  id: string;
  email: string;
  full_name: string;
  role:
    | "super_admin"
    | "municipal_admin"
    | "monitoring_operator"
    | "maintenance_tech"
    | "viewer";
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

export type AccessAction =
  "login" | "ver_monitoreo_en_vivo" | "ver_camara" | "vincular_celular";

/** Registro inmutable de quién accedió a qué. Lo escribe la app; lo lee solo la administración. */
export interface AccessLog {
  id: string;
  /** Timestamp del servidor (nuevo) o ISO (datos viejos). */
  at: StoredDate;
  action: AccessAction;
  actor_uid: string;
  actor_email: string;
  actor_name: string;
  actor_role: string;
  camera_id?: string;
  camera_name?: string;
  school_name?: string;
}

/** Marco operativo que define el Municipio. Los campos vacíos se muestran como "Sin definir". */
export interface OperationalPolicy {
  id: string;
  operator_organism: string; // quién opera el sistema
  data_controller: string; // responsable del tratamiento de las imágenes
  retention: string; // cuánto se conservan las grabaciones
  supervision_body: string; // quién supervisa y controla
  education_coordination: string; // coordinación con autoridades educativas
  security_coordination: string; // coordinación con seguridad
  updated_at: string;
  updated_by: string;
}
