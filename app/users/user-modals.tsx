"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Loader2, X } from "lucide-react";
import type { Profile } from "@/lib/firebase/auth-context";
import { patchDoc } from "@/lib/firebase/data";
import { createOperator } from "@/lib/firebase/create-operator";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import { describeError, useToast } from "@/components/toast";
import { btnPrimary, btnSecondary, input, label } from "@/components/ui";

const ROLES = Object.keys(ROLE_LABELS) as Role[];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 8;

export interface NewOperatorInput {
  full_name: string;
  email: string;
  password: string;
  role: string;
}

/** Valida el alta. Devuelve el primer problema en lenguaje claro, o null si está bien. */
export function validateNewOperator(v: NewOperatorInput): string | null {
  if (v.full_name.trim().length < 3) return "Escribí el nombre completo.";
  if (!EMAIL_RE.test(v.email.trim())) return "El email no es válido.";
  if (v.password.length < MIN_PASSWORD)
    return `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`;
  if (v.password.trim().toLowerCase() === v.email.trim().toLowerCase())
    return "La contraseña no puede ser igual al email.";
  if (!ROLES.includes(v.role as Role)) return "Elegí un rol.";
  return null;
}

function createErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  if (code === "auth/email-already-in-use")
    return "Ya existe una cuenta con ese email.";
  if (code === "auth/weak-password") return "La contraseña es demasiado débil.";
  if (code === "auth/invalid-email") return "El email no es válido.";
  if (code === "auth/operation-not-allowed")
    return "Habilitá Email/Contraseña en Firebase Authentication.";
  return describeError(error, "No se pudo crear el usuario.");
}

function ModalShell({
  title,
  onClose,
  children,
  onSubmit,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <form
        onSubmit={onSubmit}
        noValidate
        className="w-full max-w-md space-y-4 rounded-2xl border border-[var(--line-strong)] bg-[var(--panel)] p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="adm-title text-[15px] text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </form>
    </div>
  );
}

function RoleSelect({
  value,
  onChange,
  id,
}: {
  value: Role;
  onChange: (r: Role) => void;
  id: string;
}) {
  return (
    <select
      id={id}
      className={input}
      value={value}
      onChange={(e) => onChange(e.target.value as Role)}
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABELS[r]}
        </option>
      ))}
    </select>
  );
}

function Actions({
  busy,
  onClose,
  submit,
}: {
  busy: boolean;
  onClose: () => void;
  submit: string;
}) {
  return (
    <div className="flex justify-end gap-2 pt-1">
      <button
        type="button"
        className={btnSecondary}
        onClick={onClose}
        disabled={busy}
      >
        Cancelar
      </button>
      <button type="submit" className={btnPrimary} disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {submit}
      </button>
    </div>
  );
}

export function NewOperatorModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState<NewOperatorInput>({
    full_name: "",
    email: "",
    password: "",
    role: "monitoring_operator",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<NewOperatorInput>) =>
    setForm((f) => ({ ...f, ...patch }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const problem = validateNewOperator(form);
    setError(problem);
    if (problem || busy) return;
    setBusy(true);
    try {
      await createOperator({ ...form, role: form.role as Role });
      toast.success(`Usuario creado: ${form.email.trim()}`);
      onClose();
    } catch (err) {
      console.error("[usuarios] alta", err);
      setError(createErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <ModalShell title="Nuevo usuario" onClose={onClose} onSubmit={onSubmit}>
      <div>
        <label className={label} htmlFor="nu-name">
          Nombre completo
        </label>
        <input
          id="nu-name"
          className={input}
          value={form.full_name}
          onChange={(e) => set({ full_name: e.target.value })}
        />
      </div>
      <div>
        <label className={label} htmlFor="nu-email">
          Email
        </label>
        <input
          id="nu-email"
          type="email"
          className={input}
          value={form.email}
          onChange={(e) => set({ email: e.target.value })}
        />
      </div>
      <div>
        <label className={label} htmlFor="nu-pass">
          Contraseña inicial
        </label>
        <input
          id="nu-pass"
          type="text"
          autoComplete="off"
          className={input}
          placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
          value={form.password}
          onChange={(e) => set({ password: e.target.value })}
        />
      </div>
      <div>
        <label className={label} htmlFor="nu-role">
          Rol
        </label>
        <RoleSelect
          id="nu-role"
          value={form.role as Role}
          onChange={(role) => set({ role })}
        />
      </div>
      {error && (
        <p role="alert" className="text-[13px] text-red-400">
          {error}
        </p>
      )}
      <Actions busy={busy} onClose={onClose} submit="Crear usuario" />
    </ModalShell>
  );
}

/** Editar nombre y rol. Nadie puede cambiarse su propio rol (no quedarse sin Super Admin). */
export function EditUserModal({
  user,
  isMe,
  onClose,
}: {
  user: Profile;
  isMe: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const [fullName, setFullName] = useState(user.full_name);
  const [role, setRole] = useState<Role>(user.role);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const name = fullName.trim();
    if (name.length < 3) return setError("Escribí el nombre completo.");
    if (busy) return;
    setBusy(true);
    try {
      await patchDoc(
        "profiles",
        user.id,
        isMe ? { full_name: name } : { full_name: name, role },
      );
      toast.success("Usuario actualizado");
      onClose();
    } catch (err) {
      console.error("[usuarios] edición", err);
      setError(describeError(err, "No se pudo guardar el cambio."));
      setBusy(false);
    }
  }

  return (
    <ModalShell
      title={`Editar a ${user.full_name}`}
      onClose={onClose}
      onSubmit={onSubmit}
    >
      <div>
        <label className={label} htmlFor="eu-name">
          Nombre completo
        </label>
        <input
          id="eu-name"
          className={input}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
      <div>
        <label className={label} htmlFor="eu-role">
          Rol
        </label>
        {isMe ? (
          <p className="text-[13px] text-muted">
            {ROLE_LABELS[user.role]} · no podés cambiar tu propio rol.
          </p>
        ) : (
          <RoleSelect id="eu-role" value={role} onChange={setRole} />
        )}
      </div>
      {error && (
        <p role="alert" className="text-[13px] text-red-400">
          {error}
        </p>
      )}
      <Actions busy={busy} onClose={onClose} submit="Guardar" />
    </ModalShell>
  );
}
