import { app } from "./firebase";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  type UserCredential
} from "firebase/auth";

const auth = getAuth(app);

export type SignInOptions = {
  rememberMe?: boolean;
};

export async function signInWithEmail(email: string, password: string, options: SignInOptions = {}): Promise<UserCredential> {
  await setPersistence(auth, options.rememberMe ? browserLocalPersistence : browserSessionPersistence);
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(email: string, password: string, options: SignInOptions = {}): Promise<UserCredential> {
  await setPersistence(auth, options.rememberMe ? browserLocalPersistence : browserSessionPersistence);
  return await createUserWithEmailAndPassword(auth, email, password);
}

export async function resetPassword(email: string): Promise<void> {
  return await sendPasswordResetEmail(auth, email);
}

export async function signInWithGoogle(options: SignInOptions = {}): Promise<UserCredential> {
  await setPersistence(auth, options.rememberMe ? browserLocalPersistence : browserSessionPersistence);
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(auth, provider);
}

export async function signOutUser(): Promise<void> {
  return await signOut(auth);
}

export { auth };


