import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toDate, type StoredDate } from "@/lib/time";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NO_DATE = "Sin fecha";

/** Fecha y hora cortas. Acepta ISO o Timestamp; si falta o es inválida, "Sin fecha". */
export function formatDate(value: StoredDate | null | undefined): string {
  const d = toDate(value);
  if (!d) return NO_DATE;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatTimeAgo(value: StoredDate | null | undefined): string {
  const d = toDate(value);
  if (!d) return NO_DATE;
  const diffInSeconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "hace unos segundos";
  if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400)
    return `hace ${Math.floor(diffInSeconds / 3600)} h`;
  return `hace ${Math.floor(diffInSeconds / 86400)} d`;
}
