import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore, setLogLevel } from 'firebase/firestore';
setLogLevel('error');
import { getAuth } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Polyfill/Patch fetch for SSR (GitHub Actions/Vercel) so Firebase Client SDK
// doesn't get blocked by HTTP Referrer restrictions on the API Key.
// Scoped to Google/Firebase hosts only so other server-side fetches
// (GitHub dispatch, geo lookup, ...) are not silently rewritten.
if (typeof window === 'undefined' && typeof globalThis.fetch === 'function') {
  const originalFetch = globalThis.fetch;
  const isFirebaseRequest = (target) => (
    /https:\/\/[^/]*\.(googleapis\.com|firebaseio\.com|firebaseapp\.com)\//i.test(target)
  );
  globalThis.fetch = function (url, options = {}) {
    const target = typeof url === 'string' ? url : (url && url.url) || '';
    if (!isFirebaseRequest(target)) {
      return originalFetch(url, options);
    }
    const newOptions = { ...options };
    const headers = new Headers(newOptions.headers || {});
    if (!headers.has('Referer')) {
      // Use the prod domain or a valid localhost to bypass restrictions
      headers.set('Referer', 'https://phearum-info.web.app/');
    }
    newOptions.headers = headers;
    return originalFetch(url, newOptions);
  };
}

const getEnv = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof globalThis !== 'undefined' && globalThis.process?.env?.[key]) {
    return globalThis.process.env[key];
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

const hasCoreConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
if (!hasCoreConfig) {
  console.error("Firebase config is missing required values (apiKey/projectId/appId). Check your .env file.");
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// App Check (security review F-02): attests requests come from the real app,
// blocking scripted abuse of public endpoints (e.g. visits flooding). No-op
// until VITE_RECAPTCHA_SITE_KEY is set, so existing deploys are unaffected.
// To enable: register a reCAPTCHA v3 key in the Firebase console (App Check),
// set VITE_RECAPTCHA_SITE_KEY, then turn on enforcement for Firestore/Functions.
if (typeof window !== 'undefined') {
  const appCheckSiteKey = getEnv('VITE_RECAPTCHA_SITE_KEY');
  if (appCheckSiteKey) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(appCheckSiteKey),
        isTokenAutoRefreshEnabled: true
      });
    } catch (err) {
      console.warn("App Check init skipped:", err?.message || err);
    }
  }
}

const db = getFirestore(app);
const auth = getAuth(app);

let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (err) {
    // Analytics can fail in local/dev or unsupported browsers; this should not block Firestore/Auth.
    console.warn("Analytics init skipped:", err?.message || err);
  }
}

export { app, db, auth, analytics };
export default app;
