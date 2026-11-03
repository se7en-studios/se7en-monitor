"use client";

import { useState, type FormEvent } from "react";
import { Radio, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import { btnPrimary, input, label } from "@/components/ui";

const AUTH_ERRORS: Record<string, string> = {
  "auth/invalid-credential": "Email o contraseña incorrectos.",
  "auth/user-disabled": "Esta cuenta fue deshabilitada.",
  "auth/too-many-requests":
    "Demasiados intentos. Probá de nuevo en unos minutos.",
  "auth/network-request-failed": "Sin conexión. Revisá tu red.",
};

function authMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  return AUTH_ERRORS[code] ?? "No se pudo iniciar sesión.";
}

const RING =
  "pointer-events-none absolute top-1/2 left-1/2 h-[min(150vw,980px)] w-[min(92vw,640px)] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border";

/** La puerta: anillos cruzados detrás del formulario, como en el ingreso del panel de Se7en. */
export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(authMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        aria-hidden
        className={`${RING} -rotate-[32deg] border-[var(--line-strong)]`}
      />
      <div aria-hidden className={`${RING} rotate-[24deg] border-accent/45`} />

      <div className="relative w-full max-w-sm">
        <div className="adm-in mb-8 text-center">
          <span className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-background">
            <Radio className="h-5 w-5" />
          </span>
          <h1 className="adm-display text-[clamp(32px,9vw,44px)] text-foreground">
            Se7en <span className="adm-serif">monitor</span>
          </h1>
          <p className="adm-label mt-3">Corredor Escolar Cuidado · Catriel</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="adm-in space-y-4 rounded-2xl border border-[var(--line)] bg-panel p-6 sm:p-7"
          aria-describedby={error ? "login-error" : undefined}
        >
          <label className="block">
            <span className={label}>Email</span>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={input}
            />
          </label>

          <label className="block">
            <span className={label}>Contraseña</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={input}
            />
          </label>

          {error && (
            <p
              id="login-error"
              role="alert"
              className="text-[13px] text-red-400"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className={`${btnPrimary} w-full py-2.5`}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <p className="adm-in mt-5 text-center text-[12px] text-muted">
          Acceso solo para operadores autorizados por el Municipio.
        </p>
      </div>
    </main>
  );
}
