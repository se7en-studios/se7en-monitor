import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./config";

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

export type WebRTCConnectionState =
  | "new"
  | "checking"
  | "connected"
  | "completed"
  | "failed"
  | "disconnected"
  | "closed";

interface BroadcasterOptions {
  sessionId: string;
  localStream: MediaStream;
  onStateChange?: (state: WebRTCConnectionState) => void;
  onError?: (err: Error) => void;
}

/**
 * Inicia la transmisión WebRTC desde el teléfono celular usando Firestore para señalización.
 */
export async function startBroadcaster({
  sessionId,
  localStream,
  onStateChange,
  onError,
}: BroadcasterOptions) {
  if (!isFirebaseConfigured) {
    console.info("[WebRTC] Modo DEMO / Standalone (Configure Firebase en .env.local para señalización remota)");
    onStateChange?.("connected");
    return {
      stop: () => {
        onStateChange?.("closed");
      },
    };
  }

  const unsubs: Unsubscribe[] = [];
  const pc = new RTCPeerConnection(ICE_SERVERS);

  pc.onconnectionstatechange = () => {
    onStateChange?.(pc.connectionState as WebRTCConnectionState);
  };

  // 1. Agregar tracks de audio/video del celular
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  const sessionRef = doc(db, "camera_sessions", sessionId);
  const callerCandidatesRef = collection(sessionRef, "callerCandidates");
  const calleeCandidatesRef = collection(sessionRef, "calleeCandidates");

  // 2. Escuchar candidatos ICE locales y subirlos a Firestore
  pc.onicecandidate = async (event) => {
    if (event.candidate) {
      try {
        await addDoc(callerCandidatesRef, event.candidate.toJSON());
      } catch (err) {
        console.error("Error al guardar caller candidate:", err);
      }
    }
  };

  try {
    // 3. Crear SDP Offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await setDoc(sessionRef, {
      sessionId,
      offer: {
        type: offer.type,
        sdp: offer.sdp,
      },
      status: "waiting_for_viewer",
      deviceType: "mobile_webrtc",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 4. Escuchar la respuesta (SDP Answer) del dashboard operador
    const unsubDoc = onSnapshot(sessionRef, async (snapshot) => {
      const data = snapshot.data();
      if (!pc.currentRemoteDescription && data?.answer) {
        const answer = new RTCSessionDescription(data.answer);
        await pc.setRemoteDescription(answer);
      }
    });
    unsubs.push(unsubDoc);

    // 5. Escuchar candidatos ICE del operador (callee)
    const unsubCandidates = onSnapshot(calleeCandidatesRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const candidateData = change.doc.data();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidateData));
          } catch (err) {
            console.error("Error al añadir callee candidate:", err);
          }
        }
      });
    });
    unsubs.push(unsubCandidates);
  } catch (err) {
    onError?.(err instanceof Error ? err : new Error(String(err)));
  }

  return {
    stop: async () => {
      unsubs.forEach((u) => u());
      pc.close();
      try {
        await updateDoc(sessionRef, {
          status: "terminated",
          terminatedAt: serverTimestamp(),
        });
      } catch {
        // Silencio en cleanup
      }
    },
  };
}

interface ViewerOptions {
  sessionId: string;
  onRemoteStream: (stream: MediaStream) => void;
  onStateChange?: (state: WebRTCConnectionState) => void;
  onError?: (err: Error) => void;
}

/**
 * Conecta el visor del Dashboard a la transmisión del celular mediante WebRTC + Firestore.
 */
export async function startViewer({
  sessionId,
  onRemoteStream,
  onStateChange,
  onError,
}: ViewerOptions) {
  if (!isFirebaseConfigured) {
    console.info("[WebRTC Viewer] Modo DEMO / Standalone");
    return {
      stop: () => {},
    };
  }

  const unsubs: Unsubscribe[] = [];
  const pc = new RTCPeerConnection(ICE_SERVERS);

  pc.onconnectionstatechange = () => {
    onStateChange?.(pc.connectionState as WebRTCConnectionState);
  };

  // Recibir stream remoto
  pc.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      onRemoteStream(event.streams[0]);
    }
  };

  const sessionRef = doc(db, "camera_sessions", sessionId);
  const callerCandidatesRef = collection(sessionRef, "callerCandidates");
  const calleeCandidatesRef = collection(sessionRef, "calleeCandidates");

  // Escuchar candidatos ICE del visor y subirlos
  pc.onicecandidate = async (event) => {
    if (event.candidate) {
      try {
        await addDoc(calleeCandidatesRef, event.candidate.toJSON());
      } catch (err) {
        console.error("Error al guardar callee candidate:", err);
      }
    }
  };

  try {
    const unsubDoc = onSnapshot(sessionRef, async (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      // Cuando el celular publica la oferta y aún no la respondimos
      if (data.offer && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await updateDoc(sessionRef, {
          answer: {
            type: answer.type,
            sdp: answer.sdp,
          },
          status: "connected",
          connectedAt: serverTimestamp(),
        });
      }
    });
    unsubs.push(unsubDoc);

    // Escuchar candidatos ICE del celular
    const unsubCandidates = onSnapshot(callerCandidatesRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const candidateData = change.doc.data();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidateData));
          } catch (err) {
            console.error("Error al añadir caller candidate:", err);
          }
        }
      });
    });
    unsubs.push(unsubCandidates);
  } catch (err) {
    onError?.(err instanceof Error ? err : new Error(String(err)));
  }

  return {
    stop: () => {
      unsubs.forEach((u) => u());
      pc.close();
    },
  };
}

