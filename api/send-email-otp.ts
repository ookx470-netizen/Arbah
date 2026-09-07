import { Resend } from 'resend';
import crypto from 'crypto';

/**
 * ============================================================
 * إرسال رمز التحقق — نسخة آمنة
 * ============================================================
 *
 * الثغرة التي تعالجها: كانت النسخة السابقة تُعيد رمز التحقق نفسه
 * (otpCode) إلى المتصفح، فيمكن لأي شخص رؤيته من أدوات المطور
 * وتجاوز التحقق كليًا — أي التسجيل ببريد لا يملكه.
 *
 * الحل: لا نُعيد الرمز إطلاقًا. بدلاً منه نُعيد "توقيعًا" مشفّرًا
 * (HMAC) يحتوي بصمة الرمز والبريد ووقت الانتهاء، ولا يمكن استخراج
 * الرمز منه. وعند التحقق نعيد حساب التوقيع ونقارنه — فيستحيل
 * تمرير رمز خاطئ دون معرفة الرمز الحقيقي من البريد.
 */

const OTP_TTL_MS = 10 * 60 * 1000; // صلاحية الرمز: 10 دقائق

function getSecret(): string {
  // نستخدم مفتاحًا مخصصًا إن وُجد، وإلا نشتق واحدًا من مفتاح Resend
  return process.env.OTP_SECRET || process.env.RESEND_API_KEY || 'oxlo-fallback-secret-key';
}

export function signOtp(email: string, code: string, expiresAt: number): string {
  return crypto
    .createHmac('sha256', getSecret())
    .update(`${email.trim().toLowerCase()}:${code}:${expiresAt}`)
    .digest('hex');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email, brandName } = req.body || {};

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني غير صحيح' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    // الرمز يُولَّد على الخادم دائمًا — لا نقبله من العميل إطلاقًا
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const siteName = brandName || 'OXLO';

    const expiresAt = Date.now() + OTP_TTL_MS;
    const otpToken = `${expiresAt}.${signOtp(cleanEmail, otpCode, expiresAt)}`;

    const apiKey = process.env.RESEND_API_KEY;

    // وضع التطوير فقط (بلا مفتاح إرسال) — لا يعمل على الإنتاج
    if (!apiKey) {
      return res.json({
        success: true,
        devMode: true,
        previewCode: otpCode,
        otpToken,
        message: `وضع التطوير — رمز التحقق: ${otpCode}`
      });
    }

    const resend = new Resend(apiKey);

    const htmlContent = `
      <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #0f172a; color: #ffffff; padding: 30px 20px; border-radius: 12px; max-width: 480px; margin: auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #38bdf8; font-size: 24px; margin: 0;">${siteName}</h1>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 5px;">تأكيد أمان الحساب</p>
        </div>

        <div style="background-color: #1e293b; border-radius: 10px; padding: 24px; text-align: center; border: 1px solid #334155;">
          <p style="color: #e2e8f0; font-size: 14px; margin-bottom: 16px;">
            رمز التحقق الخاص بك هو:
          </p>

          <div style="background: #0f172a; border: 1px solid #38bdf8; border-radius: 8px; padding: 12px 24px; display: inline-block; margin: 10px auto;">
            <span style="font-family: monospace; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #38bdf8;">
              ${otpCode}
            </span>
          </div>

          <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">
            صالح لمدة 10 دقائق. لا تشارك هذا الرمز مع أي شخص.
          </p>
        </div>
      </div>
    `;

    const textContent = `رمز التحقق الخاص بك لمنصة ${siteName} هو: ${otpCode}\nصالح لمدة 10 دقائق.`;

    const fromAddress = process.env.RESEND_FROM_EMAIL || 'OXLO Security <auth@oxlo.store>';

    const sendResult = await resend.emails.send({
      from: fromAddress,
      to: [cleanEmail],
      subject: `رمز التحقق: ${otpCode} - ${siteName}`,
      html: htmlContent,
      text: textContent
    });

    if (sendResult.error) {
      return res.status(400).json({ success: false, message: sendResult.error.message });
    }

    // مهم: لا نُعيد otpCode إطلاقًا — فقط التوقيع المشفّر
    return res.json({
      success: true,
      otpToken,
      message: 'تم إرسال رمز التحقق بنجاح!'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'خطأ غير متوقع' });
  }
}
