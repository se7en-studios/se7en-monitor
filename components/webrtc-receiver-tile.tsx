"use client";

import { useEffect, useRef, useState } from "react";
import { Expand, Loader2, RefreshCw, Smartphone, WifiOff } from "lucide-react";
import {
  describeSignalingError,
  startViewer,
  type PeerStatus,
} from "@/lib/firebase/webrtc";
import { btnSecondary } from "@/components/ui";

/** Estado visible del receptor: el de la conexión, o error / sin enlace. */
export type ReceiverStatus = PeerStatus | "error" | "unlinked";

interface WebRTCReceiverTileProps {
  /** Token de vinculación de la cámara. Vacío: el celular todavía no fue vinculado. */
  token: string;
  isMuted?: boolean;
  /** Avisa cada cambio de estado (para mostrar «EN VIVO» solo si llega video). */
  onStatusChange?: (status: ReceiverStatus) => void;
  /** Abre la vinculación (solo si el rol puede vincular). */
  onOpenPairModal?: () => void;
}

const MESSAGES: Record<Exclude<ReceiverStatus, "live">, string> = {
  waiting:
    "El celular no está transmitiendo. Abrí la consola transmisora en el teléfono vinculado.",
  connecting: "Conectando con el celular…",
  taken:
    "Esta cámara se está viendo en otra pantalla. Se puede ver en un solo lugar a la vez.",
  error: "",
  unlinked: "Este celular todavía no tiene un enlace de vinculación.",
};

export function WebRTCReceiverTile({
  token,
  isMuted = true,
  onStatusChange,
  onOpenPairModal,
}: WebRTCReceiverTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<ReceiverStatus>(
    token ? "connecting" : "unlinked",
  );
  const [errorText, setErrorText] = useState("");
  const [attempt, setAttempt] = useState(0);
  const notify = useRef(onStatusChange);
  notify.current = onStatusChange;

  useEffect(() => notify.current?.(status), [status]);

  useEffect(() => {
    if (!token) {
      setStatus("unlinked");
      return;
    }
    setStatus("connecting");
    const handle = startViewer({
      sessionId: token,
      onRemoteStream: (stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      },
      onStatus: setStatus,
      onError: (err) => {
        console.error("[webrtc] receptor", err);
        setErrorText(describeSignalingError(err));
        setStatus("error");
      },
    });
    return handle.stop;
  }, [token, attempt]);

  const isLive = status === "live";

  return (
    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className={isLive ? "h-full w-full object-contain" : "hidden"}
      />
      {isLive ? (
        <button
          type="button"
          onClick={() => void videoRef.current?.requestFullscreen?.()}
          aria-label="Ver en pantalla completa"
          className="focus-ring absolute right-2 bottom-2 rounded-full bg-black/60 p-2 text-white/85 hover:text-white"
        >
          <Expand className="h-4 w-4" />
        </button>
      ) : (
        <ReceiverPlaceholder
          status={status}
          message={status === "error" ? errorText : MESSAGES[status]}
          onRetry={() => setAttempt((n) => n + 1)}
          onOpenPairModal={onOpenPairModal}
        />
      )}
    </div>
  );
}

function ReceiverPlaceholder({
  status,
  message,
  onRetry,
  onOpenPairModal,
}: {
  status: Exclude<ReceiverStatus, "live">;
  message: string;
  onRetry: () => void;
  onOpenPairModal?: () => void;
}) {
  const icon =
    status === "connecting" ? (
      <Loader2 className="h-6 w-6 animate-spin" />
    ) : status === "error" ? (
      <WifiOff className="h-6 w-6 text-red-400" />
    ) : (
      <Smartphone className="h-6 w-6" />
    );
  return (
    <div className="flex flex-col items-center gap-2 p-5 text-center text-muted">
      {icon}
      <p className="max-w-xs text-[12px] leading-snug">{message}</p>
      {(status === "error" || status === "taken" || status === "waiting") && (
        <button type="button" className={btnSecondary} onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" />
          {status === "taken" ? "Ver en esta pantalla" : "Reintentar"}
        </button>
      )}
      {status === "unlinked" && onOpenPairModal && (
        <button
          type="button"
          className={btnSecondary}
          onClick={onOpenPairModal}
        >
          Vincular celular
        </button>
      )}
    </div>
  );
}
