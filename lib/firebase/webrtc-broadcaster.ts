import {
  Timestamp,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type DocumentSnapshot,
} from "firebase/firestore";
import {
  clearCandidates,
  codedError,
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

/** setTimeout no admite más de ~24,8 días. */
const MAX_TIMEOUT_MS = 2_147_483_647;

/** El enlace ya reclamado por este celular (ver lib/firebase/device-pairing.ts). */
export interface DevicePairing {
  token: string;
  cameraId: string;
  cameraName: string;
  deviceUid: string;
  expiresAt: Date;
}

interface BroadcasterOptions {
  pairing: DevicePairing;
  localStream: MediaStream;
  onStatus: (status: PeerStatus) => void;
  onError: (err: Error) => void;
}

export interface BroadcasterHandle extends PeerHandle {
  /** Cambia la cámara (frontal/trasera) sin cortar la transmisión. */
  setStream: (stream: MediaStream) => void;
}

/**
 * El celular publica su cámara. Primero reclama la sesión de la cámara (si las reglas
 * lo rechazan, la promesa falla). Después atiende cada pedido nuevo de un visor con
 * una ronda nueva. Al vencer o revocarse el enlace, avisa por `onError`.
 */
export async function startBroadcaster(
  opts: BroadcasterOptions,
): Promise<BroadcasterHandle> {
  const { pairing } = opts;
  const { session, caller, callee } = sessionRefs(pairing.cameraId);
  const base = {
    pairing: pairing.token,
    device_uid: pairing.deviceUid,
    expires_at: Timestamp.fromDate(pairing.expiresAt),
  };
  let stream = opts.localStream;
  let current: Round | null = null;
  let handled: string | null = null;
  let started = false;
  let stopped = false;
  let chain = Promise.resolve();
  const fail = (err: Error) => {
    if (!stopped) opts.onError(err);
  };

  await setDoc(session, {
    ...base,
    status: "idle",
    updatedAt: serverTimestamp(),
  });

  const negotiate = async (request: string | null) => {
    current?.close();
    current = null;
    await clearCandidates(caller);
    if (stopped) return;
    const round = openRound(randomId(), caller, callee, fail);
    current = round;
    stream.getTracks().forEach((t) => round.pc.addTrack(t, stream));
    round.pc.onconnectionstatechange = () =>
      opts.onStatus(statusFromConnection(round.pc.connectionState));
    const offer = await round.pc.createOffer();
    await round.pc.setLocalDescription(offer);
    await setDoc(session, {
      ...base,
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
      .catch((err) => fail(toError(err)));
  };

  const onSnapshot = (snap: DocumentSnapshot) => {
    if (stopped) return;
    // La administración revocó el enlace o generó otro: la sesión se borra.
    if (!snap.exists())
      return fail(
        codedError("revoked", "La sesión de la cámara fue revocada."),
      );
    const data = snap.data();
    const request = (data.viewer_request as string | null | undefined) ?? null;
    if (!started || (request && request !== handled)) {
      started = true;
      handled = request;
      renegotiate(request);
      return;
    }
    acceptAnswer(current, data, fail);
  };

  const unsub = await subscribeDoc(session, onSnapshot, fail);
  const expiry = setTimeout(
    () => fail(codedError("expired", "El enlace de vinculación venció.")),
    Math.min(
      MAX_TIMEOUT_MS,
      Math.max(0, pairing.expiresAt.getTime() - Date.now()),
    ),
  );

  return {
    stop: () => {
      stopped = true;
      clearTimeout(expiry);
      unsub();
      current?.close();
      // ponytail: avisar el corte es cortesía; si falla (enlace revocado), el visor lo nota por la conexión.
      updateDoc(session, {
        status: "terminated",
        updatedAt: serverTimestamp(),
      }).catch(() => undefined);
    },
    setStream: (next) => {
      stream = next;
      const track = next.getVideoTracks()[0];
      const sender = current?.pc
        .getSenders()
        .find((s) => s.track?.kind === "video");
      if (track && sender)
        sender.replaceTrack(track).catch((err) => fail(toError(err)));
    },
  };
}

function acceptAnswer(
  round: Round | null,
  data: DocumentData,
  onError: (err: Error) => void,
) {
  if (!round || !data.answer || data.answer_round !== round.id) return;
  if (round.pc.remoteDescription) return;
  round.pc
    .setRemoteDescription(data.answer)
    .then(round.flush)
    .catch((err) => onError(toError(err)));
}
