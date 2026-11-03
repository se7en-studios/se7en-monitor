import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";
import type { AccessLog } from "@/types/monitor";

type AccessEvent = Pick<
  AccessLog,
  "action" | "camera_id" | "camera_name" | "school_name"
>;

/**
 * Registra quién accedió a qué. Es inmutable y las reglas exigen que la identidad
 * coincida con el perfil verificado y que la hora sea la del servidor (ver
 * firestore.rules). No debe romper la acción que lo origina: si falla, se informa
 * en consola.
 */
export async function logAccess(
  event: AccessEvent,
  who: { name: string; role: string },
): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email) return;
  const optional = Object.fromEntries(
    Object.entries(event).filter(([, v]) => v !== undefined),
  );
  try {
    await addDoc(collection(db, "access_logs"), {
      ...optional,
      at: serverTimestamp(),
      actor_uid: user.uid,
      actor_email: user.email,
      actor_name: who.name,
      actor_role: who.role,
    });
  } catch (err) {
    console.error("[access_logs]", err);
  }
}
