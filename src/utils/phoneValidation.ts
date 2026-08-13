export interface CountryInfo {
  name: string;
  code: string;
  flag: string;
  example: string;
  hint: string;
  validate: (input: string) => { isValid: boolean; message?: string };
}

// Check for obvious fake or dummy numbers (e.g. all same digits, or sequential 123456...)
function isFakeNumber(digits: string): boolean {
  if (digits.length < 5) return true;
  // All same digits (e.g., 07777777777, 00000000000)
  const first = digits[0];
  if (digits.split('').every(c => c === first)) return true;
  
  // Repeated pattern like 123456789 or 0123456789
  const sequentialAsc = "01234567890123456789";
  const sequentialDesc = "98765432109876543210";
  if (sequentialAsc.includes(digits) || sequentialDesc.includes(digits)) return true;

  return false;
}

export const COUNTRY_LIST: CountryInfo[] = [
  // --- الدول العربية (22 دولة بالكامل) ---
  {
    name: 'العراق',
    code: '+964',
    flag: '🇮🇶',
    example: '07701234567',
    hint: '11 رقماً تبدأ بـ 07 (مثال: 07701234567)',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (!clean) return { isValid: false, message: 'الرجاء إدخال رقم الهاتف' };
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم الهاتف وهمي أو غير صحيح!' };

      if (clean.startsWith('0')) {
        if (clean.length !== 11) {
          return { isValid: false, message: `رقم الهاتف العراقي يجب أن يتكون من 11 رقماً (أدخلت ${clean.length})` };
        }
        if (!/^07[3-9]\d{8}$/.test(clean)) {
          return { isValid: false, message: 'رقم الهاتف العراقي يجب أن يبدأ بـ 07 (مثل 077, 078, 075, 079, 076)' };
        }
      } else if (clean.startsWith('7')) {
        if (clean.length !== 10) {
          return { isValid: false, message: `رقم الهاتف العراقي بدون صفر يتكون من 10 أرقام (أدخلت ${clean.length})` };
        }
        if (!/^7[3-9]\d{8}$/.test(clean)) {
          return { isValid: false, message: 'رقم الهاتف العراقي يجب أن يبدأ بـ 7 (مثل 77, 78, 75, 79)' };
        }
      } else {
        return { isValid: false, message: 'رقم الهاتف العراقي المحلي يجب أن يبدأ بـ 07 أو 7' };
      }
      return { isValid: true };
    }
  },
  {
    name: 'السعودية',
    code: '+966',
    flag: '🇸🇦',
    example: '0501234567',
    hint: '10 أرقام تبدأ بـ 05',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم هاتف وهمي أو غير صالح' };
      if (clean.startsWith('0')) {
        if (clean.length !== 10) return { isValid: false, message: `رقم الهاتف السعودي يتكون من 10 أرقام (أدخلت ${clean.length})` };
        if (!/^05\d{8}$/.test(clean)) return { isValid: false, message: 'رقم الجوال السعودي يجب أن يبدأ بـ 05' };
      } else {
        if (clean.length !== 9) return { isValid: false, message: `رقم الهاتف السعودي يتكون من 9 أرقام بدون صفر (أدخلت ${clean.length})` };
        if (!/^5\d{8}$/.test(clean)) return { isValid: false, message: 'رقم الجوال السعودي يجب أن يبدأ بـ 5' };
      }
      return { isValid: true };
    }
  },
  {
    name: 'الإمارات',
    code: '+971',
    flag: '🇦🇪',
    example: '0501234567',
    hint: '10 أرقام تبدأ بـ 05',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم هاتف وهمي أو غير صالح' };
      if (clean.startsWith('0')) {
        if (clean.length !== 10) return { isValid: false, message: `رقم الإمارات يتكون من 10 أرقام` };
        if (!/^05[024568]\d{7}$/.test(clean)) return { isValid: false, message: 'رقم الهاتف الإماراتي يبدأ بـ 050, 052, 054, 055, 056, 058' };
      } else {
        if (clean.length !== 9) return { isValid: false, message: `رقم الإمارات بدون صفر يتكون من 9 أرقام` };
        if (!/^5[024568]\d{7}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 50, 52, 54, 55, 56, 58' };
      }
      return { isValid: true };
    }
  },
  {
    name: 'الكويت',
    code: '+965',
    flag: '🇰🇼',
    example: '91234567',
    hint: '8 أرقام تبدأ بـ 5, 6, 9',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم كويتي وهمي' };
      if (clean.length !== 8) return { isValid: false, message: `رقم الهاتف الكويتي يتكون من 8 أرقام (أدخلت ${clean.length})` };
      if (!/^[569]\d{7}$/.test(clean)) return { isValid: false, message: 'رقم الهاتف الكويتي يبدأ بـ 5 أو 6 أو 9' };
      return { isValid: true };
    }
  },
  {
    name: 'قطر',
    code: '+974',
    flag: '🇶🇦',
    example: '55123456',
    hint: '8 أرقام تبدأ بـ 3, 5, 6, 7',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم قطري وهمي' };
      if (clean.length !== 8) return { isValid: false, message: `رقم الهاتف القطري يتكون من 8 أرقام` };
      if (!/^[3567]\d{7}$/.test(clean)) return { isValid: false, message: 'الرقم القطري يبدأ بـ 3 أو 5 أو 6 أو 7' };
      return { isValid: true };
    }
  },
  {
    name: 'البحرين',
    code: '+973',
    flag: '🇧🇭',
    example: '39123456',
    hint: '8 أرقام تبدأ بـ 3 أو 6',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم بحريني غير صالح' };
      if (clean.length !== 8) return { isValid: false, message: 'رقم الهاتف البحريني يتكون من 8 أرقام' };
      if (!/^[367]\d{7}$/.test(clean)) return { isValid: false, message: 'رقم الجوال البحريني يبدأ بـ 3 أو 6 أو 7' };
      return { isValid: true };
    }
  },
  {
    name: 'عمان',
    code: '+968',
    flag: '🇴🇲',
    example: '91234567',
    hint: '8 أرقام تبدأ بـ 7 أو 9',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم عماني غير صالح' };
      if (clean.length !== 8) return { isValid: false, message: 'رقم الهاتف العماني يتكون من 8 أرقام' };
      if (!/^[79]\d{7}$/.test(clean)) return { isValid: false, message: 'رقم الجوال العماني يبدأ بـ 7 أو 9' };
      return { isValid: true };
    }
  },
  {
    name: 'مصر',
    code: '+20',
    flag: '🇪🇬',
    example: '01012345678',
    hint: '11 رقماً تبدأ بـ 010, 011, 012, 015',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم مصري غير صالح' };
      if (clean.startsWith('0')) {
        if (clean.length !== 11) return { isValid: false, message: `رقم الهاتف المصري يتكون من 11 رقماً (أدخلت ${clean.length})` };
        if (!/^01[0125]\d{8}$/.test(clean)) return { isValid: false, message: 'رقم المحمول المصري يبدأ بـ 010 أو 011 أو 012 أو 015' };
      } else {
        if (clean.length !== 10) return { isValid: false, message: `رقم المحمول المصري بدون صفر يتكون من 10 أرقام` };
        if (!/^1[0125]\d{8}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 10 أو 11 أو 12 أو 15' };
      }
      return { isValid: true };
    }
  },
  {
    name: 'الأردن',
    code: '+962',
    flag: '🇯🇴',
    example: '0791234567',
    hint: '10 أرقام تبدأ بـ 07',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم أردني غير صالح' };
      if (clean.startsWith('0')) {
        if (clean.length !== 10) return { isValid: false, message: 'رقم الهاتف الأردني يتكون من 10 أرقام' };
        if (!/^07[789]\d{7}$/.test(clean)) return { isValid: false, message: 'رقم الهاتف الأردني يبدأ بـ 077 أو 078 أو 079' };
      } else {
        if (clean.length !== 9) return { isValid: false, message: 'رقم الهاتف الأردني بدون صفر يتكون من 9 أرقام' };
        if (!/^7[789]\d{7}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 77 أو 78 أو 79' };
      }
      return { isValid: true };
    }
  },
  {
    name: 'سوريا',
    code: '+963',
    flag: '🇸🇾',
    example: '0912345678',
    hint: '10 أرقام تبدأ بـ 09',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم سوري غير صالح' };
      if (clean.startsWith('0')) {
        if (clean.length !== 10) return { isValid: false, message: 'رقم الهاتف السوري يتكون من 10 أرقام' };
        if (!/^09\d{8}$/.test(clean)) return { isValid: false, message: 'رقم الجوال السوري يبدأ بـ 09' };
      } else {
        if (clean.length !== 9) return { isValid: false, message: 'رقم الجوال السوري يتكون من 9 أرقام بدون صفر' };
        if (!/^9\d{8}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 9' };
      }
      return { isValid: true };
    }
  },
  {
    name: 'لبنان',
    code: '+961',
    flag: '🇱🇧',
    example: '70123456',
    hint: '8 أرقام تبدأ بـ 70, 71, 76, 81, 03',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم لبناني غير صالح' };
      if (clean.length !== 7 && clean.length !== 8) return { isValid: false, message: 'رقم الهاتف اللبناني يتكون من 7 أو 8 أرقام' };
      return { isValid: true };
    }
  },
  {
    name: 'فلسطين',
    code: '+970',
    flag: '🇵🇸',
    example: '0591234567',
    hint: '10 أرقام تبدأ بـ 059 أو 056',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم فلسطيني غير صالح' };
      if (clean.startsWith('0')) {
        if (clean.length !== 10) return { isValid: false, message: 'رقم الهاتف الفلسطيني يتكون من 10 أرقام' };
        if (!/^05[69]\d{7}$/.test(clean)) return { isValid: false, message: 'رقم الجوال الفلسطيني يبدأ بـ 059 أو 056' };
      } else {
        if (clean.length !== 9) return { isValid: false, message: 'يتكون من 9 أرقام بدون صفر' };
        if (!/^5[69]\d{7}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 59 أو 56' };
      }
      return { isValid: true };
    }
  },
  {
    name: 'اليمن',
    code: '+967',
    flag: '🇾🇪',
    example: '771234567',
    hint: '9 أرقام تبدأ بـ 70, 71, 73, 77, 78',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم يمني غير صالح' };
      if (clean.length !== 9) return { isValid: false, message: 'رقم الهاتف اليمني يتكون من 9 أرقام' };
      if (!/^7[01378]\d{7}$/.test(clean)) return { isValid: false, message: 'رقم المحمول اليمني يبدأ بـ 70, 71, 73, 77, 78' };
      return { isValid: true };
    }
  },
  {
    name: 'المغرب',
    code: '+212',
    flag: '🇲🇦',
    example: '0612345678',
    hint: '10 أرقام تبدأ بـ 06 أو 07',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم مغربي غير صالح' };
      if (clean.startsWith('0')) {
        if (clean.length !== 10) return { isValid: false, message: 'رقم الهاتف المغربي يتكون من 10 أرقام' };
        if (!/^0[67]\d{8}$/.test(clean)) return { isValid: false, message: 'رقم المحمول المغربي يبدأ بـ 06 أو 07' };
      } else {
        if (clean.length !== 9) return { isValid: false, message: 'يتكون من 9 أرقام بدون صفر' };
        if (!/^[67]\d{8}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 6 أو 7' };
      }
      return { isValid: true };
    }
  },
  {
    name: 'الجزائر',
    code: '+213',
    flag: '🇩🇿',
    example: '0551234567',
    hint: '10 أرقام تبدأ بـ 05, 06, 07',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم جزائري غير صالح' };
      if (clean.startsWith('0')) {
        if (clean.length !== 10) return { isValid: false, message: 'رقم الهاتف الجزائري يتكون من 10 أرقام' };
        if (!/^0[567]\d{8}$/.test(clean)) return { isValid: false, message: 'رقم الجوال الجزائري يبدأ بـ 05, 06, 07' };
      } else {
        if (clean.length !== 9) return { isValid: false, message: 'يتكون من 9 أرقام بدون صفر' };
        if (!/^[567]\d{8}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 5, 6, 7' };
      }
      return { isValid: true };
    }
  },
  {
    name: 'تونس',
    code: '+216',
    flag: '🇹🇳',
    example: '21234567',
    hint: '8 أرقام تبدأ بـ 2, 4, 5, 9',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم تونسي غير صالح' };
      if (clean.length !== 8) return { isValid: false, message: 'رقم الهاتف التونسي يتكون من 8 أرقام' };
      if (!/^[2459]\d{7}$/.test(clean)) return { isValid: false, message: 'رقم الهاتف يبدأ بـ 2, 4, 5, 9' };
      return { isValid: true };
    }
  },
  {
    name: 'ليبيا',
    code: '+218',
    flag: '🇱🇾',
    example: '0911234567',
    hint: '10 أرقام تبدأ بـ 091, 092, 094',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم ليبي غير صالح' };
      if (clean.startsWith('0')) {
        if (clean.length !== 10) return { isValid: false, message: 'رقم الهاتف الليبي يتكون من 10 أرقام' };
        if (!/^09[124]\d{7}$/.test(clean)) return { isValid: false, message: 'رقم الجوال الليبي يبدأ بـ 091 أو 092 أو 094' };
      } else {
        if (clean.length !== 9) return { isValid: false, message: 'يتكون من 9 أرقام بدون صفر' };
        if (!/^9[124]\d{7}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 91 أو 92 أو 94' };
      }
      return { isValid: true };
    }
  },
  {
    name: 'موريتانيا',
    code: '+222',
    flag: '🇲🇷',
    example: '22123456',
    hint: '8 أرقام تبدأ بـ 2, 3, 4',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم موريتاني غير صالح' };
      if (clean.length !== 8) return { isValid: false, message: 'رقم الهاتف الموريتاني يتكون من 8 أرقام' };
      if (!/^[234]\d{7}$/.test(clean)) return { isValid: false, message: 'رقم الجوال الموريتاني يبدأ بـ 2 أو 3 أو 4' };
      return { isValid: true };
    }
  },
  {
    name: 'السودان',
    code: '+249',
    flag: '🇸🇩',
    example: '0912345678',
    hint: '10 أرقام تبدأ بـ 09 أو 01',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم سوداني غير صالح' };
      if (clean.startsWith('0')) {
        if (clean.length !== 10) return { isValid: false, message: 'رقم الهاتف السوداني يتكون من 10 أرقام' };
        if (!/^0[19]\d{8}$/.test(clean)) return { isValid: false, message: 'رقم الجوال السوداني يبدأ بـ 09 أو 01' };
      } else {
        if (clean.length !== 9) return { isValid: false, message: 'يتكون من 9 أرقام بدون صفر' };
        if (!/^[19]\d{8}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 9 أو 1' };
      }
      return { isValid: true };
    }
  },
  {
    name: 'الصومال',
    code: '+252',
    flag: '🇸🇴',
    example: '615123456',
    hint: '8 أو 9 أرقام تبدأ بـ 6, 7, 9',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم صومالي غير صالح' };
      if (clean.length !== 8 && clean.length !== 9) return { isValid: false, message: 'رقم الهاتف الصومالي يتكون من 8 أو 9 أرقام' };
      if (!/^[679]\d{7,8}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 6 أو 7 أو 9' };
      return { isValid: true };
    }
  },
  {
    name: 'جيبوتي',
    code: '+253',
    flag: '🇩🇯',
    example: '77812345',
    hint: '8 أرقام تبدأ بـ 77',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم جيبوتي غير صالح' };
      if (clean.length !== 8) return { isValid: false, message: 'رقم الهاتف في جيبوتي يتكون من 8 أرقام' };
      if (!/^77\d{6}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 77' };
      return { isValid: true };
    }
  },
  {
    name: 'جزر القمر',
    code: '+269',
    flag: '🇰🇲',
    example: '3212345',
    hint: '7 أرقام تبدأ بـ 3',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم غير صالح' };
      if (clean.length !== 7) return { isValid: false, message: 'رقم الهاتف يتكون من 7 أرقام' };
      if (!/^3\d{6}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 3' };
      return { isValid: true };
    }
  },

  // --- الدول العالمية والآسيوية والأوروبية والأمريكية ---
  {
    name: 'تركيا',
    code: '+90',
    flag: '🇹🇷',
    example: '05312345678',
    hint: '11 رقماً تبدأ بـ 05',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم تركي غير صالح' };
      if (clean.startsWith('0')) {
        if (clean.length !== 11) return { isValid: false, message: 'رقم الهاتف التركي يتكون من 11 رقماً' };
        if (!/^05\d{9}$/.test(clean)) return { isValid: false, message: 'رقم المحمول التركي يبدأ بـ 05' };
      } else {
        if (clean.length !== 10) return { isValid: false, message: 'رقم المحمول التركي بدون صفر يتكون من 10 أرقام' };
        if (!/^5\d{9}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 5' };
      }
      return { isValid: true };
    }
  },
  {
    name: 'امريكا / كندا',
    code: '+1',
    flag: '🇺🇸',
    example: '2025550143',
    hint: '10 أرقام (رمز المنطقة + الرقم)',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم أمريكي غير صالح' };
      if (clean.length !== 10) return { isValid: false, message: `رقم الهاتف الأمريكي/الكندي يتكون من 10 أرقام (أدخلت ${clean.length})` };
      return { isValid: true };
    }
  },
  {
    name: 'بريطانيا',
    code: '+44',
    flag: '🇬🇧',
    example: '07911123456',
    hint: '11 رقماً تبدأ بـ 07',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم بريطاني غير صالح' };
      if (clean.startsWith('0')) {
        if (clean.length !== 11) return { isValid: false, message: 'رقم الجوال البريطاني يتكون من 11 رقماً' };
        if (!/^07\d{9}$/.test(clean)) return { isValid: false, message: 'رقم الجوال البريطاني يبدأ بـ 07' };
      } else {
        if (clean.length !== 10) return { isValid: false, message: 'رقم الجوال البريطاني يتكون من 10 أرقام بدون صفر' };
        if (!/^7\d{9}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 7' };
      }
      return { isValid: true };
    }
  },
  {
    name: 'ألمانيا',
    code: '+49',
    flag: '🇩🇪',
    example: '015112345678',
    hint: '11 إلى 12 رقماً تبدأ بـ 015, 016, 017',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم ألماني غير صالح' };
      if (clean.length < 10 || clean.length > 12) return { isValid: false, message: 'رقم الجوال الألماني يتكون من 10 إلى 12 رقماً' };
      return { isValid: true };
    }
  },
  {
    name: 'فرنسا',
    code: '+33',
    flag: '🇫🇷',
    example: '0612345678',
    hint: '10 أرقام تبدأ بـ 06 أو 07',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم فرنسي غير صالح' };
      if (clean.startsWith('0')) {
        if (clean.length !== 10) return { isValid: false, message: 'رقم الهاتف الفرنسي يتكون من 10 أرقام' };
        if (!/^0[67]\d{8}$/.test(clean)) return { isValid: false, message: 'رقم المحمول الفرنسي يبدأ بـ 06 أو 07' };
      } else {
        if (clean.length !== 9) return { isValid: false, message: 'يتكون من 9 أرقام بدون صفر' };
        if (!/^[67]\d{8}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 6 أو 7' };
      }
      return { isValid: true };
    }
  },
  {
    name: 'روسيا',
    code: '+7',
    flag: '🇷🇺',
    example: '9123456789',
    hint: '10 أرقام تبدأ بـ 9',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم روسي غير صالح' };
      if (clean.length !== 10) return { isValid: false, message: 'رقم الجوال الروسي يتكون من 10 أرقام' };
      if (!/^9\d{9}$/.test(clean)) return { isValid: false, message: 'رقم الجوال الروسي يبدأ بـ 9' };
      return { isValid: true };
    }
  },
  {
    name: 'الصين',
    code: '+86',
    flag: '🇨🇳',
    example: '13812345678',
    hint: '11 رقماً تبدأ بـ 1',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم صيني غير صالح' };
      if (clean.length !== 11) return { isValid: false, message: 'رقم الهاتف الصيني يتكون من 11 رقماً' };
      if (!/^1[3-9]\d{9}$/.test(clean)) return { isValid: false, message: 'رقم المحمول الصيني يبدأ بـ 1' };
      return { isValid: true };
    }
  },
  {
    name: 'الهند',
    code: '+91',
    flag: '🇮🇳',
    example: '9876543210',
    hint: '10 أرقام تبدأ بـ 6, 7, 8, 9',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم هندي غير صالح' };
      if (clean.length !== 10) return { isValid: false, message: 'رقم الجوال الهندي يتكون من 10 أرقام' };
      if (!/^[6-9]\d{9}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 6 أو 7 أو 8 أو 9' };
      return { isValid: true };
    }
  },
  {
    name: 'اليابان',
    code: '+81',
    flag: '🇯🇵',
    example: '09012345678',
    hint: '11 رقماً تبدأ بـ 070, 080, 090',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم ياباني غير صالح' };
      if (clean.startsWith('0')) {
        if (clean.length !== 11) return { isValid: false, message: 'رقم الهاتف الياباني يتكون من 11 رقماً' };
        if (!/^0[789]0\d{8}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 070 أو 080 أو 090' };
      } else {
        if (clean.length !== 10) return { isValid: false, message: 'يتكون من 10 أرقام بدون صفر' };
      }
      return { isValid: true };
    }
  },
  {
    name: 'كوريا الجنوبية',
    code: '+82',
    flag: '🇰🇷',
    example: '01012345678',
    hint: '11 رقماً تبدأ بـ 010',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم كوري غير صالح' };
      if (clean.startsWith('0')) {
        if (clean.length !== 11) return { isValid: false, message: 'رقم المحمول الكوري يتكون من 11 رقماً' };
        if (!/^010\d{8}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 010' };
      } else {
        if (clean.length !== 10) return { isValid: false, message: 'يتكون من 10 أرقام بدون صفر' };
      }
      return { isValid: true };
    }
  },
  {
    name: 'إسبانيا',
    code: '+34',
    flag: '🇪🇸',
    example: '612345678',
    hint: '9 أرقام تبدأ بـ 6 أو 7',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم إسباني غير صالح' };
      if (clean.length !== 9) return { isValid: false, message: 'رقم الهاتف الإسباني يتكون من 9 أرقام' };
      if (!/^[67]\d{8}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 6 أو 7' };
      return { isValid: true };
    }
  },
  {
    name: 'إيطاليا',
    code: '+39',
    flag: '🇮🇹',
    example: '3123456789',
    hint: '10 أرقام تبدأ بـ 3',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم إيطالي غير صالح' };
      if (clean.length !== 10) return { isValid: false, message: 'رقم الجوال الإيطالي يتكون من 10 أرقام' };
      if (!/^3\d{9}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 3' };
      return { isValid: true };
    }
  },
  {
    name: 'هولندا',
    code: '+31',
    flag: '🇳🇱',
    example: '0612345678',
    hint: '10 أرقام تبدأ بـ 06',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم هولندي غير صالح' };
      if (clean.startsWith('0')) {
        if (clean.length !== 10) return { isValid: false, message: 'يتكون من 10 أرقام' };
        if (!/^06\d{8}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 06' };
      } else {
        if (clean.length !== 9) return { isValid: false, message: 'يتكون من 9 أرقام بدون صفر' };
        if (!/^6\d{8}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 6' };
      }
      return { isValid: true };
    }
  },
  {
    name: 'السويد',
    code: '+46',
    flag: '🇸🇪',
    example: '0701234567',
    hint: '10 أرقام تبدأ بـ 07',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم سويدي غير صالح' };
      if (clean.startsWith('0')) {
        if (clean.length !== 10) return { isValid: false, message: 'يتكون من 10 أرقام' };
        if (!/^07[02369]\d{7}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 07' };
      } else {
        if (clean.length !== 9) return { isValid: false, message: 'يتكون من 9 أرقام بدون صفر' };
      }
      return { isValid: true };
    }
  },
  {
    name: 'أستراليا',
    code: '+61',
    flag: '🇦🇺',
    example: '0412345678',
    hint: '10 أرقام تبدأ بـ 04',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم أسترالي غير صالح' };
      if (clean.startsWith('0')) {
        if (clean.length !== 10) return { isValid: false, message: 'يتكون من 10 أرقام' };
        if (!/^04\d{8}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 04' };
      } else {
        if (clean.length !== 9) return { isValid: false, message: 'يتكون من 9 أرقام بدون صفر' };
        if (!/^4\d{8}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 4' };
      }
      return { isValid: true };
    }
  },
  {
    name: 'البرازيل',
    code: '+55',
    flag: '🇧🇷',
    example: '11912345678',
    hint: '11 رقماً (رمز المنطقة + 9 + 8 أرقام)',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم برازيلي غير صالح' };
      if (clean.length !== 11) return { isValid: false, message: 'رقم المحمول البرازيلي يتكون من 11 رقماً' };
      return { isValid: true };
    }
  },
  {
    name: 'إندونيسيا',
    code: '+62',
    flag: '🇮🇩',
    example: '08123456789',
    hint: '10 إلى 12 رقماً تبدأ بـ 08',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم غير صالح' };
      if (clean.length < 9 || clean.length > 13) return { isValid: false, message: 'يتكون من 9 إلى 12 رقماً' };
      return { isValid: true };
    }
  },
  {
    name: 'ماليزيا',
    code: '+60',
    flag: '🇲🇾',
    example: '0123456789',
    hint: '10 إلى 11 رقماً تبدأ بـ 01',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم ماليزي غير صالح' };
      if (clean.length < 9 || clean.length > 11) return { isValid: false, message: 'يتكون من 9 إلى 11 رقماً' };
      return { isValid: true };
    }
  },
  {
    name: 'باكستان',
    code: '+92',
    flag: '🇵🇰',
    example: '03001234567',
    hint: '11 رقماً تبدأ بـ 03',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم غير صالح' };
      if (clean.startsWith('0')) {
        if (clean.length !== 11) return { isValid: false, message: 'يتكون من 11 رقماً' };
        if (!/^03\d{9}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 03' };
      } else {
        if (clean.length !== 10) return { isValid: false, message: 'يتكون من 10 أرقام بدون صفر' };
      }
      return { isValid: true };
    }
  },
  {
    name: 'بنغلاديش',
    code: '+880',
    flag: '🇧🇩',
    example: '01712345678',
    hint: '11 رقماً تبدأ بـ 01',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم غير صالح' };
      if (clean.length !== 11) return { isValid: false, message: 'يتكون من 11 رقماً' };
      if (!/^01[3-9]\d{8}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 01' };
      return { isValid: true };
    }
  },
  {
    name: 'نيجيريا',
    code: '+234',
    flag: '🇳🇬',
    example: '08012345678',
    hint: '11 رقماً تبدأ بـ 07, 08, 09',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم نيجيري غير صالح' };
      if (clean.length !== 11) return { isValid: false, message: 'يتكون من 11 رقماً' };
      if (!/^0[789][01]\d{8}$/.test(clean)) return { isValid: false, message: 'يبدأ بـ 070, 080, 081, 090' };
      return { isValid: true };
    }
  },
  {
    name: 'دولة أخرى / دولي',
    code: '+',
    flag: '🌐',
    example: '1234567890',
    hint: 'أدخل رقم هاتف دولي فعال (من 7 إلى 14 رقماً)',
    validate: (input: string) => {
      const clean = input.replace(/\D/g, '');
      if (!clean) return { isValid: false, message: 'الرجاء إدخال رقم الهاتف' };
      if (isFakeNumber(clean)) return { isValid: false, message: 'رقم الهاتف يبدو وهمياً أو مكرراً!' };
      if (clean.length < 7 || clean.length > 14) {
        return { isValid: false, message: `رقم الهاتف الدولي يجب أن يتكون من 7 إلى 14 رقماً (أدخلت ${clean.length})` };
      }
      return { isValid: true };
    }
  }
];
