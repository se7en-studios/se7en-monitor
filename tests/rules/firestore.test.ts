import { afterAll, beforeAll, beforeEach, describe, test } from "vitest";
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import {
  TOKENS,
  createEnv,
  device,
  emailOf,
  nameOf,
  seed,
  sessionFor,
  staff,
} from "./setup";

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createEnv();
});
beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
});
afterAll(async () => {
  await env?.cleanup();
});

const db = (ctx: { firestore: () => unknown }) => ctx.firestore() as Firestore;

/** Vencimiento del enlace tal como lo ve el celular (lo copia en la sesión). */
async function expiresOf(fs: Firestore, token: string) {
  return (await getDoc(doc(fs, "pairings", token))).data()?.expires_at;
}

describe("vinculación de celulares", () => {
  test("un celular anónimo reclama un enlace libre una sola vez", async () => {
    const phone = db(device(env, "phone-new"));
    await assertSucceeds(
      updateDoc(doc(phone, "pairings", TOKENS.freshA), {
        device_uid: "phone-new",
        claimed_at: serverTimestamp(),
      }),
    );
    const other = db(device(env, "phone-intruso"));
    await assertFails(
      updateDoc(doc(other, "pairings", TOKENS.freshA), {
        device_uid: "phone-intruso",
        claimed_at: serverTimestamp(),
      }),
    );
  });

  test("no se puede reclamar a nombre de otro ni tocar otros campos", async () => {
    const phone = db(device(env, "phone-new"));
    await assertFails(
      updateDoc(doc(phone, "pairings", TOKENS.freshA), {
        device_uid: "otro-uid",
        claimed_at: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(phone, "pairings", TOKENS.freshA), {
        device_uid: "phone-new",
        claimed_at: serverTimestamp(),
        camera_id: "cam-b",
      }),
    );
  });

  test("un enlace vencido no se puede usar ni reclamar", async () => {
    const phone = db(device(env, "phone-old"));
    await assertFails(
      setDoc(doc(phone, "camera_sessions", "cam-a"), {
        ...sessionFor(TOKENS.expiredA, "phone-old"),
        expires_at: await expiresOf(phone, TOKENS.expiredA),
      }),
    );
    await env.withSecurityRulesDisabled((ctx) =>
      updateDoc(doc(ctx.firestore(), "pairings", TOKENS.expiredA), {
        device_uid: null,
      }),
    );
    await assertFails(
      updateDoc(doc(phone, "pairings", TOKENS.expiredA), {
        device_uid: "phone-old",
        claimed_at: serverTimestamp(),
      }),
    );
  });

  test("sin login no se lee ningún enlace; el personal no los lista", async () => {
    const anon = db(env.unauthenticatedContext());
    await assertFails(getDoc(doc(anon, "pairings", TOKENS.freshA)));
    await assertFails(
      getDocs(collection(db(staff(env, "viewer")), "pairings")),
    );
    await assertSucceeds(
      getDocs(collection(db(staff(env, "municipal_admin")), "pairings")),
    );
  });
});

describe("señalización (camera_sessions)", () => {
  test("el celular dueño del enlace publica en su cámara", async () => {
    const phone = db(device(env, "phone-a"));
    await assertSucceeds(
      setDoc(doc(phone, "camera_sessions", "cam-a"), {
        ...sessionFor(TOKENS.claimedA, "phone-a"),
        expires_at: await expiresOf(phone, TOKENS.claimedA),
        offer: { type: "offer", sdp: "v=0" },
        round: "r1",
      }),
    );
  });

  test("el token de la cámara A no sirve para la cámara B", async () => {
    const phone = db(device(env, "phone-a"));
    await assertFails(
      setDoc(doc(phone, "camera_sessions", "cam-b"), {
        ...sessionFor(TOKENS.claimedA, "phone-a"),
        expires_at: await expiresOf(phone, TOKENS.claimedA),
      }),
    );
  });

  test("otro dispositivo con el mismo token no puede publicar", async () => {
    const intruder = db(device(env, "phone-intruso"));
    await assertFails(
      setDoc(doc(intruder, "camera_sessions", "cam-a"), {
        ...sessionFor(TOKENS.claimedA, "phone-intruso"),
        expires_at: await expiresOf(intruder, TOKENS.claimedA),
      }),
    );
  });

  test("una SDP enorme se rechaza", async () => {
    const phone = db(device(env, "phone-a"));
    await assertFails(
      setDoc(doc(phone, "camera_sessions", "cam-a"), {
        ...sessionFor(TOKENS.claimedA, "phone-a"),
        expires_at: await expiresOf(phone, TOKENS.claimedA),
        offer: { type: "offer", sdp: "x".repeat(20_000) },
      }),
    );
  });

  test("solo quien puede ver en vivo lee la sesión; nadie la lista", async () => {
    await assertSucceeds(
      getDoc(
        doc(db(staff(env, "monitoring_operator")), "camera_sessions", "cam-a"),
      ),
    );
    for (const role of ["viewer", "maintenance_tech"] as const)
      await assertFails(
        getDoc(doc(db(staff(env, role)), "camera_sessions", "cam-a")),
      );
    await assertFails(
      getDoc(doc(db(env.unauthenticatedContext()), "camera_sessions", "cam-a")),
    );
    await assertFails(
      getDocs(collection(db(staff(env, "super_admin")), "camera_sessions")),
    );
  });

  test("el visor solo escribe la respuesta, a su nombre", async () => {
    const op = db(staff(env, "monitoring_operator"));
    const ref = doc(op, "camera_sessions", "cam-a");
    await assertSucceeds(
      updateDoc(ref, {
        answer: { type: "answer", sdp: "v=0" },
        answer_round: "r1",
        status: "connected",
        viewer_uid: "monitoring_operator",
        connectedAt: serverTimestamp(),
      }),
    );
    await assertFails(updateDoc(ref, { offer: { type: "offer", sdp: "v=0" } }));
    await assertFails(updateDoc(ref, { viewer_uid: "otro" }));
    await assertFails(
      updateDoc(doc(db(staff(env, "viewer")), "camera_sessions", "cam-a"), {
        viewer_request: "x",
      }),
    );
  });

  test("candidatos: el celular escribe los suyos, con tamaño acotado", async () => {
    const phone = db(device(env, "phone-a"));
    const caller = collection(
      phone,
      "camera_sessions",
      "cam-a",
      "callerCandidates",
    );
    await assertSucceeds(
      addDoc(caller, {
        candidate: "candidate:1",
        round: "r1",
        sdpMid: "0",
        sdpMLineIndex: 0,
      }),
    );
    await assertFails(
      addDoc(caller, { candidate: "x".repeat(1000), round: "r1" }),
    );
    const viewerDb = db(staff(env, "viewer"));
    await assertFails(
      getDocs(
        collection(viewerDb, "camera_sessions", "cam-a", "callerCandidates"),
      ),
    );
  });
});

describe("incidentes", () => {
  test("solo operadores y administración los leen", async () => {
    await assertSucceeds(
      getDoc(doc(db(staff(env, "monitoring_operator")), "incidents", "inc-1")),
    );
    for (const role of ["viewer", "maintenance_tech"] as const)
      await assertFails(
        getDoc(doc(db(staff(env, role)), "incidents", "inc-1")),
      );
  });

  test("no se borran y el alta exige reported_by propio", async () => {
    const op = db(staff(env, "monitoring_operator"));
    await assertFails(deleteDoc(doc(op, "incidents", "inc-1")));
    const incident = {
      id: "inc-2",
      code: "INC-2026-ABC",
      school_id: "sch-1",
      type: "alarma_vecinal",
      title: "Título",
      description: "Descripción",
      priority: "media",
      status: "nuevo",
      assigned_to: "",
      reported_at: new Date().toISOString(),
      resolved_at: null,
    };
    await assertFails(
      setDoc(doc(op, "incidents", "inc-2"), {
        ...incident,
        reported_by: "otro",
      }),
    );
    await assertSucceeds(
      setDoc(doc(op, "incidents", "inc-2"), {
        ...incident,
        reported_by: "monitoring_operator",
      }),
    );
  });
});

describe("bitácoras", () => {
  const entry = (role: "viewer" | "monitoring_operator") => ({
    at: serverTimestamp(),
    action: "login",
    actor_uid: role,
    actor_email: emailOf(role),
    actor_name: nameOf(role),
    actor_role: role,
  });

  test("cada uno registra sus propios accesos con la hora del servidor", async () => {
    const viewer = db(staff(env, "viewer"));
    await assertSucceeds(
      addDoc(collection(viewer, "access_logs"), entry("viewer")),
    );
    await assertFails(
      addDoc(collection(viewer, "access_logs"), {
        ...entry("viewer"),
        at: "2020-01-01T00:00:00Z",
      }),
    );
    await assertFails(
      addDoc(collection(viewer, "access_logs"), {
        ...entry("viewer"),
        actor_role: "super_admin",
      }),
    );
  });

  test("no se puede registrar a nombre de otro ni un documento vacío", async () => {
    const viewer = db(staff(env, "viewer"));
    await assertFails(
      addDoc(collection(viewer, "access_logs"), entry("monitoring_operator")),
    );
    await assertFails(addDoc(collection(viewer, "access_logs"), {}));
    await assertFails(addDoc(collection(viewer, "activity_logs"), {}));
    await assertFails(
      addDoc(collection(viewer, "activity_logs"), {
        event_type: "incident_created",
        title: "x",
        description: "",
        entity_type: "incident",
        actor: emailOf("super_admin"),
        actor_uid: "viewer",
        timestamp: serverTimestamp(),
      }),
    );
  });

  test("la bitácora no se modifica ni se borra", async () => {
    const admin = db(staff(env, "super_admin"));
    await assertFails(
      updateDoc(doc(admin, "access_logs", "log-1"), { action: "x" }),
    );
    await assertFails(deleteDoc(doc(admin, "access_logs", "log-1")));
  });
});

describe("perfiles", () => {
  test("nadie se sube el rol a sí mismo", async () => {
    const viewer = db(staff(env, "viewer"));
    await assertFails(
      updateDoc(doc(viewer, "profiles", "viewer"), { role: "super_admin" }),
    );
    await assertSucceeds(getDoc(doc(viewer, "profiles", "viewer")));
  });

  test("una cuenta anónima no es personal", async () => {
    const phone = db(device(env, "phone-a"));
    await assertFails(getDocs(collection(phone, "cameras")));
    await assertFails(getDoc(doc(phone, "incidents", "inc-1")));
  });
});
