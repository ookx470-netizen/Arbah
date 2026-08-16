
import { getAllUsers } from './src/firebaseService.js';

async function testAudit() {
  try {
    console.log("Fetching users...");
    const users = await getAllUsers();
    console.log(`Successfully fetched ${users.length} users.`);
  } catch (e) {
    console.error("Error:", e);
  }
}

testAudit();
