"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Smartphone, Shield, Clock, Menu, Radio } from "lucide-react";
import { btnPrimary } from "@/components/ui";
import { ConnectMobileModal } from "./connect-mobile-modal";

interface TopbarProps {
  onOpenCommandMenu: () => void;
  onOpenMenu: () => void;
}

const ICON_BTN =
  "focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/[0.05] hover:text-foreground";

/**
 * Barra superior fija. En celular y tablet lleva el botón del menú, el logo y la
 * lupa; desde lg, el buscador ancho (la navegación está en la barra flotante).
 */
export function Topbar({ onOpenCommandMenu, onOpenMenu }: TopbarProps) {
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () =>
      setTime(
        new Date().toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 w-full items-center gap-2 border-b border-[var(--line)] bg-background/90 px-3 backdrop-blur sm:gap-3 sm:px-4 lg:h-16 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir menú"
          className={`${ICON_BTN} lg:hidden`}
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>
        <Link
          href="/"
          aria-label="Inicio"
          className="focus-ring flex min-w-0 items-center gap-2 rounded-full lg:hidden"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-background">
            <Radio className="h-3.5 w-3.5" />
          </span>
          <span className="adm-title truncate text-[14px] text-foreground">
            Se7en <span className="adm-serif">monitor</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={onOpenCommandMenu}
          className="focus-ring relative hidden w-full max-w-md items-center justify-between rounded-full border border-[var(--line)] bg-panel py-2 pr-3 pl-9 text-[13px] text-muted transition-colors hover:border-[var(--line-strong)] hover:text-foreground lg:flex"
        >
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <span className="truncate">
            Buscar escuelas, cámaras o incidentes…
          </span>
          <kbd className="inline-flex items-center rounded-full border border-[var(--line)] px-2 py-0.5 font-mono text-[10px] text-muted">
            Ctrl K
          </kbd>
        </button>

        <div className="adm-label hidden items-center gap-2 xl:flex">
          <Shield className="h-3.5 w-3.5 text-accent" />
          <span>Centro de Monitoreo Urbano · Catriel</span>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onOpenCommandMenu}
            aria-label="Buscar escuelas, cámaras o incidentes"
            className={`${ICON_BTN} lg:hidden`}
          >
            <Search className="h-[18px] w-[18px]" />
          </button>
          <div
            className="hidden items-center gap-1.5 rounded-full border border-[var(--line)] bg-panel px-3 py-1.5 font-mono text-xs text-muted md:flex"
            aria-label="Hora actual"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>{time || "--:--:--"}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsConnectOpen(true)}
            aria-label="Conectar celular como cámara"
            className={`${btnPrimary} h-9 px-2.5 sm:px-3.5`}
          >
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Conectar celular</span>
          </button>
        </div>
      </header>

      <ConnectMobileModal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
      />
    </>
  );
}
