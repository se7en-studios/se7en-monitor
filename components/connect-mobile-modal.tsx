"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Smartphone,
  QrCode,
  Copy,
  Check,
  X,
  Shield,
  Wifi,
  Loader2,
} from "lucide-react";
import QRCode from "qrcode";
import { useAuth } from "@/lib/firebase/auth-context";
import { useCollection } from "@/lib/firebase/data";
import { logAccess } from "@/lib/firebase/audit";
import {
  createPairing,
  PAIRING_DAYS,
  usePairingsByCamera,
  type Pairing,
} from "@/lib/firebase/pairing";
import { can } from "@/lib/roles";
import { describeError, useToast } from "@/components/toast";
import type { Camera } from "@/types/monitor";

interface ConnectMobileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Solo para desarrollo: la IP de esta PC en la red, para abrir el enlace desde un celular.
const DEV_LAN_HOST = "192.168.18.12";

// Dirección https desde la que el celular abre la consola transmisora (sin barra final).
const CONFIGURED_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(
  /\/+$/,
  "",
);
const PUBLIC_BASE = CONFIGURED_URL.startsWith("https://") ? CONFIGURED_URL : "";

export function ConnectMobileModal({
  isOpen,
  onClose,
}: ConnectMobileModalProps) {
  const { profile, user } = useAuth();
  const toast = useToast();
  const { data: cameras } = useCollection<Camera>("cameras");
  const mobileCameras = useMemo(
    () => cameras.filter((c) => c.device_type === "mobile_webrtc"),
    [cameras],
  );

  const [pickedCameraId, setPickedCameraId] = useState("");
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [useNetworkIp, setUseNetworkIp] = useState(true);

  const camera =
    mobileCameras.find((c) => c.id === pickedCameraId) ?? mobileCameras[0];
  const canPair = can.editInfrastructure(profile?.role);
  const existing = usePairingsByCamera(canPair && isOpen);

  const mobileUrl = useMemo(() => {
    if (!pairing || typeof window === "undefined") return "";
    const { hostname, port, origin } = window.location;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    // Si hay una dirección pública https configurada, el celular entra por ahí aunque el
    // centro de monitoreo se use en localhost: así el navegador le permite la cámara.
    const base = PUBLIC_BASE
      ? PUBLIC_BASE
      : isLocalhost && useNetworkIp
        ? `http://${DEV_LAN_HOST}${port ? `:${port}` : ""}`
        : origin;
    return `${base}/camera/publish/${pairing.token}`;
  }, [pairing, useNetworkIp]);

  // Al cerrar el diálogo se descarta el enlace de pantalla: no queda a la vista de nadie.
  useEffect(() => {
    if (!isOpen) {
      setPairing(null);
      setError(null);
      setQrDataUrl("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!mobileUrl) {
      setQrDataUrl("");
      return;
    }
    let isMounted = true;
    QRCode.toDataURL(mobileUrl, {
      width: 260,
      margin: 1,
      color: { dark: "#ffffff", light: "#00000000" },
    })
      .then((url) => isMounted && setQrDataUrl(url))
      .catch((err) => console.error("Error generando QR:", err));
    return () => {
      isMounted = false;
    };
  }, [mobileUrl]);

  if (!isOpen) return null;

  async function handleGenerate() {
    if (!camera || !user || !profile) return;
    setBusy(true);
    setError(null);
    try {
      setPairing(await createPairing(camera, user.uid));
      toast.success(`Enlace generado para ${camera.identifier}`);
      void logAccess(
        {
          action: "vincular_celular",
          camera_id: camera.id,
          camera_name: camera.name,
          school_name: camera.school_name,
        },
        { name: profile.full_name, role: profile.role },
      );
    } catch (err) {
      console.error("[pairing]", err);
      setError(describeError(err, "No se pudo generar el enlace."));
    } finally {
      setBusy(false);
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mobileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // El portapapeles solo existe en https o localhost: el campo es seleccionable.
      setError(
        "Este navegador no permite copiar desde esta dirección. Seleccioná el enlace y copialo a mano.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--line-strong)] bg-panel p-6">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted transition-colors hover:bg-white/[0.08] hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-accent/30 bg-accent/20 text-accent">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h3 className="adm-title text-[13px] text-foreground">
              Vincular celular como cámara
            </h3>
            <p className="text-xs text-muted">
              Genera un enlace único para que un teléfono transmita en vivo al
              centro de monitoreo
            </p>
          </div>
        </div>

        {!canPair ? (
          <p className="mt-5 rounded-lg border border-[var(--line)] p-4 text-xs text-muted">
            Solo la administración puede vincular celulares.
          </p>
        ) : mobileCameras.length === 0 ? (
          <p className="mt-5 rounded-lg border border-[var(--line)] p-4 text-xs text-muted">
            Todavía no hay cámaras de tipo celular. Dalas de alta en Cámaras →
            Instalar punto de monitoreo, eligiendo «Celular (WebRTC)». Así queda
            ubicada dentro del corredor escolar.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            <label className="block space-y-1">
              <span className="adm-label">Cámara a vincular</span>
              <select
                value={camera?.id ?? ""}
                onChange={(e) => {
                  setPickedCameraId(e.target.value);
                  setPairing(null);
                }}
                className="focus-ring w-full rounded-lg border border-[var(--line-strong)] bg-[var(--well)] px-3 py-2 text-[13px] text-foreground"
              >
                {mobileCameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.identifier} · {c.name} ({c.school_name})
                  </option>
                ))}
              </select>
            </label>

            {!pairing ? (
              <>
                <button
                  onClick={handleGenerate}
                  disabled={busy}
                  className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-[13px] font-semibold text-background transition-colors hover:bg-foreground disabled:opacity-60"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Generar enlace seguro
                </button>
                {camera && existing.has(camera.id) && (
                  <p className="text-[11px] text-amber-300">
                    Esta cámara ya tenía un enlace: al generar uno nuevo, el
                    anterior deja de funcionar.
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="flex flex-col items-center rounded-xl border border-[var(--line)] bg-[var(--well)] p-5 text-center">
                  <div className="relative flex h-52 w-52 items-center justify-center rounded-xl border border-[var(--line)] bg-panel p-3">
                    {qrDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrDataUrl}
                        alt="Escanear QR con el celular"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <QrCode className="h-20 w-20 animate-pulse text-muted/60" />
                    )}
                  </div>
                  <p className="mt-4 max-w-xs text-xs leading-relaxed text-foreground/85">
                    Escaneá el código con el celular que va a transmitir. El
                    enlace vale {PAIRING_DAYS} días (hasta el{" "}
                    {pairing.expiresAt.toLocaleDateString("es-AR")}), funciona
                    para esta cámara y queda atado al primer celular que lo
                    abre: no lo abras en esta computadora.
                  </p>

                  {mobileUrl.startsWith("http://") && (
                    <p
                      role="alert"
                      className="mt-3 max-w-xs text-[12px] leading-relaxed text-amber-300"
                    >
                      Este enlace no es https: la mayoría de los celulares no
                      van a permitir la cámara. Configurá NEXT_PUBLIC_APP_URL
                      con la dirección https del sistema y generá el enlace de
                      nuevo.
                    </p>
                  )}

                  {!PUBLIC_BASE &&
                    typeof window !== "undefined" &&
                    ["localhost", "127.0.0.1"].includes(
                      window.location.hostname,
                    ) && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-1 text-[11px] text-muted">
                        <Wifi className="h-3.5 w-3.5 text-accent" />
                        <button
                          onClick={() => setUseNetworkIp(!useNetworkIp)}
                          className="font-mono text-accent hover:underline"
                        >
                          {useNetworkIp
                            ? `${DEV_LAN_HOST} (desde el celular)`
                            : "localhost (misma PC)"}
                        </button>
                      </div>
                    )}
                </div>

                <div>
                  <span className="adm-label">
                    Enlace directo (no lo compartas)
                  </span>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={mobileUrl}
                      className="flex-1 select-all rounded-lg border border-[var(--line)] bg-[var(--well)] px-3 py-2 font-mono text-xs text-foreground/85 focus:outline-none"
                    />
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/20 px-3 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/30"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copied ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {error && (
              <p role="alert" className="text-xs text-red-400">
                {error}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-[var(--line)] p-3 text-[11px] text-muted">
          <Shield className="h-4 w-4 shrink-0 text-emerald-300" />
          <div className="leading-relaxed">
            <span className="font-semibold text-emerald-300">
              Transmisión punto a punto.
            </span>{" "}
            El video va directo al centro de monitoreo y no se graba. El enlace
            es la credencial del celular: cada vinculación queda en la
            auditoría.
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3 border-t border-[var(--line)] pt-4">
          <button
            onClick={onClose}
            className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-medium text-foreground/85 hover:bg-white/[0.05]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
