// app/lib/firebase.ts  (or lib/firebase.ts — use ONE path consistently)
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
    getAuth,
    setPersistence,
    browserLocalPersistence,
    onAuthStateChanged,
} from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// ✅ prevent re-initialize on fast refresh
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;

// ✅ IMPORTANT: Persist auth once + wait for restore (prevents flicker after refresh/navigation)
export const authReady = (async () => {
    try {
        await setPersistence(auth, browserLocalPersistence);
    } catch {
        // ignore (some browsers/contexts can block persistence)
    }

    // ✅ Wait until Firebase finishes restoring auth state (first callback)
    await new Promise<void>((resolve) => {
        const unsub = onAuthStateChanged(auth, () => {
            unsub();
            resolve();
        });
    });
})();
