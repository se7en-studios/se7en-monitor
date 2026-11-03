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
import { describeError, useToast } from "@/components/toast";
import {
  Card,
  Skeleton,
  btnPrimary,
  btnSecondary,
  input,
  label,
} from "@/components/ui";
import type { OperationalPolicy } from "@/types/monitor";

export function PolicyCard() {
  const { profile } = useAuth();
  const toast = useToast();
  const { data, loading } = useDocument<OperationalPolicy>(
    POLICY_COLLECTION,
    POLICY_ID,
  );
  const policy = data ?? emptyPolicy();
  const canEdit = can.editPolicy(profile?.role);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<OperationalPolicy>(policy);
  const [busy, setBusy] = useState(false);

  const startEditing = () => {
    setDraft(policy);
    setEditing(true);
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await saveDoc(POLICY_COLLECTION, {
        ...draft,
        id: POLICY_ID,
        updated_at: new Date().toISOString(),
        updated_by: profile?.full_name ?? "",
      });
      setEditing(false);
      toast.success("Marco operativo guardado.");
    } catch (err) {
      toast.error(describeError(err, "No se pudo guardar el marco operativo."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title="Marco operativo"
      icon={<ClipboardList className="h-4 w-4" />}
      action={
        canEdit &&
        !editing &&
        !loading && (
          <button
            type="button"
            onClick={startEditing}
            className={`${btnSecondary} px-3 py-1.5 text-[12px]`}
          >
            Editar
          </button>
        )
      }
    >
      <div className="space-y-4 p-4">
        <p className="text-[13px] text-muted">
          Lo que define el Municipio sobre quién opera, quién ve y cuánto se
          conserva. Lo que falta definir figura como «Sin definir» y aparece así
          en los informes.
        </p>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {POLICY_FIELDS.map((f) => (
              <Skeleton key={f.key} className="h-[62px]" />
            ))}
          </div>
        ) : editing ? (
          <form onSubmit={onSubmit} className="space-y-3">
            {POLICY_FIELDS.map((f) => (
              <label key={f.key} className="block">
                <span className={label}>{f.label}</span>
                <input
                  className={input}
                  placeholder={f.placeholder}
                  value={draft[f.key]}
                  onChange={(e) =>
                    setDraft({ ...draft, [f.key]: e.target.value })
                  }
                />
              </label>
            ))}
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className={btnPrimary}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className={btnSecondary}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-2">
            {POLICY_FIELDS.map((f) => (
              <div
                key={f.key}
                className="rounded-lg border border-[var(--line)] bg-[var(--well)] p-3"
              >
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
          <p className="text-[12px] text-muted">
            Última actualización:{" "}
            {new Date(policy.updated_at).toLocaleString("es-AR")} ·{" "}
            {policy.updated_by}
          </p>
        )}
      </div>
    </Card>
  );
}
