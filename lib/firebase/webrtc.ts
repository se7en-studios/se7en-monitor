// Punto de entrada de la transmisión WebRTC (celular → centro de monitoreo).
export {
  ICE_SERVERS,
  describeSignalingError,
  toError,
  type PeerHandle,
  type PeerStatus,
} from "./webrtc-core";
export {
  startBroadcaster,
  type BroadcasterHandle,
  type DevicePairing,
} from "./webrtc-broadcaster";
export { startViewer } from "./webrtc-viewer";
