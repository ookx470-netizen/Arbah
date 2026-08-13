import { collection, getDocs } from 'firebase/firestore';
import { db } from './src/firebase';
async function test() {
  const snapshot = await getDocs(collection(db, "users"));
  console.log("Firestore users count:", snapshot.size);
  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
