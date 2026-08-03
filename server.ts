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

// AI FAQ response API
app.post("/api/faq", async (req, res) => {
  const { message, username, phone, vipTier, earnings } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "مفتاح API غير متوفر حالياً. يرجى تهيئة GEMINI_API_KEY في الإعدادات." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction: `أنت مريم (Maryam)، مستشارة الدعم الفني والمستشارة المالية والتقنية الرسمية والذكية لمنصة oxlo (منصة المهام الكبرى USDT).
معلومات المنصة والعمل بالتفصيل من واقع الواجهات الرسمية للمنصة:
- اسم المنصة: oxlo.
- آلية عمل المنصة: يكسب الأعضاء الأرباح بالدولار الرقمي (USDT) من خلال تنفيذ مهام يومية سهلة للغاية مثل الاشتراك في قنوات يوتيوب مخصصة (مثل قناة بندريتا BanderitaX بقيمة 3 USDT للمهمة وقناة الدحيح El Da7ee7 بقيمة 3 USDT للمهمة) وعمل إعجاب (لايك) لصفحات فيسبوك ورفع لقطة شاشة لإثبات الإنجاز من خلال واجهة المهام في السجل.
- قواعد هامة: لا يُسمح للمستخدم باختيار مهام يوتيوب وفيسبوك معاً في نفس اليوم لضمان التوازن والامتثال.
- باقات المناصب والترقيات (VIP) الحقيقية والمحدثة:
  * باقة A1: سعر الاشتراك $300 - الربح اليومي الإجمالي $9 USDT.
  * باقة A2: سعر الاشتراك $600 - الربح اليومي الإجمالي $18 USDT.
  * باقة B1: سعر الاشتراك $1200 - الربح اليومي الإجمالي $38 USDT.
  * باقة B2: سعر الاشتراك $2600 - الربح اليومي الإجمالي $65 USDT.
  * باقة C1: سعر الاشتراك $5000 - الربح اليومي الإجمالي $162 USDT.
  * باقة C2: سعر الاشتراك $12000 - الربح اليومي الإجمالي $360 USDT.
  * باقة D1: سعر الاشتراك $26000 - الربح اليومي الإجمالي $750 USDT.
  * باقة D2: سعر الاشتراك $65000 - الربح اليومي الإجمالي $1620 USDT.
  * باقة business: سعر الاشتراك $90000 - الربح اليومي الإجمالي $2550 USDT.
- الشحن والإيداع: يتم شحن الرصيد بإيداع عملة USDT عبر شبكة Polygon حصرياً إلى عنوان محفظة المنصة الآمن المحدد في صفحة الشحن. الحد الأدنى للشحن هو 25$. بعد إتمام الإيداع على المحفظة ورفع لقطة شاشة، يقوم المدير باعتماد الطلب لإضافة الرصيد فوراً للحساب.
- سحب الأرباح: يتم السحب لعنوان محفظة USDT (Polygon) الخاص بالعميل. الحد الأدنى للسحب هو 10$.
  * رسوم السحب: توجد رسوم معالجة للسحب تبلغ 15% لكل طلب سحب يتم إنشاؤه.
  * وقت معالجة السحب: يتم معالجة طلبات السحب خلال فترة تتراوح بين 24 إلى 48 ساعة كحد أقصى.
  * قيود السحب: قد يتم قفل السحب مؤقتاً بقرار من الإدارة.
- أوقات العمل الرسمية لتنفيذ واعتماد المهام اليومية: تبدأ يومياً وبشكل رسمي وصارم من الساعة 4:00 عصراً وحتى الساعة 10:00 مساءً بتوقيت مكة المكرمة (الرياض). خارج هذه الأوقات، يتوقف تقديم واعتماد المهام تلقائياً لغايات المراجعة والتدقيق وصيانة النظام.
- العطلة الأسبوعية: المنصة تعمل وتستقبل الإيداعات على مدار الساعة دون عطلات، ولكن عمليات تدقيق المهام والسحوبات قد تخضع للتوقف المؤقت في عطلات يحددها المدير.
- برنامج التوظيف والشركاء (برنامج الإحالة والعمولات):
  * يمكن للمشتركين دعوة أصدقائهم باستخدام كود الدعوة ورابط الإحالة المباشر الخاص بهم.
  * يحصل الداعي على عمولات مجزية وفورية تصل إلى 10% من دخل مهام كل عضو يقوم بدعوته ويسجل من خلاله مباشرة.

بيانات العضو السائل الحالية:
- اسم العضو: ${username || 'عضو جديد'}
- رقم الهاتف: ${phone || 'غير متوفر'}
- رتبة VIP الحالية: ${vipTier || 'العضوية العادية'}
- الرصيد الحالي المتوفر: ${earnings || 0} USDT

تعليمات الإجابة:
- أجب باللغة العربية بأسلوب احترافي، ودود، ومشجع للغاية، وكأنك مريم مستشارة الدعم البشري الحقيقي للمنصة.
- خاطب العضو باسمه (${username || 'عضو'}) لزيادة التفاعل واللمسة الشخصية.
- اعتمد على البيانات الحقيقية للعضو السائل المذكورة أعلاه بدقة.
- لا تذكر أبداً أي تفاصيل تقنية حول الكود أو النظام. أجب كشخص حقيقي من مستشاري الخدمة والدعم.
- اجعل الإجابات واضحة، منسقة ومختصرة لسهولة القراءة في نافذة المحادثة المباشرة الصغيرة.`
      }
    });

    res.json({ reply: response.text });
  } catch (err: any) {
    console.error("Support API error:", err);
    res.status(500).json({ error: err.message || "عذراً، تعذر الاتصال بالمساعد حالياً" });
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


