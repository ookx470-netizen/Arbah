// Trusted & Verified Global Email Providers (Whitelist Policy)
// Any domain outside of genuine, trusted email providers will be strictly rejected.

export const TRUSTED_EMAIL_DOMAINS: Set<string> = new Set([
  // Google
  'gmail.com', 'googlemail.com',

  // Microsoft
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'passport.com',
  'outlook.sa', 'outlook.ae', 'outlook.fr', 'outlook.de', 'outlook.es', 'outlook.co.uk',
  'hotmail.co.uk', 'hotmail.fr', 'hotmail.de', 'hotmail.es', 'live.fr', 'live.co.uk',

  // Yahoo
  'yahoo.com', 'yahoo.fr', 'yahoo.co.uk', 'yahoo.es', 'yahoo.de', 'yahoo.it', 'yahoo.ca',
  'yahoo.com.br', 'yahoo.com.mx', 'yahoo.com.ar', 'yahoo.co.in', 'yahoo.co.jp', 'ymail.com', 'rocketmail.com',

  // Apple
  'icloud.com', 'me.com', 'mac.com',

  // Proton & Secure Major Providers
  'proton.me', 'protonmail.com', 'pm.me', 'tutanota.com', 'tuta.io', 'tuta.com',

  // Other Major Global & Regional Providers
  'zoho.com', 'zohomail.com', 'aol.com', 'aim.com', 'mail.com', 'gmx.com', 'gmx.net', 'gmx.de',
  'web.de', 'freenet.de', 't-online.de',
  'yandex.com', 'yandex.ru', 'ya.ru', 'mail.ru', 'bk.ru', 'inbox.ru', 'list.ru',
  'qq.com', '163.com', '126.com', 'sina.com', 'sohu.com',
  'naver.com', 'daum.net', 'hanmail.net',
  'orange.fr', 'wanadoo.fr', 'free.fr', 'sfr.fr', 'laposte.net',
  'libero.it', 'virgilio.it', 'tiscali.it', 'alice.it',
  'terra.com.br', 'uol.com.br', 'bol.com.br',
  'rediffmail.com',

  // Education & Government top level domains are handled dynamically (.edu, .gov, .ac.*)
]);

/**
 * Validates if an email belongs to a genuine, trusted global email provider.
 * Strictly blocks all temporary, fake, and disposable emails.
 */
export function isAllowedTrustedEmail(email: string): { allowed: boolean; reason?: string } {
  if (!email || !email.includes('@')) {
    return { allowed: false, reason: "صيغة البريد الإلكتروني غير صحيحة." };
  }

  const cleanEmail = email.trim().toLowerCase();
  const parts = cleanEmail.split('@');
  if (parts.length !== 2) {
    return { allowed: false, reason: "صيغة البريد الإلكتروني غير صحيحة." };
  }

  const domain = parts[1].trim();
  if (!domain || !domain.includes('.')) {
    return { allowed: false, reason: "نطاق البريد الإلكتروني غير صالح." };
  }

  // Allow trusted domain list
  if (TRUSTED_EMAIL_DOMAINS.has(domain)) {
    return { allowed: true };
  }

  // Allow verified university and government emails (.edu, .edu.*, .ac.*, .gov)
  if (domain.endsWith('.edu') || domain.includes('.edu.') || domain.includes('.ac.') || domain.endsWith('.gov') || domain.includes('.gov.')) {
    return { allowed: true };
  }

  // Reject all other unverified / throwaway / custom fake domains
  return {
    allowed: false,
    reason: "عذراً، يُسمح فقط بالتسجيل عبر مزودي البريد الإلكتروني الرسميين المعتمدين (مثل: Gmail, Outlook, Hotmail, Yahoo, iCloud, Proton...). لا يُقبل أي بريد وهمي أو غير معروف."
  };
}
