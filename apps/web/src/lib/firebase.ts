import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;
let appCheck: AppCheck | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Copy .env.example to apps/web/.env and fill in values.');
  }
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) auth = getAuth(getFirebaseApp());
  return auth;
}

export function getDb(): Firestore {
  if (!db) db = getFirestore(getFirebaseApp());
  return db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) storage = getStorage(getFirebaseApp());
  return storage;
}

export async function initAnalytics(): Promise<Analytics | null> {
  if (!isFirebaseConfigured) return null;
  if (analytics) return analytics;
  if (await isSupported()) {
    analytics = getAnalytics(getFirebaseApp());
  }
  return analytics;
}

export function initAppCheck(): AppCheck | null {
  if (!isFirebaseConfigured) return null;
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (!siteKey) return null;
  if (appCheck) return appCheck;
  appCheck = initializeAppCheck(getFirebaseApp(), {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
  return appCheck;
}
