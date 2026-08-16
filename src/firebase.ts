import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Connect directly to the production Firestore database
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "ai-studio-imagegallery-a44d0f4b-f3bd-412d-9cdd-d5863b832b78");
export const oldDb = db;

export const storage = getStorage(app);
export const auth = getAuth(app);


