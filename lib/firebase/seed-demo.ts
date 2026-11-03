import { collection, doc, getDocs, limit, query, writeBatch } from "firebase/firestore";
import { auth, db } from "./config";
import * as demo from "@/data/demo-data";

// La bitácora (activity_logs) no se siembra: solo admite eventos reales con identidad y
// hora del servidor (ver firestore.rules). Incidentes y órdenes llevan quién los cargó.
function demoCollections(uid: string): [string, { id: string }[]][] {
  const withReporter = <T extends { id: string }>(docs: T[]) =>
    docs.map((d) => ({ ...d, reported_by: uid }));
  return [
    ["schools", demo.MOCK_SCHOOLS],
    ["cameras", demo.MOCK_CAMERAS],
    ["incidents", withReporter(demo.MOCK_INCIDENTS)],
    ["alerts", demo.MOCK_ALERTS],
    ["maintenance_tickets", withReporter(demo.MOCK_TICKETS)],
  ];
}

// Campos que se agregaron después: se completan en documentos demo viejos que no los tienen.
const BACKFILL: Record<string, string[]> = {
  schools: ["management"],
  cameras: ["lat", "lng"],
};

/**
 * Carga los datos demo de Catriel en colecciones vacías y completa los campos
 * nuevos de los documentos demo ya cargados. Devuelve qué hizo, en texto.
 */
export async function seedDemoData(): Promise<string[]> {
  const done: string[] = [];
  for (const [name, docs] of demoCollections(auth.currentUser?.uid ?? "")) {
    const snap = await getDocs(query(collection(db, name), limit(500)));
    const batch = writeBatch(db);
    let writes = 0;

    if (snap.empty) {
      for (const d of docs) batch.set(doc(db, name, d.id), d);
      writes = docs.length;
      if (writes) done.push(`${name}: cargado`);
    } else {
      const fields = BACKFILL[name] ?? [];
      const existing = new Map(snap.docs.map((d) => [d.id, d.data()]));
      for (const d of docs as Record<string, unknown>[]) {
        const current = existing.get(d.id as string);
        if (!current) continue;
        const patch: Record<string, unknown> = {};
        for (const f of fields) if (current[f] === undefined && d[f] !== undefined) patch[f] = d[f];
        if (Object.keys(patch).length) {
          batch.update(doc(db, name, d.id as string), patch);
          writes++;
        }
      }
      if (writes) done.push(`${name}: completados ${writes}`);
    }
    if (writes) await batch.commit();
  }
  return done;
}
