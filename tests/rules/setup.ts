import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { Timestamp, doc, setDoc } from "firebase/firestore";

export const PROJECT_ID = "demo-se7en-monitor";
const DAY_MS = 24 * 60 * 60 * 1000;

export const ROLES = [
  "super_admin",
  "municipal_admin",
  "monitoring_operator",
  "maintenance_tech",
  "viewer",
] as const;
export type TestRole = (typeof ROLES)[number];

/** Un usuario por rol: uid = rol, email = rol@test.ar, nombre = "Nombre <rol>". */
export const emailOf = (role: TestRole) => `${role}@test.ar`;
export const nameOf = (role: TestRole) => `Nombre ${role}`;

export const TOKENS = {
  /** Cámara A, sin reclamar, vigente. */
  freshA: "token-fresh-a",
  /** Cámara A, ya reclamado por el celular "phone-a". */
  claimedA: "token-claimed-a",
  /** Cámara B, ya reclamado por "phone-b". */
  claimedB: "token-claimed-b",
  /** Cámara A, vencido, reclamado por "phone-old". */
  expiredA: "token-expired-a",
} as const;

export async function createEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
}

const pairing = (cameraId: string, deviceUid: string | null, inMs: number) => ({
  camera_id: cameraId,
  camera_name: `Cámara ${cameraId}`,
  school_name: "Escuela",
  created_by: "super_admin",
  created_at: new Date().toISOString(),
  expires_at: Timestamp.fromMillis(Date.now() + inMs),
  device_uid: deviceUid,
  claimed_at: deviceUid ? Timestamp.now() : null,
});

/** Perfiles, cámaras, enlaces, una sesión de la cámara A y un incidente, sin reglas. */
export async function seed(env: RulesTestEnvironment): Promise<void> {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const role of ROLES)
      await setDoc(doc(db, "profiles", role), {
        email: emailOf(role),
        full_name: nameOf(role),
        role,
        active: true,
        created_at: new Date().toISOString(),
      });
    await setDoc(doc(db, "cameras", "cam-a"), { name: "A" });
    await setDoc(doc(db, "cameras", "cam-b"), { name: "B" });
    await setDoc(
      doc(db, "pairings", TOKENS.freshA),
      pairing("cam-a", null, DAY_MS),
    );
    await setDoc(
      doc(db, "pairings", TOKENS.claimedA),
      pairing("cam-a", "phone-a", DAY_MS),
    );
    await setDoc(
      doc(db, "pairings", TOKENS.claimedB),
      pairing("cam-b", "phone-b", DAY_MS),
    );
    await setDoc(
      doc(db, "pairings", TOKENS.expiredA),
      pairing("cam-a", "phone-old", -DAY_MS),
    );
    await setDoc(doc(db, "camera_sessions", "cam-a"), {
      ...sessionFor(TOKENS.claimedA, "phone-a"),
      expires_at: Timestamp.fromMillis(Date.now() + DAY_MS),
    });
    await setDoc(doc(db, "incidents", "inc-1"), {
      title: "x",
      status: "nuevo",
    });
    await setDoc(doc(db, "access_logs", "log-1"), { action: "login" });
  });
}

/** Documento de sesión como lo escribe el celular (sin expires_at: lo agrega cada prueba). */
export const sessionFor = (token: string, deviceUid: string) => ({
  pairing: token,
  device_uid: deviceUid,
  status: "idle",
});

/** Contexto con sesión de un rol del personal. */
export const staff = (
  env: RulesTestEnvironment,
  role: TestRole,
): RulesTestContext => env.authenticatedContext(role, { email: emailOf(role) });

/** Contexto de un celular con sesión anónima. */
export const device = (
  env: RulesTestEnvironment,
  uid: string,
): RulesTestContext =>
  env.authenticatedContext(uid, {
    firebase: { sign_in_provider: "anonymous" },
  });
