import type { IncomingMessage, ServerResponse } from 'http';
import { Resend } from 'resend';

type VercelRequest = IncomingMessage & {
  body?: any;
  query?: { [key: string]: string | string[] };
  cookies?: { [key: string]: string };
};

type VercelResponse = ServerResponse & {
  send: (body: any) => VercelResponse;
  json: (jsonBody: any) => VercelResponse;
  status: (statusCode: number) => VercelResponse;
  setHeader: (name: string, value: string | string[]) => VercelResponse;
};

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { email, siteName = "OXLO" } = req.body || {};
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

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return res.json({
        success: true,
        devMode: true,
        previewCode: otpCode,
        message: `تم توليد رمز التحقق: ${otpCode}`
      });
    }

    const resend = new Resend(apiKey);

    const htmlContent = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f19; color: #ffffff; padding: 40px 20px; border-radius: 16px; max-width: 520px; margin: auto; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #ffffff; font-size: 20px; font-weight: 900; padding: 12px 28px; border-radius: 12px; letter-spacing: 2px;">
            ${siteName}
          </div>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 8px; font-weight: 600;">منصة الاستثمار الرقمي المعتمدة</p>
        </div>

        <div style="background-color: #111827; border-radius: 14px; padding: 28px 20px; text-align: center; border: 1px solid #1f2937;">
          <h2 style="color: #ffffff; font-size: 18px; margin-top: 0; margin-bottom: 12px;">رمز التحقق لتأكيد الحساب</h2>
          <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 20px 0;">
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

    const fromAddress = process.env.RESEND_FROM_EMAIL || `OXLO Security <auth@oxlo.store>`;

    const sendResult = await resend.emails.send({
      from: fromAddress,
      to: [cleanEmail],
      subject: `رمز التحقق الخاص بك لمنصة ${siteName}: ${otpCode}`,
      html: htmlContent
    });

    if (sendResult.error) {
      console.error("Resend send error:", sendResult.error);
      return res.status(400).json({
        success: false,
        message: sendResult.error.message || "فشل إرسال البريد الإلكتروني."
      });
    }

    return res.json({
      success: true,
      otpCode: otpCode, // sent so client can verify in serverless stateless context
      message: "تم إرسال رمز التحقق بنجاح إلى بريدك الإلكتروني! تفقد صندوق الوارد أو البريد غير المرغوب فيه (Spam)."
    });
  } catch (err: any) {
    console.error("Error in serverless /api/send-email-otp:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "حدث خطأ في الخادم أثناء إرسال البريد الإلكتروني."
    });
  }
}
