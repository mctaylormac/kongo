import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, type Analytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getFirestore, type Firestore } from "firebase/firestore";

// Firebase configuration derived from firebase.txt
const firebaseConfig = {
  apiKey: "AIzaSyCVh4H0KzYveo3qOmzm6_okz71xBezDICc",
  authDomain: "kongo-8161f.firebaseapp.com",
  projectId: "kongo-8161f",
  storageBucket: "kongo-8161f.firebasestorage.app",
  messagingSenderId: "742743875539",
  appId: "1:742743875539:web:f4f16d35fc549873515926",
  measurementId: "G-5GFXE17ZGS"
};

// Initialize core services once
export const app: FirebaseApp = initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app);

// Lazily initialize Analytics only in supported browser environments
let analyticsInstance: Analytics | undefined;
export async function getAnalyticsInstance(): Promise<Analytics | undefined> {
  try {
    if (typeof window === "undefined") return undefined;
    if (!analyticsInstance && (await isAnalyticsSupported())) {
      analyticsInstance = getAnalytics(app);
    }
    return analyticsInstance;
  } catch {
    // Silently ignore analytics initialization errors (e.g., unsupported env)
    return undefined;
  }
}

export type { Firestore };


