
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously, 
  onAuthStateChanged, 
  signOut,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCo3pqKMGNYrLAKVisrGbD_1ZiZnZzlKeM",
  authDomain: "codesensei-c77c7.firebaseapp.com",
  databaseURL: "https://codesensei-c77c7-default-rtdb.firebaseio.com",
  projectId: "codesensei-c77c7",
  storageBucket: "codesensei-c77c7.firebasestorage.app",
  messagingSenderId: "118813263442",
  appId: "1:118813263442:web:0fa9f04f9fd00e916f018b",
  measurementId: "G-EJYXY95Q38"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth service
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Configure Persistence
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.error("Firebase persistence setup failed:", err);
});

export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    if (error.code === 'auth/unauthorized-domain') {
      const currentDomain = window.location.hostname;
      throw new Error(`Domain '${currentDomain}' is not authorized. Please add '${currentDomain}' to 'Authorized Domains' in your Firebase Console > Auth > Settings.`);
    }
    throw error;
  }
};

export const loginAsGuest = async () => {
  try {
    return await signInAnonymously(auth);
  } catch (error: any) {
    if (error.code === 'auth/admin-restricted-operation') {
      throw new Error("Guest mode is disabled. Please enable 'Anonymous' provider in your Firebase Console > Auth > Sign-in method.");
    }
    throw error;
  }
};

export const logoutUser = () => signOut(auth);
export { onAuthStateChanged };
