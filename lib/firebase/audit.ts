import { addDoc, collection } from "firebase/firestore";
import { auth, db } from "./config";
import type { AccessLog } from "@/types/monitor";

type AccessEvent = Pick<AccessLog, "action" | "camera_id" | "camera_name" | "school_name">;

/**
 * Registra quién accedió a qué. Es inmutable (ver firestore.rules) y no debe
 * romper la acción que lo origina: si falla, solo se informa en consola.
 */
export async function logAccess(
  event: AccessEvent,
  who: { name: string; role: string }
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  const entry: Omit<AccessLog, "id"> = {
    at: new Date().toISOString(),
    actor_uid: user.uid,
    actor_email: user.email ?? "",
    actor_name: who.name,
    actor_role: who.role,
    ...Object.fromEntries(Object.entries(event).filter(([, v]) => v !== undefined)),
  } as Omit<AccessLog, "id">;
  try {
    await addDoc(collection(db, "access_logs"), entry);
  } catch (err) {
    console.error("[access_logs]", err);
  }
}
