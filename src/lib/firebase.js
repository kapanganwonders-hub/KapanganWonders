// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYucmpCSWuzbK43rhQH6Lo4ymhHTuFjMc",
  authDomain: "kapangan-wonders.firebaseapp.com",
  projectId: "kapangan-wonders",
  storageBucket: "kapangan-wonders.firebasestorage.app",
  messagingSenderId: "165080462751",
  appId: "1:165080462751:web:d58d11e6782e2d1ab0f9aa",
  measurementId: "G-83QFFC44DP"
};

// Initialize Firebase only if no apps exist
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Analytics only if supported (client-side)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ✅ Export everything needed across the app
export {
  app,
  auth,
  db,
  googleProvider,
  analytics,
  // Firebase Auth
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  // Firestore
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
};
