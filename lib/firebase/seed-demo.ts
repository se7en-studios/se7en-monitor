import { collection, doc, getDocs, limit, query, writeBatch } from "firebase/firestore";
import { db } from "./config";
import * as demo from "@/data/demo-data";

const COLLECTIONS: [string, { id: string }[]][] = [
  ["schools", demo.MOCK_SCHOOLS],
  ["cameras", demo.MOCK_CAMERAS],
  ["incidents", demo.MOCK_INCIDENTS],
  ["alerts", demo.MOCK_ALERTS],
  ["maintenance_tickets", demo.MOCK_TICKETS],
  ["activity_logs", demo.MOCK_ACTIVITY],
];

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
  for (const [name, docs] of COLLECTIONS) {
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
