export interface UserLocationInfo {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  flag: string;
}

const countryArabicMap: Record<string, string> = {
  IQ: 'العراق',
  SA: 'السعودية',
  AE: 'الإمارات',
  KW: 'الكويت',
  QA: 'قطر',
  BH: 'البحرين',
  OM: 'عُمان',
  JO: 'الأردن',
  EG: 'مصر',
  LB: 'لبنان',
  SY: 'سوريا',
  PS: 'فلسطين',
  YE: 'اليمن',
  SD: 'السودان',
  LY: 'ليبيا',
  TN: 'تونس',
  DZ: 'الجزائر',
  MA: 'المغرب',
  TR: 'تركيا',
  DE: 'ألمانيا',
  FR: 'فرنسا',
  GB: 'المملكة المتحدة',
  US: 'الولايات المتحدة',
  CA: 'كندا',
  SE: 'السويد',
  NL: 'هولندا',
  NO: 'النرويج',
  DK: 'الدنمارك',
  AT: 'النمسا',
  CH: 'سويسرا',
  BE: 'بلجيكا',
  ES: 'إسبانيا',
  IT: 'إيطاليا',
  RU: 'روسيا',
  IR: 'إيران',
  IN: 'الهند',
  CN: 'الصين',
  MY: 'ماليزيا',
  ID: 'إندونيسيا',
  PK: 'باكستان',
  BR: 'البرازيل',
  AU: 'أستراليا'
};

export function getCountryFlagEmoji(code?: string): string {
  if (!code || code.length !== 2) return '🌐';
  try {
    const codePoints = code
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch (e) {
    return '🌐';
  }
}

export function getArabicCountryName(code?: string, fallback?: string): string {
  if (!code) return fallback || 'غير معروف';
  const upper = code.toUpperCase();
  if (countryArabicMap[upper]) {
    return countryArabicMap[upper];
  }
  return fallback || code;
}

export async function detectUserLocation(): Promise<UserLocationInfo | null> {
  // Provider 1: ipwho.is (CORS enabled, fast, detailed)
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(id);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false) {
        const cCode = data.country_code || '';
        const arabicCountry = getArabicCountryName(cCode, data.country || '');
        const flag = data.flag?.emoji || getCountryFlagEmoji(cCode);
        return {
          ip: data.ip || '',
          country: arabicCountry,
          countryCode: cCode,
          region: data.region || '',
          city: data.city || '',
          flag
        };
      }
    }
  } catch (e) {
    console.warn("Location provider 1 failed, trying fallback...", e);
  }

  // Provider 2: ipapi.co
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(id);
    if (res.ok) {
      const data = await res.json();
      if (data && !data.error) {
        const cCode = data.country_code || '';
        const arabicCountry = getArabicCountryName(cCode, data.country_name || '');
        const flag = getCountryFlagEmoji(cCode);
        return {
          ip: data.ip || '',
          country: arabicCountry,
          countryCode: cCode,
          region: data.region || '',
          city: data.city || '',
          flag
        };
      }
    }
  } catch (e) {
    console.warn("Location provider 2 failed, trying fallback...", e);
  }

  // Provider 3: freeipapi.com
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://freeipapi.com/api/json', { signal: controller.signal });
    clearTimeout(id);
    if (res.ok) {
      const data = await res.json();
      if (data && data.countryCode) {
        const cCode = data.countryCode || '';
        const arabicCountry = getArabicCountryName(cCode, data.countryName || '');
        const flag = getCountryFlagEmoji(cCode);
        return {
          ip: data.ipAddress || '',
          country: arabicCountry,
          countryCode: cCode,
          region: data.regionName || '',
          city: data.cityName || '',
          flag
        };
      }
    }
  } catch (e) {
    console.warn("Location provider 3 failed, trying fallback...", e);
  }

  // Provider 4: db-ip.com
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://api.db-ip.com/v2/free/self', { signal: controller.signal });
    clearTimeout(id);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ipAddress) {
        const cCode = data.countryCode || '';
        const arabicCountry = getArabicCountryName(cCode, data.countryName || '');
        const flag = getCountryFlagEmoji(cCode);
        return {
          ip: data.ipAddress || '',
          country: arabicCountry,
          countryCode: cCode,
          region: data.stateProv || '',
          city: data.city || '',
          flag
        };
      }
    }
  } catch (e) {
    console.warn("Location provider 4 failed:", e);
  }

  return null;
}
