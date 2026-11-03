import type { AccessAction } from "@/types/monitor";

export const ACCESS_ACTION_LABELS: Record<AccessAction, string> = {
  login: "Ingreso al sistema",
  ver_monitoreo_en_vivo: "Abrió el monitoreo en vivo",
  ver_camara: "Vio una cámara",
  vincular_celular: "Generó enlace para celular",
};
