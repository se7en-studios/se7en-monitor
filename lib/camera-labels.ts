import type {
  CameraDeviceType,
  CameraLocationType,
  CameraStatus,
} from "@/types/monitor";

export const DEVICE_LABELS: Record<CameraDeviceType, string> = {
  mobile_webrtc: "Celular",
  ip_dome: "Domo IP",
  ip_bullet: "Bullet IP",
  ptz_exterior: "Domo PTZ",
};

export const LOCATION_LABELS: Record<CameraLocationType, string> = {
  acceso_principal: "Acceso principal",
  corredor_escolar: "Corredor escolar",
  perimetro_exterior: "Perímetro exterior",
  patio_general: "Patio general",
  porton_secundario: "Portón secundario",
};

export const CAMERA_STATUS_LABELS: Record<CameraStatus, string> = {
  online: "En línea",
  offline: "Sin señal",
  alerta: "Alerta",
  mantenimiento: "Mantenimiento",
};
