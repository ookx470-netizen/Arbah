import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDdrjioBLrFev-2eQKfUXwll6DSvmHRokk",
  authDomain: "oxlo-9f766.firebaseapp.com",
  projectId: "oxlo-9f766",
  storageBucket: "oxlo-9f766.firebasestorage.app",
  messagingSenderId: "331306979774",
  appId: "1:331306979774:web:88e13881e934f24afbe9ef"
};

const app = initializeApp(firebaseConfig);

// Initialize the new, standard online database (default)
export const db = getFirestore(app);

// Configuration for the old project so we can safely read the data to migrate it
const oldFirebaseConfig = {
  projectId: "practical-axon-t77bw",
  appId: "1:517514188720:web:a1af4464a7ead45152e875",
  apiKey: "AIzaSyCkU6rhlyQdazlD6TxvuILT-kJ4IfcF9rs",
  authDomain: "practical-axon-t77bw.firebaseapp.com",
  storageBucket: "practical-axon-t77bw.firebasestorage.app",
  messagingSenderId: "517514188720"
};

// Initialize the secondary app to connect to the old project online
const oldApp = initializeApp(oldFirebaseConfig, "oldApp");
export const oldDb = getFirestore(oldApp, "ai-studio-imagegallery-a44d0f4b-f3bd-412d-9cdd-d5863b832b78");

export const storage = getStorage(app);
export const auth = getAuth(app);
