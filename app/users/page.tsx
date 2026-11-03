"use client";

import { useState, type FormEvent } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { useAuth, type Profile } from "@/lib/firebase/auth-context";
import { useCollection, patchDoc, byNewest } from "@/lib/firebase/data";
import { createOperator } from "@/lib/firebase/create-operator";
import { can, ROLE_BADGES, ROLE_LABELS, type Role } from "@/lib/roles";

const sortProfiles = byNewest("created_at");
const INPUT =
  "w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-sm text-white outline-none focus:border-blue-500/60";

function createErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  if (code === "auth/email-already-in-use")
    return "Ya existe una cuenta con ese email.";
  if (code === "auth/weak-password")
    return "La contraseña debe tener al menos 6 caracteres.";
  if (code === "auth/invalid-email") return "El email no es válido.";
  if (code === "auth/operation-not-allowed")
    return "Habilitá Email/Contraseña en Firebase Authentication.";
  if (code === "permission-denied")
    return "No tenés permiso para crear usuarios.";
  return "No se pudo crear el usuario.";
}

function NewOperatorModal({ onClose }: { onClose: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("monitoring_operator");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createOperator({ full_name: fullName, email, password, role });
      onClose();
    } catch (err) {
      setError(createErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-4 rounded-xl border border-white/[0.08] bg-[#0c101a] p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Nuevo operador</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        <input
          className={INPUT}
          required
          placeholder="Nombre completo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <input
          className={INPUT}
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className={INPUT}
          required
          type="text"
          minLength={6}
          placeholder="Contraseña inicial (mín. 6)"
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <select
          className={INPUT}
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
        >
          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>

        {error && (
          <p role="alert" className="text-xs text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Crear usuario
        </button>
      </form>
    </div>
  );
}

export default function UsersPage() {
  const { profile: me } = useAuth();
  const {
    data: users,
    loading,
    error,
  } = useCollection<Profile>("profiles", sortProfiles);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!can.manageUsers(me?.role)) {
    return (
      <p className="text-sm text-slate-400">
        Solo el Super Admin puede gestionar usuarios.
      </p>
    );
  }

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
            Aislamiento de permisos y trazabilidad de operadores del sistema de
            monitoreo
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo operador</span>
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400">
          No se pudieron cargar los usuarios: {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#0c101a]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08] bg-[#070a12] text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Usuario</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Rol</th>
              <th className="py-3 px-4">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-xs">
            {loading && (
              <tr>
                <td colSpan={4} className="py-6 px-4 text-slate-500">
                  Cargando…
                </td>
              </tr>
            )}
            {users.map((u) => {
              const isMe = u.id === me?.id;
              return (
                <tr key={u.id} className="hover:bg-white/[0.02]">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {u.full_name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {u.email}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase ${ROLE_BADGES[u.role]}`}
                    >
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      disabled={isMe}
                      title={
                        isMe
                          ? "No podés deshabilitar tu propia cuenta"
                          : undefined
                      }
                      onClick={() =>
                        patchDoc("profiles", u.id, { active: !u.active })
                      }
                      className={`font-mono text-[11px] flex items-center gap-1.5 disabled:cursor-not-allowed ${u.active ? "text-emerald-400" : "text-slate-500"}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${u.active ? "bg-emerald-400" : "bg-slate-500"}`}
                      />
                      {u.active ? "Activo" : "Deshabilitado"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <NewOperatorModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
