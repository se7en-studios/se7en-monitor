import localFont from "next/font/local";

// Las mismas tipografías del panel de Se7en Studio, servidas desde el repo.
// Archivo (cuerpo), Archivo con eje de ancho (titulares y cifras), Chivo Mono
// (etiquetas) e Instrument Serif itálica (el acento).
export const archivo = localFont({
  src: "./fonts/archivo-latin.woff2",
  weight: "100 900",
  variable: "--font-archivo",
});

export const chivoMono = localFont({
  src: "./fonts/chivo-mono-latin.woff2",
  weight: "100 900",
  variable: "--font-chivo-mono",
});

export const wide = localFont({
  src: "./fonts/archivo-wdth-latin.woff2",
  weight: "100 900",
  variable: "--font-wide",
});

export const serif = localFont({
  src: "./fonts/instrument-serif-latin-italic-400.woff2",
  weight: "400",
  style: "italic",
  variable: "--font-serif",
});
