import { describe, expect, test } from "vitest";
import { cameraCoverage, distanceMeters } from "@/lib/geo";
import type { Camera, School } from "@/types/monitor";

const school = {
  lat: -37.8785,
  lng: -67.7955,
  perimeter_radius_meters: 200,
} as School;

const cameraAt = (lat?: number, lng?: number) => ({ lat, lng }) as Camera;

describe("distanceMeters", () => {
  test("es cero para el mismo punto", () => {
    expect(distanceMeters(school, school)).toBe(0);
  });

  test("un grado de latitud mide unos 111 km", () => {
    const d = distanceMeters({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(d).toBeGreaterThan(111_000);
    expect(d).toBeLessThan(111_400);
  });
});

describe("cameraCoverage", () => {
  test("cámara a ~110 m de la escuela queda dentro del radio de 200 m", () => {
    expect(cameraCoverage(cameraAt(-37.8775, -67.7955), school)).toBe("dentro");
  });

  test("cámara a ~330 m queda fuera", () => {
    expect(cameraCoverage(cameraAt(-37.8755, -67.7955), school)).toBe("fuera");
  });

  test("sin coordenadas o sin escuela no se puede verificar", () => {
    expect(cameraCoverage(cameraAt(), school)).toBe("sin_ubicacion");
    expect(cameraCoverage(cameraAt(-37.8, -67.7), undefined)).toBe(
      "sin_ubicacion",
    );
  });
});
