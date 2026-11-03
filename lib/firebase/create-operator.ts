import { deleteApp, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  inMemoryPersistence,
  initializeAuth,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { app, db } from "./config";
import { randomCode } from "@/lib/ids";
import type { Role } from "@/lib/roles";

interface NewOperator {
  full_name: string;
  email: string;
  password: string;
  role: Role;
}

/**
 * Se creó la cuenta de acceso pero no su perfil: queda sin permisos (las reglas exigen
 * perfil activo). Desde el cliente no se puede borrar otra cuenta: hay que hacerlo en
 * Firebase Console → Authentication, o reintentar el alta del perfil.
 */
export class ProfileWriteError extends Error {
  constructor(
    readonly email: string,
    readonly uid: string,
    readonly cause: unknown,
  ) {
    super(
      `Se creó la cuenta ${email} pero no se pudo guardar su perfil. La cuenta quedó sin permisos: ` +
        `borrala en Firebase Console → Authentication (uid ${uid}) y volvé a darla de alta.`,
    );
    this.name = "ProfileWriteError";
  }
}

/**
 * Crea la cuenta en una instancia secundaria de Firebase (en memoria, sin tocar el
 * almacenamiento del navegador) para no cerrar la sesión del Super Admin, y luego
 * escribe el perfil (las reglas solo lo permiten a super_admin).
 */
export async function createOperator({
  full_name,
  email,
  password,
  role,
}: NewOperator): Promise<void> {
  const secondary = initializeApp(app.options, `operator-${randomCode(12)}`);
  const secondaryAuth = initializeAuth(secondary, {
    persistence: inMemoryPersistence,
  });
  try {
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      email.trim(),
      password,
    );
    try {
      await setDoc(doc(db, "profiles", cred.user.uid), {
        email: email.trim().toLowerCase(),
        full_name: full_name.trim(),
        role,
        active: true,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      throw new ProfileWriteError(email.trim(), cred.user.uid, err);
    }
  } finally {
    await signOut(secondaryAuth).catch((err) =>
      console.error("[usuarios] cierre de la sesión secundaria", err),
    );
    await deleteApp(secondary).catch((err) =>
      console.error("[usuarios] cierre de la instancia secundaria", err),
    );
  }
}
