import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/lib/firebase/auth-context";
import { ToastProvider } from "@/components/toast";
import { archivo, chivoMono, serif, wide } from "@/lib/fonts";
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
  themeColor: "#0b0b0c",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`dark ${archivo.variable} ${chivoMono.variable} ${wide.variable} ${serif.variable}`}
    >
      <body className="antialiased">
        <AuthProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
