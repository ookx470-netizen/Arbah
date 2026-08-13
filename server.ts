import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

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
    
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: "فشل التحقق من الهوية." });
    }
    
    const baseEarnings = Number(user.earnings) || 0;
    const baseTaskIncome = Number(user.taskIncome) || 0;
    const reward = Number(rewardValue) || 0;
    
    if (reward <= 0 || reward > 100) {
      return res.status(400).json({ success: false, message: "قيمة المكافأة غير صالحة." });
    }
    
    const newEarnings = Number((baseEarnings + reward).toFixed(2));
    const newTaskIncome = Number((baseTaskIncome + reward).toFixed(2));
    
    await updateUserStats(phone, {
      earnings: newEarnings,
      taskIncome: newTaskIncome
    });
    
    try {
      await creditReferrerCommission(phone, reward, user.username);
    } catch (commErr) {
      console.error("Error crediting referrer:", commErr);
    }
    
    res.json({ success: true, newEarnings, newTaskIncome });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Secure API for VIP Upgrade
app.post("/api/upgrade-vip", async (req, res) => {
  try {
    const { phone, password, planName, planPrice, isTrial } = req.body;
    const { getUserByPhone, updateUserByAdmin } = await import('./src/firebaseService');
    const user = await getUserByPhone(phone);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: "فشل التحقق من الهوية." });
    }
    
    if (user.earnings < planPrice) {
      return res.status(400).json({ success: false, message: "رصيد غير كافٍ." });
    }
    
    const newEarnings = Number((user.earnings - planPrice).toFixed(2));
    
    await updateUserByAdmin(phone, {
      earnings: newEarnings,
      vipTier: planName,
      effectiveDays: isTrial ? 1 : 365,
      vipStartDate: new Date().toISOString()
    });
    
    res.json({ success: true, newEarnings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// AI Support Chat API (Maryam - مريم مستشارة الدعم الفني)
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

  // Local expert support response engine (100% reliable fallback & instant answers)
  let localReply = "";
  if (text.includes("تأسست") || text.includes("تأسيس") || text.includes("متى") || text.includes("عمر") || text.includes("بداية")) {
    localReply = `أهلاً بك يا ${username || 'عزيزي'}! تأسست منصة oxlo في تاريخ 2026/05/03 لتكون المنصة الرائدة في المهام الرقمية وأرباح USDT المضمونة.`;
  } else if (text.includes("سحب") || text.includes("فلوس") || text.includes("ارباح") || text.includes("أرباح") || text.includes("زين كاش")) {
    localReply = `أهلاً بك يا ${username || 'عزيزي'}! الحد الأدنى للسحب هو 2 USDT عبر شبكات USDT (POLYGON, TRC20, BEP20). أوقات السحب يومياً من 12 ظهراً حتى 12 ليلاً، ومعالجة الطلبات تتم خلال 24 ساعة كحد أقصى.`;
  } else if (text.includes("شحن") || text.includes("إيداع") || text.includes("ايداع") || text.includes("رصيد")) {
    localReply = `أهلاً بك يا ${username || 'عزيزي'}! الحد الأدنى للإيداع هو 25 USDT (عبر شبكات POLYGON, TRC20, BEP20). الإيداع متاح 24/7، فقط قم بالتحويل وارفع لقطة الشاشة ورقم المعاملة (الهاش) ليعتمدها المدير فوراً.`;
  } else if (text.includes("مهام") || text.includes("شغل") || text.includes("عمل") || text.includes("عطلة")) {
    localReply = isHoliday 
      ? `اليوم عطلة رسمية (جمعة/سبت) بالمنصة ولا توجد مهام إطلاقاً، وتعود المهام يوم الأحد الساعة 2 ظهراً.`
      : `أوقات المهام اليومية: الفترة الأولى (2 ظهراً لـ 5 عصراً) والفترة الثانية (9 مساءً لـ 12 صباحاً). وتكتمل المهام بدقائق بسيطة!`;
  } else if (text.includes("باقة") || text.includes("اشتراك") || text.includes("ترقية") || text.includes("a1") || text.includes("a2") || text.includes("b1")) {
    localReply = `الباقات تبدأ من A1 ($50 بأرباح $2 يومياً)، وA2 ($100 بأرباح $4)، وB1 ($300 بأرباح $9)، وصولاً لباقات القادة C1. يمكنك الترقية فوراً من تبويب 'المنصب'.`;
  }

  if (localReply) {
    return res.json({ reply: localReply });
  }

  if (!apiKey) {
    return res.json({ reply: `أهلاً بك يا ${username || 'عزيزي'}! أنا مريم مستشارة الدعم الفني لمنصة oxlo. تأسست المنصة في 2026/05/03، وأوقات السحب والإيداع متوفرة يومياً، والمهام تنفتح بـ 2 ظهراً و9 مساءً. كيف يمكنني مساعدتك الآن؟` });
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

    const systemInstruction = `أنتِ مريم (Maryam)، مستشارة الدعم الفني والمستشارة المالية والتقنية الرسمية لمنصة oxlo (منصة المهام الكبرى USDT).
تلتزمين بقواعد ومعلومات عمل منصة oxlo التالية بدقة متناهية وبنسبة 100%:

0. تأسيس المنصة:
   - تأسست منصة oxlo رسمياً في تاريخ 2026/05/03.

1. باقات VIP والأرباح اليومية:
   - باقة A1: سعر الاشتراك $50 - الربح اليومي $2 USDT.
   - باقة A2: سعر الاشتراك $100 - الربح اليومي $4 USDT.
   - باقة B1: سعر الاشتراك $300 - الربح اليومي $9 USDT.
   - باقة B2: سعر الاشتراك $600 - الربح اليومي $22 USDT.
   - باقة C1: سعر الاشتراك $1200 - الربح اليومي $45 USDT.

2. الشحن والإيداع:
   - العملة: USDT عبر شبكات (POLYGON, TRC20, BEP20).
   - الحد الأدنى للإيداع: 25 USDT. متاح 24/7.

3. سحب الأرباح:
   - العملة: USDT عبر شبكات (POLYGON, TRC20, BEP20).
   - الحد الأدنى للسحب: 2 USDT. أوقات طلب السحب يومياً من 12 ظهراً لـ 12 ليلاً.

4. أوقات تنفيذ المهام والعطلات:
   - أوقات العمل: (2 ظهراً - 5 عصراً) و(9 مساءً - 12 صباحاً).
   - العطلة الأسبوعية: الجمعة والسبت عطلة رسمية.

بيانات العضو:
- الاسم: ${username || 'عضو جديد'}
- رقم الهاتف: ${userPhone || 'غير متوفر'}
- الباقة الحالية: ${vipTier || 'العضوية العادية'}
- الرصيد الحالي: ${earnings || 0} USDT

تعليمات الإجابة:
- أجيبي باللغة العربية بأسلوب احترافي ودود كشخص حقيقي من الدعم (مريم).
- خاطبي العضو باسمه (${username || 'عزيزي'}).
- إذا سأل متى تأسست المنصة أجبيه بدقة: تأسست في تاريخ 2026/05/03.
- أجيبي بإيجاز ومباشرة على قدر السؤال دون إطالة.`;

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

    const reply = responseText || `أهلاً بك يا ${username || 'عزيزي'}! أنا مريم مستشارة الدعم الفني لمنصة oxlo (تأسست في 2026/05/03). كيف يمكنني مساعدتك الآن؟`;
    res.json({ reply });
  } catch (err: any) {
    console.error("Support chat error:", err);
    res.json({ reply: localReply || `أهلاً بك يا ${username || 'عزيزي'}! أنا مريم مستشارة الدعم الفني لمنصة oxlo (تأسست في 2026/05/03). كيف يمكنني مساعدتك الآن؟` });
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
