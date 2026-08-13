import { 
  collection, 
  doc, 
  setDoc as rawSetDoc, 
  getDoc as rawGetDoc, 
  getDocs as rawGetDocs, 
  query, 
  where, 
  updateDoc as rawUpdateDoc, 
  increment,
  deleteDoc as rawDeleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db, oldDb, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { User, Deposit, Withdrawal, SystemSettings, Task, SupportMessage, SupportChat, SupportFaq, UserNotification } from './types';

// Password Hashing Helper (SHA-256)
export async function hashPassword(password: string): Promise<string> {
  if (!password) return '';
  try {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `h_${Math.abs(hash)}`;
  }
}

// Let's keep a state flag for Local Storage fallback mode
let useLocalStorageFallback = false;
// Clear sticky offline fallback on load to automatically heal and reconnect to Firestore when Blaze plan is active or quota resets!
try {
  localStorage.removeItem('oxlo_quota_fallback_active');
} catch (e) {
  console.warn(e);
}
let bypassFallback = false;

function checkForQuotaExceeded(error: any) {
  if (!error) return;
  const errMsg = error.message || String(error);
  if (
    errMsg.includes('Quota exceeded') ||
    errMsg.includes('quota') ||
    errMsg.includes('Quota limit exceeded') ||
    errMsg.includes('RESOURCE_EXHAUSTED') ||
    errMsg.includes('quota-exceeded')
  ) {
    if (!useLocalStorageFallback) {
      console.warn("⚠️ Firebase Quota Limit Exceeded detected! Activating Local Storage Fallback Mode.");
      useLocalStorageFallback = true;
      try {
        localStorage.setItem('oxlo_quota_fallback_active', 'true');
      } catch (e) {}
      try {
        window.dispatchEvent(new Event('quota_fallback_activated'));
      } catch (e) {}
    }
  }
}

// Helper to force timeout on hanging Firestore promises
const FIRESTORE_TIMEOUT_MS = 12000;
function withTimeout<T>(promise: Promise<T>, ms: number = FIRESTORE_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('firestore-operation-timeout')), ms)
    )
  ]);
}

function safeOnSnapshot(
  queryOrRef: any,
  onNext: (snapshot: any) => void,
  onError?: (error: any) => void,
  fallbackAction?: () => void
): () => void {
  if (useLocalStorageFallback) {
    if (fallbackAction) fallbackAction();
    return () => {};
  }

  let unsubscribe: (() => void) | null = null;
  let isUnsubscribed = false;

  const cleanup = () => {
    isUnsubscribed = true;
    if (unsubscribe) {
      try {
        unsubscribe();
      } catch (_) {}
      unsubscribe = null;
    }
  };

  try {
    unsubscribe = onSnapshot(queryOrRef, (snapshot) => {
      if (!isUnsubscribed) {
        onNext(snapshot);
      }
    }, (error) => {
      checkForQuotaExceeded(error);
      // Immediately cleanup to stop Firebase JS SDK from retrying in the background with backoff delay
      cleanup();
      if (onError) onError(error);
      if (fallbackAction) fallbackAction();
    });

    if (isUnsubscribed && unsubscribe) {
      cleanup();
    }

    return cleanup;
  } catch (error) {
    checkForQuotaExceeded(error);
    if (fallbackAction) fallbackAction();
    return () => {};
  }
}

// Wrapped safe Firestore functions that intercept Quota Exceeded errors
async function getDoc(ref: any): Promise<any> {
  try {
    if (useLocalStorageFallback && !bypassFallback) {
      throw new Error("local-fallback-active");
    }
    return await withTimeout(rawGetDoc(ref));
  } catch (error: any) {
    checkForQuotaExceeded(error);
    throw error;
  }
}

async function getDocs(q: any): Promise<any> {
  try {
    if (useLocalStorageFallback && !bypassFallback) {
      throw new Error("local-fallback-active");
    }
    return await withTimeout(rawGetDocs(q));
  } catch (error: any) {
    checkForQuotaExceeded(error);
    throw error;
  }
}

async function setDoc(ref: any, data: any, options?: any): Promise<any> {
  try {
    if (useLocalStorageFallback && !bypassFallback) {
      throw new Error("local-fallback-active");
    }
    return await withTimeout(rawSetDoc(ref, data, options));
  } catch (error: any) {
    checkForQuotaExceeded(error);
    throw error;
  }
}

async function updateDoc(ref: any, data: any): Promise<any> {
  try {
    if (useLocalStorageFallback && !bypassFallback) {
      throw new Error("local-fallback-active");
    }
    return await withTimeout(rawUpdateDoc(ref, data));
  } catch (error: any) {
    checkForQuotaExceeded(error);
    throw error;
  }
}

async function deleteDoc(ref: any): Promise<any> {
  try {
    if (useLocalStorageFallback && !bypassFallback) {
      throw new Error("local-fallback-active");
    }
    return await withTimeout(rawDeleteDoc(ref));
  } catch (error: any) {
    checkForQuotaExceeded(error);
    throw error;
  }
}

export const defaultSupportFaqs = [
  {
    question: "متى تأسست المنصة؟",
    answer: "تأسست منصة oxlo في تاريخ 2026/05/03 لتكون المنصة الرائدة في المهام الرقمية وأرباح USDT."
  },
  {
    question: "ما هي منصة oxlo وكيف تعمل؟",
    answer: "منصة oxlo هي منصة ذكية لتأدية المهام المصغرة اليومية لزيادة الدخل. تتيح للمشتركين تحقيق أرباح يومية مستقرة من خلال تنفيذ مهام الاشتراك والإعجاب والمتابعة عبر يوتيوب أو فيسبوك وتأكيدها بلقطة شاشة."
  },
  {
    question: "ما هي باقات VIP والأرباح اليومية؟",
    answer: "الباقات المتاحة في oxlo:\n• A1: اشتراك $50 / ربح يومي $2 USDT\n• A2: اشتراك $100 / ربح يومي $4 USDT\n• B1: اشتراك $300 / ربح يومي $9 USDT\n• B2: اشتراك $600 / ربح يومي $22 USDT\n• C1: اشتراك $1200 / ربح يومي $45 USDT"
  },
  {
    question: "كيف يمكنني شحن حسابي وترقية VIP؟",
    answer: "يمكنك شحن رصيدك بالذهاب إلى 'المركز الشخصي' ثم 'شحن الحساب' والنسخ لعنوان المحفظة (USDT POLYGON أو TRC20 أو BEP20) وإرسال المبلغ (25 USDT كحد أدنى). بعد التحويل، أرفق لقطة شاشة الإيصال والهاش ليعتمدها المدير. لتفعيل الـ VIP، انتقل لتبويب 'المنصب' واشترك في الباقة المناسبة."
  },
  {
    question: "ما هي أوقات العمل والعطلات الرسمية؟",
    answer: "أوقات تنفيذ واعتماد المهام اليومية:\n• الفترة الأولى: 02:00 ظهراً حتى 05:00 عصراً.\n• الفترة الثانية: 09:00 مساءً حتى 12:00 منتصف الليل (بتوقيت مكة/العراق).\nالعطلة الأسبوعية: الجمعة والسبت عطلة رسمية (لا توجد مهام إطلاقاً)، بينما شحن الرصيد متاح 24/7."
  },
  {
    question: "ما هي شروط وأوقات سحب الأرباح والرسوم؟",
    answer: "الحد الأدنى للسحب هو 2 USDT عبر شبكات (POLYGON, TRC20, BEP20). أوقات طلب السحب يومياً من الساعة 12:00 ظهراً حتى 12:00 ليلاً. توجد رسوم سحب بنسبة 15% وتستغرق معالجة طلب السحب خلال 24 ساعة كأقصى حد."
  },
  {
    question: "ما هي رواتب القادة والعمولات؟",
    answer: "تحصل على عمولة فورية بنسبة 10% من دخل أرباح المهام اليومية لكل عضو مباشر يسجل ويشترك برابطك. كما توجد رواتب ثابتة تُصرف كل 10 أيام لقادة B1 و B2 عند بناء فريق نشط (من 3 إلى 10 أعضاء)."
  }
];

export function isFallbackMode(): boolean {
  return useLocalStorageFallback;
}

export function setFallbackMode(val: boolean) {
  useLocalStorageFallback = val;
}

// Local Storage Getters and Setters
function getLocalUsers(): Record<string, User> {
  let users: Record<string, User> = {};
  const saved = localStorage.getItem('local_db_users');
  if (saved) {
    try {
      users = JSON.parse(saved);
    } catch (e) {
      users = {};
    }
  }
  
  // Purge any old admin accounts so that ONLY 07519952000 is admin
  const adminPhone = "07519952000";
  Object.keys(users).forEach(key => {
    if (key !== adminPhone && users[key]?.phone !== adminPhone && users[key]?.role === "admin") {
      users[key].role = "user";
    }
  });
  if (users["07712345678"]) {
    delete users["07712345678"];
  }

  // Ensure the single fixed admin account is ALWAYS present and updated in local storage
  users[adminPhone] = {
    id: adminPhone,
    username: "المدير العام",
    phone: adminPhone,
    password: "07519952000",
    rawPassword: "07519952000",
    inviteCode: "K92W84",
    earnings: 1000,
    taskIncome: 500,
    effectiveDays: 365,
    role: "admin",
    createdAt: users[adminPhone]?.createdAt || new Date().toISOString()
  };
  
  localStorage.setItem('local_db_users', JSON.stringify(users));
  return users;
}

function saveLocalUsers(users: Record<string, User>) {
  localStorage.setItem('local_db_users', JSON.stringify(users));
}

function getLocalSettings(): SystemSettings {
  const saved = localStorage.getItem('local_db_settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Ensure any missing fields are filled with defaults
      return {
        siteName: (parsed.siteName && parsed.siteName !== "BET") ? parsed.siteName : "OXLO",
        rechargeAddress: parsed.rechargeAddress ?? "e738819b080a278d",
        rechargeAddressTRC20: parsed.rechargeAddressTRC20 ?? "sfnmQtKLfcDarAMd",
        rechargeAddressBEP20: parsed.rechargeAddressBEP20 ?? "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        telegramLink: parsed.telegramLink ?? "-fhzo.vercel.app",
        minDeposit: parsed.minDeposit ?? 25,
        minWithdrawal: parsed.minWithdrawal ?? 2,
        holidayActive: parsed.holidayActive ?? false,
        holidayDays: parsed.holidayDays ?? [5], // Default to Friday
        globalNotification: parsed.globalNotification ?? "مرحباً بكم في منصتنا الميكروية الجديدة! ابدأ بالعمل اليوم وزد أرباحك.",
        withdrawLockActive: parsed.withdrawLockActive ?? false,
        withdrawLockDays: parsed.withdrawLockDays ?? [5],
        withdrawRatesInfo: parsed.withdrawRatesInfo ?? "رسوم معالجة السحب 15% - سعر الصرف مستقر",
        rechargeNotice: parsed.rechargeNotice ?? "يرجى تحويل المبلغ المحدد فقط وتصوير إثبات التحويل لضمان سرعة معالجة شحن حسابك.",
        rechargeNotice2: parsed.rechargeNotice2 ?? "",
        withdrawNotice: parsed.withdrawNotice ?? "تنبيه: يتم معالجة طلبات السحب خلال 24 ساعة كحد أقصى.",
        withdrawNotice2: parsed.withdrawNotice2 ?? "",
        vipPlans: (parsed.vipPlans && Array.isArray(parsed.vipPlans)) ? parsed.vipPlans : [
          
          { id: 'plan_A1', name: 'A1', price: 300, profit: 9, tasksCount: 5 },
          { id: 'plan_A2', name: 'A2', price: 600, profit: 18, tasksCount: 5 },
          { id: 'plan_B1', name: 'B1', price: 1200, profit: 38, tasksCount: 5 },
          { id: 'plan_B2', name: 'B2', price: 2600, profit: 65, tasksCount: 5 },
          { id: 'plan_C1', name: 'C1', price: 5000, profit: 162, tasksCount: 5 },
          { id: 'plan_C2', name: 'C2', price: 12000, profit: 360, tasksCount: 5 },
          { id: 'plan_D1', name: 'D1', price: 26000, profit: 750, tasksCount: 5 },
          { id: 'plan_D2', name: 'D2', price: 65000, profit: 1620, tasksCount: 5 },
          { id: 'plan_business', name: 'business', price: 90000, profit: 2550, tasksCount: 5 }
        ],
        workingHoursNotice: parsed.workingHoursNotice ?? "💡 تنويه هام لجميع الأعضاء: يرجى العلم بأن أوقات العمل الرسمية لتنفيذ واعتماد المهام اليومية مقسمة على فترتين يومياً:\n- الفترة الأولى: من الساعة 02:00 ظهراً وحتى 05:00 عصراً.\n- الفترة الثانية: من الساعة 09:00 مساءً وحتى 12:00 منتصف الليل بتوقيت مكة المكرمة.",
        enforceWorkingHours: parsed.enforceWorkingHours ?? true,
        workStartHour: parsed.workStartHour !== undefined ? Number(parsed.workStartHour) : 14,
        workEndHour: parsed.workEndHour !== undefined ? Number(parsed.workEndHour) : 17,
        workStartHour2: parsed.workStartHour2 !== undefined ? Number(parsed.workStartHour2) : 21,
        workEndHour2: parsed.workEndHour2 !== undefined ? Number(parsed.workEndHour2) : 0,
        supportAgentName: (parsed.supportAgentName && !parsed.supportAgentName.includes("مريم")) ? parsed.supportAgentName : "دعم فني منصة oxlo",
        supportAgentSubtitle: (parsed.supportAgentSubtitle && !parsed.supportAgentSubtitle.includes("المالية") && !parsed.supportAgentSubtitle.includes("Mis")) ? parsed.supportAgentSubtitle : "مستشارتك المساعدة في oxlo",
        supportAgentAvatar: parsed.supportAgentAvatar ?? "",
        supportFaqs: (parsed.supportFaqs && parsed.supportFaqs.length > 4 && parsed.supportFaqs.some((f: any) => f.question.includes("تأسست"))) ? parsed.supportFaqs : defaultSupportFaqs,
        tasksCode: parsed.tasksCode ?? "",
        hideTrialPlans: parsed.hideTrialPlans !== undefined ? Boolean(parsed.hideTrialPlans) : false
      };
    } catch (e) {
      // JSON parse error, fall through to default
    }
  }
  const initial: SystemSettings = {
    siteName: "OXLO",
    rechargeAddress: "e738819b080a278d",
    rechargeAddressTRC20: "sfnmQtKLfcDarAMd",
    rechargeAddressBEP20: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    telegramLink: "-fhzo.vercel.app",
    minDeposit: 25,
    minWithdrawal: 2,
    holidayActive: false,
    holidayDays: [5], // Default to Friday
    globalNotification: "مرحباً بكم في منصتنا الميكروية الجديدة! ابدأ بالعمل اليوم وزد أرباحك.",
    withdrawLockActive: false,
    withdrawLockDays: [5],
    withdrawRatesInfo: "رسوم معالجة السحب 15% - سعر الصرف مستقر",
    rechargeNotice: "يرجى تحويل المبلغ المحدد فقط وتصوير إثبات التحويل لضمان سرعة معالجة شحن حسابك.",
    rechargeNotice2: "",
    withdrawNotice: "تنبيه: يتم معالجة طلبات السحب خلال 24 ساعة كحد أقصى.",
    withdrawNotice2: "",
    vipPlans: [
      
      { id: 'plan_A1', name: 'A1', price: 300, profit: 9, tasksCount: 5 },
      { id: 'plan_A2', name: 'A2', price: 600, profit: 18, tasksCount: 5 },
      { id: 'plan_B1', name: 'B1', price: 1200, profit: 38, tasksCount: 5 },
      { id: 'plan_B2', name: 'B2', price: 2600, profit: 65, tasksCount: 5 },
      { id: 'plan_C1', name: 'C1', price: 5000, profit: 162, tasksCount: 5 },
      { id: 'plan_C2', name: 'C2', price: 12000, profit: 360, tasksCount: 5 },
      { id: 'plan_D1', name: 'D1', price: 26000, profit: 750, tasksCount: 5 },
      { id: 'plan_D2', name: 'D2', price: 65000, profit: 1620, tasksCount: 5 },
      { id: 'plan_business', name: 'business', price: 90000, profit: 2550, tasksCount: 5 }
    ],
    workingHoursNotice: "💡 تنويه هام لجميع الأعضاء: يرجى العلم بأن أوقات العمل الرسمية لتنفيذ واعتماد المهام اليومية مقسمة على فترتين يومياً:\n- الفترة الأولى: من الساعة 02:00 ظهراً وحتى 05:00 عصراً.\n- الفترة الثانية: من الساعة 09:00 مساءً وحتى 12:00 منتصف الليل بتوقيت مكة المكرمة.",
    enforceWorkingHours: true,
    workStartHour: 14,
    workEndHour: 17,
    workStartHour2: 21,
    workEndHour2: 0,
    supportAgentName: "دعم فني منصة oxlo",
    supportAgentSubtitle: "مستشارتك المساعدة في oxlo",
    supportAgentAvatar: "",
    supportFaqs: defaultSupportFaqs,
    tasksCode: "",
    hideTrialPlans: false
  };
  localStorage.setItem('local_db_settings', JSON.stringify(initial));
  return initial;
}

function saveLocalSettings(settings: SystemSettings) {
  localStorage.setItem('local_db_settings', JSON.stringify(settings));
}

function getLocalDeposits(): Record<string, Deposit> {
  const saved = localStorage.getItem('local_db_deposits');
  return saved ? JSON.parse(saved) : {};
}

function saveLocalDeposits(deposits: Record<string, Deposit>) {
  localStorage.setItem('local_db_deposits', JSON.stringify(deposits));
}

function getLocalWithdrawals(): Record<string, Withdrawal> {
  const saved = localStorage.getItem('local_db_withdrawals');
  return saved ? JSON.parse(saved) : {};
}

function saveLocalWithdrawals(withdrawals: Record<string, Withdrawal>) {
  localStorage.setItem('local_db_withdrawals', JSON.stringify(withdrawals));
}

// Helper to generate custom invite codes
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Migration helper: copies data from old cached named DB into the new online default DB
export async function migrateOldCachedDataToNewDb(force: boolean = false) {
  const isMigrated = localStorage.getItem('oxlo_premium_migration_done_v1');
  if ((isMigrated === 'true' || oldDb === db) && !force) {
    localStorage.setItem('oxlo_premium_migration_done_v1', 'true');
    return { success: true, counts: {}, alreadyDone: true };
  }

  if (force) {
    localStorage.removeItem('oxlo_quota_fallback_active');
    useLocalStorageFallback = false;
  }

  const report: Record<string, number> = {};
  bypassFallback = true;

  try {
    const collectionsToMigrate = [
      "users",
      "settings",
      "deposits",
      "withdrawals",
      "tasks",
      "support_chats",
      "support_messages",
      "support_faqs",
      "notifications"
    ];

    for (const colName of collectionsToMigrate) {
      try {
        const snapshot = await getDocs(collection(oldDb, colName));
        if (!snapshot.empty) {
          console.log(`Found ${snapshot.size} documents in old cached collection: ${colName}. Migrating...`);
          let copiedCount = 0;
          for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const newDocRef = doc(db, colName, docSnap.id);
            await setDoc(newDocRef, data, { merge: true });
            copiedCount++;
          }
          report[colName] = copiedCount;
        } else {
          report[colName] = 0;
        }
      } catch (err: any) {
        console.warn(`Error migrating collection ${colName}:`, err.message);
        report[colName] = -1; // Flag as error
      }
    }

    localStorage.setItem('oxlo_premium_migration_done_v1', 'true');
    console.log("Successfully completed database migration!", report);
    return { success: true, counts: report, alreadyDone: false };
  } catch (error: any) {
    console.error("Critical error in database migration process:", error.message);
    return { success: false, error: error.message, counts: report };
  } finally {
    bypassFallback = false;
  }
}

// Check and Initialize Admin & System Settings if not exist
export async function initializeDatabase() {
  // Always trigger the migration process first asynchronously
  migrateOldCachedDataToNewDb().catch(err => {
    console.warn("Migration trigger error:", err);
  });

  try {
    // 1. Initialize Admin
    const adminPhone = "07519952000";
    const adminRef = doc(db, "users", adminPhone);

    const hashedPassword = await hashPassword("07519952000");
    const adminUser: User = {
      id: adminPhone,
      username: "المدير العام",
      phone: adminPhone,
      password: hashedPassword,
      rawPassword: "07519952000",
      inviteCode: "K92W84",
      earnings: 1000,
      taskIncome: 500,
      effectiveDays: 365,
      role: "admin",
      createdAt: new Date().toISOString()
    };
    // Always write/merge the new fixed admin credentials to guarantee it is initialized correctly
    await setDoc(adminRef, adminUser, { merge: true });
    // Remove old default admin account from Firestore if present
    await deleteDoc(doc(db, "users", "07712345678")).catch(() => {});

    // Sync any local storage users to Firestore so they are globally shared across normal and incognito browsers
    const localUsers = getLocalUsers();
    await Promise.all(
      Object.keys(localUsers).map(phoneKey => {
        const u = localUsers[phoneKey];
        if (u && phoneKey) {
          return setDoc(doc(db, "users", phoneKey), u, { merge: true }).catch(() => {});
        }
        return Promise.resolve();
      })
    );

    // Sync local deposits to Firestore
    const localDeposits = getLocalDeposits();
    await Promise.all(
      Object.keys(localDeposits).map(depId => {
        const d = localDeposits[depId];
        if (d && depId) {
          return setDoc(doc(db, "deposits", depId), d, { merge: true }).catch(() => {});
        }
        return Promise.resolve();
      })
    );

    // Sync local withdrawals to Firestore
    const localWithdrawals = getLocalWithdrawals();
    await Promise.all(
      Object.keys(localWithdrawals).map(withId => {
        const w = localWithdrawals[withId];
        if (w && withId) {
          return setDoc(doc(db, "withdrawals", withId), w, { merge: true }).catch(() => {});
        }
        return Promise.resolve();
      })
    );

    console.log("Admin account and local data synchronized successfully with shared Firestore database!");

    // 2. Initialize System Settings
    const settingsRef = doc(db, "settings", "general");
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      const defaultSettings: SystemSettings = {
        siteName: "OXLO",
        rechargeAddress: "e738819b080a278d",
        rechargeAddressTRC20: "sfnmQtKLfcDarAMd",
        rechargeAddressBEP20: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        telegramLink: "-fhzo.vercel.app",
        minDeposit: 25,
        minWithdrawal: 2,
        holidayActive: false,
        holidayDays: [5] // Default to Friday
      };
      await setDoc(settingsRef, defaultSettings);
      console.log("Default settings initialized successfully in Firestore!");
    }
  } catch (error) {
    console.warn("Error initializing database (using local defaults if offline):", error);
    getLocalUsers();
    getLocalSettings();
  }
}

// 1. Get user by phone
export async function getUserByPhone(phone: string): Promise<User | null> {
  const cleanPhone = phone.trim();
  const digitsOnly = cleanPhone.replace(/\D/g, '');
  const localUsers = getLocalUsers();

  // If in local fallback mode, check cache FIRST for instant response
  if (useLocalStorageFallback) {
    if (localUsers[cleanPhone]) {
      return localUsers[cleanPhone];
    }
    const foundLocal = Object.values(localUsers).find(u => {
      const uDigits = (u.phone || '').replace(/\D/g, '');
      return uDigits === digitsOnly || (digitsOnly.length >= 7 && uDigits.endsWith(digitsOnly.slice(-7)));
    });
    if (foundLocal) {
      return foundLocal;
    }
  }

  // Try Firestore FIRST to get latest changes (admin updates, plan shifts, etc.)
  try {
    const docRef = doc(db, "users", cleanPhone);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as User;
      localUsers[cleanPhone] = data;
      saveLocalUsers(localUsers);
      return data;
    }

    const q = query(collection(db, "users"), where("phone", "==", cleanPhone));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data() as User;
      localUsers[cleanPhone] = data;
      saveLocalUsers(localUsers);
      return data;
    }

    // If Firestore doesn't find it but it exists in local storage, return local
    if (localUsers[cleanPhone]) {
      return localUsers[cleanPhone];
    }
    return null;
  } catch (error) {
    console.warn("Firestore getUserByPhone error, using local cache fallback:", error);
    if (localUsers[cleanPhone]) {
      return localUsers[cleanPhone];
    }
    const foundLocal = Object.values(localUsers).find(u => {
      const uDigits = (u.phone || '').replace(/\D/g, '');
      return uDigits === digitsOnly || (digitsOnly.length >= 7 && uDigits.endsWith(digitsOnly.slice(-7)));
    });
    return foundLocal || null;
  }
}

// 2. Create standard user
export async function registerUser(username: string, phone: string, password: string, referrerCode: string): Promise<User> {
  const cleanPhone = phone.trim();
  const cleanRefCode = (referrerCode || '').trim().toUpperCase();
  
  // Mandatory invite code check
  if (!cleanRefCode) {
    throw new Error("رمز الدعوة إجباري لإنشاء حساب جديد! يرجى إدخال رمز دعوة صالح أو التسجيل عبر رابط إحالة.");
  }

  // Check if user already exists BEFORE creating
  const existing = await getUserByPhone(cleanPhone);
  if (existing) {
    throw new Error("رقم الهاتف مسجل بالفعل!");
  }

  // Validate referrer code
  const localUsers = getLocalUsers();
  let finalReferrer: string | undefined = undefined;
  let referrerUser: User | null = null;

  if (cleanRefCode === 'ADMIN95' || cleanRefCode === 'OXLO95' || cleanRefCode === 'BET95') {
    finalReferrer = cleanRefCode;
  } else {
    const referrerInLocal = Object.values(localUsers).find(u => u.inviteCode && u.inviteCode.trim().toUpperCase() === cleanRefCode);
    if (referrerInLocal) {
      finalReferrer = referrerInLocal.inviteCode;
      referrerUser = referrerInLocal;
    } else {
      try {
        const q = query(collection(db, "users"), where("inviteCode", "==", cleanRefCode));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          referrerUser = querySnapshot.docs[0].data() as User;
          finalReferrer = referrerUser.inviteCode || cleanRefCode;
        } else {
          finalReferrer = cleanRefCode;
        }
      } catch (err: any) {
        finalReferrer = cleanRefCode;
      }
    }
  }

  // Hash password before storing
  const hashedPassword = await hashPassword(password);

  // Detect location silently at registration (timeout 1.5s to avoid slowness)
  let locData: any = {};
  try {
    const { detectUserLocation } = await import('./locationService');
    const locPromise = detectUserLocation();
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 1500));
    const loc: any = await Promise.race([locPromise, timeoutPromise]);
    if (loc) {
      locData = {
        country: loc.country,
        countryCode: loc.countryCode,
        region: loc.region,
        city: loc.city,
        ip: loc.ip,
        lastLocationUpdate: new Date().toISOString()
      };
    }
  } catch (locErr) {
    console.warn("Silent registration location check skipped:", locErr);
  }

  const newUser: User = {
    id: cleanPhone,
    username,
    phone: cleanPhone,
    password: hashedPassword,
    rawPassword: password,
    inviteCode: generateInviteCode(),
    referrerCode: finalReferrer,
    walletAddress: "",
    earnings: 0,
    taskIncome: 0,
    effectiveDays: 0,
    role: "user",
    vipTier: "",
    vipStartDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    isOnline: true,
    ...locData
  };

  // 1. Save to local storage cache immediately
  const currentLocalUsers = getLocalUsers();
  currentLocalUsers[cleanPhone] = newUser;
  saveLocalUsers(currentLocalUsers);

  // Clear any existing cached tasks and notifications for this cleanPhone to prevent old data from leaking
  try {
    localStorage.removeItem(`micro_tasks_data_${cleanPhone}`);
    localStorage.removeItem('micro_tasks_data');
    localStorage.removeItem('local_db_notifications');
  } catch (e) {
    console.warn("Error clearing old storage on register:", e);
  }

  // 2. Write to Firestore database (if it fails/times out, we log warning and proceed with local user)
  try {
    await setDoc(doc(db, "users", cleanPhone), newUser);
    console.log("Successfully saved new user to Firestore database:", cleanPhone);
  } catch (error: any) {
    console.warn("Firestore registerUser write warning (proceeding with local user):", error);
  }

  // 3. Trigger Referral Notifications in background
  const notifMsg = `🔔 انضم موظف/عضو جديد إلى فريقك: ${username} (${cleanPhone}) عبر رمز دعوتك!`;
  
  if (referrerUser && (referrerUser.phone || referrerUser.id)) {
    const refTarget = referrerUser.phone || referrerUser.id;
    createNotification(refTarget, notifMsg).catch(e => console.warn(e));
  } else if (cleanRefCode) {
    createNotification(cleanRefCode, notifMsg).catch(e => console.warn(e));
  }

  if (cleanRefCode === 'ADMIN95' || cleanRefCode === 'OXLO95' || cleanRefCode === 'BET95') {
    createNotification('admin', notifMsg).catch(e => console.warn(e));
  }

  // Send welcome notification
  const welcomeMsg = `🎉 أهلاً وسهلاً بك يا ${username}! تم إنشاء حسابك وانضمامك بنجاح عبر رمز الدعوة (${cleanRefCode}).`;
  createNotification(cleanPhone, welcomeMsg).catch(e => console.warn(e));

  return newUser;
}

// Record User Login Time & Online Status
export async function recordUserLogin(phone: string): Promise<void> {
  if (!phone) return;
  const now = new Date().toISOString();
  const updates = {
    lastLoginAt: now,
    lastActiveAt: now,
    isOnline: true
  };

  // 1. Local storage update
  const users = getLocalUsers();
  if (users[phone]) {
    users[phone] = { ...users[phone], ...updates };
    saveLocalUsers(users);
  }

  // 2. Firestore update
  try {
    const userRef = doc(db, "users", phone);
    await updateDoc(userRef, updates);
  } catch (err) {
    console.warn("recordUserLogin Firestore error:", err);
  }
}

// Record User Logout Time & Offline Status
export async function recordUserLogout(phone: string): Promise<void> {
  if (!phone) return;
  const now = new Date().toISOString();
  const updates = {
    lastLogoutAt: now,
    lastActiveAt: now,
    isOnline: false
  };

  // 1. Local storage update
  const users = getLocalUsers();
  if (users[phone]) {
    users[phone] = { ...users[phone], ...updates };
    saveLocalUsers(users);
  }

  // 2. Firestore update
  try {
    const userRef = doc(db, "users", phone);
    await updateDoc(userRef, updates);
  } catch (err) {
    console.warn("recordUserLogout Firestore error:", err);
  }
}

// Heartbeat to keep lastActiveAt fresh and isOnline true
export async function recordUserActivity(phone: string): Promise<void> {
  if (!phone) return;
  const now = new Date().toISOString();
  const updates = {
    lastActiveAt: now,
    isOnline: true
  };

  // 1. Local storage update
  const users = getLocalUsers();
  if (users[phone]) {
    users[phone] = { ...users[phone], ...updates };
    saveLocalUsers(users);
  }

  // 2. Firestore update
  try {
    const userRef = doc(db, "users", phone);
    await updateDoc(userRef, updates);
  } catch (err) {
    console.warn("recordUserActivity Firestore error:", err);
  }
}

// 3. Update User Statistics (Admin function or task complete)
export async function updateUserStats(phone: string, updates: Partial<Pick<User, 'earnings' | 'taskIncome' | 'effectiveDays' | 'vipStartDate'>>) {
  // Safeguard against NaN values
  const safeUpdates: typeof updates = {};
  if (updates.earnings !== undefined) {
    safeUpdates.earnings = isNaN(updates.earnings) ? 0 : updates.earnings;
  }
  if (updates.taskIncome !== undefined) {
    safeUpdates.taskIncome = isNaN(updates.taskIncome) ? 0 : updates.taskIncome;
  }
  if (updates.effectiveDays !== undefined) {
    safeUpdates.effectiveDays = isNaN(updates.effectiveDays) ? 0 : updates.effectiveDays;
  }
  if (updates.vipStartDate !== undefined) {
    safeUpdates.vipStartDate = updates.vipStartDate;
  }

  // ALWAYS write to local cache to keep them perfectly synced!
  const users = getLocalUsers();
  if (users[phone]) {
    users[phone] = {
      ...users[phone],
      earnings: safeUpdates.earnings !== undefined ? safeUpdates.earnings : users[phone].earnings,
      taskIncome: safeUpdates.taskIncome !== undefined ? safeUpdates.taskIncome : users[phone].taskIncome,
      effectiveDays: safeUpdates.effectiveDays !== undefined ? safeUpdates.effectiveDays : users[phone].effectiveDays,
      vipStartDate: safeUpdates.vipStartDate !== undefined ? safeUpdates.vipStartDate : users[phone].vipStartDate
    };
    saveLocalUsers(users);
  }

  if (useLocalStorageFallback) {
    return;
  }

  try {
    const userRef = doc(db, "users", phone);
    await updateDoc(userRef, safeUpdates);
  } catch (error) {
    console.warn("Firestore updateUserStats error, falling back:", error);
    setFallbackMode(true);
  }
}

// 3.5 Credit 10% Referrer Commission when a team member completes a task
export async function creditReferrerCommission(childPhone: string, rewardValue: number, childUsername: string): Promise<void> {
  if (!childPhone || rewardValue <= 0) return;

  const commission = Number((rewardValue * 0.10).toFixed(2));
  if (commission <= 0) return;

  let referrerPhone: string | null = null;
  let childReferrerCode = "";

  // 1. Find child user and their referrerCode
  const localUsers = getLocalUsers();
  const childUser = localUsers[childPhone];
  if (childUser && childUser.referrerCode) {
    childReferrerCode = childUser.referrerCode.trim().toUpperCase();
  }

  if (useLocalStorageFallback) {
    if (!childReferrerCode) return;
    const referrerInLocal = Object.values(localUsers).find(u => u.inviteCode && u.inviteCode.trim().toUpperCase() === childReferrerCode);
    if (referrerInLocal) {
      referrerPhone = referrerInLocal.phone;
    }
  } else {
    try {
      // If we don't have local childReferrerCode, fetch child doc from firestore first
      if (!childReferrerCode) {
        const childRef = doc(db, "users", childPhone);
        const childSnap = await getDoc(childRef);
        if (childSnap.exists()) {
          const cData = childSnap.data() as User;
          if (cData.referrerCode) {
            childReferrerCode = cData.referrerCode.trim().toUpperCase();
          }
        }
      }

      if (childReferrerCode) {
        // Query user with inviteCode == childReferrerCode
        const q = query(collection(db, "users"), where("inviteCode", "==", childReferrerCode));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const referrerDoc = querySnapshot.docs[0];
          referrerPhone = referrerDoc.id; // user document ID is phone
        }
      }
    } catch (err) {
      console.warn("Firestore error in creditReferrerCommission finding referrer:", err);
    }
  }

  // If referrer is found, increment their earnings (credit balance) and send notification!
  if (referrerPhone) {
    const notifMsg = `💰 حصلت على عمولة قدرها ${commission} USDT من إتمام العضو (${childUsername}) لمهمته بنجاح!`;

    // 1. Update in local storage
    const updatedLocalUsers = getLocalUsers();
    if (updatedLocalUsers[referrerPhone]) {
      updatedLocalUsers[referrerPhone].earnings = Number((updatedLocalUsers[referrerPhone].earnings + commission).toFixed(2));
      saveLocalUsers(updatedLocalUsers);
    }

    // 2. Update in firestore
    if (!useLocalStorageFallback) {
      try {
        const refUserRef = doc(db, "users", referrerPhone);
        await updateDoc(refUserRef, {
          earnings: increment(commission)
        });
      } catch (err) {
        console.warn("Firestore error in creditReferrerCommission updating referrer:", err);
      }
    }

    // Send notification to referrer
    try {
      await createNotification(referrerPhone, notifMsg);
    } catch (nErr) {
      console.warn("Error triggering commission notification:", nErr);
    }
  }
}

// 4. Update User Wallet
export async function updateUserWallet(phone: string, walletAddress: string) {
  if (useLocalStorageFallback) {
    const users = getLocalUsers();
    if (users[phone]) {
      users[phone].walletAddress = walletAddress;
      saveLocalUsers(users);
    }
    return;
  }

  try {
    const userRef = doc(db, "users", phone);
    await updateDoc(userRef, { walletAddress });
  } catch (error) {
    console.warn("Firestore updateUserWallet error, falling back:", error);
    setFallbackMode(true);
    const users = getLocalUsers();
    if (users[phone]) {
      users[phone].walletAddress = walletAddress;
      saveLocalUsers(users);
    }
  }
}

// 4.5 Update User Password
export async function updateUserPassword(phone: string, oldPassword: string, newPassword: string): Promise<User> {
  const cleanPhone = phone.trim();
  const users = getLocalUsers();
  const user = users[cleanPhone] || await getUserByPhone(cleanPhone);

  if (!user) {
    throw new Error("المستخدم غير موجود!");
  }

  if (user.password && user.password !== oldPassword) {
    throw new Error("كلمة المرور القديمة غير صحيحة!");
  }

  if (newPassword.length < 6) {
    throw new Error("يجب أن تتكون كلمة المرور الجديدة من 6 خانات على الأقل!");
  }

  const updatedUser: User = {
    ...user,
    password: newPassword
  };

  users[cleanPhone] = updatedUser;
  saveLocalUsers(users);

  if (!useLocalStorageFallback) {
    try {
      const userRef = doc(db, "users", cleanPhone);
      await updateDoc(userRef, { password: newPassword });
    } catch (error) {
      console.warn("Firestore updateUserPassword error, saved locally:", error);
      setFallbackMode(true);
    }
  }

  return updatedUser;
}

// 5. System Settings functions
export async function getSystemSettings(): Promise<SystemSettings> {
  if (useLocalStorageFallback) {
    return getLocalSettings();
  }

  try {
    const settingsRef = doc(db, "settings", "general");
    const snap = await getDoc(settingsRef);
    if (snap.exists()) {
      const data = snap.data();
      
      // Force update hours to the requested values
      if (data.workStartHour !== 14 || data.workEndHour !== 17 || data.workStartHour2 !== 21 || data.workEndHour2 !== 0) {
        const updated = {
          ...data,
          workStartHour: 14,
          workEndHour: 17,
          workStartHour2: 21,
          workEndHour2: 0,
          workingHoursNotice: "💡 تنويه هام لجميع الأعضاء: يرجى العلم بأن أوقات العمل الرسمية لتنفيذ واعتماد المهام اليومية مقسمة على فترتين يومياً:\n- الفترة الأولى: من الساعة 02:00 ظهراً وحتى 05:00 عصراً.\n- الفترة الثانية: من الساعة 09:00 مساءً وحتى 12:00 منتصف الليل بتوقيت مكة المكرمة."
        };
        setDoc(settingsRef, updated).catch(e => console.warn(e));
        data.workStartHour = 14;
        data.workEndHour = 17;
        data.workStartHour2 = 21;
        data.workEndHour2 = 0;
        data.workingHoursNotice = updated.workingHoursNotice;
      }

      return {
        siteName: data.siteName ?? "BET",
        rechargeAddress: data.rechargeAddress ?? "e738819b080a278d",
        rechargeAddressTRC20: data.rechargeAddressTRC20 ?? "sfnmQtKLfcDarAMd",
        rechargeAddressBEP20: data.rechargeAddressBEP20 ?? "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        telegramLink: data.telegramLink ?? "-fhzo.vercel.app",
        minDeposit: Number(data.minDeposit ?? 25),
        minWithdrawal: Number(data.minWithdrawal ?? 2),
        holidayActive: Boolean(data.holidayActive ?? false),
        holidayDays: data.holidayDays ?? [5],
        globalNotification: data.globalNotification ?? "مرحباً بكم في منصتنا الميكروية الجديدة! ابدأ بالعمل اليوم وزد أرباحك.",
        withdrawLockActive: Boolean(data.withdrawLockActive ?? false),
        withdrawLockDays: data.withdrawLockDays ?? [5],
        withdrawRatesInfo: data.withdrawRatesInfo ?? "رسوم معالجة السحب 15% - سعر الصرف مستقر",
        rechargeNotice: data.rechargeNotice ?? "يرجى تحويل المبلغ المحدد فقط وتصوير إثبات التحويل لضمان سرعة معالجة شحن حسابك.",
        rechargeNotice2: data.rechargeNotice2 ?? "",
        withdrawNotice: data.withdrawNotice ?? "تنبيه: يتم معالجة طلبات السحب خلال 24 ساعة كحد أقصى.",
        withdrawNotice2: data.withdrawNotice2 ?? "",
        vipPlans: (data.vipPlans && Array.isArray(data.vipPlans)) ? data.vipPlans : [
          
          { id: 'plan_A1', name: 'A1', price: 300, profit: 9, tasksCount: 5 },
          { id: 'plan_A2', name: 'A2', price: 600, profit: 18, tasksCount: 5 },
          { id: 'plan_B1', name: 'B1', price: 1200, profit: 38, tasksCount: 5 },
          { id: 'plan_B2', name: 'B2', price: 2600, profit: 65, tasksCount: 5 },
          { id: 'plan_C1', name: 'C1', price: 5000, profit: 162, tasksCount: 5 },
          { id: 'plan_C2', name: 'C2', price: 12000, profit: 360, tasksCount: 5 },
          { id: 'plan_D1', name: 'D1', price: 26000, profit: 750, tasksCount: 5 },
          { id: 'plan_D2', name: 'D2', price: 65000, profit: 1620, tasksCount: 5 },
          { id: 'plan_business', name: 'business', price: 90000, profit: 2550, tasksCount: 5 }
        ],
        workingHoursNotice: data.workingHoursNotice ?? "💡 تنويه هام لجميع الأعضاء: يرجى العلم بأن أوقات العمل الرسمية لتنفيذ واعتماد المهام اليومية مقسمة على فترتين يومياً:\n- الفترة الأولى: من الساعة 02:00 ظهراً وحتى 05:00 عصراً.\n- الفترة الثانية: من الساعة 09:00 مساءً وحتى 12:00 منتصف الليل بتوقيت مكة المكرمة.",
        enforceWorkingHours: data.enforceWorkingHours !== undefined ? Boolean(data.enforceWorkingHours) : true,
        workStartHour: data.workStartHour !== undefined ? Number(data.workStartHour) : 14,
        workEndHour: data.workEndHour !== undefined ? Number(data.workEndHour) : 17,
        workStartHour2: data.workStartHour2 !== undefined ? Number(data.workStartHour2) : 21,
        workEndHour2: data.workEndHour2 !== undefined ? Number(data.workEndHour2) : 0,
        appDownloadUrl: data.appDownloadUrl ?? "",
        supportAgentName: (data.supportAgentName && !data.supportAgentName.includes("مريم")) ? data.supportAgentName : "دعم فني منصة oxlo",
        supportAgentSubtitle: (data.supportAgentSubtitle && !data.supportAgentSubtitle.includes("المالية") && !data.supportAgentSubtitle.includes("Mis")) ? data.supportAgentSubtitle : "مستشارتك المساعدة في oxlo",
        supportAgentAvatar: data.supportAgentAvatar ?? "",
        supportFaqs: (data.supportFaqs && data.supportFaqs.length > 4 && data.supportFaqs.some((f: any) => f.question.includes("تأسست"))) ? data.supportFaqs : defaultSupportFaqs,
        tasksCode: data.tasksCode ?? "",
        hideTrialPlans: data.hideTrialPlans !== undefined ? Boolean(data.hideTrialPlans) : false
      };
    }
    const def = getLocalSettings();
    await setDoc(settingsRef, def);
    return def;
  } catch (error) {
    console.warn("Firestore getSystemSettings error, falling back:", error);
    setFallbackMode(true);
    return getLocalSettings();
  }
}

export async function updateSystemSettings(newSettings: SystemSettings) {
  if (useLocalStorageFallback) {
    saveLocalSettings(newSettings);
    return;
  }

  try {
    const settingsRef = doc(db, "settings", "general");
    await setDoc(settingsRef, newSettings);
  } catch (error) {
    console.warn("Firestore updateSystemSettings error, falling back:", error);
    setFallbackMode(true);
    saveLocalSettings(newSettings);
  }
}

// 6. Deposits
export async function createDeposit(
  userId: string, 
  username: string, 
  phone: string, 
  amount: number, 
  txHash?: string, 
  screenshotUrl?: string,
  currency: string = 'USDT (Polygon)'
): Promise<Deposit> {
  const depositId = `dep_${Date.now()}`;
  const newDeposit: Deposit = {
    id: depositId,
    userId,
    username,
    phone,
    amount,
    currency: currency || 'USDT (Polygon)',
    txHash: txHash || '',
    screenshotUrl: screenshotUrl || '',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  const userMsg = `💳 تم تقديم طلب شحن بقيمة ${amount} ${currency}. الطلب قيد المراجعة.`;
  const adminMsg = `📥 طلب شحن جديد بقيمة ${amount} ${currency} من المستخدم: ${username} (${phone})`;
  const targetUser = phone || userId;
  if (targetUser) createNotification(targetUser, userMsg).catch(() => {});
  createNotification('admin', adminMsg).catch(() => {});

  if (useLocalStorageFallback) {
    const deposits = getLocalDeposits();
    deposits[depositId] = newDeposit;
    saveLocalDeposits(deposits);
    return newDeposit;
  }

  try {
    await setDoc(doc(db, "deposits", depositId), newDeposit);
    return newDeposit;
  } catch (error) {
    console.warn("Firestore createDeposit error, falling back:", error);
    setFallbackMode(true);
    const deposits = getLocalDeposits();
    deposits[depositId] = newDeposit;
    saveLocalDeposits(deposits);
    return newDeposit;
  }
}

export async function getUserDeposits(phone: string): Promise<Deposit[]> {
  if (useLocalStorageFallback) {
    const deposits = Object.values(getLocalDeposits()).filter(d => d.phone === phone);
    return deposits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  try {
    const q = query(collection(db, "deposits"), where("phone", "==", phone));
    const querySnapshot = await getDocs(q);
    const list: Deposit[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Deposit;
      const key = data.id || docSnap.id;
      if (key) {
        list.push({ ...data, id: key });
      }
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn("Firestore getUserDeposits error, falling back:", error);
    setFallbackMode(true);
    const deposits = Object.values(getLocalDeposits()).filter(d => d.phone === phone);
    return deposits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function getAllDeposits(): Promise<Deposit[]> {
  if (useLocalStorageFallback) {
    return Object.values(getLocalDeposits()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  try {
    const querySnapshot = await getDocs(collection(db, "deposits"));
    const list: Deposit[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Deposit;
      const key = data.id || docSnap.id;
      if (key) {
        list.push({ ...data, id: key });
      }
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn("Firestore getAllDeposits error, falling back:", error);
    setFallbackMode(true);
    return Object.values(getLocalDeposits()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function updateDepositStatus(depositId: string, status: 'approved' | 'rejected', phone: string, amount: number) {
  const notifMsg = status === 'approved' 
    ? `✅ تم قبول طلب الشحن بقيمة ${amount} USDT وإضافة المبلغ لرصيدك!`
    : `❌ تم رفض طلب الشحن بقيمة ${amount} USDT.`;
  createNotification(phone, notifMsg).catch(() => {});

  if (useLocalStorageFallback) {
    const deposits = getLocalDeposits();
    if (deposits[depositId]) {
      deposits[depositId].status = status;
      saveLocalDeposits(deposits);
    }
    if (status === 'approved') {
      const users = getLocalUsers();
      if (users[phone]) {
        users[phone].earnings += amount;
        saveLocalUsers(users);
      }
    }
    return;
  }

  try {
    const depRef = doc(db, "deposits", depositId);
    await updateDoc(depRef, { status });

    if (status === 'approved') {
      const userRef = doc(db, "users", phone);
      await updateDoc(userRef, {
        earnings: increment(amount)
      });
    }
  } catch (error) {
    console.warn("Firestore updateDepositStatus error, falling back:", error);
    setFallbackMode(true);
    // apply local
    const deposits = getLocalDeposits();
    if (deposits[depositId]) {
      deposits[depositId].status = status;
      saveLocalDeposits(deposits);
    }
    if (status === 'approved') {
      const users = getLocalUsers();
      if (users[phone]) {
        users[phone].earnings += amount;
        saveLocalUsers(users);
      }
    }
  }
}

// 7. Withdrawals
export async function createWithdrawal(
  userId: string,
  username: string,
  phone: string,
  amount: number,
  walletAddress: string,
  currency: string = 'USDT (BEP20)'
): Promise<Withdrawal> {
  const selectedCurrency = currency || 'USDT (BEP20)';

  const userMsg = `💸 تم تقديم طلب سحب بقيمة ${amount} ${selectedCurrency}. الطلب قيد المراجعة.`;
  const adminMsg = `📤 طلب سحب جديد بقيمة ${amount} ${selectedCurrency} من المستخدم: ${username} (${phone})`;
  createNotification(phone, userMsg).catch(() => {});
  if (userId) createNotification(userId, userMsg).catch(() => {});
  createNotification('admin', adminMsg).catch(() => {});

  if (useLocalStorageFallback) {
    const users = getLocalUsers();
    if (!users[phone]) {
      throw new Error("المستخدم غير موجود");
    }
    if (users[phone].isWithdrawalBlocked) {
      throw new Error("🔒 نأسف لإعلامك بأنه قد تم تعليق ميزة السحب مؤقتاً لحسابك لدواعي الأمان والتحقق من جودة النشاط. لتفعيل السحب التلقائي مجدداً ومواصلة العمل وجني الأرباح بشكل طبيعي، يرجى دعوة (2) من المشتركين الجدد والنشطين على الأقل للترقية فئة VIP (B1) باستخدام رابط الإحالة الخاص بك. نشكر تفهمكم وحرصكم على استدامة المجتمع الرقمي للمنصة.");
    }
    if (users[phone].earnings < amount) {
      throw new Error("رصيد الأرباح غير كافٍ لإجراء هذا السحب!");
    }

    // Deduct immediately
    users[phone].earnings -= amount;
    saveLocalUsers(users);

    const withdrawalId = `with_${Date.now()}`;
    const newWithdrawal: Withdrawal = {
      id: withdrawalId,
      userId,
      username,
      phone,
      amount,
      currency: selectedCurrency,
      walletAddress,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const withdrawals = getLocalWithdrawals();
    withdrawals[withdrawalId] = newWithdrawal;
    saveLocalWithdrawals(withdrawals);
    return newWithdrawal;
  }

  try {
    // First deduct pending withdrawal amount from user balance
    const userRef = doc(db, "users", phone);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error("المستخدم غير موجود");
    }
    const userData = userSnap.data() as User;
    if (userData.isWithdrawalBlocked) {
      throw new Error("🔒 نأسف لإعلامك بأنه قد تم تعليق ميزة السحب مؤقتاً لحسابك لدواعي الأمان والتحقق من جودة النشاط. لتفعيل السحب التلقائي مجدداً ومواصلة العمل وجني الأرباح بشكل طبيعي، يرجى دعوة (2) من المشتركين الجدد والنشطين على الأقل للترقية فئة VIP (B1) باستخدام رابط الإحالة الخاص بك. نشكر تفهمكم وحرصكم على استدامة المجتمع الرقمي للمنصة.");
    }
    if (userData.earnings < amount) {
      throw new Error("رصيد الأرباح غير كافٍ لإجراء هذا السحب!");
    }

    // Deduct immediately
    await updateDoc(userRef, {
      earnings: increment(-amount)
    });

    const withdrawalId = `with_${Date.now()}`;
    const newWithdrawal: Withdrawal = {
      id: withdrawalId,
      userId,
      username,
      phone,
      amount,
      currency: selectedCurrency,
      walletAddress,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "withdrawals", withdrawalId), newWithdrawal);
    return newWithdrawal;
  } catch (error: any) {
    console.warn("Firestore createWithdrawal error, falling back:", error);
    setFallbackMode(true);
    return createWithdrawal(userId, username, phone, amount, walletAddress, selectedCurrency);
  }
}

export async function getUserWithdrawals(phone: string): Promise<Withdrawal[]> {
  if (useLocalStorageFallback) {
    const withdrawals = Object.values(getLocalWithdrawals()).filter(w => w.phone === phone);
    return withdrawals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  try {
    const q = query(collection(db, "withdrawals"), where("phone", "==", phone));
    const querySnapshot = await getDocs(q);
    const list: Withdrawal[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Withdrawal;
      const key = data.id || docSnap.id;
      if (key) {
        list.push({ ...data, id: key });
      }
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn("Firestore getUserWithdrawals error, falling back:", error);
    setFallbackMode(true);
    const withdrawals = Object.values(getLocalWithdrawals()).filter(w => w.phone === phone);
    return withdrawals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function getAllWithdrawals(): Promise<Withdrawal[]> {
  if (useLocalStorageFallback) {
    return Object.values(getLocalWithdrawals()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  try {
    const querySnapshot = await getDocs(collection(db, "withdrawals"));
    const list: Withdrawal[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Withdrawal;
      const key = data.id || docSnap.id;
      if (key) {
        list.push({ ...data, id: key });
      }
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn("Firestore getAllWithdrawals error, falling back:", error);
    setFallbackMode(true);
    return Object.values(getLocalWithdrawals()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function updateWithdrawalStatus(withdrawalId: string, status: 'approved' | 'rejected', phone: string, amount: number) {
  const notifMsg = status === 'approved'
    ? `✅ تم قبول طلب السحب بقيمة ${amount} USDT وتحويل المبلغ لمحفظتك!`
    : `❌ تم رفض طلب السحب بقيمة ${amount} USDT وإعادة المبلغ لرصيدك.`;
  createNotification(phone, notifMsg).catch(() => {});

  if (useLocalStorageFallback) {
    const withdrawals = getLocalWithdrawals();
    if (withdrawals[withdrawalId]) {
      withdrawals[withdrawalId].status = status;
      saveLocalWithdrawals(withdrawals);
    }
    if (status === 'rejected') {
      const users = getLocalUsers();
      if (users[phone]) {
        users[phone].earnings += amount;
        saveLocalUsers(users);
      }
    }
    return;
  }

  try {
    const withRef = doc(db, "withdrawals", withdrawalId);
    await updateDoc(withRef, { status });

    if (status === 'rejected') {
      const userRef = doc(db, "users", phone);
      await updateDoc(userRef, {
        earnings: increment(amount)
      });
    }
  } catch (error) {
    console.warn("Firestore updateWithdrawalStatus error, falling back:", error);
    setFallbackMode(true);
    // apply local
    const withdrawals = getLocalWithdrawals();
    if (withdrawals[withdrawalId]) {
      withdrawals[withdrawalId].status = status;
      saveLocalWithdrawals(withdrawals);
    }
    if (status === 'rejected') {
      const users = getLocalUsers();
      if (users[phone]) {
        users[phone].earnings += amount;
        saveLocalUsers(users);
      }
    }
  }
}

// 8. Team (Invited users query)
export async function getReferralTeam(myInviteCode: string): Promise<User[]> {
  if (!myInviteCode) return [];
  const cleanCode = myInviteCode.trim().toUpperCase();
  const teamMap: Record<string, User> = {};

  // Always sync local storage matching
  const localUsers = getLocalUsers();
  Object.values(localUsers).forEach(u => {
    if (u.referrerCode && u.referrerCode.trim().toUpperCase() === cleanCode) {
      const key = u.phone || u.id;
      if (key) teamMap[key] = u;
    }
  });

  if (useLocalStorageFallback) {
    return Object.values(teamMap).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  try {
    // 1. Direct match in Firestore
    const q = query(collection(db, "users"), where("referrerCode", "==", myInviteCode.trim()));
    const snap = await getDocs(q);
    snap.forEach((d) => {
      const u = d.data() as User;
      const key = u.phone || u.id || d.id;
      if (key) teamMap[key] = u;
    });

    // 2. Uppercase match if different
    if (cleanCode !== myInviteCode.trim()) {
      const q2 = query(collection(db, "users"), where("referrerCode", "==", cleanCode));
      const snap2 = await getDocs(q2);
      snap2.forEach((d) => {
        const u = d.data() as User;
        const key = u.phone || u.id || d.id;
        if (key) teamMap[key] = u;
      });
    }

    // 3. Fallback scan all users in Firestore to guarantee case-insensitive matches
    const allUsersSnap = await getDocs(collection(db, "users"));
    allUsersSnap.forEach((d) => {
      const u = d.data() as User;
      if (u.referrerCode && u.referrerCode.trim().toUpperCase() === cleanCode) {
        const key = u.phone || u.id || d.id;
        if (key) teamMap[key] = u;
      }
    });

    const result = Object.values(teamMap).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return result;
  } catch (error) {
    console.warn("Firestore getReferralTeam error, returning cached team:", error);
    return Object.values(teamMap).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }
}

export function subscribeToReferralTeam(myInviteCode: string, callback: (team: User[]) => void): () => void {
  if (!myInviteCode) {
    callback([]);
    return () => {};
  }
  const cleanCode = myInviteCode.trim().toUpperCase();

  const handleFallback = () => {
    getReferralTeam(myInviteCode).then(list => callback(list)).catch(() => {});
  };

  // Initial fetch immediately
  getReferralTeam(myInviteCode).then(list => callback(list)).catch(() => {});

  return safeOnSnapshot(collection(db, "users"), (snapshot) => {
    const teamMap: Record<string, User> = {};

    snapshot.forEach((docSnap) => {
      const u = docSnap.data() as User;
      if (u.referrerCode && u.referrerCode.trim().toUpperCase() === cleanCode) {
        const key = u.phone || u.id || docSnap.id;
        if (key) teamMap[key] = u;
      }
    });

    // Merge local storage fallback
    const localUsers = getLocalUsers();
    Object.values(localUsers).forEach(u => {
      if (u.referrerCode && u.referrerCode.trim().toUpperCase() === cleanCode) {
        const key = u.phone || u.id;
        if (key) teamMap[key] = u;
      }
    });

    const result = Object.values(teamMap).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    callback(result);
  }, (err) => {
    console.warn("subscribeToReferralTeam onSnapshot error:", err);
  }, handleFallback);
}

// 9. All Users (For Admin dashboard)
export async function getAllUsers(): Promise<User[]> {
  const localMap = getLocalUsers();
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const firestoreMap: Record<string, User> = {};
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as User;
      const key = data.phone || docSnap.id;
      if (key) {
        firestoreMap[key] = data;
      }
    });

    const mergedMap: Record<string, User> = { ...firestoreMap, ...localMap };

    // Push/sync all local users to Firestore so Incognito and other browsers share them instantly
    await Promise.all(
      Object.keys(localMap).map(key => {
        if (!firestoreMap[key]) {
          return setDoc(doc(db, "users", key), localMap[key], { merge: true }).catch(() => {});
        }
        return Promise.resolve();
      })
    );

    saveLocalUsers(mergedMap);
    return Object.values(mergedMap);
  } catch (error: any) {
    console.warn("Firestore getAllUsers error, falling back to local storage:", error);
    return Object.values(localMap);
  }
}

export function subscribeToAllUsers(callback: (users: User[]) => void): () => void {
  const handleFallback = () => {
    callback(Object.values(getLocalUsers()));
  };

  return safeOnSnapshot(collection(db, "users"), (snapshot) => {
    const localMap = getLocalUsers();
    const firestoreMap: Record<string, User> = {};
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as User;
      const key = data.phone || docSnap.id;
      if (key) {
        firestoreMap[key] = data;
      }
    });

    const mergedMap: Record<string, User> = { ...firestoreMap, ...localMap };

    // Ensure ONLY 07519952000 has admin role
    Object.keys(mergedMap).forEach(k => {
      if (k !== "07519952000" && mergedMap[k]?.phone !== "07519952000" && mergedMap[k]?.role === "admin") {
        mergedMap[k].role = "user";
      }
    });

    // Push/sync all local users to Firestore
    Promise.all(
      Object.keys(localMap).map(key => {
        if (!firestoreMap[key]) {
          return setDoc(doc(db, "users", key), localMap[key], { merge: true }).catch(() => {});
        }
        return Promise.resolve();
      })
    ).catch(() => {});

    saveLocalUsers(mergedMap);
    callback(Object.values(mergedMap));
  }, (error) => {
    console.warn("Firestore subscribeToAllUsers error:", error);
  }, handleFallback);
}

export function subscribeToAllDeposits(callback: (deposits: Deposit[]) => void): () => void {
  const handleFallback = () => {
    const list = Object.values(getLocalDeposits()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  };

  return safeOnSnapshot(collection(db, "deposits"), (snapshot) => {
    const firestoreMap: Record<string, Deposit> = {};
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Deposit;
      const key = data.id || docSnap.id;
      if (key) {
        firestoreMap[key] = { ...data, id: key };
      }
    });
    saveLocalDeposits(firestoreMap);
    const list = Object.values(firestoreMap).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  }, (error) => {
    console.warn("Firestore subscribeToAllDeposits error:", error);
  }, handleFallback);
}

export function subscribeToAllWithdrawals(callback: (withdrawals: Withdrawal[]) => void): () => void {
  const handleFallback = () => {
    const list = Object.values(getLocalWithdrawals()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  };

  return safeOnSnapshot(collection(db, "withdrawals"), (snapshot) => {
    const firestoreMap: Record<string, Withdrawal> = {};
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Withdrawal;
      const key = data.id || docSnap.id;
      if (key) {
        firestoreMap[key] = { ...data, id: key };
      }
    });
    saveLocalWithdrawals(firestoreMap);
    const list = Object.values(firestoreMap).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  }, (error) => {
    console.warn("Firestore subscribeToAllWithdrawals error:", error);
  }, handleFallback);
}

// 10. Admin user modification / deletion
export async function deleteUserByAdmin(phone: string): Promise<void> {
  const cleanPhone = phone.trim();
  
  // --- 1. Clear Local Storage caches for the deleted user completely ---
  
  // Clear User local cache
  const users = getLocalUsers();
  Object.keys(users).forEach(k => {
    if (k === cleanPhone || users[k]?.phone === cleanPhone) {
      delete users[k];
    }
  });
  saveLocalUsers(users);

  // Clear Tasks cache keys
  try {
    localStorage.removeItem(`micro_tasks_data_${cleanPhone}`);
    localStorage.removeItem('micro_tasks_data');
  } catch (e) {
    console.warn("Error removing task local cache on user delete:", e);
  }

  // Clear Deposits local cache
  try {
    const deposits = getLocalDeposits();
    let depositsChanged = false;
    Object.keys(deposits).forEach(id => {
      if (deposits[id]?.phone === cleanPhone) {
        delete deposits[id];
        depositsChanged = true;
      }
    });
    if (depositsChanged) {
      saveLocalDeposits(deposits);
    }
  } catch (e) {
    console.warn("Error removing deposits local cache on user delete:", e);
  }

  // Clear Withdrawals local cache
  try {
    const withdrawals = getLocalWithdrawals();
    let withdrawalsChanged = false;
    Object.keys(withdrawals).forEach(id => {
      if (withdrawals[id]?.phone === cleanPhone) {
        delete withdrawals[id];
        withdrawalsChanged = true;
      }
    });
    if (withdrawalsChanged) {
      saveLocalWithdrawals(withdrawals);
    }
  } catch (e) {
    console.warn("Error removing withdrawals local cache on user delete:", e);
  }

  // Clear Support Chats local cache
  try {
    const localChats = JSON.parse(localStorage.getItem('local_db_support_chats') || '{}');
    if (localChats[cleanPhone]) {
      delete localChats[cleanPhone];
      localStorage.setItem('local_db_support_chats', JSON.stringify(localChats));
    }
    localStorage.removeItem(`local_chat_msg_${cleanPhone}`);
  } catch (e) {
    console.warn("Error removing support chat local cache on user delete:", e);
  }

  // Clear private Notifications local cache (excluding 'all' and 'broadcast')
  try {
    const notifications = getLocalNotifications();
    let notificationsChanged = false;
    Object.keys(notifications).forEach(id => {
      const n = notifications[id];
      if (n && n.userId !== 'all' && n.userId !== 'broadcast' && matchesUser(n.userId, cleanPhone)) {
        delete notifications[id];
        notificationsChanged = true;
      }
    });
    if (notificationsChanged) {
      saveLocalNotifications(notifications);
    }
  } catch (e) {
    console.warn("Error removing notifications local cache on user delete:", e);
  }

  if (useLocalStorageFallback) {
    return;
  }

  // --- 2. Clear Firestore Database records for the deleted user completely ---
  try {
    const deletePromises: Promise<void>[] = [];

    // A. Delete user doc
    deletePromises.push(deleteDoc(doc(db, "users", cleanPhone)));

    // B. Delete all tasks associated with this user
    const qTasks = query(collection(db, "tasks"), where("userId", "==", cleanPhone));
    const tasksSnap = await getDocs(qTasks);
    tasksSnap.forEach(tDoc => {
      deletePromises.push(deleteDoc(doc(db, "tasks", tDoc.id)));
    });

    // C. Delete all deposits associated with this user
    const qDeposits = query(collection(db, "deposits"), where("phone", "==", cleanPhone));
    const depositsSnap = await getDocs(qDeposits);
    depositsSnap.forEach(dDoc => {
      deletePromises.push(deleteDoc(doc(db, "deposits", dDoc.id)));
    });

    // D. Delete all withdrawals associated with this user
    const qWithdrawals = query(collection(db, "withdrawals"), where("phone", "==", cleanPhone));
    const withdrawalsSnap = await getDocs(qWithdrawals);
    withdrawalsSnap.forEach(wDoc => {
      deletePromises.push(deleteDoc(doc(db, "withdrawals", wDoc.id)));
    });

    // E. Delete all support chat messages & support chat document
    try {
      const messagesCol = collection(db, "support_chats", cleanPhone, "messages");
      const msgsSnap = await getDocs(messagesCol);
      msgsSnap.forEach(mDoc => {
        deletePromises.push(deleteDoc(doc(db, "support_chats", cleanPhone, "messages", mDoc.id)));
      });
      deletePromises.push(deleteDoc(doc(db, "support_chats", cleanPhone)));
    } catch (chatError) {
      console.warn("Error queuing support chat/messages delete:", chatError);
    }

    // F. Delete all private notifications associated with this user
    const qNotifs = query(collection(db, "notifications"));
    const notifsSnap = await getDocs(qNotifs);
    notifsSnap.forEach(nDoc => {
      const data = nDoc.data() as UserNotification;
      if (data && data.userId !== 'all' && data.userId !== 'broadcast' && matchesUser(data.userId, cleanPhone)) {
        deletePromises.push(deleteDoc(doc(db, "notifications", nDoc.id)));
      }
    });

    await Promise.all(deletePromises);
    console.log("Successfully completed final deletion of user data from Firestore:", cleanPhone);
  } catch (error) {
    console.warn("Firestore deleteUserByAdmin error, falling back:", error);
    setFallbackMode(true);
  }
}

export async function updateUserByAdmin(phoneOrId: string, updates: Partial<User>): Promise<void> {
  const target = (phoneOrId || '').trim();
  if (!target) return;

  const finalUpdates: Partial<User> = { ...updates };
  if (updates.password) {
    finalUpdates.rawPassword = updates.password;
  }

  // 1. ALWAYS write to local cache robustly across all matching keys
  const users = getLocalUsers();
  const digitsOnly = target.replace(/\D/g, '');
  let matched = false;

  Object.keys(users).forEach(key => {
    const u = users[key];
    const uDigits = (u.phone || '').replace(/\D/g, '');
    const isMatch = key === target || u.phone === target || u.id === target ||
      (digitsOnly.length >= 7 && uDigits.length >= 7 && uDigits.endsWith(digitsOnly.slice(-7)));

    if (isMatch) {
      users[key] = {
        ...users[key],
        ...finalUpdates
      };
      matched = true;
    }
  });

  if (!matched) {
    users[target] = { ...(users[target] || {}), ...finalUpdates } as User;
  }

  saveLocalUsers(users);

  if (useLocalStorageFallback) {
    return;
  }

  // 2. Write to Firestore using setDoc with merge: true to avoid missing document errors
  try {
    const userRef = doc(db, "users", target);
    await setDoc(userRef, finalUpdates, { merge: true });
  } catch (error) {
    console.warn("Firestore updateUserByAdmin error:", error);
    setFallbackMode(true);
  }
}

export async function updateAdminPhone(oldPhone: string, newPhone: string, newPassword?: string): Promise<{ success: boolean; message: string }> {
  const cleanOld = oldPhone ? oldPhone.trim() : "";
  const cleanNew = newPhone ? newPhone.trim() : "";

  if (!cleanNew) {
    return { success: false, message: "رقم الهاتف الجديد لا يمكن أن يكون فارغاً" };
  }

  // If changing to a different phone number, check if the new phone is taken by a non-admin user
  if (cleanOld && cleanOld !== cleanNew) {
    const existing = await getUserByPhone(cleanNew);
    if (existing && existing.id !== cleanOld && existing.phone !== cleanOld && existing.role !== 'admin') {
      return { success: false, message: "رقم الهاتف الجديد مستخدم بالفعل لحساب آخر!" };
    }
  }

  // 1. Update in local storage
  const users = getLocalUsers();
  let adminObj: User | null = users[cleanOld] || null;

  if (!adminObj) {
    const foundKey = Object.keys(users).find(k => users[k].role === 'admin' || users[k].phone === cleanOld);
    if (foundKey) {
      adminObj = users[foundKey];
      delete users[foundKey];
    }
  } else if (cleanOld !== cleanNew) {
    delete users[cleanOld];
  }

  if (!adminObj) {
    adminObj = {
      id: cleanNew,
      username: "المدير العام",
      phone: cleanNew,
      password: newPassword ? newPassword.trim() : "hemoome1995",
      rawPassword: newPassword ? newPassword.trim() : "hemoome1995",
      inviteCode: "K92W84",
      earnings: 1000,
      taskIncome: 500,
      effectiveDays: 365,
      role: "admin",
      createdAt: new Date().toISOString()
    };
  } else {
    adminObj.phone = cleanNew;
    adminObj.id = cleanNew;
    adminObj.role = "admin";
    if (newPassword && newPassword.trim()) {
      adminObj.password = newPassword.trim();
      adminObj.rawPassword = newPassword.trim();
    }
  }

  users[cleanNew] = adminObj;
  saveLocalUsers(users);
  localStorage.setItem('logged_in_phone', cleanNew);

  // 2. Update in Firestore
  if (!useLocalStorageFallback) {
    try {
      if (cleanOld && cleanOld !== cleanNew) {
        await setDoc(doc(db, "users", cleanNew), adminObj);
        await deleteDoc(doc(db, "users", cleanOld)).catch(() => {});
      } else {
        await updateDoc(doc(db, "users", cleanNew), {
          phone: cleanNew,
          role: "admin",
          ...(newPassword && newPassword.trim() ? { password: newPassword.trim(), rawPassword: newPassword.trim() } : {})
        });
      }
    } catch (e) {
      console.warn("Firestore updateAdminPhone error:", e);
    }
  }

  return { success: true, message: `تم تحديث رقم دخول الأدمن بنجاح إلى: (${cleanNew})` };
}

export async function updateUserLocation(phone: string, locationData: {
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  ip?: string;
  lastLocationUpdate?: string;
}): Promise<void> {
  if (useLocalStorageFallback) {
    const users = getLocalUsers();
    if (users[phone]) {
      users[phone] = {
        ...users[phone],
        ...locationData
      };
      saveLocalUsers(users);
    }
    return;
  }

  try {
    const userRef = doc(db, "users", phone);
    await updateDoc(userRef, locationData);
  } catch (error) {
    console.warn("Firestore updateUserLocation error, falling back:", error);
    setFallbackMode(true);
    const users = getLocalUsers();
    if (users[phone]) {
      users[phone] = {
        ...users[phone],
        ...locationData
      };
      saveLocalUsers(users);
    }
  }
}

export async function addManualWithdrawalByAdmin(
  phone: string,
  amount: number,
  walletAddress: string,
  status: 'pending' | 'approved' | 'rejected',
  createdAt: string
): Promise<Withdrawal> {
  // Try to find the user first to get their username
  let username = "عضو يدوي";
  let userId = phone;
  try {
    const user = await getUserByPhone(phone);
    if (user) {
      username = user.username;
      userId = user.id;
    }
  } catch (e) {
    console.warn("Could not find user for manual withdrawal, using defaults", e);
  }

  const withdrawalId = `with_manual_${Date.now()}`;
  const newWithdrawal: Withdrawal = {
    id: withdrawalId,
    userId,
    username,
    phone,
    amount,
    currency: 'USDT (Polygon)',
    walletAddress: walletAddress || "تم الإدخال يدوياً",
    status,
    createdAt: createdAt || new Date().toISOString()
  };

  if (useLocalStorageFallback) {
    const withdrawals = getLocalWithdrawals();
    withdrawals[withdrawalId] = newWithdrawal;
    saveLocalWithdrawals(withdrawals);
    return newWithdrawal;
  }

  try {
    await setDoc(doc(db, "withdrawals", withdrawalId), newWithdrawal);
    return newWithdrawal;
  } catch (error) {
    console.warn("Firestore addManualWithdrawalByAdmin error, falling back:", error);
    setFallbackMode(true);
    const withdrawals = getLocalWithdrawals();
    withdrawals[withdrawalId] = newWithdrawal;
    saveLocalWithdrawals(withdrawals);
    return newWithdrawal;
  }
}

export async function addManualDepositByAdmin(
  phone: string,
  amount: number,
  currency: string = 'USDT (Polygon)',
  status: 'pending' | 'approved' | 'rejected' = 'approved',
  createdAt: string = new Date().toISOString()
): Promise<Deposit> {
  let username = "عضو يدوي";
  let userId = phone;
  try {
    const user = await getUserByPhone(phone);
    if (user) {
      username = user.username;
      userId = user.id;
    }
  } catch (e) {
    console.warn("Could not find user for manual deposit, using defaults", e);
  }

  const depositId = `dep_manual_${Date.now()}`;
  const newDeposit: Deposit = {
    id: depositId,
    userId,
    username,
    phone,
    amount,
    currency: currency || 'USDT (Polygon)',
    txHash: 'إيداع يدوي من لوحة التحكم',
    status,
    createdAt: createdAt || new Date().toISOString()
  };

  if (status === 'approved') {
    if (useLocalStorageFallback) {
      const users = getLocalUsers();
      if (users[phone]) {
        users[phone].earnings += amount;
        saveLocalUsers(users);
      }
    } else {
      try {
        const userRef = doc(db, "users", phone);
        await updateDoc(userRef, {
          earnings: increment(amount)
        });
      } catch (e) {
        console.warn("Error updating user balance on manual deposit:", e);
      }
    }
    createNotification(phone, `💰 تم إضافة إيداع يدوي بقيمة ${amount} USDT إلى حسابك من قبل الإدارة!`).catch(() => {});
  }

  if (useLocalStorageFallback) {
    const deposits = getLocalDeposits();
    deposits[depositId] = newDeposit;
    saveLocalDeposits(deposits);
    return newDeposit;
  }

  try {
    await setDoc(doc(db, "deposits", depositId), newDeposit);
    return newDeposit;
  } catch (error) {
    console.warn("Firestore addManualDepositByAdmin error, falling back:", error);
    setFallbackMode(true);
    const deposits = getLocalDeposits();
    deposits[depositId] = newDeposit;
    saveLocalDeposits(deposits);
    return newDeposit;
  }
}

export async function updateDepositByAdmin(
  depositId: string,
  updates: Partial<Deposit>
): Promise<void> {
  if (useLocalStorageFallback) {
    const deposits = getLocalDeposits();
    if (deposits[depositId]) {
      deposits[depositId] = {
        ...deposits[depositId],
        ...updates
      };
      saveLocalDeposits(deposits);
    }
    return;
  }

  try {
    const depRef = doc(db, "deposits", depositId);
    await updateDoc(depRef, updates);
  } catch (error) {
    console.warn("Firestore updateDepositByAdmin error, falling back:", error);
    setFallbackMode(true);
    const deposits = getLocalDeposits();
    if (deposits[depositId]) {
      deposits[depositId] = {
        ...deposits[depositId],
        ...updates
      };
      saveLocalDeposits(deposits);
    }
  }
}

export async function deleteDepositByAdmin(depositId: string): Promise<void> {
  if (!depositId) return;
  const deposits = getLocalDeposits();
  if (deposits[depositId]) {
    delete deposits[depositId];
  }
  Object.keys(deposits).forEach(k => {
    if (deposits[k]?.id === depositId) {
      delete deposits[k];
    }
  });
  saveLocalDeposits(deposits);

  if (useLocalStorageFallback) return;

  try {
    const depRef = doc(db, "deposits", depositId);
    await deleteDoc(depRef).catch(() => {});

    const q = query(collection(db, "deposits"), where("id", "==", depositId));
    const snap = await getDocs(q);
    const deletePromises: Promise<void>[] = [];
    snap.forEach(d => {
      deletePromises.push(deleteDoc(doc(db, "deposits", d.id)));
    });
    await Promise.all(deletePromises);
    console.log("Successfully deleted deposit from Firestore:", depositId);
  } catch (error) {
    console.warn("Firestore deleteDepositByAdmin error:", error);
  }
}

export async function deleteAllDepositsByAdmin(): Promise<void> {
  saveLocalDeposits({});
  if (useLocalStorageFallback) return;
  try {
    const snap = await getDocs(collection(db, "deposits"));
    const deletePromises: Promise<void>[] = [];
    snap.forEach(d => {
      deletePromises.push(deleteDoc(doc(db, "deposits", d.id)));
    });
    await Promise.all(deletePromises);
    console.log("Successfully deleted all deposits from Firestore");
  } catch (error) {
    console.warn("Firestore deleteAllDepositsByAdmin error:", error);
  }
}

export async function updateWithdrawalByAdmin(
  withdrawalId: string,
  updates: Partial<Withdrawal>
): Promise<void> {
  if (useLocalStorageFallback) {
    const withdrawals = getLocalWithdrawals();
    if (withdrawals[withdrawalId]) {
      withdrawals[withdrawalId] = {
        ...withdrawals[withdrawalId],
        ...updates
      };
      saveLocalWithdrawals(withdrawals);
    }
    return;
  }

  try {
    const withRef = doc(db, "withdrawals", withdrawalId);
    await updateDoc(withRef, updates);
  } catch (error) {
    console.warn("Firestore updateWithdrawalByAdmin error, falling back:", error);
    setFallbackMode(true);
    const withdrawals = getLocalWithdrawals();
    if (withdrawals[withdrawalId]) {
      withdrawals[withdrawalId] = {
        ...withdrawals[withdrawalId],
        ...updates
      };
      saveLocalWithdrawals(withdrawals);
    }
  }
}

export async function deleteWithdrawalByAdmin(withdrawalId: string): Promise<void> {
  if (!withdrawalId) return;
  const withdrawals = getLocalWithdrawals();
  if (withdrawals[withdrawalId]) {
    delete withdrawals[withdrawalId];
  }
  Object.keys(withdrawals).forEach(k => {
    if (withdrawals[k]?.id === withdrawalId) {
      delete withdrawals[k];
    }
  });
  saveLocalWithdrawals(withdrawals);

  if (useLocalStorageFallback) return;

  try {
    const withRef = doc(db, "withdrawals", withdrawalId);
    await deleteDoc(withRef).catch(() => {});

    const q = query(collection(db, "withdrawals"), where("id", "==", withdrawalId));
    const snap = await getDocs(q);
    const deletePromises: Promise<void>[] = [];
    snap.forEach(d => {
      deletePromises.push(deleteDoc(doc(db, "withdrawals", d.id)));
    });
    await Promise.all(deletePromises);
    console.log("Successfully deleted withdrawal from Firestore:", withdrawalId);
  } catch (error) {
    console.warn("Firestore deleteWithdrawalByAdmin error:", error);
  }
}

export async function deleteAllWithdrawalsByAdmin(): Promise<void> {
  saveLocalWithdrawals({});
  if (useLocalStorageFallback) return;
  try {
    const snap = await getDocs(collection(db, "withdrawals"));
    const deletePromises: Promise<void>[] = [];
    snap.forEach(d => {
      deletePromises.push(deleteDoc(doc(db, "withdrawals", d.id)));
    });
    await Promise.all(deletePromises);
    console.log("Successfully deleted all withdrawals from Firestore");
  } catch (error) {
    console.warn("Firestore deleteAllWithdrawalsByAdmin error:", error);
  }
}

// Get user tasks from Firestore (or Local Storage fallback)
export async function getUserTasks(phone: string): Promise<Task[]> {
  if (!phone) return [];
  const cleanPhone = phone.trim();
  if (useLocalStorageFallback) {
    const key = `micro_tasks_data_${cleanPhone}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  }
  try {
    const q = query(collection(db, "tasks"), where("userId", "==", cleanPhone));
    const querySnapshot = await getDocs(q);
    const tasks: Task[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && (!data.userId || data.userId === cleanPhone)) {
        let rawId = data.id || docSnap.id;
        if (rawId.startsWith(`${cleanPhone}_`)) {
          rawId = rawId.replace(`${cleanPhone}_`, '');
        }
        tasks.push({
          id: rawId,
          title: data.title || '',
          reward: data.reward || '',
          category: data.category || 'youtube',
          status: data.status || 'in_progress',
          taskDetails: data.taskDetails || '',
          requires: data.requires || '',
          reviewLink: data.reviewLink || '',
          uploadedScreenshot: data.uploadedScreenshot || undefined,
          claimDate: data.claimDate || undefined
        });
      }
    });
    return tasks;
  } catch (error) {
    console.warn("Firestore getUserTasks error, falling back:", error);
    const saved = localStorage.getItem(`micro_tasks_data_${cleanPhone}`);
    return saved ? JSON.parse(saved) : [];
  }
}

// Save user tasks to Firestore (and local storage for faster/safe reads)
export async function saveUserTasks(phone: string, tasks: Task[]): Promise<void> {
  if (!phone) return;
  const cleanPhone = phone.trim();
  const key = `micro_tasks_data_${cleanPhone}`;
  try {
    localStorage.setItem(key, JSON.stringify(tasks));
  } catch (e) {
    console.warn("LocalStorage saving error in saveUserTasks:", e);
  }

  if (useLocalStorageFallback) {
    return;
  }

  try {
    // Save each task to Firestore
    for (const t of tasks) {
      let cleanId = t.id;
      if (cleanId.startsWith(`${cleanPhone}_`)) {
        cleanId = cleanId.replace(`${cleanPhone}_`, '');
      }
      const docId = `${cleanPhone}_${cleanId}`;
      await setDoc(doc(db, "tasks", docId), {
        id: cleanId,
        title: t.title,
        reward: t.reward,
        category: t.category,
        status: t.status,
        taskDetails: t.taskDetails,
        requires: t.requires,
        reviewLink: t.reviewLink,
        uploadedScreenshot: t.uploadedScreenshot || null,
        claimDate: t.claimDate || null,
        userId: cleanPhone,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (error) {
    console.warn("Firestore saveUserTasks error:", error);
  }
}

// Subscribe to system settings in real-time
export function subscribeToSystemSettings(onUpdate: (settings: SystemSettings) => void): () => void {
  const settingsRef = doc(db, "settings", "general");
  const handleFallback = () => {
    onUpdate(getLocalSettings());
  };

  return safeOnSnapshot(settingsRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      onUpdate({
        siteName: data.siteName ?? "BET",
        rechargeAddress: data.rechargeAddress ?? "e738819b080a278d",
        rechargeAddressTRC20: data.rechargeAddressTRC20 ?? "sfnmQtKLfcDarAMd",
        rechargeAddressBEP20: data.rechargeAddressBEP20 ?? "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        telegramLink: data.telegramLink ?? "-fhzo.vercel.app",
        minDeposit: Number(data.minDeposit ?? 25),
        minWithdrawal: Number(data.minWithdrawal ?? 2),
        holidayActive: Boolean(data.holidayActive ?? false),
        holidayDays: data.holidayDays ?? [5],
        globalNotification: data.globalNotification ?? "مرحباً بكم في منصتنا الميكروية الجديدة! ابدأ بالعمل اليوم وزد أرباحك.",
        withdrawLockActive: Boolean(data.withdrawLockActive ?? false),
        withdrawLockDays: data.withdrawLockDays ?? [5],
        withdrawRatesInfo: data.withdrawRatesInfo ?? "رسوم معالجة السحب 15% - سعر الصرف مستقر",
        rechargeNotice: data.rechargeNotice ?? "يرجى تحويل المبلغ المحدد فقط وتصوير إثبات التحويل لضمان سرعة معالجة شحن حسابك.",
        rechargeNotice2: data.rechargeNotice2 ?? "",
        withdrawNotice: data.withdrawNotice ?? "تنبيه: يتم معالجة طلبات السحب خلال 24 ساعة كحد أقصى.",
        withdrawNotice2: data.withdrawNotice2 ?? "",
        vipPlans: data.vipPlans ?? [
          { id: 'plan_600', name: 'باقة 600$', price: 600, profit: 18, tasksCount: 5 },
          { id: 'plan_1200', name: 'باقة 1200$', price: 1200, profit: 38, tasksCount: 5 }
        ],
        workingHoursNotice: data.workingHoursNotice ?? "💡 تنويه هام لجميع الأعضاء: يرجى العلم بأن أوقات العمل الرسمية لتنفيذ واعتماد المهام اليومية مقسمة على فترتين يومياً:\n- الفترة الأولى: من الساعة 12:00 ظهراً وحتى 05:00 عصراً.\n- الفترة الثانية: من الساعة 09:00 مساءً وحتى 01:00 ليلاً بتوقيت مكة المكرمة.",
        enforceWorkingHours: data.enforceWorkingHours !== undefined ? Boolean(data.enforceWorkingHours) : true,
        workStartHour: data.workStartHour !== undefined ? Number(data.workStartHour) : 12,
        workEndHour: data.workEndHour !== undefined ? Number(data.workEndHour) : 17,
        workStartHour2: data.workStartHour2 !== undefined ? Number(data.workStartHour2) : 21,
        workEndHour2: data.workEndHour2 !== undefined ? Number(data.workEndHour2) : 1,
        appDownloadUrl: data.appDownloadUrl ?? "",
        supportAgentName: (data.supportAgentName && !data.supportAgentName.includes("مريم")) ? data.supportAgentName : "دعم فني منصة oxlo",
        supportAgentSubtitle: (data.supportAgentSubtitle && !data.supportAgentSubtitle.includes("المالية") && !data.supportAgentSubtitle.includes("Mis")) ? data.supportAgentSubtitle : "مستشارتك المساعدة في oxlo",
        supportAgentAvatar: data.supportAgentAvatar ?? "",
        supportFaqs: (data.supportFaqs && data.supportFaqs.length > 4 && data.supportFaqs.some((f: any) => f.question.includes("تأسست"))) ? data.supportFaqs : defaultSupportFaqs,
        tasksCode: data.tasksCode ?? "",
        hideTrialPlans: data.hideTrialPlans !== undefined ? Boolean(data.hideTrialPlans) : false,
        telegramSupportUsername: data.telegramSupportUsername ?? ""
      });
    } else {
      onUpdate(getLocalSettings());
    }
  }, (error) => {
    console.warn("Error in system settings snapshot listener, falling back:", error);
  }, handleFallback);
}

export async function uploadFileToStorage(file: File): Promise<string> {
  // First, try our direct local Express upload endpoint (extremely fast & reliable)
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      throw new Error(`Local upload failed with status ${res.status}`);
    }
    const json = await res.json();
    if (json.url) {
      return json.url;
    }
    throw new Error("Invalid response structure from local host");
  } catch (localError) {
    console.warn("Local upload endpoint failed, attempting Firebase Storage:", localError);
    
    // Fallback 1: try Firebase Storage
    try {
      const fileRef = ref(storage, `apps/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (storageError) {
      console.warn("Firebase Storage failed or not configured, attempting fallback public host:", storageError);
      
      // Fallback 2: to tmpfiles.org
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('https://tmpfiles.org/api/v1/upload', {
          method: 'POST',
          body: formData
        });
        if (!res.ok) {
          throw new Error(`Public host upload failed with status ${res.status}`);
        }
        const json = await res.json();
        if (json.status === 'success' && json.data?.url) {
          // Convert tmpfiles.org/XXXXX/filename to tmpfiles.org/dl/XXXXX/filename for direct download
          const directUrl = json.data.url.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
          return directUrl;
        } else {
          throw new Error("Invalid response structure from public host");
        }
      } catch (fallbackError) {
        console.error("All upload methods failed:", fallbackError);
        throw new Error("فشلت جميع طرق الرفع. يرجى تزويد رابط خارجي مباشر (مثل Google Drive أو Mediafire) بدلاً من رفع الملف.");
      }
    }
  }
}

// ================== REAL-TIME SUPPORT CHAT (PRO SYSTEM) ==================

export async function sendSupportMessage(
  chatId: string,
  username: string,
  text: string,
  sender: 'user' | 'admin',
  senderName: string
): Promise<void> {
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();

  // 1. Local fallback management
  try {
    const localChatKey = `local_chat_msg_${chatId}`;
    const localMsgs = JSON.parse(localStorage.getItem(localChatKey) || '[]');
    localMsgs.push({ id: msgId, chatId, text, sender, senderName, timestamp });
    localStorage.setItem(localChatKey, JSON.stringify(localMsgs));

    const localChats = JSON.parse(localStorage.getItem('local_db_support_chats') || '{}');
    localChats[chatId] = {
      id: chatId,
      username,
      phone: chatId,
      lastMessage: text,
      lastMessageTime: timestamp,
      unreadByAdmin: sender === 'user' ? true : (localChats[chatId]?.unreadByAdmin ?? false),
      unreadByUser: sender === 'admin' ? true : (localChats[chatId]?.unreadByUser ?? false),
      createdAt: localChats[chatId]?.createdAt ?? timestamp
    };
    localStorage.setItem('local_db_support_chats', JSON.stringify(localChats));
  } catch (e) {
    console.warn("Local storage update failed inside sendSupportMessage:", e);
  }

  // Trigger private in-app notification (bell system) for fallback & live users
  try {
    if (sender === 'admin') {
      // Create a private notification for this user (chatId is user's identifier/phone)
      createNotification(chatId, `💬 رسالة جديدة من الدعم الفني: "${text}"`).catch(() => {});
    } else if (sender === 'user') {
      // Create a notification for the administrator
      createNotification('admin', `💬 رسالة جديدة من العضو ${username} (${chatId}): "${text}"`).catch(() => {});
    }
  } catch (notifErr) {
    console.warn("sendSupportMessage notification trigger failed:", notifErr);
  }

  if (useLocalStorageFallback) return;

  try {
    // 2. Update Firestore Chat document
    const chatRef = doc(db, "support_chats", chatId);
    await setDoc(chatRef, {
      id: chatId,
      username,
      phone: chatId,
      lastMessage: text,
      lastMessageTime: timestamp,
      unreadByAdmin: sender === 'user' ? true : false,
      unreadByUser: sender === 'admin' ? true : false,
      createdAt: timestamp
    }, { merge: true });

    // 3. Write Firestore Message document in subcollection
    const msgRef = doc(db, "support_chats", chatId, "messages", msgId);
    await setDoc(msgRef, {
      id: msgId,
      chatId,
      text,
      sender,
      senderName,
      timestamp
    });
  } catch (error) {
    console.warn("Firestore sendSupportMessage error:", error);
  }
}

export function subscribeToSupportMessages(
  chatId: string,
  onUpdate: (messages: SupportMessage[]) => void
): () => void {
  const localChatKey = `local_chat_msg_${chatId}`;
  const getLocal = () => JSON.parse(localStorage.getItem(localChatKey) || '[]');

  const messagesCol = collection(db, "support_chats", chatId, "messages");
  return safeOnSnapshot(messagesCol, (snapshot) => {
    const msgs: SupportMessage[] = [];
    snapshot.forEach((doc) => {
      const d = doc.data();
      msgs.push({
        id: d.id || doc.id,
        chatId: d.chatId || chatId,
        text: d.text || '',
        sender: d.sender || 'user',
        senderName: d.senderName || '',
        timestamp: d.timestamp || ''
      });
    });
    // Sort messages chronologically by timestamp
    msgs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    onUpdate(msgs);
  }, (error) => {
    console.warn("Error in live chat messages listener, falling back:", error);
  }, () => {
    onUpdate(getLocal());
  });
}

export function subscribeToAllChats(
  onUpdate: (chats: SupportChat[]) => void
): () => void {
  const getLocal = (): SupportChat[] => Object.values(JSON.parse(localStorage.getItem('local_db_support_chats') || '{}')) as SupportChat[];
  const chatsCol = collection(db, "support_chats");

  return safeOnSnapshot(chatsCol, (snapshot) => {
    const chats: SupportChat[] = [];
    snapshot.forEach((doc) => {
      const d = doc.data();
      chats.push({
        id: doc.id,
        username: d.username || '',
        phone: d.phone || doc.id,
        lastMessage: d.lastMessage || '',
        lastMessageTime: d.lastMessageTime || '',
        unreadByAdmin: !!d.unreadByAdmin,
        unreadByUser: !!d.unreadByUser,
        createdAt: d.createdAt || ''
      });
    });
    // Sort chats with recent messages first
    chats.sort((a, b) => b.lastMessageTime.localeCompare(a.lastMessageTime));
    onUpdate(chats);
  }, (error) => {
    console.warn("Error in subscribeToAllChats, falling back:", error);
  }, () => {
    onUpdate(getLocal());
  });
}

export function subscribeToUserChat(
  phone: string,
  onUpdate: (chat: SupportChat | null) => void
): () => void {
  const getLocal = () => {
    const localChats = JSON.parse(localStorage.getItem('local_db_support_chats') || '{}');
    return localChats[phone] || null;
  };
  const chatRef = doc(db, "support_chats", phone);

  return safeOnSnapshot(chatRef, (docSnap) => {
    if (docSnap.exists()) {
      const d = docSnap.data();
      onUpdate({
        id: docSnap.id,
        username: d.username || '',
        phone: d.phone || docSnap.id,
        lastMessage: d.lastMessage || '',
        lastMessageTime: d.lastMessageTime || '',
        unreadByAdmin: !!d.unreadByAdmin,
        unreadByUser: !!d.unreadByUser,
        createdAt: d.createdAt || ''
      });
    } else {
      onUpdate(null);
    }
  }, (error) => {
    console.warn("Error in subscribeToUserChat, falling back:", error);
  }, () => {
    onUpdate(getLocal());
  });
}

export async function markChatAsReadByAdmin(chatId: string): Promise<void> {
  // Update local storage
  try {
    const localChats = JSON.parse(localStorage.getItem('local_db_support_chats') || '{}');
    if (localChats[chatId]) {
      localChats[chatId].unreadByAdmin = false;
      localStorage.setItem('local_db_support_chats', JSON.stringify(localChats));
    }
  } catch (e) {}

  if (useLocalStorageFallback) return;

  try {
    const chatRef = doc(db, "support_chats", chatId);
    await updateDoc(chatRef, { unreadByAdmin: false });
  } catch (error) {
    console.warn("Firestore markChatAsReadByAdmin error:", error);
  }
}

export async function markChatAsReadByUser(chatId: string): Promise<void> {
  // Update local storage
  try {
    const localChats = JSON.parse(localStorage.getItem('local_db_support_chats') || '{}');
    if (localChats[chatId]) {
      localChats[chatId].unreadByUser = false;
      localStorage.setItem('local_db_support_chats', JSON.stringify(localChats));
    }
  } catch (e) {}

  if (useLocalStorageFallback) return;

  try {
    const chatRef = doc(db, "support_chats", chatId);
    await updateDoc(chatRef, { unreadByUser: false });
  } catch (error) {
    console.warn("Firestore markChatAsReadByUser error:", error);
  }
}

// ---------------------------
// 12. User Notifications System
// ---------------------------
function getLocalNotifications(): Record<string, UserNotification> {
  const saved = localStorage.getItem('local_db_notifications');
  return saved ? JSON.parse(saved) : {};
}

function saveLocalNotifications(notifications: Record<string, UserNotification>) {
  localStorage.setItem('local_db_notifications', JSON.stringify(notifications));
}

export function clearLocalNotificationsCache(): void {
  try {
    localStorage.removeItem('local_db_notifications');
  } catch (e) {}
}

export async function createNotification(userId: string, message: string): Promise<UserNotification> {
  const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newNotif: UserNotification = {
    id: notifId,
    userId,
    message,
    createdAt: new Date().toISOString(),
    read: false
  };

  const localMap = getLocalNotifications();
  localMap[notifId] = newNotif;
  saveLocalNotifications(localMap);

  try {
    await setDoc(doc(db, "notifications", notifId), newNotif);
  } catch (e) {
    console.warn("createNotification firestore error:", e);
  }

  return newNotif;
}

export const createUserNotification = createNotification;

function normalizePhone(p: string): string {
  if (!p) return '';
  const digits = p.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function matchesUser(notifUserId: string, target: string | User): boolean {
  if (!notifUserId || !target) return false;
  if (notifUserId === 'all' || notifUserId === 'broadcast') return true;

  const targetPhone = typeof target === 'string' ? target : (target.phone || target.id || '');
  const targetUserObj = typeof target === 'string' ? null : target;

  if (notifUserId === targetPhone) return true;

  if (targetUserObj) {
    if (targetUserObj.id && notifUserId === targetUserObj.id) return true;
    if (targetUserObj.phone && notifUserId === targetUserObj.phone) return true;
    if (targetUserObj.inviteCode && notifUserId === targetUserObj.inviteCode) return true;
    if (targetUserObj.role === 'admin' && (notifUserId === 'admin' || notifUserId === 'oxlo_admin' || notifUserId === '07519952000' || notifUserId === '07712345678' || notifUserId === 'ADMIN95' || notifUserId === 'OXLO95')) {
      return true;
    }
  } else {
    if (targetPhone === 'admin' && (notifUserId === 'admin' || notifUserId === 'oxlo_admin' || notifUserId === '07519952000' || notifUserId === '07712345678' || notifUserId === 'ADMIN95' || notifUserId === 'OXLO95')) {
      return true;
    }
  }

  const norm1 = normalizePhone(notifUserId);
  const norm2 = normalizePhone(targetPhone);
  if (norm1 && norm2 && norm1.length >= 9 && norm2.length >= 9) {
    if (norm1 === norm2) return true;
  }

  return false;
}

function deduplicateNotifications(list: UserNotification[]): UserNotification[] {
  const seenMap = new Map<string, UserNotification>();
  for (const notif of list) {
    const dateBucket = notif.createdAt ? notif.createdAt.substring(0, 16) : '';
    const key = `${notif.message.trim()}__${dateBucket}`;
    if (!seenMap.has(key)) {
      seenMap.set(key, notif);
    }
  }
  return Array.from(seenMap.values());
}

export async function getUserNotifications(targetUser: string | User): Promise<UserNotification[]> {
  const localList = Object.values(getLocalNotifications()).filter(n => matchesUser(n.userId, targetUser));

  try {
    const q = query(collection(db, "notifications"));
    const snap = await getDocs(q);
    const fsList: UserNotification[] = [];
    snap.forEach(d => {
      const data = d.data() as UserNotification;
      if (matchesUser(data.userId, targetUser)) {
        fsList.push(data);
      }
    });

    const map: Record<string, UserNotification> = {};
    localList.forEach(n => { map[n.id] = n; });
    fsList.forEach(n => { map[n.id] = n; });

    const sorted = Object.values(map).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return deduplicateNotifications(sorted);
  } catch (e) {
    console.warn("getUserNotifications error:", e);
    const sorted = localList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return deduplicateNotifications(sorted);
  }
}

export function subscribeToUserNotifications(targetUser: string | User, callback: (notifs: UserNotification[]) => void): () => void {
  const getFilteredList = (localMap: Record<string, UserNotification>) => {
    const filtered = Object.values(localMap)
      .filter(n => matchesUser(n.userId, targetUser))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return deduplicateNotifications(filtered);
  };

  const localMap = getLocalNotifications();
  callback(getFilteredList(localMap));

  const q = query(collection(db, "notifications"));
  return safeOnSnapshot(q, (snapshot) => {
    const fsMap: Record<string, UserNotification> = {};
    snapshot.forEach((d) => {
      const data = d.data() as UserNotification;
      fsMap[data.id] = data;
    });
    const merged = { ...getLocalNotifications(), ...fsMap };
    saveLocalNotifications(merged);
    callback(getFilteredList(merged));
  }, (error) => {
    console.warn("subscribeToUserNotifications error:", error);
  }, () => {
    callback(getFilteredList(getLocalNotifications()));
  });
}

export async function markNotificationAsRead(notifId: string): Promise<void> {
  const localMap = getLocalNotifications();
  if (localMap[notifId]) {
    localMap[notifId].read = true;
    saveLocalNotifications(localMap);
  }

  try {
    await updateDoc(doc(db, "notifications", notifId), { read: true });
  } catch (e) {
    console.warn("markNotificationAsRead firestore error:", e);
  }
}

export async function markAllNotificationsAsRead(targetUser: string | User): Promise<void> {
  const localMap = getLocalNotifications();
  let updated = false;

  Object.values(localMap).forEach(n => {
    if (matchesUser(n.userId, targetUser) && !n.read) {
      n.read = true;
      updated = true;
    }
  });

  if (updated) {
    saveLocalNotifications(localMap);
  }

  try {
    const q = query(collection(db, "notifications"), where("read", "==", false));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    let count = 0;
    snapshot.forEach(d => {
      const data = d.data() as UserNotification;
      if (matchesUser(data.userId, targetUser)) {
        batch.update(d.ref, { read: true });
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
    }
  } catch (e) {
    console.warn("markAllNotificationsAsRead firestore error:", e);
  }
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  phone: string;
  referralCount: number;
  vipTier: string;
}

export async function getReferralLeaderboard(): Promise<LeaderboardEntry[]> {
  const localUsers = getLocalUsers();
  const list = Object.values(localUsers);

  const counts: Record<string, number> = {};
  list.forEach(u => {
    if (u.referrerCode) {
      const refCode = u.referrerCode.trim().toUpperCase();
      counts[refCode] = (counts[refCode] || 0) + 1;
    }
  });

  const entries: LeaderboardEntry[] = list.map(u => {
    const code = (u.inviteCode || '').trim().toUpperCase();
    return {
      userId: u.id || u.phone,
      username: u.username || '',
      phone: u.phone || '',
      referralCount: counts[code] || 0,
      vipTier: u.vipTier || 'العضوية العادية'
    };
  });

  if (!useLocalStorageFallback) {
    try {
      const snap = await getDocs(collection(db, "users"));
      const fsUsers: User[] = [];
      snap.forEach(d => {
        fsUsers.push(d.data() as User);
      });

      const fsCounts: Record<string, number> = {};
      fsUsers.forEach(u => {
        if (u.referrerCode) {
          const refCode = u.referrerCode.trim().toUpperCase();
          fsCounts[refCode] = (fsCounts[refCode] || 0) + 1;
        }
      });

      const fsEntries: LeaderboardEntry[] = fsUsers.map(u => {
        const code = (u.inviteCode || '').trim().toUpperCase();
        return {
          userId: u.id || u.phone,
          username: u.username || '',
          phone: u.phone || '',
          referralCount: fsCounts[code] || 0,
          vipTier: u.vipTier || 'العضوية العادية'
        };
      });

      return fsEntries
        .filter(e => e.username && !e.username.toLowerCase().includes('admin'))
        .sort((a, b) => b.referralCount - a.referralCount);
    } catch (e) {
      console.warn("getReferralLeaderboard firestore error:", e);
    }
  }

  return entries
    .filter(e => e.username && !e.username.toLowerCase().includes('admin'))
    .sort((a, b) => b.referralCount - a.referralCount);
}









import { auth } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export async function shadowFirebaseAuth(phone: string, passwordHash: string) {
  try {
    const email = `${phone.replace(/\+/g, '')}@oxlo.app`;
    const safePassword = passwordHash.substring(0, 20).padEnd(6, '0');
    let userCredential;
    try {
      userCredential = await withTimeout(signInWithEmailAndPassword(auth, email, safePassword));
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          userCredential = await withTimeout(createUserWithEmailAndPassword(auth, email, safePassword));
        } catch (createError: any) {
          if (createError.code === 'auth/email-already-in-use') {
             userCredential = await withTimeout(signInWithEmailAndPassword(auth, email, safePassword));
          } else {
             throw createError;
          }
        }
      } else {
        throw error;
      }
    }

    if (userCredential && userCredential.user) {
      try {
        await updateDoc(doc(db, "users", phone), {
          uid: userCredential.user.uid
        });
      } catch (e) {
        console.warn("Could not sync UID to user document:", e);
      }
    }
  } catch (error) {
    console.warn("Shadow auth failed silently:", error);
  }
}

export async function signInBackend() {
  const email = "backend_secure_server_admin@oxlo.app";
  const password = "VerySecureBackendPassword123!@#";
  try {
    const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import('firebase/auth');
    const { auth } = await import('./firebase');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Backend signed in successfully.");
    } catch (e: any) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log("Backend user created and signed in.");
      } else {
        throw e;
      }
    }
  } catch (err) {
    console.error("Backend sign in failed:", err);
  }
}
