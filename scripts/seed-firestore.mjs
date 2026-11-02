// Script de carga inicial (Seed) de datos para Cloud Firestore
// Ejecutar con: node scripts/seed-firestore.mjs

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

// Cargar .env.local si existe
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "../.env.local");

if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("your-")) {
  console.error("❌ Error: Faltan las credenciales de Firebase en .env.local");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SCHOOLS = [
  {
    id: "sch-001",
    code: "ESC-204",
    name: "Escuela Primaria N° 204",
    address: "Av. San Martín 450",
    neighborhood: "Centro",
    city: "Catriel",
    province: "Río Negro",
    lat: -37.8785,
    lng: -67.7955,
    educational_level: "primario",
    principal_name: "Prof. Marta Silveira",
    phone: "(0299) 491-1204",
    email: "escuela204.catriel@educacion.rn.gov.ar",
    perimeter_radius_meters: 200,
    cameras_count: 5,
    status: "operativo",
    created_at: new Date().toISOString(),
  },
  {
    id: "sch-002",
    code: "CEM-021",
    name: "C.E.M. N° 21 (Secundario)",
    address: "Alberdi y Jujuy s/n",
    neighborhood: "Barrio Preiss",
    city: "Catriel",
    province: "Río Negro",
    lat: -37.8812,
    lng: -67.7928,
    educational_level: "secundario",
    principal_name: "Lic. Carlos Benítez",
    phone: "(0299) 491-2121",
    email: "cem21.catriel@educacion.rn.gov.ar",
    perimeter_radius_meters: 200,
    cameras_count: 6,
    status: "operativo",
    created_at: new Date().toISOString(),
  },
  {
    id: "sch-003",
    code: "JAR-043",
    name: "Jardín de Infantes N° 43 Rayito de Sol",
    address: "Roca 320",
    neighborhood: "Centro",
    city: "Catriel",
    province: "Río Negro",
    lat: -37.8768,
    lng: -67.7972,
    educational_level: "inicial",
    principal_name: "Directora Laura Méndez",
    phone: "(0299) 491-3043",
    email: "jardin43.catriel@educacion.rn.gov.ar",
    perimeter_radius_meters: 200,
    cameras_count: 3,
    status: "operativo",
    created_at: new Date().toISOString(),
  },
  {
    id: "sch-004",
    code: "CET-007",
    name: "C.E.T. N° 7 (Escuela Técnica)",
    address: "Av. Mosconi y Formosa",
    neighborhood: "Barrio YPF",
    city: "Catriel",
    province: "Río Negro",
    lat: -37.8845,
    lng: -67.7891,
    educational_level: "tecnico",
    principal_name: "Ing. Roberto Albarracín",
    phone: "(0299) 491-4007",
    email: "cet07.catriel@educacion.rn.gov.ar",
    perimeter_radius_meters: 200,
    cameras_count: 7,
    status: "operativo",
    created_at: new Date().toISOString(),
  },
  {
    id: "sch-005",
    code: "ESC-195",
    name: "Escuela Primaria N° 195",
    address: "La Pampa 120",
    neighborhood: "Barrio Carod",
    city: "Catriel",
    province: "Río Negro",
    lat: -37.8869,
    lng: -67.8015,
    educational_level: "primario",
    principal_name: "Prof. Silvia Morales",
    phone: "(0299) 491-1195",
    email: "escuela195.catriel@educacion.rn.gov.ar",
    perimeter_radius_meters: 200,
    cameras_count: 4,
    status: "atencion_requerida",
    created_at: new Date().toISOString(),
  },
];

async function seed() {
  console.log("🚀 Iniciando carga de escuelas en Firestore...");
  for (const school of SCHOOLS) {
    await setDoc(doc(db, "schools", school.id), school);
    console.log(` ✅ Escuela registrada: ${school.name}`);
  }
  console.log("🎉 Carga completada con éxito en Firestore.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});

