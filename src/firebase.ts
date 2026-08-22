import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import {
  initializeAuth,
  getAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Connect directly to the production Firestore database
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "arbah-main");
export const oldDb = db;

export const storage = getStorage(app);

// ============================================================
// إصلاح حاسم لمشكلة "permission-denied" بكل عمليات الكتابة:
//
// المشكلة كانت أن تسجيل الدخول الفعلي بـ Firebase Auth ينجح، لكن الجلسة
// لا تُحفظ إطلاقًا بالمتصفح (لا يوجد أي مفتاح firebase:authUser بالتخزين)،
// فتضيع فور أي تنقّل داخل الصفحة. النتيجة: كل عملية كتابة لاحقة على
// قاعدة البيانات تُرفض بـ permission-denied لأن القواعد تشترط isSignedIn()،
// بينما المستخدم يبدو "داخل الموقع" لأن القراءة مسموحة للجميع.
//
// السبب: getAuth() بدون تحديد آلية الحفظ (persistence) قد يقع على وضع
// التخزين بالذاكرة فقط (inMemory) في بعض المتصفحات/الإعدادات.
//
// الحل: تحديد ترتيب تفضيلي صريح لآلية حفظ الجلسة:
//   1) IndexedDB   (الأفضل والأكثر ثباتًا)
//   2) localStorage (بديل موثوق)
//   3) sessionStorage (حل أخير قبل الذاكرة المؤقتة)
//
// نستخدم try/catch لأن initializeAuth تُرمى إن كانت auth مُهيّأة مسبقًا
// (مثلاً عند إعادة تحميل الوحدات في وضع التطوير)، فنرجع للنسخة القائمة.
// ============================================================
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: [
      indexedDBLocalPersistence,
      browserLocalPersistence,
      browserSessionPersistence
    ]
  });
} catch (e) {
  console.warn('initializeAuth already initialized, falling back to getAuth:', e);
  authInstance = getAuth(app);
}

export const auth = authInstance;
