// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// .env.local içindeki değerleri kullanıyoruz
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
};

// Aynı app'i iki kez initialize etmemek için:
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 🔴 ÖNEMLİ: İşte aradığımız export bu satır
export const db = getFirestore(app);