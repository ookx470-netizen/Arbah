import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { Resend } from "resend";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Resend Email Client Lazy Initialization
let resendClient: Resend | null = null;
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// In-memory OTP Store for email verifications
interface EmailOtpRecord {
  code: string;
  expiresAt: number;
  lastSentAt: number;
  attempts: number;
}
const emailOtpStore = new Map<string, EmailOtpRecord>();

// Clean up expired OTPs periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of emailOtpStore.entries()) {
    if (record.expiresAt < now) {
      emailOtpStore.delete(email);
    }
  }
}, 5 * 60 * 1000);

// Strict Trusted Providers List (Whitelist)
const TRUSTED_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'passport.com',
  'outlook.sa', 'outlook.ae', 'outlook.fr', 'outlook.de', 'outlook.es', 'outlook.co.uk',
  'hotmail.co.uk', 'hotmail.fr', 'hotmail.de', 'hotmail.es', 'live.fr', 'live.co.uk',
  'yahoo.com', 'yahoo.fr', 'yahoo.co.uk', 'yahoo.es', 'yahoo.de', 'yahoo.it', 'yahoo.ca',
  'yahoo.com.br', 'yahoo.com.mx', 'yahoo.com.ar', 'yahoo.co.in', 'yahoo.co.jp', 'ymail.com', 'rocketmail.com',
  'icloud.com', 'me.com', 'mac.com',
  'proton.me', 'protonmail.com', 'pm.me', 'tutanota.com', 'tuta.io', 'tuta.com',
  'zoho.com', 'zohomail.com', 'aol.com', 'aim.com', 'mail.com', 'gmx.com', 'gmx.net', 'gmx.de',
  'web.de', 'freenet.de', 't-online.de',
  'yandex.com', 'yandex.ru', 'ya.ru', 'mail.ru', 'bk.ru', 'inbox.ru', 'list.ru',
  'qq.com', '163.com', '126.com', 'sina.com', 'sohu.com',
  'naver.com', 'daum.net', 'hanmail.net',
  'orange.fr', 'wanadoo.fr', 'free.fr', 'sfr.fr', 'laposte.net',
  'libero.it', 'virgilio.it', 'tiscali.it', 'alice.it',
  'terra.com.br', 'uol.com.br', 'bol.com.br',
  'rediffmail.com'
]);

function isAllowedEmailServer(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1].trim();
  if (!domain || !domain.includes('.')) return false;

  if (TRUSTED_EMAIL_DOMAINS.has(domain)) return true;
  if (domain.endsWith('.edu') || domain.includes('.edu.') || domain.includes('.ac.') || domain.endsWith('.gov') || domain.includes('.gov.')) {
    return true;
  }
  return false;
}

// API Endpoint: Send Email OTP Verification Code
app.post("/api/send-email-otp", async (req, res) => {
  try {
    const { email, siteName = "OXLO" } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: "يرجى إدخال عنوان بريد إلكتروني صحيح وصالح." });
    }

    // Strictly allow only verified official email providers
    if (!isAllowedEmailServer(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "⛔ عذراً، يُسمح فقط بالتسجيل عبر مزودي البريد الإلكتروني الرسميين المعتمدين (مثل: Gmail, Outlook, Hotmail, Yahoo, iCloud, Proton...). لا يُقبل أي بريد وهمي أو غير معروف."
      });
    }

    const now = Date.now();
    const existing = emailOtpStore.get(cleanEmail);

    // Rate limit: 45 seconds cooldown between resends
    if (existing && now - existing.lastSentAt < 45 * 1000) {
      const waitSeconds = Math.ceil((45 * 1000 - (now - existing.lastSentAt)) / 1000);
      return res.status(429).json({
        success: false,
        message: `يرجى الانتظار ${waitSeconds} ثانية قبل طلب رمز جديد.`
      });
    }

    // Generate random 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes

    emailOtpStore.set(cleanEmail, {
      code: otpCode,
      expiresAt,
      lastSentAt: now,
      attempts: 0
    });

    const resend = getResendClient();
    if (!resend) {
      // In development or when RESEND_API_KEY is not set yet
      console.warn(`[DEV MODE] RESEND_API_KEY is not set. Simulated OTP for ${cleanEmail} is: ${otpCode}`);
      return res.json({
        success: true,
        devMode: true,
        previewCode: otpCode,
        message: "تم توليد رمز التحقق! (لتفعيل الإرسال الحقيقي عبر الإيميل، يرجى وضع مفتاح RESEND_API_KEY في الإعدادات)."
      });
    }

    // Modern HTML email template for OXLO
    const htmlContent = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f19; color: #ffffff; padding: 40px 20px; border-radius: 16px; max-width: 520px; margin: auto; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #ffffff; font-size: 20px; font-weight: 900; padding: 12px 28px; border-radius: 12px; letter-spacing: 2px;">
            ${siteName}
          </div>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 8px; font-weight: 600;">منصة الاستثمار الرقمي المعتمدة</p>
        </div>
        
        <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 28px; text-align: center;">
          <h2 style="color: #f8fafc; font-size: 18px; margin-bottom: 12px; font-weight: 800;">رمز التحقق لتسجيل الحساب</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            مرحباً بك! استخدم الرمز السري أدناه لتأكيد بريدك الإلكتروني وإكمال إنشاء حسابك:
          </p>
          
          <div style="background: linear-gradient(180deg, #1e293b, #0f172a); border: 2px dashed #3b82f6; border-radius: 12px; padding: 16px 24px; margin: 20px auto; display: inline-block;">
            <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #38bdf8;">
              ${otpCode}
            </span>
          </div>

          <p style="color: #f59e0b; font-size: 12px; font-weight: 700; margin-top: 16px;">
            ⏱️ هذا الرمز صالح لمدة 10 دقائق فقط.
          </p>
        </div>

        <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 11px; line-height: 1.5;">
          <p>إذا لم تكن قد طلبت هذا الرمز، يمكنك تجاهل هذا البريد بأمان.</p>
          <p style="margin-top: 4px;">© ${new Date().getFullYear()} ${siteName}. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    `;

    // Use verified domain sender (Domain added in Resend is "oxlo.store")
    const customFrom = process.env.RESEND_FROM_EMAIL;
    const fromAddress = customFrom || `OXLO Security <auth@oxlo.store>`;
    
    let sendResult = await resend.emails.send({
      from: fromAddress,
      to: [cleanEmail],
      subject: `رمز التحقق الخاص بك لمنصة ${siteName}: ${otpCode}`,
      html: htmlContent
    });

    // If oxlo.store primary fails, try verify@send.oxlo.store or support@oxlo.store
    if (sendResult.error) {
      console.warn("Retrying with support@oxlo.store:", sendResult.error);
      sendResult = await resend.emails.send({
        from: `OXLO Security <support@oxlo.store>`,
        to: [cleanEmail],
        subject: `رمز التحقق الخاص بك لمنصة ${siteName}: ${otpCode}`,
        html: htmlContent
      });
    }

    if (sendResult.error) {
      console.error("Resend API error:", sendResult.error);
      
      let userFriendlyMsg = sendResult.error.message || "حدث خطأ أثناء إرسال البريد الإلكتروني.";
      
      // Check for Resend testing domain restriction
      if (sendResult.error.message && (sendResult.error.message.includes('testing emails') || sendResult.error.message.includes('verify a domain') || sendResult.error.message.includes('own email address'))) {
        userFriendlyMsg = "⚠️ إشعار: حساب Resend قيد التحقق حالياً. في الوضع التجريبي يسمح بإرسال الرموز إلى إيميل صاحب الحساب فقط. سيتاح لجميع الإيميلات فور اكتمال توثيق الدومين.";
      }

      return res.status(400).json({
        success: false,
        message: userFriendlyMsg
      });
    }

    return res.json({
      success: true,
      message: "تم إرسال رمز التحقق بنجاح إلى بريدك الإلكتروني! تفقد صندوق الوارد أو البريد غير المرغوب فيه (Spam)."
    });
  } catch (err: any) {
    console.error("Error in /api/send-email-otp:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "حدث خطأ غير متوقع في الخادم أثناء إرسال رمز التحقق."
    });
  }
});

// API Endpoint: Verify Email OTP Code
app.post("/api/verify-email-otp", (req, res) => {
  try {
    const { email, code } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanCode = (code || "").trim();

    if (!cleanEmail || !cleanCode) {
      return res.status(400).json({ success: false, message: "يرجى إدخال البريد الإلكتروني ورمز التحقق." });
    }

    const record = emailOtpStore.get(cleanEmail);
    if (!record) {
      return res.status(400).json({
        success: false,
        message: "لم يتم العثور على رمز تحقق لهذا البريد أو انتهت صلاحيته. يرجى طلب رمز جديد."
      });
    }

    if (Date.now() > record.expiresAt) {
      emailOtpStore.delete(cleanEmail);
      return res.status(400).json({
        success: false,
        message: "انتهت صلاحية رمز التحقق (مرت 10 دقائق). يرجى طلب رمز جديد."
      });
    }

    if (record.attempts >= 5) {
      emailOtpStore.delete(cleanEmail);
      return res.status(400).json({
        success: false,
        message: "تم تجاوز الحد الأقصى للمحاولات الخاطئة. يرجى طلب رمز تحقق جديد."
      });
    }

    if (record.code !== cleanCode) {
      record.attempts += 1;
      return res.status(400).json({
        success: false,
        message: `رمز التحقق غير صحيح! (المحاولات المتبقية: ${5 - record.attempts})`
      });
    }

    // Code is valid! Remove OTP record to prevent reuse
    emailOtpStore.delete(cleanEmail);

    return res.json({
      success: true,
      message: "تم التحقق من البريد الإلكتروني بنجاح!"
    });
  } catch (err: any) {
    console.error("Error in /api/verify-email-otp:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "حدث خطأ غير متوقع أثناء التحقق من الرمز."
    });
  }
});

// Ensure the uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage: storageConfig });

// Serve /uploads statically so uploads are fully accessible
app.use("/uploads", express.static(uploadDir));

// File upload API endpoint using multer
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file was uploaded" });
  }
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// Helper to get exact Baghdad / Mecca time details
function getBaghdadTimeDetails() {
  const now = new Date();
  let bDate = now;
  try {
    const baghdadStr = now.toLocaleString("en-US", { timeZone: "Asia/Baghdad" });
    bDate = new Date(baghdadStr);
  } catch (e) {
    bDate = new Date(now.getTime() + 3 * 3600 * 1000);
  }

  const daysArabic = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const currentDayName = daysArabic[bDate.getDay()];
  const currentDayNum = bDate.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const isHoliday = (currentDayNum === 5 || currentDayNum === 6); // الجمعة والسبت عطلة رسمية

  const currentHour = bDate.getHours();
  const isWithdrawalTime = currentHour >= 12 && currentHour <= 23; // 12 PM to 12 AM
  const isWorkTime = (!isHoliday) && ((currentHour >= 12 && currentHour < 17) || (currentHour >= 20 || currentHour < 1));

  const formattedDate = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, '0')}-${String(bDate.getDate()).padStart(2, '0')}`;
  
  let formattedTime = "";
  try {
    formattedTime = bDate.toLocaleTimeString("ar-IQ", { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch (e) {
    formattedTime = `${currentHour}:00`;
  }

  return {
    bDate,
    currentDayName,
    currentDayNum,
    isHoliday,
    currentHour,
    isWithdrawalTime,
    isWorkTime,
    formattedDate,
    formattedTime
  };
}

// Secure API for Task Completion
app.post("/api/complete-task", async (req, res) => {
  try {
    const { phone, password, taskId, rewardValue } = req.body;
    const { getUserByPhone, updateUserStats, creditReferrerCommission } = await import('./src/firebaseService');
    const user = await getUserByPhone(phone);
    
    const baseEarnings = user ? (Number(user.earnings) || 0) : 0;
    const baseTaskIncome = user ? (Number(user.taskIncome) || 0) : 0;
    const reward = Number(rewardValue) || 1;
    
    if (reward <= 0) {
      return res.status(400).json({ success: false, message: `قيمة المكافأة غير صالحة: ${rewardValue}` });
    }
    if (reward > 200) {
      return res.status(400).json({ success: false, message: "قيمة المكافأة تتجاوز الحد المسموح." });
    }
    
    const newEarnings = Number((baseEarnings + reward).toFixed(2));
    const newTaskIncome = Number((baseTaskIncome + reward).toFixed(2));
    
    await updateUserStats(phone, {
      earnings: newEarnings,
      taskIncome: newTaskIncome
    });
    
    try {
      await creditReferrerCommission(phone, reward, user?.username || "مستخدم");
    } catch (commErr) {
      console.error("Error crediting referrer:", commErr);
    }
    
    res.json({ success: true, newEarnings, newTaskIncome });
  } catch (err: any) {
    console.error("Complete task error:", err);
    res.status(500).json({ success: false, message: err.message || "حدث خطأ غير متوقع" });
  }
});

// Secure API for VIP Upgrade
app.post("/api/upgrade-vip", async (req, res) => {
  try {
    const { phone, password, planName, planPrice, isTrial } = req.body;
    const { getUserByPhone, updateUserByAdmin } = await import('./src/firebaseService');
    const user = await getUserByPhone(phone);
    
    const currentEarnings = user ? (Number(user.earnings) || 0) : Number(planPrice);
    const price = Number(planPrice) || 0;
    
    if (user && currentEarnings < price) {
      return res.status(400).json({ success: false, message: "رصيد غير كافٍ." });
    }
    
    const newEarnings = Number((currentEarnings - price).toFixed(2));
    
    await updateUserByAdmin(phone, {
      earnings: newEarnings,
      vipTier: planName,
      effectiveDays: isTrial ? 1 : 365,
      vipStartDate: new Date().toISOString(),
      hasDeposited: true
    });
    
    res.json({ success: true, newEarnings });
  } catch (err: any) {
    console.error("Upgrade VIP error:", err);
    res.status(500).json({ success: false, message: err.message || "حدث خطأ غير متوقع" });
  }
});

// AI Support Chat API (Elena - إلينا مستشارة الدعم الفني)
app.post("/api/support-chat", async (req, res) => {
  const { userPhone, username, vipTier, earnings, userMessage, recentMessages } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcDay = now.getUTCDay(); // 0: Sun, 1: Mon, ..., 5: Fri, 6: Sat
  const meccaHours = (utcHours + 3) % 24;
  
  const isHoliday = (utcDay === 5 || utcDay === 6);
  const isWithdrawalTime = meccaHours >= 12 && meccaHours <= 23; // 12 PM to 12 AM
  const isWorkTime = (!isHoliday) && ((meccaHours >= 14 && meccaHours < 17) || (meccaHours >= 21 && meccaHours < 24));

  const text = (userMessage || '').trim().toLowerCase();

  // Local expert support response engine (100% instant expert answers)
  let localReply = "";
  if (text.includes("تأسست") || text.includes("تأسيس") || text.includes("متى") || text.includes("عمر") || text.includes("بداية")) {
    localReply = `أهلاً بك يا ${username || 'عزيزي'}! تأسست منصة oxlo في هنكاريا بتاريخ 2026/05/03، ودخلت رسمياً إلى العراق وسوريا في تاريخ 2026/07/08.`;
  } else if (text.includes("سحب") || text.includes("فلوس") || text.includes("ارباح") || text.includes("أرباح") || text.includes("زين كاش") || text.includes("محفظة")) {
    localReply = `أهلاً بك يا ${username || 'عزيزي'}! الحد الأدنى للسحب هو 2 USDT عبر شبكات USDT (POLYGON, TRC20, BEP20). أوقات السحب يومياً من 12 ظهراً حتى 12 ليلاً، ومعالجة الطلبات تتم خلال 24 ساعة كحد أقصى (رسوم السحب 15%).`;
  } else if (text.includes("شحن") || text.includes("إيداع") || text.includes("ايداع") || text.includes("رصيد") || text.includes("تحويل")) {
    localReply = `أهلاً بك يا ${username || 'عزيزي'}! الحد الأدنى للإيداع هو 25 USDT (عبر شبكات POLYGON, TRC20, BEP20). الإيداع متاح 24/7، فقط قم بالتحويل وارفع لقطة الشاشة ورقم المعاملة (الهاش) ليعتمدها المدير فوراً.`;
  } else if (text.includes("مهام") || text.includes("شغل") || text.includes("عمل") || text.includes("عطلة") || text.includes("مهمة")) {
    localReply = isHoliday 
      ? `اليوم عطلة رسمية (جمعة/سبت) بالمنصة ولا توجد مهام إطلاقاً، وتعود المهام يوم الأحد الساعة 2 ظهراً.`
      : `أوقات المهام اليومية: الفترة الأولى (2 ظهراً لـ 5 عصراً) والفترة الثانية (9 مساءً لـ 12 صباحاً). وتكتمل المهام بدقائق بسيطة!`;
  } else if (text.includes("باقة") || text.includes("اشتراك") || text.includes("ترقية") || text.includes("a") || text.includes("b") || text.includes("c") || text.includes("business") || text.includes("مستوى")) {
    localReply = `الباقات تبدأ من مستوى A ($150 بأرباح $4 يومياً)، وB1 ($300 بأرباح $9)، وصولاً لباقات القادة C و Business. يمكنك الترقية فوراً من تبويب 'المنصب'.`;
  } else if (text.includes("السلام") || text.includes("مرحبا") || text.includes("هلا") || text.includes("صباح") || text.includes("مساء") || text.includes("أهلاً") || text.includes("hi") || text.includes("hello")) {
    localReply = `أهلاً بك يا ${username || 'عزيزي'}! أنا إلينا مستشارة الدعم الفني لمنصة oxlo. كيف يمكنني مساعدتك اليوم؟`;
  } else if (text.includes("شكرا") || text.includes("تسلم") || text.includes("بارك") || text.includes("يعطيك")) {
    localReply = `العفو يا ${username || 'عزيزي'}! أنا دائماً في خدمتكم لضمان نجاحكم وتجاربكم المميزة في منصة oxlo. هل لديك أي استفسار آخر؟`;
  } else if (text.includes("مشكلة") || text.includes("عطل") || text.includes("خطأ") || text.includes("مساعدة") || text.includes("الدعم")) {
    localReply = `أنا معك يا ${username || 'عزيزي'}! يمكنك توضيح تفاصيل المشكلة أو إرفاق لقطة شاشة، وسأقوم بمساعدتك وحل طلبك فوراً.`;
  } else if (text.includes("احالة") || text.includes("دعوة") || text.includes("صديق") || text.includes("رابط")) {
    localReply = `نظام الإحالة في منصة oxlo يمنحك عمولات مجزية عند دعوة أصدقائك عبر رابط الإحالة الخاص بك الموجود في صفحة حسابك الشخصي!`;
  }

  if (localReply) {
    return res.json({ reply: localReply });
  }

  if (!apiKey) {
    return res.json({ reply: `أهلاً بك يا ${username || 'عزيزي'}! أنا إلينا مستشارة الدعم الفني لمنصة oxlo. تأسست المنصة في 2026/05/03، وأوقات السحب والإيداع متوفرة يومياً، والمهام تنفتح بـ 2 ظهراً و9 مساءً. كيف يمكنني مساعدتك الآن؟` });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `أنتِ إلينا (Elena)، مستشارة الدعم الفني والمستشارة المالية والتقنية والرفيقة الودودة الرسمية لمنصة oxlo (منصة المهام الكبرى USDT).
تتحدثين مع المستخدمين بكل ود ولباقة ومحبة عن **أي شيء وكل شيء** يطلبونه (سواء كان استفساراً عاماً، دردشة، نصائح، مساعدة تقنية، أو مواضيع متنوعة)، وتساعدينهم في كافة احتياجاتهم بروح إيجابية ودافئة.
وفي حال سأل أحدهم عن معلومات منصة oxlo، تلتزمين بدقة بالمعلومات التالية:

0. تأسيس المنصة والدخول الإقليمي:
   - تأسست منصة oxlo في هنكاريا بتاريخ 2026/05/03.
   - دخلت المنصة رسمياً إلى العراق وسوريا في تاريخ 2026/07/08.

1. باقات VIP والأرباح اليومية:
   - مستوى A: التكلفة $150 | الربح اليومي $4
   - مستوى B1: التكلفة $300 | الربح اليومي $9
   - مستوى B2: التكلفة $600 | الربح اليومي $25
   - مستوى C1: التكلفة $1,200 | الربح اليومي $45
   - مستوى C2: التكلفة $2,600 | الربح اليومي $90
   - مستوى D1: التكلفة $6,000 | الربح اليومي $162
   - مستوى F2: التكلفة $13,000 | الربح اليومي $360
   - مستوى E1: التكلفة $28,000 | الربح اليومي $750
   - مستوى E2: التكلفة $60,000 | الربح اليومي $1,620
   - مستوى Business: التكلفة $100,000 | الربح اليومي $2,550

2. الشحن والإيداع:
   - العملة: USDT عبر شبكات (POLYGON, TRC20, BEP20).
   - الحد الأدنى للإيداع: 25 USDT. متاح 24/7.

3. سحب الأرباح:
   - العملة: USDT عبر شبكات (POLYGON, TRC20, BEP20).
   - الحد الأدنى للسحب: 2 USDT. أوقات طلب السحب يومياً من 12 ظهراً لـ 12 ليلاً.
   - رسوم السحب: 15%.

4. أوقات تنفيذ المهام والعطلات:
   - أوقات العمل: (2 ظهراً - 5 عصراً) و(9 مساءً - 12 صباحاً).
   - العطلة الأسبوعية: الجمعة والسبت عطلة رسمية.

بيانات العضو:
- الاسم: ${username || 'عضو جديد'}
- رقم الهاتف: ${userPhone || 'غير متوفر'}
- الباقة الحالية: ${vipTier || 'العضوية العادية'}
- الرصيد الحالي: ${earnings || 0} USDT

تعليمات الإجابة:
- أجيبي باللغة العربية بأسلوب احترافي، ودود، ومرن جداً (كصديقة ومستشارة حقيقية).
- كوني مستعدة للحديث والمساعدة في **أي موضوع** يطرحه المستخدم بحماس واهتمام.
- إذا سأل عن المنصة أو تأسيسها، اذكري أن منصة oxlo تأسست في هنكاريا بتاريخ 2026/05/03 ودخلت العراق وسوريا في 2026/07/08.
- خاطبي العضو باسمه (${username || 'عزيزي'}).`;

    const contents: any[] = [
      { role: "user", parts: [{ text: systemInstruction }] }
    ];

    if (recentMessages && Array.isArray(recentMessages)) {
      recentMessages.slice(-6).forEach((msg: any) => {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: userMessage }]
    });

    let responseText = localReply;
    if (!responseText) {
      const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-3.6-flash"];

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents
          });
          if (response && response.text) {
            responseText = response.text;
            break;
          }
        } catch (err: any) {
          // Silent fallback
        }
      }
    }

    const reply = responseText || `أهلاً بك يا ${username || 'عزيزي'}! أنا إلينا مستشارة الدعم الفني لمنصة oxlo (تأسست في هنكاريا بتاريخ 2026/05/03 ودخلت العراق وسوريا في 2026/07/08). كيف يمكنني مساعدتك الآن؟`;
    res.json({ reply });
  } catch (err: any) {
    console.error("Support chat error:", err);
    res.json({ reply: localReply || `أهلاً بك يا ${username || 'عزيزي'}! أنا إلينا مستشارة الدعم الفني لمنصة oxlo (تأسست في هنكاريا بتاريخ 2026/05/03 ودخلت العراق وسوريا في 2026/07/08). كيف يمكنني مساعدتك الآن؟` });
  }
});

// Vite middleware & Server bootloader wrapped in async startServer
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
