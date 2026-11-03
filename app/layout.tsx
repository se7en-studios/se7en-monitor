import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/lib/firebase/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title:
    "SE7EN MONITOR — Sistema de Monitoreo para Establecimientos Educativos",
  description:
    "Plataforma inteligente de videovigilancia y corredores escolares cuidados para municipios e instituciones educativas.",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#080b11",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased selection:bg-blue-600/30 selection:text-blue-200">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
