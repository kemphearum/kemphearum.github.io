import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

const getEnv = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID'),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID')
};

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase Initialization Error:", error);
  // Create a dummy app to avoid crashing subsequent calls
  app = { name: '[DEFAULT]', options: {}, automaticDataCollectionEnabled: false };
}

export let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (err) {
    console.error("Analytics init failed:", err);
  }
}

export let db;
export let auth;

try {
  db = getFirestore(app);
} catch (error) {
  console.error("Firestore Initialization Error:", error);
  db = {}; // Fallback dummy object
}

try {
  auth = getAuth(app);
} catch (error) {
  console.error("Auth Initialization Error:", error);
  auth = {}; // Fallback dummy object
}

export default app;
