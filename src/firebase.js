import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD63CFtXL9F7kEP8GcEqdOAlHQ34LyuPYQ",
  authDomain: "careerpulse-82f19.firebaseapp.com",
  projectId: "careerpulse-82f19",
  storageBucket: "careerpulse-82f19.firebasestorage.app",
  messagingSenderId: "1016953282084",
  appId: "1:1016953282084:web:50c264cf67461ccd7e82b1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
