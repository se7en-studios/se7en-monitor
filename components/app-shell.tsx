"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sidebar, NavDrawer } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { CommandMenu } from "@/components/command-menu";
import { LoginScreen } from "@/components/login-screen";
import { btnSecondary } from "@/components/ui";
import { useAuth } from "@/lib/firebase/auth-context";
import { cn } from "@/lib/utils";

const RAIL_KEY = "se7en-monitor-rail";

const FullScreen = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-4 text-center text-foreground/85">
    {children}
  </div>
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, profile, loading, signOut } = useAuth();
  const isMobilePublisher = pathname.startsWith("/camera/publish");

  // Al navegar se cierra el cajón (también si se navega desde la paleta o el teclado).
  const [shownPath, setShownPath] = useState(pathname);
  if (shownPath !== pathname) {
    setShownPath(pathname);
    setDrawerOpen(false);
  }

  // La barra recuerda si estaba abierta o angosta (solo una comodidad: sin storage queda abierta).
  useEffect(() => {
    try {
      if (localStorage.getItem(RAIL_KEY) === "closed") setRailOpen(false);
    } catch {}
  }, []);

  // Ctrl/⌘ K abre y cierra la paleta. Escape cierra el cajón.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen((v) => !v);
      } else if (e.key === "Escape") {
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Con el cajón abierto, la página de atrás no scrollea.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

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
      <main className="min-h-dvh bg-[var(--well)] text-foreground">
        {children}
      </main>
    );
  }

  if (loading) {
    return (
      <FullScreen>
        <Loader2
          className="h-6 w-6 animate-spin text-accent"
          aria-label="Cargando"
        />
      </FullScreen>
    );
  }

  if (!user) return <LoginScreen />;

  if (!profile || !profile.active) {
    return (
      <FullScreen>
        <p className="adm-title text-[15px] text-foreground">
          Tu cuenta no tiene acceso habilitado.
        </p>
        <p className="text-[13px] text-muted">
          Pedile a un Super Admin que la active.
        </p>
        <button type="button" onClick={signOut} className={btnSecondary}>
          Cerrar sesión
        </button>
      </FullScreen>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Sidebar open={railOpen} onToggle={toggleRail} />
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div
        className={cn(
          "flex min-h-dvh min-w-0 flex-col transition-[padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          railOpen ? "lg:pl-[256px]" : "lg:pl-[88px]",
        )}
      >
        <Topbar
          onOpenCommandMenu={() => setIsCommandOpen(true)}
          onOpenMenu={() => setDrawerOpen(true)}
        />
        <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
      <CommandMenu
        open={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />
    </div>
  );
}
