import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
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

// ⚠️ DATABASE SELECTION / خيارات قاعدة البيانات:
// To use the unlimited default database with Blaze plan (highly recommended):
// لتشغيل قاعدة البيانات الافتراضية المفتوحة وبلا أي حدود بعد الترحيل:
// export const db = getFirestore(app);

// To use the unlimited default database with Blaze plan (highly recommended):
// لتشغيل قاعدة البيانات الافتراضية المفتوحة وبلا أي حدود بعد الترحيل:
// export const db = getFirestore(app);

// To use the custom database containing all production data (86+ users, deposits, withdrawals):
// تشغيل قاعدة البيانات المخصصة التي تحتوي على كافة البيانات الفعلية للأعضاء:
// Last Sync: 2026-08-14 11:32
export const db = getFirestore(app, "ai-studio-imagegallery-a44d0f4b-f3bd-412d-9cdd-d5863b832b78");

export const oldDb = db;

export const storage = getStorage(app);
export const auth = getAuth(app);

