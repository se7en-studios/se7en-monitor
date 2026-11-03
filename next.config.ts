import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Qué puede cargar y a dónde puede conectarse la página. Firebase habla con estos hosts;
// el mapa carga sus mosaicos de OpenStreetMap; el video del celular llega por WebRTC (no pasa por acá).
// 'unsafe-inline' en scripts lo exige Next para su hidratación; 'unsafe-eval' solo en desarrollo.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://tile.openstreetmap.org",
  "font-src 'self' data:",
  `connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com${isDev ? " ws://localhost:* ws://127.0.0.1:*" : ""}`,
  "media-src 'self' blob:",
  "frame-src 'self' https://*.firebaseapp.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Solo el origen (sin ruta ni token) hacia otros sitios. OpenStreetMap exige que llegue un Referer.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // La cámara solo para este origen (la consola transmisora del celular); nada más.
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), display-capture=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // La consola transmisora lleva el token en la ruta: que no se indexe ni se filtre.
      {
        source: "/camera/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
