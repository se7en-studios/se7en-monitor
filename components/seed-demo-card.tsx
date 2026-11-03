"use client";

import { useState } from "react";
import { Database, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import { seedDemoData } from "@/lib/firebase/seed-demo";
import { can } from "@/lib/roles";

export function SeedDemoCard() {
  const { profile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!can.manageUsers(profile?.role)) return null;

  async function onClick() {
    setBusy(true);
    setMessage(null);
    try {
      const seeded = await seedDemoData();
      setMessage(
        seeded.length
          ? `Cargado: ${seeded.join(", ")}.`
          : "Todas las colecciones ya tenían datos; no se tocó nada."
      );
    } catch (err) {
      console.error("[seed-demo]", err);
      setMessage("No se pudo cargar. Revisá la consola y las reglas de Firestore.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--line)] bg-panel p-5 space-y-3">
      <div className="flex items-center gap-2.5 text-foreground font-semibold text-sm">
        <Database className="h-4 w-4 text-accent" />
        <span>Datos demo de Catriel</span>
      </div>
      <p className="text-xs text-muted">
        Carga escuelas, cámaras, incidentes, alertas y tickets de ejemplo. Solo completa colecciones vacías.
      </p>
      <button
        onClick={onClick}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-2 text-xs font-semibold text-background hover:bg-[var(--accent-hover)] disabled:opacity-60"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Cargar datos demo
      </button>
      {message && <p className="text-xs text-foreground/85">{message}</p>}
    </div>
  );
}
