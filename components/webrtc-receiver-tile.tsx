"use client";

import { useEffect, useRef, useState } from "react";
import {
  Smartphone,
  Radio,
  Video,
  Volume2,
  VolumeX,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { startViewer, WebRTCConnectionState } from "@/lib/firebase/webrtc";
import { isFirebaseConfigured } from "@/lib/firebase/config";

interface WebRTCReceiverTileProps {
  token: string;
  onOpenPairModal: () => void;
  isMuted?: boolean;
}

export function WebRTCReceiverTile({
  token,
  onOpenPairModal,
  isMuted = true,
}: WebRTCReceiverTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<WebRTCConnectionState | null>(null);
  const [isReceiving, setIsReceiving] = useState(false);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (isFirebaseConfigured && token) {
      startViewer({
        sessionId: token,
        onRemoteStream: (stream) => {
          setRemoteStream(stream);
          setIsReceiving(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        },
        onStateChange: (state) => {
          setConnectionState(state);
          if (state === "disconnected" || state === "failed" || state === "closed") {
            setIsReceiving(false);
          }
        },
        onError: (err) => {
          console.error("Error en receptor WebRTC:", err);
          setIsReceiving(false);
        },
      }).then((handle) => {
        cleanup = handle.stop;
      });
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [token]);

  return (
    <div className="relative aspect-video w-full bg-background flex items-center justify-center overflow-hidden">
      {/* Remote Video Stream Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className={`h-full w-full object-cover ${isReceiving ? "block" : "hidden"}`}
      />

      {/* When Stream is Active: Overlay Telemetry */}
      {isReceiving && (
        <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-foreground bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded w-fit">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              ENLACE MÓVIL EN VIVO (P2P)
            </span>
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono text-foreground/85 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded">
            <span>SEÑALIZACIÓN: FIRESTORE OK</span>
            <span className="text-accent">FPS: 30 · WEBRTC DIRECT</span>
          </div>
        </div>
      )}

      {/* Standby / Waiting State */}
      {!isReceiving && (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft border border-accent/20 text-accent">
            <Smartphone className="h-7 w-7" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
            </span>
          </div>
          <p className="text-xs font-semibold text-foreground">
            Receptor WebRTC para Dispositivo Móvil
          </p>
          <p className="mt-1 text-[11px] text-muted max-w-xs leading-tight">
            Escaneá el código QR desde tu teléfono para emitir video en vivo a este visor
          </p>
          <button
            onClick={onOpenPairModal}
            className="mt-3.5 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/20 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/30 transition-colors"
          >
            <Radio className="h-3.5 w-3.5" />
            Vincular Teléfono Celular
          </button>
        </div>
      )}
    </div>
  );
}

