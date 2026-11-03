"use client";

import { useState, type FormEvent } from "react";
import { ClipboardList, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import { useDocument, saveDoc } from "@/lib/firebase/data";
import { can } from "@/lib/roles";
import {
  POLICY_COLLECTION,
  POLICY_FIELDS,
  POLICY_ID,
  emptyPolicy,
} from "@/lib/policy";
import type { OperationalPolicy } from "@/types/monitor";

const INPUT =
  "focus-ring w-full rounded-lg border border-[var(--line-strong)] bg-[var(--well)] px-3 py-2 text-[13px] text-foreground placeholder:text-muted/60 focus:border-accent/70";

export function PolicyCard() {
  const { profile } = useAuth();
  const { data, loading } = useDocument<OperationalPolicy>(POLICY_COLLECTION, POLICY_ID);
  const policy = data ?? emptyPolicy();
  const canEdit = can.editPolicy(profile?.role);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<OperationalPolicy>(policy);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    setDraft(policy);
    setError(null);
    setEditing(true);
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await saveDoc(POLICY_COLLECTION, {
        ...draft,
        id: POLICY_ID,
        updated_at: new Date().toISOString(),
        updated_by: profile?.full_name ?? "",
      });
      setEditing(false);
    } catch (err) {
      console.error("[policy]", err);
      setError("No se pudo guardar. Revisá tus permisos.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-[var(--line)] bg-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
          <ClipboardList className="h-4 w-4 text-accent" />
          <span>Marco operativo</span>
        </div>
        {canEdit && !editing && (
          <button
            onClick={startEditing}
            className="focus-ring rounded-full border border-[var(--line-strong)] px-3 py-1.5 text-xs font-semibold text-foreground hover:border-foreground"
          >
            Editar
          </button>
        )}
      </div>
      <p className="text-xs text-muted">
        Lo que define el Municipio sobre quién opera, quién ve y cuánto se conserva. Lo que falta
        definir figura como «Sin definir» y aparece así en los informes.
      </p>

      {loading ? (
        <p className="text-xs text-muted">Cargando…</p>
      ) : editing ? (
        <form onSubmit={onSubmit} className="space-y-3">
          {POLICY_FIELDS.map((f) => (
            <label key={f.key} className="block space-y-1">
              <span className="adm-label">{f.label}</span>
              <input
                className={INPUT}
                placeholder={f.placeholder}
                value={draft[f.key]}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
              />
            </label>
          ))}
          {error && (
            <p role="alert" className="text-xs text-red-400">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="focus-ring inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-2 text-xs font-semibold text-background hover:bg-foreground disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="focus-ring rounded-full border border-[var(--line-strong)] px-3.5 py-2 text-xs font-semibold text-foreground hover:border-foreground"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <dl className="grid gap-3 sm:grid-cols-2">
          {POLICY_FIELDS.map((f) => (
            <div key={f.key} className="rounded-lg border border-[var(--line)] bg-[var(--well)] p-3">
              <dt className="adm-label">{f.label}</dt>
              <dd
                className={`mt-1 text-[13px] ${policy[f.key] ? "text-foreground" : "text-amber-300"}`}
              >
                {policy[f.key] || "Sin definir"}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {policy.updated_at && !editing && (
        <p className="text-[11px] text-muted">
          Última actualización: {new Date(policy.updated_at).toLocaleString("es-AR")} · {policy.updated_by}
        </p>
      )}
    </div>
  );
}
