import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBgLB4dmonS7NI0lFJGsyt5qrqv4q0Q_5Q",
  authDomain: "stuy-connects.firebaseapp.com",
  projectId: "stuy-connects",
  storageBucket: "stuy-connects.firebasestorage.app",
  messagingSenderId: "468277953582",
  appId: "1:468277953582:web:89e1964554f0cc47814bbf",
  measurementId: "G-5NLEJ9H8J3"
};

// Initialize Firebase (Ensure these three lines appear ONLY ONCE!)
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
