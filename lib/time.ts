/**
 * Fecha tal como puede venir de Firestore: texto ISO (datos viejos), Timestamp
 * (lo nuevo, escrito con serverTimestamp()) o directamente un Date.
 */
export type StoredDate = string | Date | { toDate: () => Date };

const hasToDate = (v: unknown): v is { toDate: () => Date } =>
  typeof v === "object" &&
  v !== null &&
  typeof (v as { toDate?: unknown }).toDate === "function";

/** Convierte cualquier fecha guardada a Date. Devuelve null si falta o es inválida. */
export function toDate(value: unknown): Date | null {
  const d =
    value instanceof Date
      ? value
      : hasToDate(value)
        ? value.toDate()
        : typeof value === "string" || typeof value === "number"
          ? new Date(value)
          : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

/** Milisegundos para ordenar. Lo que no tiene fecha va al final (0). */
export const toMillis = (value: unknown): number =>
  toDate(value)?.getTime() ?? 0;
