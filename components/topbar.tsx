"use client";

import { useState, useEffect } from "react";
import { Search, Smartphone, Shield, Clock } from "lucide-react";
import { ConnectMobileModal } from "./connect-mobile-modal";

interface TopbarProps {
  onOpenCommandMenu?: () => void;
}

export function Topbar({ onOpenCommandMenu }: TopbarProps) {
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
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-4 border-b border-[var(--line)] bg-background/90 px-6 backdrop-blur">
        <button
          onClick={onOpenCommandMenu}
          className="focus-ring group relative flex w-full max-w-md items-center justify-between rounded-full border border-[var(--line)] bg-panel py-2 pl-9 pr-3 text-[13px] text-muted transition-colors hover:border-[var(--line-strong)] hover:text-foreground"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <span className="truncate">
            Buscar escuelas, cámaras o incidentes…
          </span>
          <kbd className="hidden items-center rounded-full border border-[var(--line)] px-2 py-0.5 font-mono text-[10px] text-muted sm:inline-flex">
            Ctrl K
          </kbd>
        </button>

        <div className="adm-label hidden items-center gap-2 lg:flex">
          <Shield className="h-3.5 w-3.5 text-accent" />
          <span>Centro de Monitoreo Urbano · Catriel</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 rounded-full border border-[var(--line)] bg-panel px-3 py-1.5 font-mono text-xs text-muted sm:flex">
            <Clock className="h-3.5 w-3.5" />
            <span>{time || "--:--:--"}</span>
          </div>

          <button
            onClick={() => setIsConnectOpen(true)}
            className="focus-ring inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-2 text-[13px] font-semibold text-background transition-colors hover:bg-foreground"
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
