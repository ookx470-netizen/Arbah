export interface User {
  id: string;
  uid?: string; // Firebase Auth UID
  username: string; // اسم المستخدم كامل
  phone: string; // رقم الهاتف مع المفتاح الدولي والعراق أساسي
  password?: string; // كلمة المرور المشفرة أو النصية للتبسيط في هذا السياق الآمن
  rawPassword?: string; // كلمة المرور النصية الصريحة لرؤيتها في لوحة التحكم عند التسجيل
  inviteCode: string; // رمز الدعوة الخاص بالمستخدم
  referrerCode?: string; // رمز دعوة الشخص الذي دعاه
  walletAddress?: string; // ربط محفظة المستخدم (usdt polygon)
  earnings: number; // الأرباح
  taskIncome: number; // دخل المهمه
  effectiveDays: number; // يوم العمل الفعال فقط
  role: 'admin' | 'user';
  createdAt: string;
  vipTier?: string; // نوع الباقة المشترك بها (مثل VIP 1, VIP 2, إلخ)
  vipStartDate?: string; // تاريخ بدء سريان الباقة (لحساب الأيام المتبقية)
  country?: string; // الدولة (مثال: العراق)
  countryCode?: string; // رمز الدولة (مثال: IQ)
  region?: string; // المنطقة/المحافظة
  city?: string; // المدينة
  ip?: string; // IP
  lastLocationUpdate?: string; // تاريخ آخر تحديث موقع
  lastLoginAt?: string; // تاريخ ووقت آخر تسجيل دخول
  lastLogoutAt?: string; // تاريخ ووقت آخر تسجيل خروج
  lastActiveAt?: string; // تاريخ ووقت آخر تواجد أو نشاط للمستخدم
  isOnline?: boolean; // حالة الاتصال الحالية للمستخدم (داخل الموقع أم لا)
  isWithdrawalBlocked?: boolean; // حظر سحب الأرباح للمستخدم
}

export interface UserNotification {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface Task {
  id: string;
  title: string;
  reward: string;
  category: 'facebook' | 'youtube' | 'tiktok' | 'instagram';
  status: 'withdrawn' | 'in_progress' | 'completed' | 'rejected';
  taskDetails: string;
  requires: string;
  reviewLink: string;
  uploadedScreenshot?: string;
  claimDate?: string;
}

export interface Deposit {
  id: string;
  userId: string;
  username: string;
  phone: string;
  amount: number;
  currency: string; // USDT (BEP20), USDT (TRC20), USDT (Polygon)
  txHash?: string; // رقم المعاملة / الهاش لإثبات الإيداع (اصبح اختياريا)
  screenshotUrl?: string; // صورة التحويل المرفوعة للتحقق
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  username: string;
  phone: string;
  amount: number;
  currency: 'USDT (BEP20)' | 'USDT (TRC20)' | 'USDT (Polygon)' | string;
  walletAddress: string; // المحفظة التي تم السحب إليها
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface VipPlan {
  id: string;
  name: string; // اسم الباقة
  price: number; // السعر بالدولار
  profit: number; // الربح بالدولار
  tasksCount: number; // عدد المهام
  isTrial?: boolean; // هل هي باقة تجريبية؟
  maxSubscribers?: number; // الحد الأقصى للمشتركين
}

export interface SystemSettings {
  siteName: string; // اسم الموقع (مثل BET)
  rechargeAddress: string; // عنوان الإيداع (USDT Polygon) المحددة من قبل الأدمن
  rechargeAddressTRC20: string; // عنوان الإيداع (USDT TRC-20) المحددة من قبل الأدمن
  rechargeAddressBEP20: string; // عنوان الإيداع (USDT BEP-20) المحددة من قبل الأدمن
  telegramLink: string; // رابط منصة تواصل
  minDeposit: number; // الحد الأدنى للإيداع
  minWithdrawal: number; // الحد الأدنى للسحب
  holidayActive: boolean; // تفعيل العطلة الأسبوعية أو إيقاف المهام
  holidayDays?: number[]; // أيام العطلة الأسبوعية المحددة (0: الأحد، 1: الإثنين، ..., 6: السبت)
  globalNotification?: string; // رسالة الإشعار العام للموقع
  withdrawLockActive?: boolean; // قفل السحب يدوياً بالكامل
  withdrawLockDays?: number[]; // تحديد أيام قفل السحب أسبوعياً
  withdrawRatesInfo?: string; // عرض أسعار وتنويهات السحب للمستخدمين
  rechargeNotice?: string; // تنبيه/إشعار صفحة الشحن للمستخدمين (الأول)
  rechargeNotice2?: string; // تنبيه/إشعار صفحة الشحن للمستخدمين الثاني (الجديد)
  withdrawNotice?: string; // تنبيه/إشعار صفحة السحب للمستخدمين (الأول)
  withdrawNotice2?: string; // تنبيه/إشعار صفحة السحب للمستخدمين الثاني (الجديد)
  vipPlans?: VipPlan[]; // الاشتراكات والخطط المتاحة
  defaultTasksLimit?: number; // عدد المهام الافتراضي للعضوية العادية
  defaultTaskReward?: number; // سعر المهمة الواحدة الافتراضي للعضوية العادية
  workingHoursNotice?: string; // نص التنويه لأوقات العمل المخصص
  enforceWorkingHours?: boolean; // تفعيل تقييد أوقات العمل
  workStartHour?: number; // الفترة الأولى: ساعة بدء العمل (بتوقيت 24 ساعة)
  workEndHour?: number; // الفترة الأولى: ساعة نهاية العمل (بتوقيت 24 ساعة)
  workStartHour2?: number; // الفترة الثانية: ساعة بدء العمل (بتوقيت 24 ساعة)
  workEndHour2?: number; // الفترة الثانية: ساعة نهاية العمل (بتوقيت 24 ساعة)
  appDownloadUrl?: string; // رابط أو ملف تحميل التطبيق المرفوع من الأدمن
  supportAgentName?: string; // اسم وكيل الدعم (مثل مريم)
  supportAgentSubtitle?: string; // المسمى الوظيفي أو الوصف
  supportAgentAvatar?: string; // الصورة الرمزية لوكيل الدعم (رابط أو base64)
  telegramSupportUsername?: string; // يوزر التليجرام في حال اختيار الدعم عبر تليجرام
  supportFaqs?: SupportFaq[]; // الأسئلة الشائعة للرد التلقائي المخصص
  tasksCode?: string; // رمز المهام اليومي المطلوب لدخول السجل
  hideTrialPlans?: boolean; // إخفاء الباقات التجريبية من واجهة الأعضاء
}

export interface SupportFaq {
  question: string;
  answer: string;
}

export interface SupportMessage {
  id: string;
  chatId: string; // رقم هاتف العميل وهو معرف الشات نفسه
  text: string;
  sender: 'user' | 'admin';
  senderName: string;
  timestamp: string;
}

export interface SupportChat {
  id: string; // رقم هاتف العميل
  username: string;
  phone: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadByAdmin: boolean;
  unreadByUser: boolean;
  createdAt: string;
}
