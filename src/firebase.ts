import { initializeApp } from 'firebase/app';
import { getFirestore, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "practical-axon-t77bw",
  appId: "1:517514188720:web:a1af4464a7ead45152e875",
  apiKey: "AIzaSyCkU6rhlyQdazlD6TxvuILT-kJ4IfcF9rs",
  authDomain: "practical-axon-t77bw.firebaseapp.com",
  storageBucket: "practical-axon-t77bw.firebasestorage.app",
  messagingSenderId: "517514188720"
};

const app = initializeApp(firebaseConfig);

// Initialize the new, standard online database (default)
export const db = getFirestore(app);

// Initialize the old named database and put it in offline-only mode
export const oldDb = getFirestore(app, "ai-studio-imagegallery-a44d0f4b-f3bd-412d-9cdd-d5863b832b78");
disableNetwork(oldDb).catch(err => {
  console.warn("Failed to disable network on oldDb:", err);
});

export const storage = getStorage(app);
export const auth = getAuth(app);
