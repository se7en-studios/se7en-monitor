"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Smartphone,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  X,
  Shield,
  Radio,
  Wifi,
} from "lucide-react";
import QRCode from "qrcode";

interface ConnectMobileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectMobileModal({ isOpen, onClose }: ConnectMobileModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [useNetworkIp, setUseNetworkIp] = useState(true);

  // Token estable para emparejar con la cámara fija del dashboard
  const token = "demo-mobile-token-se7en";

  // Determinar la URL para el celular
  const mobileUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return `http://localhost:3000/camera/publish/${token}`;
    }

    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    
    // Si estamos en localhost y el usuario prefiere IP de red para escanear con el celular
    if (isLocalhost && useNetworkIp) {
      return `http://192.168.18.12:3000/camera/publish/${token}`;
    }

    return `${window.location.origin}/camera/publish/${token}`;
  }, [useNetworkIp]);

  // Generar QR de forma controlada y sin bucles infinitos
  useEffect(() => {
    if (!isOpen) {
      setQrDataUrl("");
      return;
    }

    let isMounted = true;

    QRCode.toDataURL(mobileUrl, {
      width: 260,
      margin: 1,
      color: {
        dark: "#ffffff",
        light: "#00000000",
      },
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
        }
      })
      .catch((err) => console.error("Error generando QR:", err));

    return () => {
      isMounted = false;
    };
  }, [isOpen, mobileUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(mobileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--line-strong)] bg-panel p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted hover:bg-white/[0.08] hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/20 border border-accent/30 text-accent">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h3 className="adm-title text-[13px] text-foreground">Conectar Dispositivo Móvil</h3>
            <p className="text-xs text-muted">
              Transmití video en vivo mediante WebRTC desde tu teléfono celular al dashboard
            </p>
          </div>
        </div>

        {/* QR & Instructions */}
        <div className="mt-5 flex flex-col items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--well)] p-5 text-center">
          <div className="relative flex h-52 w-52 items-center justify-center rounded-xl border border-[var(--line)] bg-panel p-3">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="Escanear QR con celular" className="h-full w-full object-contain" />
            ) : (
              <QrCode className="h-20 w-20 text-muted/60 animate-pulse" />
            )}
            <div className="absolute -bottom-2.5 rounded-full bg-accent px-3 py-0.5 text-[10px] font-mono font-semibold text-background uppercase tracking-wider shadow">
              Escanear con la cámara
            </div>
          </div>

          <p className="mt-4 text-xs text-foreground/85 max-w-xs leading-relaxed">
            Abrí la cámara de tu teléfono móvil conectado al Wi-Fi para ingresar al transmisor.
          </p>

          {/* Wi-Fi IP Toggle for local development */}
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/[0.03] border border-[var(--line)] px-3 py-1 text-[11px] text-muted">
            <Wifi className="h-3.5 w-3.5 text-accent" />
            <span>Red Wi-Fi:</span>
            <button
              onClick={() => setUseNetworkIp(!useNetworkIp)}
              className="font-mono text-accent hover:underline"
            >
              {useNetworkIp ? "192.168.18.12:3000 (Móvil)" : "localhost:3000 (Misma PC)"}
            </button>
          </div>
        </div>

        {/* Direct Link Section */}
        <div className="mt-4">
          <label className="text-[11px] font-mono uppercase tracking-wider text-muted">
            Enlace directo de publicación
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={mobileUrl}
              className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--well)] px-3 py-2 font-mono text-xs text-foreground/85 focus:outline-none select-all"
            />
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/20 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/30 transition-colors"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
            <a
              href={mobileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-white/[0.04] p-2 text-foreground/85 hover:bg-white/[0.08] hover:text-foreground transition-colors"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Security & Protocol notice */}
        <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] text-muted flex items-start gap-2.5">
          <Shield className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-emerald-300">Conexión Segura WebRTC P2P:</span>{" "}
            El video se transmite punto a punto directamente al centro de monitoreo sin almacenar grabaciones de los alumnos.
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex justify-end gap-3 border-t border-[var(--line)] pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--line)] px-4 py-2 text-xs font-medium text-foreground/85 hover:bg-white/[0.05] transition-colors"
          >
            Cerrar
          </button>
          <a
            href={mobileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-background hover:bg-[var(--accent-hover)] transition-colors"
          >
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            Abrir Consola Transmisora
          </a>
        </div>
      </div>
    </div>
  );
}
