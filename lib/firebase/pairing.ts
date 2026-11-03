import { Timestamp, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "./config";
import type { Camera } from "@/types/monitor";

/** Cuánto vale un enlace de vinculación. Pasado ese plazo hay que generar uno nuevo. */
export const PAIRING_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

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
  const token = crypto.randomUUID();
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
