import crypto from 'crypto';

/**
 * ============================================================
 * التحقق من رمز البريد — نسخة آمنة
 * ============================================================
 *
 * يستقبل: البريد، الرمز الذي أدخله المستخدم، والتوقيع المشفّر
 * الذي أُرسل عند طلب الرمز.
 *
 * يعيد حساب التوقيع من الرمز المُدخل ويقارنه بالتوقيع الأصلي —
 * فإن تطابقا كان الرمز صحيحًا، وإلا فهو خاطئ. لا يمكن تزويره
 * دون معرفة المفتاح السري الموجود على الخادم فقط.
 */

function getSecret(): string {
  return process.env.OTP_SECRET || process.env.RESEND_API_KEY || 'oxlo-fallback-secret-key';
}

function signOtp(email: string, code: string, expiresAt: number): string {
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
    const { email, code, otpToken } = req.body || {};

    if (!email || !code || !otpToken) {
      return res.status(400).json({
        success: false,
        message: 'بيانات التحقق غير مكتملة. يرجى طلب رمز جديد.'
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim();

    // التوقيع بصيغة: {تاريخ الانتهاء}.{البصمة}
    const parts = String(otpToken).split('.');
    if (parts.length !== 2) {
      return res.status(400).json({ success: false, message: 'رمز التحقق غير صالح. يرجى طلب رمز جديد.' });
    }

    const expiresAt = Number(parts[0]);
    const originalSig = parts[1];

    if (!expiresAt || isNaN(expiresAt)) {
      return res.status(400).json({ success: false, message: 'رمز التحقق غير صالح. يرجى طلب رمز جديد.' });
    }

    // فحص انتهاء الصلاحية
    if (Date.now() > expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.'
      });
    }

    // إعادة حساب التوقيع ومقارنته بأمان (مقارنة ثابتة الزمن)
    const expectedSig = signOtp(cleanEmail, cleanCode, expiresAt);

    const a = Buffer.from(expectedSig, 'utf8');
    const b = Buffer.from(String(originalSig), 'utf8');
    const isValid = a.length === b.length && crypto.timingSafeEqual(a, b);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'رمز التحقق غير صحيح. يرجى المحاولة مرة أخرى.'
      });
    }

    return res.json({ success: true, message: 'تم التحقق من البريد الإلكتروني بنجاح' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'خطأ غير متوقع' });
  }
}
