import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "practical-axon-t77bw",
  appId: "1:517514188720:web:a1af4464a7ead45152e875",
  apiKey: "AIzaSyCkU6rhlyQdazlD6TxvuILT-kJ4IfcF9rs",
  authDomain: "practical-axon-t77bw.firebaseapp.com",
  storageBucket: "practical-axon-t77bw.firebasestorage.app",
  messagingSenderId: "517514188720"
};

const app = initializeApp(firebaseConfig);

async function checkNamedDb() {
  try {
    const dbNamed = getFirestore(app, "ai-studio-imagegallery-a44d0f4b-f3bd-412d-9cdd-d5863b832b78");
    const snapshot = await getDocs(collection(dbNamed, "users"));
    console.log("Named DB users count:", snapshot.size);
  } catch (error: any) {
    console.error("Error checking Named DB:", error.message);
  }
}

async function checkDefaultDb() {
  try {
    const dbDefault = getFirestore(app);
    const snapshot = await getDocs(collection(dbDefault, "users"));
    console.log("Default DB users count:", snapshot.size);
  } catch (error: any) {
    console.error("Error checking Default DB:", error.message);
  }
}

async function main() {
  console.log("--- STARTING DATABASE CHECK ---");
  await checkNamedDb();
  await checkDefaultDb();
  console.log("--- COMPLETED DATABASE CHECK ---");
  process.exit(0);
}

main().catch(console.error);
