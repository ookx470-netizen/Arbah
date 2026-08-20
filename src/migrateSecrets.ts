import { collection, getDocs, doc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from './firebase';

export async function migratePasswordsToSecrets() {
  console.log("Starting secrets migration...");
  try {
    const snap = await getDocs(collection(db, "users"));
    let count = 0;
    for (const d of snap.docs) {
      const data = d.data();
      if (data.password || data.rawPassword) {
        // Move to secrets
        await setDoc(doc(db, "user_secrets", d.id), {
          password: data.password || "",
          rawPassword: data.rawPassword || ""
        }, { merge: true });
        
        // Remove from public profile
        await updateDoc(doc(db, "users", d.id), {
          password: deleteField(),
          rawPassword: deleteField()
        });
        count++;
      }
    }
    console.log(`Migration complete. Secured ${count} accounts.`);
  } catch (e: any) {
    const errMsg = e?.message || String(e);
    if (errMsg.includes('Missing or insufficient permissions') || e?.code === 'permission-denied') {
      console.warn("Migration skipped: Only Admins can perform this action (Expected behavior for normal users).");
    } else {
      console.error("Migration failed:", e);
    }
  }
}

// إصلاح أمني: يحذف كلمة السر الصريحة غير المشفرة (rawPassword) نهائيًا من
// كل حسابات user_secrets — يبقي فقط النسخة المشفرة (password). يُستدعى مرة
// وحدة من الأدمن فقط (نفس آلية migratePasswordsToSecrets أعلاه).
export async function purgeRawPasswords() {
  console.log("Starting rawPassword purge...");
  try {
    const snap = await getDocs(collection(db, "user_secrets"));
    let count = 0;
    for (const d of snap.docs) {
      const data = d.data();
      if (data.rawPassword) {
        await updateDoc(doc(db, "user_secrets", d.id), {
          rawPassword: deleteField()
        });
        count++;
      }
    }
    console.log(`Purge complete. Cleaned ${count} accounts.`);
    return count;
  } catch (e: any) {
    const errMsg = e?.message || String(e);
    if (errMsg.includes('Missing or insufficient permissions') || e?.code === 'permission-denied') {
      console.warn("Purge skipped: Only Admins can perform this action (Expected behavior for normal users).");
    } else {
      console.error("Purge failed:", e);
    }
    return 0;
  }
}
