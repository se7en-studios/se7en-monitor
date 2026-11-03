"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { CommandMenu } from "@/components/command-menu";
import { LoginScreen } from "@/components/login-screen";
import { useAuth } from "@/lib/firebase/auth-context";

const RAIL_KEY = "se7en-monitor-rail";

const FullScreen = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center text-foreground/85">
    {children}
  </div>
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(true);
  const { user, profile, loading, signOut } = useAuth();
  const isMobilePublisher = pathname.startsWith("/camera/publish");

  // La barra recuerda si estaba abierta o angosta (solo una comodidad: sin storage queda abierta).
  useEffect(() => {
    try {
      if (localStorage.getItem(RAIL_KEY) === "closed") setRailOpen(false);
    } catch {}
  }, []);

  const toggleRail = () =>
    setRailOpen((open) => {
      try {
        localStorage.setItem(RAIL_KEY, open ? "closed" : "open");
      } catch {}
      return !open;
    });

  // El celular emisor entra por token, sin login.
  if (isMobilePublisher) {
    return (
      <main className="min-h-screen bg-[var(--well)] text-foreground">{children}</main>
    );
  }

  if (loading) {
    return (
      <FullScreen>
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </FullScreen>
    );
  }

  if (!user) return <LoginScreen />;

  if (!profile || !profile.active) {
    return (
      <FullScreen>
        <p className="text-sm font-semibold text-foreground">
          Tu cuenta no tiene acceso habilitado.
        </p>
        <p className="text-xs text-muted">
          Pedile a un Super Admin que la active.
        </p>
        <button
          onClick={signOut}
          className="rounded-lg border border-[var(--line)] px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-white/[0.04]"
        >
          Cerrar sesión
        </button>
      </FullScreen>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar open={railOpen} onToggle={toggleRail} />
      <div
        className={`flex flex-1 flex-col transition-[padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          railOpen ? "pl-[256px]" : "pl-[88px]"
        }`}
      >
        <Topbar onOpenCommandMenu={() => setIsCommandOpen(true)} />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
      <CommandMenu />
    </div>
  );
}
