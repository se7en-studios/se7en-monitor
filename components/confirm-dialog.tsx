"use client";

import { useEffect, type ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { btnDanger, btnPrimary, btnSecondary } from "@/components/ui";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  /** Acción destructiva (baja, deshabilitar): botón rojo. */
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmación propia (reemplaza al `confirm()` del navegador). Esc cancela. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/70 p-4"
      onClick={() => !busy && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-[var(--line-strong)] bg-[var(--panel)] p-5"
      >
        <div className="flex items-start gap-3">
          {danger && (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          )}
          <div className="min-w-0">
            <h2
              id="confirm-title"
              className="adm-title text-[15px] text-foreground"
            >
              {title}
            </h2>
            {children && (
              <div className="mt-2 text-[13px] leading-relaxed text-muted">
                {children}
              </div>
            )}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className={btnSecondary}
            onClick={onCancel}
            disabled={busy}
            autoFocus
          >
            Cancelar
          </button>
          <button
            type="button"
            className={danger ? btnDanger : btnPrimary}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
