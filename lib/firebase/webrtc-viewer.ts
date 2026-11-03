import {
  serverTimestamp,
  updateDoc,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot,
} from "firebase/firestore";
import { auth } from "./config";
import { toMillis } from "@/lib/time";
import {
  clearCandidates,
  openRound,
  randomId,
  sessionRefs,
  statusFromConnection,
  subscribeDoc,
  toError,
  type PeerHandle,
  type PeerStatus,
  type Round,
} from "./webrtc-core";

const MAX_TIMEOUT_MS = 2_147_483_647;

interface ViewerOptions {
  cameraId: string;
  onRemoteStream: (stream: MediaStream) => void;
  onStatus: (status: PeerStatus) => void;
  onError: (err: Error) => void;
}

/**
 * El centro de monitoreo pide la cámara del celular y responde la oferta que le toca.
 * Si la primera lectura falla (por ejemplo, el rol no puede ver en vivo), la promesa
 * se rechaza. Cuando la sesión se borra (enlace revocado) o vence, corta la conexión.
 */
export async function startViewer(opts: ViewerOptions): Promise<PeerHandle> {
  const { session, caller, callee } = sessionRefs(opts.cameraId);
  const myRequest = randomId();
  let current: Round | null = null;
  let requested = false;
  let requestedFor: string | null = null;
  let stopped = false;
  let expiry: ReturnType<typeof setTimeout> | undefined;

  const fail = (err: unknown) => {
    if (!stopped) opts.onError(toError(err));
  };
  const request = () =>
    updateDoc(session, {
      viewer_request: myRequest,
      updatedAt: serverTimestamp(),
    }).catch((err) =>
      // Si la sesión se borró justo antes, el próximo snapshot lo muestra como "waiting".
      (err as { code?: string })?.code === "not-found" ? undefined : fail(err),
    );
  const closeRound = () => {
    current?.close();
    current = null;
  };
  const goIdle = () => {
    closeRound();
    opts.onStatus("waiting");
  };
  /** Programa el corte al vencer el enlace. false si ya venció (o no tiene vencimiento). */
  const watchExpiry = (value: unknown): boolean => {
    clearTimeout(expiry);
    const ms = toMillis(value) - Date.now();
    if (ms <= 0) return false;
    expiry = setTimeout(goIdle, Math.min(ms, MAX_TIMEOUT_MS));
    return true;
  };

  const onSnapshot = (snap: DocumentSnapshot) => {
    if (stopped) return;
    if (!snap.exists()) {
      requested = false;
      requestedFor = null;
      clearTimeout(expiry);
      return goIdle();
    }
    const data = snap.data();
    if (!watchExpiry(data.expires_at)) return goIdle();
    // Recién se pide la conexión cuando la sesión existe (el visor no puede crearla).
    const firstRequest = !requested;
    if (firstRequest) {
      requested = true;
      void request();
    }
    if (!data.offer || data.status === "terminated") return goIdle();
    if (firstRequest) return opts.onStatus("connecting");
    if (data.round === current?.id) return;
    if (!data.viewer_request) {
      // El celular reinició: se le vuelve a pedir (una vez por ronda).
      if (requestedFor !== data.round) {
        requestedFor = data.round;
        void request();
      }
      return opts.onStatus("connecting");
    }
    if (data.viewer_request !== myRequest) {
      closeRound();
      return opts.onStatus("taken");
    }
    closeRound();
    current = answerOffer(session, data, caller, callee, opts, fail);
  };

  const unsub = await subscribeDoc(session, onSnapshot, fail);

  return {
    stop: () => {
      stopped = true;
      clearTimeout(expiry);
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
  fail: (err: unknown) => void,
): Round {
  const round = openRound(data.round as string, callee, caller, fail);
  round.pc.ontrack = (e) => {
    if (e.streams[0]) opts.onRemoteStream(e.streams[0]);
  };
  round.pc.onconnectionstatechange = () =>
    opts.onStatus(statusFromConnection(round.pc.connectionState));
  opts.onStatus("connecting");

  const run = async () => {
    // Los candidatos propios recién se generan después de setLocalDescription.
    await clearCandidates(callee);
    await round.pc.setRemoteDescription(data.offer);
    round.flush();
    const answer = await round.pc.createAnswer();
    await round.pc.setLocalDescription(answer);
    await updateDoc(session, {
      answer: { type: answer.type, sdp: answer.sdp },
      answer_round: round.id,
      status: "connected",
      viewer_uid: auth.currentUser?.uid ?? "",
      connectedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };
  // Si la ronda se cerró mientras negociaba (llegó otra), el error no importa.
  run().catch((err) => {
    if (round.pc.signalingState !== "closed") fail(err);
  });
  return round;
}
