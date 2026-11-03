import type {
  IncidentPriority,
  IncidentStatus,
  IncidentType,
} from "@/types/monitor";

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  nuevo: "Nuevo",
  en_revision: "En revisión",
  en_proceso: "En proceso",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
};

export const INCIDENT_PRIORITY_LABELS: Record<IncidentPriority, string> = {
  critica: "Crítica",
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  perimetro_vulnerable: "Perímetro vulnerable",
  persona_sospechosa: "Persona sospechosa",
  aglomeracion_no_habitual: "Aglomeración no habitual",
  accidente_transito_escolar: "Tránsito / cruce peatonal",
  obstruccion_camara: "Cámara obstruida",
  corte_suministro: "Corte de energía",
  alarma_vecinal: "Alarma vecinal",
};

/** Un incidente cuenta como abierto hasta que se resuelve o se cierra. */
export const isOpenIncident = (s: IncidentStatus): boolean =>
  s !== "resuelto" && s !== "cerrado";
