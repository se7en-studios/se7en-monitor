export type ReportKind = "coverage" | "availability" | "audit";

export const REPORT_KINDS: Record<
  ReportKind,
  { title: string; summary: string }
> = {
  coverage: {
    title: "Cobertura del Corredor Escolar Cuidado Monitoreado",
    summary:
      "Qué establecimientos tienen cámaras verificadas dentro del radio y cuáles no.",
  },
  availability: {
    title: "Disponibilidad del sistema e incidentes",
    summary:
      "Qué cámaras están en línea ahora y cómo van los incidentes abiertos.",
  },
  audit: {
    title: "Auditoría de accesos al sistema",
    summary: "Quién ingresó y qué cámaras vio. Solo para la administración.",
  },
};
