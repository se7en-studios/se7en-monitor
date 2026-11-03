// 32 símbolos sin los que se confunden (0/O, 1/I): 256 es múltiplo de 32, así que no hay sesgo.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Código al azar con crypto.getRandomValues (5 bits por carácter). */
export function randomCode(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** Id de documento: prefijo legible + 20 caracteres al azar (100 bits). */
export const newId = (prefix: string): string =>
  `${prefix}-${randomCode(20).toLowerCase()}`;
