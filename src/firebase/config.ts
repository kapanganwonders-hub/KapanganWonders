// src/firebase/config.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCYucmpCSWuzbK43rhQH6Lo4ymhHTuFjMc",
  authDomain: "kapangan-wonders.firebaseapp.com",
  projectId: "kapangan-wonders",
  storageBucket: "kapangan-wonders.firebasestorage.app",
  messagingSenderId: "165080462751",
  appId: "1:165080462751:web:d58d11e6782e2d1ab0f9aa",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the Auth service and Google provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
