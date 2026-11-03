import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./config";

export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
      ],
    },
  ],
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
 * Protocolo de señalización en `camera_sessions/{token}` (ver firestore.rules):
 * - El visor escribe `viewer_request` (id al azar) para pedir una conexión nueva.
 * - El celular, ante cada pedido nuevo, abre una "ronda": conexión nueva, oferta nueva
 *   con `round` y el `viewer_request` que atiende.
 * - El visor solo responde ofertas con su propio pedido (`answer` + `answer_round`).
 * - Los candidatos ICE llevan `round`: los de rondas viejas se ignoran.
 * Así el visor puede entrar y salir de la pantalla, y el celular reiniciar, sin quedar
 * colgados. Una cámara se ve en una sola pantalla a la vez (la última que la pidió).
 */

interface Round {
  id: string;
  pc: RTCPeerConnection;
  flush: () => void;
  close: () => void;
}

const randomId = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");

export const toError = (err: unknown): Error =>
  err instanceof Error ? err : new Error(String(err));

/** Explica en criollo por qué falló la señalización. */
export function describeSignalingError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code === "permission-denied")
    return "El enlace de vinculación venció o fue revocado. Hay que generar uno nuevo desde el centro de monitoreo.";
  if (code === "unavailable")
    return "Sin conexión a internet. Revisá la red e intentá de nuevo.";
  return "No se pudo establecer la conexión de video. Intentá de nuevo.";
}

const sessionRefs = (sessionId: string) => {
  const session = doc(db, "camera_sessions", sessionId);
  return {
    session,
    caller: collection(session, "callerCandidates"),
    callee: collection(session, "calleeCandidates"),
  };
};

/**
 * Abre una conexión de una ronda: sube los candidatos propios y aplica los remotos
 * (los que llegan antes de la descripción remota quedan en espera hasta `flush`).
 */
function openRound(
  id: string,
  outgoing: CollectionReference,
  incoming: CollectionReference,
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
      console.error("[webrtc] no se pudo publicar un candidato", err),
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
    (err) => console.error("[webrtc] candidatos", err),
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

const statusFromConnection = (s: RTCPeerConnectionState): PeerStatus =>
  s === "connected"
    ? "live"
    : s === "failed" || s === "closed"
      ? "waiting"
      : "connecting";

interface BroadcasterOptions {
  sessionId: string;
  localStream: MediaStream;
  onStatus: (status: PeerStatus) => void;
  onError: (err: Error) => void;
}

/** El celular publica su cámara. Atiende cada pedido nuevo de un visor con una ronda nueva. */
export function startBroadcaster(opts: BroadcasterOptions): PeerHandle {
  const { session, caller, callee } = sessionRefs(opts.sessionId);
  let current: Round | null = null;
  let handled: string | null = null;
  let started = false;
  let stopped = false;
  let chain = Promise.resolve();

  const negotiate = async (request: string | null) => {
    current?.close();
    const round = openRound(randomId(), caller, callee);
    current = round;
    opts.localStream
      .getTracks()
      .forEach((t) => round.pc.addTrack(t, opts.localStream));
    round.pc.onconnectionstatechange = () =>
      opts.onStatus(statusFromConnection(round.pc.connectionState));
    const offer = await round.pc.createOffer();
    await round.pc.setLocalDescription(offer);
    await setDoc(session, {
      offer: { type: offer.type, sdp: offer.sdp },
      round: round.id,
      viewer_request: request,
      status: "waiting_for_viewer",
      updatedAt: serverTimestamp(),
    });
    opts.onStatus("waiting");
  };

  const renegotiate = (request: string | null) => {
    chain = chain
      .then(() => (stopped ? undefined : negotiate(request)))
      .catch((err) => opts.onError(toError(err)));
  };

  const unsub = onSnapshot(
    session,
    (snap) => {
      if (stopped) return;
      const data = snap.data();
      const request =
        (data?.viewer_request as string | null | undefined) ?? null;
      if (!started || (request && request !== handled)) {
        started = true;
        handled = request;
        renegotiate(request);
        return;
      }
      acceptAnswer(current, data, opts.onError);
    },
    (err) => opts.onError(toError(err)),
  );

  return {
    stop: () => {
      stopped = true;
      unsub();
      current?.close();
      // ponytail: avisar el corte es cortesía; si falla, el visor lo nota por la conexión.
      updateDoc(session, {
        status: "terminated",
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    },
  };
}

function acceptAnswer(
  round: Round | null,
  data: DocumentData | undefined,
  onError: (err: Error) => void,
) {
  if (!round || !data?.answer || data.answer_round !== round.id) return;
  if (round.pc.remoteDescription) return;
  round.pc
    .setRemoteDescription(data.answer)
    .then(round.flush)
    .catch((err) => onError(toError(err)));
}

interface ViewerOptions {
  sessionId: string;
  onRemoteStream: (stream: MediaStream) => void;
  onStatus: (status: PeerStatus) => void;
  onError: (err: Error) => void;
}

/** El centro de monitoreo pide la cámara del celular y responde la oferta que le toca. */
export function startViewer(opts: ViewerOptions): PeerHandle {
  const { session, caller, callee } = sessionRefs(opts.sessionId);
  const myRequest = randomId();
  let current: Round | null = null;
  let requestedFor: string | null = null;
  let stopped = false;

  const fail = (err: unknown) => !stopped && opts.onError(toError(err));
  const request = () =>
    setDoc(
      session,
      { viewer_request: myRequest, updatedAt: serverTimestamp() },
      { merge: true },
    ).catch(fail);
  const closeRound = () => {
    current?.close();
    current = null;
  };

  request();
  const unsub = onSnapshot(
    session,
    (snap) => {
      if (stopped) return;
      const data = snap.data();
      if (!data?.offer || data.status === "terminated") {
        closeRound();
        return opts.onStatus("waiting");
      }
      if (data.round === current?.id) return;
      if (!data.viewer_request) {
        // El celular reinició: se le vuelve a pedir (una vez por ronda).
        if (requestedFor !== data.round) {
          requestedFor = data.round;
          request();
        }
        return opts.onStatus("connecting");
      }
      if (data.viewer_request !== myRequest) {
        closeRound();
        return opts.onStatus("taken");
      }
      closeRound();
      current = answerOffer(session, data, caller, callee, opts);
    },
    fail,
  );

  return {
    stop: () => {
      stopped = true;
      unsub();
      closeRound();
    },
  };
}

function answerOffer(
  session: DocumentReference,
  data: DocumentData,
  caller: CollectionReference,
  callee: CollectionReference,
  opts: ViewerOptions,
): Round {
  const round = openRound(data.round as string, callee, caller);
  round.pc.ontrack = (e) => {
    if (e.streams[0]) opts.onRemoteStream(e.streams[0]);
  };
  round.pc.onconnectionstatechange = () =>
    opts.onStatus(statusFromConnection(round.pc.connectionState));
  opts.onStatus("connecting");

  const run = async () => {
    await round.pc.setRemoteDescription(data.offer);
    round.flush();
    const answer = await round.pc.createAnswer();
    await round.pc.setLocalDescription(answer);
    await updateDoc(session, {
      answer: { type: answer.type, sdp: answer.sdp },
      answer_round: round.id,
      status: "connected",
      updatedAt: serverTimestamp(),
    });
  };
  run().catch((err) => opts.onError(toError(err)));
  return round;
}
