import { useEffect, useState } from "react";
import {
  Timestamp,
  collection,
  deleteField,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
  writeBatch,
  type WriteBatch,
} from "firebase/firestore";
import { db } from "./config";
import { toDate } from "@/lib/time";
import type { Camera } from "@/types/monitor";

/** Cuánto vale un enlace de vinculación. Pasado ese plazo hay que generar uno nuevo. */
export const PAIRING_DAYS = 3;

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

/** Lo que la administración ve de un enlace (nunca el token). */
export interface PairingInfo {
  expiresAt: Date;
  /** true: un celular ya lo abrió y quedó atado a él. */
  claimed: boolean;
}

/**
 * Agrega al lote el borrado de todo lo que deja transmitir a una cámara: sus enlaces
 * (`pairings` con ese `camera_id`) y su sesión de señalización. Al borrarse la sesión,
 * el tablero corta la conexión y el celular avisa que el enlace fue revocado.
 * Limpia también el `publish_token` que guardaban las cámaras en la versión anterior.
 */
async function revokeAllInBatch(batch: WriteBatch, camera: Camera) {
  const existing = await getDocs(
    query(collection(db, "pairings"), where("camera_id", "==", camera.id)),
  );
  existing.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, "camera_sessions", camera.id));
}

/**
 * Genera un enlace nuevo para una cámara celular y revoca los anteriores. El token
 * solo se muestra en el QR: no se guarda en `cameras` (lo lee todo el personal).
 * El primer celular que lo abre lo reclama (ver lib/firebase/device-pairing.ts).
 */
export async function createPairing(
  camera: Camera,
  uid: string,
): Promise<Pairing> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + PAIRING_DAYS * DAY_MS);
  const batch = writeBatch(db);
  await revokeAllInBatch(batch, camera);
  batch.set(doc(db, "pairings", token), {
    camera_id: camera.id,
    camera_name: camera.name,
    school_name: camera.school_name ?? "",
    created_by: uid,
    created_at: new Date().toISOString(),
    expires_at: Timestamp.fromDate(expiresAt),
    device_uid: null,
    claimed_at: null,
  });
  batch.update(doc(db, "cameras", camera.id), { publish_token: deleteField() });
  await batch.commit();
  return { token, expiresAt };
}

/** Revoca todos los enlaces de una cámara: el celular deja de transmitir. */
export async function revokeCameraPairing(camera: Camera): Promise<void> {
  const batch = writeBatch(db);
  await revokeAllInBatch(batch, camera);
  batch.update(doc(db, "cameras", camera.id), { publish_token: deleteField() });
  await batch.commit();
}

/** Da de baja una cámara y anula sus enlaces de vinculación. */
export async function removeCamera(camera: Camera): Promise<void> {
  const batch = writeBatch(db);
  await revokeAllInBatch(batch, camera);
  batch.delete(doc(db, "cameras", camera.id));
  await batch.commit();
}

/**
 * Enlace vigente más reciente de cada cámara, por id de cámara. Solo la administración
 * puede leer `pairings` (ver firestore.rules): con `enabled` en false queda vacío.
 */
export function usePairingsByCamera(
  enabled: boolean,
): Map<string, PairingInfo> {
  const [map, setMap] = useState<Map<string, PairingInfo>>(new Map());
  useEffect(() => {
    if (!enabled) return;
    return onSnapshot(
      collection(db, "pairings"),
      (snap) => {
        const next = new Map<string, PairingInfo>();
        for (const d of snap.docs) {
          const data = d.data();
          const expiresAt = toDate(data.expires_at);
          const cameraId = String(data.camera_id ?? "");
          if (!expiresAt || !cameraId) continue;
          const prev = next.get(cameraId);
          if (!prev || prev.expiresAt < expiresAt)
            next.set(cameraId, { expiresAt, claimed: !!data.device_uid });
        }
        setMap(next);
      },
      (err) => console.error("[pairings]", err),
    );
  }, [enabled]);
  return map;
}
