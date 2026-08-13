import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "practical-axon-t77bw",
  appId: "1:517514188720:web:a1af4464a7ead45152e875",
  apiKey: "AIzaSyCkU6rhlyQdazlD6TxvuILT-kJ4IfcF9rs",
  authDomain: "practical-axon-t77bw.firebaseapp.com",
  storageBucket: "practical-axon-t77bw.firebasestorage.app",
  messagingSenderId: "517514188720"
};

const app = initializeApp(firebaseConfig);

// Initialize both databases
const oldDb = getFirestore(app, "ai-studio-imagegallery-a44d0f4b-f3bd-412d-9cdd-d5863b832b78");
const defaultDb = getFirestore(app); // uses (default) database

const collectionsToMigrate = [
  "users",
  "settings",
  "deposits",
  "withdrawals",
  "support_chats",
  "notifications"
];

async function runMigration() {
  console.log("🚀 Starting data migration from Named DB to Default (Unlimited) DB...");
  
  for (const collName of collectionsToMigrate) {
    console.log(`\n📁 Migrating collection: "${collName}"...`);
    try {
      const oldColRef = collection(oldDb, collName);
      const snapshot = await getDocs(oldColRef);
      console.log(`Found ${snapshot.size} documents in "${collName}" on the old database.`);
      
      let successCount = 0;
      for (const oldDoc of snapshot.docs) {
        const data = oldDoc.data();
        const docId = oldDoc.id;
        
        const newDocRef = doc(defaultDb, collName, docId);
        await setDoc(newDocRef, data);
        successCount++;
      }
      console.log(`✅ Successfully copied ${successCount}/${snapshot.size} documents for "${collName}".`);
    } catch (error: any) {
      console.error(`❌ Error migrating "${collName}":`, error.message || error);
    }
  }
  
  console.log("\n✨ Migration process completed! If there were quota limit errors, please retry when the quota resets.");
}

runMigration();
