"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit as limitTo,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "./config";
import { toMillis } from "@/lib/time";
import type { ActivityEvent } from "@/types/monitor";

export { newId } from "@/lib/ids";

export interface CollectionOptions {
  /** Cantidad máxima de documentos (los más nuevos si hay `orderByField`). */
  limit?: number;
  /** Campo por el que se ordena en Firestore, de mayor a menor. */
  orderByField?: string;
  /** false: no se suscribe (el rol no tiene permiso de lectura). Queda vacío. */
  enabled?: boolean;
}

/**
 * Suscripción en tiempo real a una colección. `sort` debe ser una función estable (de módulo).
 * Con `options` la consulta se ordena y se corta en el servidor: `hasMore` indica si
 * probablemente hay más documentos que los traídos (se llegó al límite).
 */
export function useCollection<T extends { id: string }>(
  name: string,
  sort?: (a: T, b: T) => number,
  options?: CollectionOptions,
) {
  const [raw, setRaw] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const max = options?.limit;
  const field = options?.orderByField;
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) {
      setRaw([]);
      setLoading(false);
      return;
    }
    const base = collection(db, name);
    const constraints = [
      ...(field ? [orderBy(field, "desc")] : []),
      ...(max ? [limitTo(max)] : []),
    ];
    const source = constraints.length ? query(base, ...constraints) : base;
    return onSnapshot(
      source,
      (snap) => {
        // Las fechas de serverTimestamp() todavía no confirmadas se estiman localmente.
        setRaw(
          snap.docs.map(
            (d) =>
              ({ ...d.data({ serverTimestamps: "estimate" }), id: d.id }) as T,
          ),
        );
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error(`[firestore] ${name}`, err);
        setError(err.message);
        setLoading(false);
      },
    );
  }, [name, max, field, enabled]);

  const data = useMemo(() => (sort ? [...raw].sort(sort) : raw), [raw, sort]);
  const hasMore = max !== undefined && raw.length >= max;
  return { data, loading, error, hasMore };
}

/** Suscripción en tiempo real a un documento. `data` es null si no existe. */
export function useDocument<T extends { id: string }>(col: string, id: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onSnapshot(
        doc(db, col, id),
        (snap) => {
          setData(
            snap.exists() ? ({ ...snap.data(), id: snap.id } as T) : null,
          );
          setLoading(false);
        },
        (err) => {
          console.error(`[firestore] ${col}/${id}`, err);
          setLoading(false);
        },
      ),
    [col, id],
  );

  return { data, loading };
}

export const saveDoc = <T extends { id: string }>(col: string, data: T) =>
  setDoc(doc(db, col, data.id), data);

export const patchDoc = (
  col: string,
  id: string,
  patch: Record<string, unknown>,
) => updateDoc(doc(db, col, id), patch);

export const removeDoc = (col: string, id: string) =>
  deleteDoc(doc(db, col, id));

/** Quién está haciendo el cambio, para guardar en `updated_by` / `acknowledged_by`. */
export const currentActor = (): string => auth.currentUser?.email ?? "Sistema";

/** uid de la sesión actual (para `reported_by`). Vacío si no hay sesión. */
export const currentUid = (): string => auth.currentUser?.uid ?? "";

/**
 * Registra un evento en la bitácora. La identidad y la hora las valida el servidor
 * (ver firestore.rules). No debe romper la acción principal: el error solo se loguea.
 */
export function logActivity(
  event: Omit<ActivityEvent, "id" | "actor" | "actor_uid" | "timestamp">,
): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email) return Promise.resolve();
  const entry = Object.fromEntries(
    Object.entries(event).filter(([, v]) => v !== undefined),
  );
  return addDoc(collection(db, "activity_logs"), {
    ...entry,
    actor: user.email,
    actor_uid: user.uid,
    timestamp: serverTimestamp(),
  })
    .then(() => undefined)
    .catch((err) => console.error("[activity_logs]", err));
}

export const byId = (a: { id: string }, b: { id: string }) =>
  a.id.localeCompare(b.id);

/** Más nuevo primero. Acepta fecha ISO o Timestamp; sin fecha va al final. */
export const byNewest =
  <K extends string>(field: K) =>
  (a: Partial<Record<K, unknown>>, b: Partial<Record<K, unknown>>) =>
    toMillis(b[field]) - toMillis(a[field]);
