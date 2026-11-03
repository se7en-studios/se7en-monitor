"use client";

import { useState } from "react";
import { Database, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import { seedDemoData } from "@/lib/firebase/seed-demo";
import { can } from "@/lib/roles";
import { describeError, useToast } from "@/components/toast";
import { Card, btnPrimary } from "@/components/ui";

export function SeedDemoCard() {
  const { profile } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  if (!can.manageUsers(profile?.role)) return null;

  async function onClick() {
    setBusy(true);
    try {
      const seeded = await seedDemoData();
      if (seeded.length) toast.success(`Listo: ${seeded.join(" · ")}.`);
      else toast.info("No había nada para cargar ni completar.");
    } catch (err) {
      toast.error(
        describeError(
          err,
          "No se pudo cargar. Revisá las reglas de Firestore.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Datos demo de Catriel" icon={<Database className="h-4 w-4" />}>
      <div className="space-y-3 p-4">
        <p className="text-[13px] text-muted">
          Carga escuelas, cámaras, incidentes, alertas y tickets de ejemplo.
          Completa colecciones vacías y los campos nuevos de los datos demo ya
          cargados.
        </p>
        <button
          type="button"
          onClick={onClick}
          disabled={busy}
          className={btnPrimary}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Cargar datos demo
        </button>
      </div>
    </Card>
  );
}
