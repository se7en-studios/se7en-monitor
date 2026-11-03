import { useEffect, useState } from "react";
import {
  Timestamp,
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";
import type { Camera } from "@/types/monitor";

/** Cuánto vale un enlace de vinculación. Pasado ese plazo hay que generar uno nuevo. */
export const PAIRING_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;
const TOKEN_BYTES = 16; // 128 bits de aleatoriedad

/**
 * Token impredecible. Usa getRandomValues y no randomUUID porque este último solo
 * existe en contextos seguros (https o localhost): desde http://192.168.x.x fallaba.
 */
function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_BYTES));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export interface Pairing {
  token: string;
  expiresAt: Date;
}

/**
 * Genera un token único e impredecible para una cámara celular. El token es la
 * credencial del celular: las reglas de Firestore solo aceptan señalización de
 * sesiones cuyo `pairings/{token}` existe y no venció (ver firestore.rules).
 * Si la cámara ya tenía un token, se revoca: un enlace viejo deja de servir.
 */
export async function createPairing(
  camera: Camera,
  uid: string,
): Promise<Pairing> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + PAIRING_DAYS * DAY_MS);

  const batch = writeBatch(db);
  batch.set(doc(db, "pairings", token), {
    camera_id: camera.id,
    camera_name: camera.name,
    school_name: camera.school_name ?? "",
    created_by: uid,
    created_at: new Date().toISOString(),
    expires_at: Timestamp.fromDate(expiresAt),
  });
  batch.update(doc(db, "cameras", camera.id), { publish_token: token });
  if (camera.publish_token)
    batch.delete(doc(db, "pairings", camera.publish_token));
  await batch.commit();

  return { token, expiresAt };
}

/** Anula un enlace de vinculación (por ejemplo, al dar de baja la cámara). */
export const revokePairing = (token: string) =>
  deleteDoc(doc(db, "pairings", token));

/** Revoca el enlace de una cámara y limpia su `publish_token`, todo junto. */
export async function revokeCameraPairing(camera: Camera): Promise<void> {
  const batch = writeBatch(db);
  if (camera.publish_token)
    batch.delete(doc(db, "pairings", camera.publish_token));
  batch.update(doc(db, "cameras", camera.id), { publish_token: deleteField() });
  await batch.commit();
}

/** Da de baja una cámara y, si tenía, anula su enlace de vinculación. */
export async function removeCamera(camera: Camera): Promise<void> {
  const batch = writeBatch(db);
  if (camera.publish_token)
    batch.delete(doc(db, "pairings", camera.publish_token));
  batch.delete(doc(db, "cameras", camera.id));
  await batch.commit();
}

/**
 * Vencimiento de cada enlace vigente, por token. Solo la administración puede leer
 * `pairings` (ver firestore.rules): para otros roles queda vacío.
 */
export function usePairingExpirations(enabled: boolean): Map<string, Date> {
  const [map, setMap] = useState<Map<string, Date>>(new Map());
  useEffect(() => {
    if (!enabled) return;
    return onSnapshot(
      collection(db, "pairings"),
      (snap) =>
        setMap(
          new Map(
            snap.docs.map((d) => [
              d.id,
              (d.data().expires_at as Timestamp).toDate(),
            ]),
          ),
        ),
      (err) => console.error("[pairings]", err),
    );
  }, [enabled]);
  return map;
}
