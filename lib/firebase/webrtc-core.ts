import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  type CollectionReference,
  type DocumentReference,
  type DocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./config";

/**
 * Servidores ICE. STUN públicos siempre; TURN solo si está configurado.
 * TODO(TURN): sin TURN, los celulares detrás de CGNAT o redes móviles estrictas pueden no
 * conectar. Hace falta un servidor TURN propio (coturn, o un servicio administrado) y
 * cargar NEXT_PUBLIC_TURN_URLS / _USERNAME / _CREDENTIAL. Esas credenciales viajan al
 * navegador: usar credenciales temporales del servicio, nunca una clave maestra.
 */
function iceServers(): RTCIceServer[] {
  const stun: RTCIceServer = {
    urls: [
      "stun:stun.l.google.com:19302",
      "stun:stun1.l.google.com:19302",
      "stun:stun2.l.google.com:19302",
    ],
  };
  const turnUrls = (process.env.NEXT_PUBLIC_TURN_URLS ?? "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
  if (!turnUrls.length) return [stun];
  return [
    stun,
    {
      urls: turnUrls,
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    },
  ];
}

export const ICE_SERVERS: RTCConfiguration = {
  iceServers: iceServers(),
  iceCandidatePoolSize: 10,
};

/**
 * Estado de una punta de la transmisión:
 * - waiting: falta la otra punta (el celular no transmite o nadie mira).
 * - connecting: negociando la conexión.
 * - live: el video está pasando.
 * - taken: otra pantalla está viendo esta cámara (solo visor).
 */
export type PeerStatus = "waiting" | "connecting" | "live" | "taken";

export interface PeerHandle {
  stop: () => void;
}

/*
 * Protocolo de señalización en `camera_sessions/{cameraId}` (ver firestore.rules):
 * - El celular reclama la sesión con su enlace (`pairing`, `device_uid`, `expires_at`).
 * - El visor escribe `viewer_request` (id al azar) para pedir una conexión nueva.
 * - El celular, ante cada pedido nuevo, abre una "ronda": conexión nueva, oferta nueva
 *   con `round` y el `viewer_request` que atiende.
 * - El visor solo responde ofertas con su propio pedido (`answer` + `answer_round`).
 * - Los candidatos ICE llevan `round`: los de rondas viejas se ignoran y se borran.
 * Una cámara se ve en una sola pantalla a la vez (la última que la pidió).
 */

export interface Round {
  id: string;
  pc: RTCPeerConnection;
  flush: () => void;
  close: () => void;
}

export const randomId = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");

export const toError = (err: unknown): Error =>
  err instanceof Error ? err : new Error(String(err));

export const codedError = (code: string, message: string): Error =>
  Object.assign(new Error(message), { code });

/** Explica en criollo por qué falló la señalización. */
export function describeSignalingError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code === "expired")
    return "El enlace de vinculación venció. Hay que generar uno nuevo desde el centro de monitoreo.";
  if (code === "permission-denied" || code === "revoked")
    return "El enlace de vinculación venció o fue revocado. Hay que generar uno nuevo desde el centro de monitoreo.";
  if (code === "unavailable")
    return "Sin conexión a internet. Revisá la red e intentá de nuevo.";
  return "No se pudo establecer la conexión de video. Intentá de nuevo.";
}

export const sessionRefs = (cameraId: string) => {
  const session = doc(db, "camera_sessions", cameraId);
  return {
    session,
    caller: collection(session, "callerCandidates"),
    callee: collection(session, "calleeCandidates"),
  };
};

/**
 * Se suscribe a un documento y espera la primera lectura: si falla (permiso, red),
 * la promesa se rechaza y quien llama se entera. Los errores posteriores van a `onError`.
 */
export function subscribeDoc(
  ref: DocumentReference,
  onNext: (snap: DocumentSnapshot) => void,
  onError: (err: Error) => void,
): Promise<Unsubscribe> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const unsub = onSnapshot(
      ref,
      (snap) => {
        onNext(snap);
        if (!settled) {
          settled = true;
          resolve(() => unsub());
        }
      },
      (err) => {
        if (settled) return onError(toError(err));
        settled = true;
        reject(err);
      },
    );
  });
}

/** Borra los candidatos de rondas anteriores antes de abrir una nueva. */
export async function clearCandidates(col: CollectionReference): Promise<void> {
  const snap = await getDocs(col);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

/**
 * Abre una conexión de una ronda: sube los candidatos propios y aplica los remotos
 * (los que llegan antes de la descripción remota quedan en espera hasta `flush`).
 */
export function openRound(
  id: string,
  outgoing: CollectionReference,
  incoming: CollectionReference,
  onError: (err: Error) => void,
): Round {
  const pc = new RTCPeerConnection(ICE_SERVERS);
  const pending: RTCIceCandidateInit[] = [];
  const add = (c: RTCIceCandidateInit) =>
    pc
      .addIceCandidate(c)
      .catch((err) => console.error("[webrtc] candidato", err));

  pc.onicecandidate = (e) => {
    if (!e.candidate) return;
    addDoc(outgoing, { ...e.candidate.toJSON(), round: id }).catch((err) =>
      onError(toError(err)),
    );
  };

  const unsub = onSnapshot(
    incoming,
    (snap) =>
      snap.docChanges().forEach((change) => {
        if (change.type !== "added") return;
        const { round, ...candidate } = change.doc.data();
        if (round !== id) return;
        if (pc.remoteDescription) void add(candidate);
        else pending.push(candidate);
      }),
    (err) => onError(toError(err)),
  );

  return {
    id,
    pc,
    flush: () => pending.splice(0).forEach((c) => void add(c)),
    close: () => {
      unsub();
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.ontrack = null;
      pc.close();
    },
  };
}

export const statusFromConnection = (s: RTCPeerConnectionState): PeerStatus =>
  s === "connected"
    ? "live"
    : s === "failed" || s === "closed"
      ? "waiting"
      : "connecting";
