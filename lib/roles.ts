export type Role =
  | "super_admin"
  | "municipal_admin"
  | "monitoring_operator"
  | "maintenance_tech"
  | "viewer";

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  municipal_admin: "Administrador Municipal",
  monitoring_operator: "Operador de Monitoreo",
  maintenance_tech: "Técnico de Mantenimiento",
  viewer: "Solo lectura",
};

export const ROLE_BADGES: Record<Role, string> = {
  super_admin: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  municipal_admin: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  monitoring_operator:
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  maintenance_tech: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  viewer: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

// Debe coincidir con firestore.rules
const ADMINS: Role[] = ["super_admin", "municipal_admin"];
const OPERATORS: Role[] = [...ADMINS, "monitoring_operator"];

export const can = {
  manageUsers: (r?: Role) => r === "super_admin",
  editInfrastructure: (r?: Role) => !!r && ADMINS.includes(r), // escuelas y cámaras
  handleIncidents: (r?: Role) => !!r && OPERATORS.includes(r), // incidentes y alertas
  handleMaintenance: (r?: Role) =>
    !!r && (ADMINS.includes(r) || r === "maintenance_tech"),
};
