import { Resend } from 'resend';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, code, brandName } = req.body || {};

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني غير صحيح' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otpCode = code || Math.floor(100000 + Math.random() * 900000).toString();
    const siteName = brandName || 'OXLO';

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

    const fromAddress = process.env.RESEND_FROM_EMAIL || `OXLO Security <auth@oxlo.store>`;

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

    return res.json({
      success: true,
      otpCode: otpCode,
      message: 'تم إرسال رمز التحقق بنجاح!'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
