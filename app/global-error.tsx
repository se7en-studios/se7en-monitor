"use client";

import { useEffect } from "react";
import "./globals.css";

/** Último recurso: falla el layout raíz. Reemplaza todo el documento, por eso trae html y body. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[aplicación]", error);
  }, [error]);

  return (
    <html lang="es" className="dark">
      <body className="flex min-h-dvh items-center justify-center bg-[var(--background)] p-4 text-[var(--foreground)] antialiased">
        <div
          role="alert"
          className="flex max-w-md flex-col items-center gap-3 rounded-2xl border border-[var(--line-strong)] bg-[var(--panel)] p-6 text-center"
        >
          <h1 className="text-[15px] font-semibold">
            El sistema tuvo un problema inesperado
          </h1>
          <p className="text-[13px] leading-relaxed text-[var(--muted)]">
            Recargá la página. Si se repite, avisale a la administración.
          </p>
          {error.digest && (
            <p className="font-mono text-[11px] text-[var(--muted)]">
              Código: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-[13px] font-semibold text-[var(--background)]"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
