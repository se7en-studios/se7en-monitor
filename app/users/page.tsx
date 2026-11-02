import { Users, Plus, Shield, Key } from "lucide-react";

export default function UsersPage() {
  const users = [
    {
      name: "Franco (Se7en Studio)",
      email: "franco@se7en.studio",
      role: "Super Admin",
      roleBadge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
      status: "Activo",
    },
    {
      name: "Carolina Piris (Concejal FAVC)",
      email: "cpiris@catriel.gob.ar",
      role: "Administrador Municipal",
      roleBadge: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      status: "Activo",
    },
    {
      name: "Operador Sala de Monitoreo 1",
      email: "guardia.monitoreo@catriel.gob.ar",
      role: "Operador de Monitoreo",
      roleBadge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      status: "Activo",
    },
    {
      name: "Lucas Ramos (Técnico Redes)",
      email: "lramos@servicios.catriel.gob.ar",
      role: "Técnico de Mantenimiento",
      roleBadge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      status: "Activo",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-semibold text-blue-400 uppercase tracking-wider">
            CONTROL DE ACCESO INSTITUCIONAL
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            Usuarios, Roles y Permisos
          </h1>
          <p className="text-xs text-slate-400">
            Aislamiento de permisos y trazabilidad de operadores del sistema de monitoreo
          </p>
        </div>

        <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors">
          <Plus className="h-4 w-4" />
          <span>Invitar Usuario</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#0c101a]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08] bg-[#070a12] text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Usuario</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Rol en la Plataforma</th>
              <th className="py-3 px-4">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-xs">
            {users.map((u, i) => (
              <tr key={i} className="hover:bg-white/[0.02]">
                <td className="py-3.5 px-4 font-semibold text-white">{u.name}</td>
                <td className="py-3.5 px-4 font-mono text-slate-300">{u.email}</td>
                <td className="py-3.5 px-4">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase ${u.roleBadge}`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
