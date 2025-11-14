// Import the functions you need from the SDKs you need
import Constants from 'expo-constants';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

// Helper function to safely get environment variables
const getEnvVar = (key: string): string => {
  return Constants.expoConfig?.extra?.[key] || 
         process.env[key] || 
         '';
};

// Your web app's Firebase configuration (from environment variables)
const firebaseConfig = {
  apiKey: getEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnvVar('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('EXPO_PUBLIC_FIREBASE_APP_ID'),
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth - use getAuth to avoid initialization issues
let auth;
try {
  auth = getAuth(app);
} catch (error) {
  console.error('Firebase Auth initialization error:', error);
  // Fallback: try to get existing instance
  auth = getAuth();
}

// Initialize other services
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);

// Export instances
export { app, auth, db, functions, storage };

