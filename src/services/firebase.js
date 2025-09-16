import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Log config for debugging (remove in production)
console.log("Firebase Config:", {
  apiKey: firebaseConfig.apiKey ? "Set" : "Missing",
  authDomain: firebaseConfig.authDomain ? "Set" : "Missing",
  projectId: firebaseConfig.projectId ? "Set" : "Missing",
  storageBucket: firebaseConfig.storageBucket ? "Set" : "Missing",
  messagingSenderId: firebaseConfig.messagingSenderId ? "Set" : "Missing",
  appId: firebaseConfig.appId ? "Set" : "Missing",
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Only connect to emulators in development and if explicitly enabled
if (
  process.env.NODE_ENV === "development" &&
  process.env.REACT_APP_USE_FIREBASE_EMULATOR === "true"
) {
  try {
    // Check if emulators are not already connected
    if (!auth._delegate?._config?.emulator) {
      console.log("Connecting to Firebase Auth Emulator...");
      connectAuthEmulator(auth, "http://localhost:9099");
    }

    if (!db._delegate?._databaseId) {
      console.log("Connecting to Firestore Emulator...");
      connectFirestoreEmulator(db, "localhost", 8080);
    }

    console.log("Connecting to Storage Emulator...");
    connectStorageEmulator(storage, "localhost", 9199);

    console.log("Firebase Emulators connected successfully");
  } catch (error) {
    console.log(
      "Firebase Emulators not available or already connected:",
      error.message
    );
  }
} else {
  console.log("Using Firebase Production Services");
}

export default app;
