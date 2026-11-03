// Carga inicial de Firestore + creación del primer Super Admin (bypassa las reglas con firebase-admin).
//
// Requisitos:
//   1. Firebase Console → Configuración del proyecto → Cuentas de servicio → "Generar nueva clave privada".
//   2. Guardá el JSON FUERA del repo y exportá la ruta:
//        PowerShell: $env:GOOGLE_APPLICATION_CREDENTIALS="C:\ruta\clave.json"
//   3. Firebase Console → Authentication → habilitar "Correo electrónico/contraseña".
//
// Uso:
//   SUPERADMIN_EMAIL=franco@... SUPERADMIN_PASSWORD=... SUPERADMIN_NAME="Franco" npm run seed:firebase
//   (idempotente: si el usuario ya existe, solo actualiza su perfil; los datos demo no pisan lo existente
//    salvo con SEED_FORCE=1)

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import * as seed from "../data/demo-data.ts";

const { SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, SUPERADMIN_NAME, SEED_FORCE } = process.env;

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("❌ Falta GOOGLE_APPLICATION_CREDENTIALS (ruta al JSON de la cuenta de servicio).");
  process.exit(1);
}
if (!SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) {
  console.error("❌ Definí SUPERADMIN_EMAIL y SUPERADMIN_PASSWORD.");
  process.exit(1);
}

initializeApp({
  credential: applicationDefault(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "monitoreo-camaras-977a6",
});
const auth = getAuth();
const db = getFirestore();

async function ensureSuperAdmin() {
  let user;
  try {
    user = await auth.getUserByEmail(SUPERADMIN_EMAIL);
  } catch (err) {
    if (err.code !== "auth/user-not-found") throw err;
    user = await auth.createUser({
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD,
      displayName: SUPERADMIN_NAME,
    });
  }
  await db.doc(`profiles/${user.uid}`).set(
    {
      email: SUPERADMIN_EMAIL.toLowerCase(),
      full_name: SUPERADMIN_NAME || SUPERADMIN_EMAIL,
      role: "super_admin",
      active: true,
      created_at: new Date().toISOString(),
    },
    { merge: true }
  );
  console.log(`✅ Super Admin listo: ${SUPERADMIN_EMAIL}`);
}

async function seedCollection(name, docs) {
  const existing = await db.collection(name).limit(1).get();
  if (!existing.empty && !SEED_FORCE) {
    console.log(`⏭️  ${name}: ya tiene datos (SEED_FORCE=1 para sobrescribir)`);
    return;
  }
  const batch = db.batch();
  for (const d of docs) batch.set(db.doc(`${name}/${d.id}`), d);
  await batch.commit();
  console.log(`✅ ${name}: ${docs.length} documentos`);
}

await ensureSuperAdmin();
await seedCollection("schools", seed.MOCK_SCHOOLS);
await seedCollection("cameras", seed.MOCK_CAMERAS);
await seedCollection("incidents", seed.MOCK_INCIDENTS);
await seedCollection("alerts", seed.MOCK_ALERTS);
await seedCollection("maintenance_tickets", seed.MOCK_TICKETS);
await seedCollection("activity_logs", seed.MOCK_ACTIVITY);
console.log("🎉 Listo.");
