"use client";

import { useState, useEffect } from "react";
import {
  Smartphone,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  X,
  Shield,
  Video,
  Radio,
} from "lucide-react";
import QRCode from "qrcode";

interface ConnectMobileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectMobileModal({ isOpen, onClose }: ConnectMobileModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  
  // Generating a unique demo token
  const token = "mob-se7en-" + Math.random().toString(36).substring(2, 8);
  const mobileUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/camera/publish/${token}`
    : `http://localhost:3000/camera/publish/${token}`;

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(mobileUrl, {
        width: 240,
        margin: 1,
        color: {
          dark: "#ffffff",
          light: "#00000000",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error(err));
    }
  }, [isOpen, mobileUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(mobileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.12] bg-[#0c101a] p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.08] hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Conectar Dispositivo Móvil</h3>
            <p className="text-xs text-slate-400">
              Transmití video en vivo mediante WebRTC desde tu teléfono celular al dashboard
            </p>
          </div>
        </div>

        {/* QR & Instructions */}
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-[#070a12] p-6 text-center">
          <div className="relative flex h-52 w-52 items-center justify-center rounded-xl border border-white/[0.1] bg-[#0e1424] p-3 shadow-inner">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="Escanear QR con celular" className="h-full w-full object-contain" />
            ) : (
              <QrCode className="h-20 w-20 text-slate-600 animate-pulse" />
            )}
            <div className="absolute -bottom-2.5 rounded-full bg-blue-600 px-3 py-0.5 text-[10px] font-mono font-semibold text-white uppercase tracking-wider">
              Escanear con la cámara
            </div>
          </div>

          <p className="mt-5 text-xs text-slate-300 max-w-xs">
            Abrí la cámara de tu teléfono móvil o lector de QR para acceder a la consola de transmisión.
          </p>
        </div>

        {/* Direct Link Section */}
        <div className="mt-4">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            O enlace directo de publicación
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={mobileUrl}
              className="flex-1 rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 font-mono text-xs text-slate-300 focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-600/20 px-3 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-600/30"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
            <a
              href={mobileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] p-2 text-slate-300 hover:bg-white/[0.08] hover:text-white"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Security & Protocol notice */}
        <div className="mt-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] text-slate-400 flex items-start gap-2.5">
          <Shield className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-emerald-300">Conexión Segura WebRTC P2P:</span>{" "}
            El video se transmite punto a punto directamente al centro de monitoreo sin almacenar grabaciones de los alumnos ni exponer datos a servidores externos.
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3 border-t border-white/[0.06] pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.05]"
          >
            Cerrar
          </button>
          <a
            href={mobileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20"
          >
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            Abrir Consola Transmisora
          </a>
        </div>
      </div>
    </div>
  );
}
