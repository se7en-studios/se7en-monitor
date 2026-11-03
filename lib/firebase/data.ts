"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "./config";
import type { ActivityEvent } from "@/types/monitor";

/** Suscripción en tiempo real a una colección. `sort` debe ser una función estable (de módulo). */
export function useCollection<T extends { id: string }>(
  name: string,
  sort?: (a: T, b: T) => number,
) {
  const [raw, setRaw] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      onSnapshot(
        collection(db, name),
        (snap) => {
          setRaw(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as T));
          setError(null);
          setLoading(false);
        },
        (err) => {
          console.error(`[firestore] ${name}`, err);
          setError(err.message);
          setLoading(false);
        },
      ),
    [name],
  );

  const data = useMemo(() => (sort ? [...raw].sort(sort) : raw), [raw, sort]);
  return { data, loading, error };
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
          setData(snap.exists() ? ({ ...snap.data(), id: snap.id } as T) : null);
          setLoading(false);
        },
        (err) => {
          console.error(`[firestore] ${col}/${id}`, err);
          setLoading(false);
        }
      ),
    [col, id]
  );

  return { data, loading };
}

export const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export const saveDoc = <T extends { id: string }>(col: string, data: T) =>
  setDoc(doc(db, col, data.id), data);

export const patchDoc = (
  col: string,
  id: string,
  patch: Record<string, unknown>,
) => updateDoc(doc(db, col, id), patch);

export const removeDoc = (col: string, id: string) => deleteDoc(doc(db, col, id));

/** La bitácora no debe romper la acción principal: el error solo se loguea. */
export const logActivity = (
  event: Omit<ActivityEvent, "id" | "actor" | "timestamp">,
) =>
  addDoc(collection(db, "activity_logs"), {
    ...event,
    actor: auth.currentUser?.email ?? "Sistema",
    timestamp: new Date().toISOString(),
  }).catch((err) => console.error("[activity_logs]", err));

export const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);

export const byNewest =
  <K extends string>(field: K) =>
  (a: Record<K, string>, b: Record<K, string>) =>
    b[field].localeCompare(a[field]);
