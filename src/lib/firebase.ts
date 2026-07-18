import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "constant-wavelet-rtgzl",
  appId: "1:122186402024:web:2de11202993824cf81215d",
  apiKey: "AIzaSyDb-bJ7sEfaGwHkYJ5uTxKrPtyr4hOCsoM",
  authDomain: "constant-wavelet-rtgzl.firebaseapp.com",
  storageBucket: "constant-wavelet-rtgzl.firebasestorage.app",
  messagingSenderId: "122186402024",
};

const firestoreDatabaseId = "ai-studio-427031f1-3575-42a9-bd79-0912cd4cfaf8";

const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
export const db = getFirestore(app, firestoreDatabaseId);
