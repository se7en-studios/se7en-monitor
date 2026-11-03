import { deleteApp, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { app, db } from "./config";
import type { Role } from "@/lib/roles";

interface NewOperator {
  full_name: string;
  email: string;
  password: string;
  role: Role;
}

/**
 * Crea la cuenta en una instancia secundaria de Firebase para no cerrar la sesión
 * del Super Admin, y luego escribe el perfil (las reglas solo lo permiten a super_admin).
 */
export async function createOperator({
  full_name,
  email,
  password,
  role,
}: NewOperator) {
  const secondary = initializeApp(app.options, `operator-${Date.now()}`);
  try {
    const secondaryAuth = getAuth(secondary);
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      email.trim(),
      password,
    );
    await setDoc(doc(db, "profiles", cred.user.uid), {
      email: email.trim().toLowerCase(),
      full_name: full_name.trim(),
      role,
      active: true,
      created_at: new Date().toISOString(),
    });
    await signOut(secondaryAuth);
  } finally {
    await deleteApp(secondary);
  }
}
