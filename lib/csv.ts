// Una celda que empieza con estos caracteres la interpreta Excel/LibreOffice como fórmula.
const FORMULA_START = /^[=+\-@\t\r]/;

/** Celda CSV entre comillas y neutralizada contra inyección de fórmulas (antepone '). */
export function csvCell(value: string): string {
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export const csvRow = (cells: string[]): string => cells.map(csvCell).join(",");
