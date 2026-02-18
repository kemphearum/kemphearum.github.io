import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAucicBCUmdaJSYsAvx_kwNQs9sVSoDrgA",
  authDomain: "portfolio-77db2.firebaseapp.com",
  projectId: "portfolio-77db2",
  storageBucket: "portfolio-77db2.firebasestorage.app",
  messagingSenderId: "871859633193",
  appId: "1:871859633193:web:cb71a71835bcd3b5fa7038",
  measurementId: "G-FXJV6CG9QB"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;
