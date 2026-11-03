// Piezas visuales compartidas del panel, del sistema de Se7en. Reglas:
// - Texto: 11 (etiquetas) · 12 (meta) · 13 (cuerpo) · 15 (cuerpo destacado).
// - Radios: rounded-lg campos y tarjetas chicas · rounded-xl tarjetas · rounded-2xl diálogos
//   · botones, pestañas y filtros son pastillas (rounded-full).
// - Fondos: solo tokens (--panel, --well, --line…). Planos, sin sombras.
// - Títulos en Archivo ancha (adm-display / adm-title), cifras en adm-num, etiquetas en mono.
// - El acento es para la acción principal y lo nuevo. Lo elegido se invierte: papel sobre tinta.
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Botones: `btn` + una variante. */
export const btn =
  "focus-ring inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-40";
export const btnPrimary = `${btn} bg-accent text-background hover:bg-foreground`;
export const btnSecondary = `${btn} border border-[var(--line-strong)] text-foreground hover:border-foreground`;
export const btnGhost = `${btn} text-muted hover:bg-white/[0.05] hover:text-foreground`;
export const btnDanger = `${btn} bg-red-500/90 text-white hover:bg-red-500`;

export const input =
  "focus-ring w-full rounded-lg border border-[var(--line-strong)] bg-[var(--well)] px-3 py-2 text-[13px] text-foreground placeholder:text-muted/60 transition-[border-color,box-shadow] focus:border-accent/70 focus:shadow-[0_0_0_3px_var(--accent-soft)]";
export const label =
  "mb-1.5 block font-mono text-[10.5px] tracking-[0.13em] text-muted uppercase";
export const searchInput =
  "focus-ring w-full rounded-full border border-[var(--line)] bg-[var(--panel)] py-2 pr-3 pl-9 text-[13px] text-foreground placeholder:text-muted/70 transition-[border-color,box-shadow] focus:border-accent/60 focus:shadow-[0_0_0_3px_var(--accent-soft)]";

/** Elegir una opción entre pocas (vista, período, filtro). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label: aria,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly { id: T; label: ReactNode }[];
  label?: string;
}) {
  return (
    <div
      className="flex rounded-full border border-[var(--line)] bg-[var(--well-soft)] p-0.5 text-[13px]"
      role="group"
      aria-label={aria}
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={cn(
            "focus-ring flex items-center gap-1.5 rounded-full px-3 py-1.5 whitespace-nowrap transition-colors",
            value === o.id
              ? "bg-foreground font-medium text-background"
              : "text-muted hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Botón-pastilla que se prende (estado, prioridad, tipo). */
export function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "focus-ring inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-colors",
        on
          ? "border-foreground bg-foreground text-background"
          : "border-[var(--line-strong)] text-muted hover:border-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** Encabezado de página: etiqueta, título con palabra en serif, descripción y acciones. */
export function PageHeader({
  title,
  accent,
  eyebrow,
  children,
  right,
}: {
  title: ReactNode;
  /** Palabra final en serif con el color de acento. */
  accent?: ReactNode;
  eyebrow?: ReactNode;
  children?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="adm-in flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="adm-label mb-3">{eyebrow}</p>}
        <h1 className="adm-display text-[clamp(28px,4vw,48px)] text-balance text-foreground">
          {title}
          {accent && (
            <>
              {" "}
              <span className="adm-serif">{accent}</span>
            </>
          )}
        </h1>
        {children && (
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
            {children}
          </p>
        )}
      </div>
      {right && (
        <div className="flex flex-wrap items-center gap-2">{right}</div>
      )}
    </header>
  );
}

export function Card({
  title,
  action,
  children,
  className,
  icon,
  count,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  count?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "adm-in overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)]",
        className,
      )}
    >
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
          <h2 className="adm-title flex min-w-0 items-center gap-2 text-[13px] text-foreground">
            {icon && <span className="text-muted">{icon}</span>}
            <span className="truncate">{title}</span>
            {count !== undefined && count !== null && (
              <span className="rounded-full border border-[var(--line-strong)] px-2 py-px font-mono text-[10.5px] font-normal tracking-normal text-muted">
                {count}
              </span>
            )}
          </h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

/** Estado vacío: dice qué falta y, si se puede, qué hacer. */
export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--line-strong)] px-6 py-12 text-center">
      {icon && <span className="text-muted">{icon}</span>}
      <p className="adm-title text-[13px] text-foreground">{title}</p>
      {children && (
        <p className="max-w-sm text-[13px] leading-relaxed text-muted">
          {children}
        </p>
      )}
      {action}
    </div>
  );
}

/** Bloque gris que late mientras carga. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-lg bg-white/[0.05]", className)}
    />
  );
}

/** Tecla, para atajos y ayudas de teclado. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-5 items-center justify-center rounded-md border border-[var(--line-strong)] px-1.5 py-px font-mono text-[10.5px] text-muted">
      {children}
    </kbd>
  );
}
