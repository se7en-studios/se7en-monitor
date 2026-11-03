import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración del cliente web de Firebase. NO es un secreto: viaja en cada página y la
// seguridad la dan las reglas de Firestore (firestore.rules). Por eso hay valores por
// defecto del proyecto real: así el sitio funciona aunque no se carguen las variables de
// entorno en el hosting. Las variables NEXT_PUBLIC_FIREBASE_* siguen pisándolos si existen.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB3q73VOadQd71rLPxpiwBxQBInlcRgpLA",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "monitoreo-camaras-977a6.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "monitoreo-camaras-977a6",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "monitoreo-camaras-977a6.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "966850242693",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:966850242693:web:e729a77460eaeaa947a1ec",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("Dummy")
);

// Singleton Firebase initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

