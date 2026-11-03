import type { Camera, School } from "@/types/monitor";

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

interface Point {
  lat: number;
  lng: number;
}

/** Distancia en metros entre dos coordenadas (haversine). */
export function distanceMeters(a: Point, b: Point): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export type Coverage = "dentro" | "fuera" | "sin_ubicacion";

/** ¿La cámara está dentro del corredor escolar de su escuela? */
export function cameraCoverage(camera: Camera, school: School | undefined): Coverage {
  if (!school || camera.lat === undefined || camera.lng === undefined) return "sin_ubicacion";
  const d = distanceMeters(school, { lat: camera.lat, lng: camera.lng });
  return d <= school.perimeter_radius_meters ? "dentro" : "fuera";
}
