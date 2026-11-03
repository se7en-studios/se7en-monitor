import { describe, expect, test } from "vitest";
import { toDate, toMillis } from "@/lib/time";
import { byNewest } from "@/lib/firebase/data";
import { csvCell } from "@/lib/csv";

describe("toDate", () => {
  test("acepta texto ISO, Date y Timestamp", () => {
    const iso = "2026-03-01T08:00:00.000Z";
    const ms = Date.parse(iso);
    expect(toDate(iso)?.getTime()).toBe(ms);
    expect(toDate(new Date(ms))?.getTime()).toBe(ms);
    expect(toDate({ toDate: () => new Date(ms) })?.getTime()).toBe(ms);
  });

  test("devuelve null si falta o es inválida", () => {
    expect(toDate(undefined)).toBeNull();
    expect(toDate(null)).toBeNull();
    expect(toDate("no es fecha")).toBeNull();
    expect(toDate({})).toBeNull();
    expect(toMillis(undefined)).toBe(0);
  });
});

describe("byNewest", () => {
  test("ordena mezclando ISO y Timestamp, y deja al final lo que no tiene fecha", () => {
    const rows = [
      { id: "viejo", at: "2026-01-01T00:00:00Z" },
      { id: "sin-fecha" },
      { id: "nuevo", at: { toDate: () => new Date("2026-06-01T00:00:00Z") } },
    ];
    const sorted = [...rows].sort(byNewest("at")).map((r) => r.id);
    expect(sorted).toEqual(["nuevo", "viejo", "sin-fecha"]);
  });
});

describe("csvCell", () => {
  test("neutraliza celdas que Excel tomaría como fórmula", () => {
    for (const start of ["=", "+", "-", "@", "\t", "\r"])
      expect(csvCell(`${start}HYPERLINK("x")`).startsWith(`"'${start}`)).toBe(
        true,
      );
  });

  test("escapa comillas y deja el texto normal igual", () => {
    expect(csvCell('Ana "la jefa"')).toBe('"Ana ""la jefa"""');
    expect(csvCell("ESC-204")).toBe('"ESC-204"');
  });
});
