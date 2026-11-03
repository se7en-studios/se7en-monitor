"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { btnPrimary, btnSecondary } from "@/components/ui";

/**
 * Si una pantalla falla (por ejemplo, un dato corrupto en Firestore), se muestra esto
 * dentro del panel en vez de tirar toda la aplicación.
 */
export default function SectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[pantalla]", error);
  }, [error]);

  return (
    <div
      role="alert"
      className="mx-auto mt-10 flex max-w-md flex-col items-center gap-3 rounded-2xl border border-[var(--line-strong)] bg-[var(--panel)] p-6 text-center"
    >
      <AlertTriangle className="h-8 w-8 text-amber-400" />
      <h1 className="adm-title text-[15px] text-foreground">
        Esta pantalla no se pudo mostrar
      </h1>
      <p className="text-[13px] leading-relaxed text-muted">
        Puede haber un dato con un formato inesperado. El resto del sistema
        sigue funcionando. Si se repite, avisale a la administración.
      </p>
      {error.digest && (
        <p className="font-mono text-[11px] text-muted">
          Código: {error.digest}
        </p>
      )}
      <div className="flex gap-2">
        <button type="button" className={btnPrimary} onClick={reset}>
          <RefreshCw className="h-4 w-4" /> Reintentar
        </button>
        <Link href="/" className={btnSecondary}>
          Ir al tablero
        </Link>
      </div>
    </div>
  );
}
