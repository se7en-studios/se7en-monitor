"use client";

import { useCallback, useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { KeyRound, Pencil, Plus, Users } from "lucide-react";
import { useAuth, type Profile } from "@/lib/firebase/auth-context";
import { auth } from "@/lib/firebase/config";
import { useCollection, patchDoc, byNewest } from "@/lib/firebase/data";
import { can, ROLE_BADGES, ROLE_LABELS } from "@/lib/roles";
import { formatDate } from "@/lib/utils";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { describeError, useToast } from "@/components/toast";
import { EmptyState, PageHeader, btnGhost, btnPrimary } from "@/components/ui";
import { EditUserModal, NewOperatorModal } from "./user-modals";

const sortProfiles = byNewest("created_at");

function resetErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  if (code === "auth/user-not-found")
    return "Ese email no tiene una cuenta de acceso.";
  if (code === "auth/too-many-requests")
    return "Se enviaron demasiados correos. Esperá unos minutos.";
  return describeError(error, "No se pudo enviar el correo.");
}

export default function UsersPage() {
  const { profile: me } = useAuth();
  const toast = useToast();
  const {
    data: users,
    loading,
    error,
  } = useCollection<Profile>("profiles", sortProfiles);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [disabling, setDisabling] = useState<Profile | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const setActive = useCallback(
    async (u: Profile, active: boolean) => {
      setBusyId(u.id);
      try {
        await patchDoc("profiles", u.id, { active });
        toast.success(
          active
            ? `${u.full_name} puede volver a ingresar`
            : `${u.full_name} quedó deshabilitado`,
        );
        setDisabling(null);
      } catch (err) {
        console.error("[usuarios] estado", err);
        toast.error(describeError(err, "No se pudo cambiar el estado."));
      } finally {
        setBusyId(null);
      }
    },
    [toast],
  );

  const sendReset = async (u: Profile) => {
    setBusyId(u.id);
    try {
      await sendPasswordResetEmail(auth, u.email);
      toast.success(
        `Le enviamos a ${u.email} un correo para elegir una contraseña nueva.`,
      );
    } catch (err) {
      console.error("[usuarios] restablecer", err);
      toast.error(resetErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  if (!can.manageUsers(me?.role)) {
    return <EmptyState title="Solo el Super Admin puede gestionar usuarios." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Control de acceso"
        title="Usuarios y"
        accent="roles"
        right={
          <button className={btnPrimary} onClick={() => setIsNewOpen(true)}>
            <Plus className="h-4 w-4" /> Nuevo usuario
          </button>
        }
      >
        Quién puede entrar al sistema y qué puede hacer cada persona.
      </PageHeader>

      {error && (
        <p className="text-[13px] text-red-400">
          No se pudieron cargar los usuarios: {error}
        </p>
      )}

      {!loading && users.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Todavía no hay usuarios"
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--panel)]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--line)] font-mono text-[11px] tracking-wider text-muted uppercase">
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Alta</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] text-[13px]">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-muted">
                    Cargando…
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  isMe={u.id === me?.id}
                  busy={busyId === u.id}
                  onEdit={() => setEditing(u)}
                  onReset={() => void sendReset(u)}
                  onToggle={() =>
                    u.active ? setDisabling(u) : void setActive(u, true)
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isNewOpen && <NewOperatorModal onClose={() => setIsNewOpen(false)} />}
      {editing && (
        <EditUserModal
          user={editing}
          isMe={editing.id === me?.id}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={!!disabling}
        danger
        title={`¿Deshabilitar a ${disabling?.full_name ?? ""}?`}
        confirmLabel="Deshabilitar"
        busy={!!disabling && busyId === disabling.id}
        onCancel={() => setDisabling(null)}
        onConfirm={() => disabling && void setActive(disabling, false)}
      >
        No va a poder ingresar ni ver cámaras hasta que la vuelvas a habilitar.
        Su historial en la auditoría se conserva.
      </ConfirmDialog>
    </div>
  );
}

function UserRow({
  user: u,
  isMe,
  busy,
  onEdit,
  onReset,
  onToggle,
}: {
  user: Profile;
  isMe: boolean;
  busy: boolean;
  onEdit: () => void;
  onReset: () => void;
  onToggle: () => void;
}) {
  return (
    <tr className="hover:bg-white/[0.02]">
      <td className="px-4 py-3">
        <span className="block font-medium text-foreground">
          {u.full_name}{" "}
          {isMe && <span className="text-[11px] text-muted">(vos)</span>}
        </span>
        <span className="block font-mono text-[12px] text-muted">
          {u.email}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] uppercase ${ROLE_BADGES[u.role] ?? ""}`}
        >
          {ROLE_LABELS[u.role] ?? u.role}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-[12px] whitespace-nowrap text-muted">
        {u.created_at ? formatDate(u.created_at) : "Sin dato"}
      </td>
      <td className="px-4 py-3">
        <span
          className={`flex items-center gap-1.5 text-[12px] ${u.active ? "text-emerald-400" : "text-muted"}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${u.active ? "bg-emerald-400" : "bg-white/30"}`}
          />
          {u.active ? "Activo" : "Deshabilitado"}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <button
            className={btnGhost}
            onClick={onEdit}
            disabled={busy}
            title="Editar nombre y rol"
          >
            <Pencil className="h-3.5 w-3.5" /> Editar
          </button>
          <button
            className={btnGhost}
            onClick={onReset}
            disabled={busy}
            title="Enviar correo para restablecer contraseña"
          >
            <KeyRound className="h-3.5 w-3.5" /> Contraseña
          </button>
          <button
            className={btnGhost}
            onClick={onToggle}
            disabled={busy || isMe}
            title={isMe ? "No podés deshabilitar tu propia cuenta" : undefined}
          >
            {u.active ? "Deshabilitar" : "Habilitar"}
          </button>
        </div>
      </td>
    </tr>
  );
}
