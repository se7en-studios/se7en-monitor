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

/** Carga los datos demo de Catriel solo en colecciones vacías. Devuelve las que cargó. */
export async function seedDemoData(): Promise<string[]> {
  const seeded: string[] = [];
  for (const [name, docs] of COLLECTIONS) {
    const existing = await getDocs(query(collection(db, name), limit(1)));
    if (!existing.empty) continue;
    const batch = writeBatch(db);
    for (const d of docs) batch.set(doc(db, name, d.id), d);
    await batch.commit();
    seeded.push(name);
  }
  return seeded;
}
