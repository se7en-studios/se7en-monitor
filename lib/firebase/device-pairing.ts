import { signInAnonymously, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "./config";
import { toDate } from "@/lib/time";
import type { DevicePairing } from "./webrtc";

/** Resultado de abrir un enlace de vinculación en el celular. */
export type ClaimResult =
  | { state: "valid"; pairing: DevicePairing }
  | { state: "invalid" } // no existe, venció o fue revocado
  | { state: "claimed" } // ya lo usa otro dispositivo
  | { state: "disabled" } // falta habilitar el acceso anónimo en Firebase
  | { state: "offline" };

const codeOf = (err: unknown) => (err as { code?: string })?.code ?? "";

// Una sola sesión anónima y un solo reclamo por token aunque React monte dos veces
// (StrictMode): dos sesiones anónimas distintas se pisarían el reclamo.
let userPromise: Promise<User> | null = null;
const claims = new Map<string, Promise<ClaimResult>>();

/** El celular entra sin cuenta: sesión anónima (se conserva en el navegador). */
function deviceUser(): Promise<User> {
  userPromise ??= auth
    .authStateReady()
    .then(async () => auth.currentUser ?? (await signInAnonymously(auth)).user);
  return userPromise;
}

async function tryClaim(token: string): Promise<ClaimResult> {
  const user = await deviceUser();
  const ref = doc(db, "pairings", token);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { state: "invalid" };
  const p = snap.data();
  const expiresAt = toDate(p.expires_at);
  // Los enlaces del formato viejo (sin `device_uid`) no se pueden reclamar: se descartan.
  if (!expiresAt || expiresAt.getTime() <= Date.now() || !("device_uid" in p))
    return { state: "invalid" };
  if (p.device_uid && p.device_uid !== user.uid) return { state: "claimed" };
  if (!p.device_uid)
    await updateDoc(ref, {
      device_uid: user.uid,
      claimed_at: serverTimestamp(),
    });
  return {
    state: "valid",
    pairing: {
      token,
      cameraId: String(p.camera_id),
      cameraName: String(p.camera_name ?? ""),
      deviceUid: user.uid,
      expiresAt,
    },
  };
}

function describeFailure(err: unknown): ClaimResult {
  const code = codeOf(err);
  if (
    code === "auth/operation-not-allowed" ||
    code === "auth/admin-restricted-operation"
  )
    return { state: "disabled" };
  // Otro dispositivo lo reclamó un instante antes.
  if (code === "permission-denied") return { state: "claimed" };
  console.error("[vinculación] reclamo", err);
  return { state: "offline" };
}

/**
 * Abre el enlace en el celular: inicia sesión anónima y reclama el enlace una sola vez.
 * Desde ese momento solo este dispositivo puede transmitir con él (ver firestore.rules).
 */
export function claimPairing(token: string): Promise<ClaimResult> {
  const cached = claims.get(token);
  if (cached) return cached;
  const result = tryClaim(token).catch(describeFailure);
  claims.set(token, result);
  // Sin conexión se puede reintentar recargando: no se guarda ese resultado.
  void result.then((r) => r.state === "offline" && claims.delete(token));
  return result;
}
