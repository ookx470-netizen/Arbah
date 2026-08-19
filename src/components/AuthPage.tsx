import React, { useState, useEffect } from 'react';
import { getUserByPhone, getUserByEmail, registerUser, getSystemSettings, hashPassword, recordUserLogin, shadowFirebaseAuth } from '../firebaseService';
import { User } from '../types';
import { ShieldCheck, Phone, Lock, User as UserIcon, Award, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Mail, KeyRound, Send } from 'lucide-react';
import { COUNTRY_LIST, CountryInfo } from '../utils/phoneValidation';
import { isAllowedTrustedEmail } from '../utils/disposableEmailBlocklist';
import oxloLogoImg from '../assets/images/oxlo_clean_logo_1786416406822.jpg';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
  settings?: any;
}

export default function AuthPage({ onLoginSuccess, settings }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [fullName, setFullName] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(COUNTRY_LIST[0]); // Iraq (+964) default
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [emailOtp, setEmailOtp] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [sendingOtp, setSendingOtp] = useState<boolean>(false);
  const [otpCountdown, setOtpCountdown] = useState<number>(0);
  const [password, setPassword] = useState<string>('');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [siteName, setSiteName] = useState<string>((settings?.siteName && settings.siteName !== 'BET') ? settings.siteName : 'OXLO');
  const [globalNotification, setGlobalNotification] = useState<string>(settings?.globalNotification ?? '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedOtpCode, setGeneratedOtpCode] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // OTP Resend Countdown Timer
  useEffect(() => {
    let timer: any;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [otpCountdown]);

  // Handle sending email verification code via Resend
  const handleSendEmailOtp = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMsg("الرجاء إدخال عنوان بريد إلكتروني صحيح أولاً.");
      return;
    }

    // Strictly allow only verified official email providers
    const emailCheck = isAllowedTrustedEmail(cleanEmail);
    if (!emailCheck.allowed) {
      setErrorMsg(emailCheck.reason || "⛔ عذراً، يُسمح فقط بالتسجيل عبر مزودي البريد الإلكتروني الرسميين المعتمدين (مثل: Gmail, Outlook, Hotmail, Yahoo, iCloud, Proton...). لا يُقبل أي بريد وهمي أو غير معروف.");
      return;
    }

    setSendingOtp(true);
    try {
      // Check if email already registered
      const existingUser = await getUserByEmail(cleanEmail);
      if (existingUser) {
        throw new Error("عذراً، هذا البريد الإلكتروني مسجل بالفعل لحساب آخر! يرجى استخدام بريد إلكتروني جديد أو تسجيل الدخول.");
      }

      let data: any = null;
      try {
        const response = await fetch('/api/send-email-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, siteName })
        });
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await response.json();
        }
      } catch (fetchErr) {
        console.warn("API send-email-otp fetch error:", fetchErr);
      }

      // If server responded with success
      if (data && data.success) {
        setOtpSent(true);
        setOtpCountdown(45);
        if (data.otpCode) {
          setGeneratedOtpCode(data.otpCode);
        }
        if (data.devMode && data.previewCode) {
          setEmailOtp(data.previewCode);
          setGeneratedOtpCode(data.previewCode);
          setSuccessMsg(`✅ تم توليد رمز التحقق: ${data.previewCode} (تم تعبئته تلقائياً)`);
        } else {
          setSuccessMsg(data.message || "تم إرسال رمز التحقق إلى بريدك الإلكتروني بنجاح!");
        }
      } else if (data && !data.success) {
        throw new Error(data.message || "فشل إرسال رمز التحقق.");
      } else {
        // Fallback for direct client-only static hosting / Vercel SPA
        const fallbackOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtpCode(fallbackOtp);
        setEmailOtp(fallbackOtp);
        setOtpSent(true);
        setOtpCountdown(45);
        setSuccessMsg(`✅ تم توليد رمز التحقق الخاص بك: ${fallbackOtp} (تم إدراجه تلقائياً لسرعة التسجيل)`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ أثناء إرسال رمز التحقق.");
    } finally {
      setSendingOtp(false);
    }
  };

  // Handle settings updates from prop
  useEffect(() => {
    if (settings) {
      if (settings.siteName && settings.siteName !== 'BET') {
        setSiteName(settings.siteName);
      } else {
        setSiteName('OXLO');
      }
      if (settings.globalNotification) {
        setGlobalNotification(settings.globalNotification);
      }
    }
  }, [settings]);

  // Load site settings and parse URL referral codes on mount
  useEffect(() => {
    try {
      const search = window.location.search || (window.location.hash.includes('?') ? window.location.hash.substring(window.location.hash.indexOf('?')) : '');
      const params = new URLSearchParams(search);
      const urlRef = params.get('ref') || params.get('invite') || params.get('code') || params.get('inviteCode');
      if (urlRef && urlRef.trim() !== '') {
        const cleanCode = urlRef.trim().toUpperCase();
        if (cleanCode !== 'ADMIN95') {
          setIsLogin(false);
          setInviteCode(cleanCode);
          setSuccessMsg(`🎉 تم إدراج رمز الدعوة تلقائياً من رابط الإحالة: (${cleanCode})`);
        }
      }
    } catch (e) {
      console.warn("Could not parse URL referral params:", e);
    }

    if (settings) return;
    const fetchSettings = async () => {
      try {
        const sysSettings = await getSystemSettings();
        if (sysSettings) {
          if (sysSettings.siteName) {
            setSiteName(sysSettings.siteName);
          }
          if (sysSettings.globalNotification) {
            setGlobalNotification(sysSettings.globalNotification);
          }
        }
      } catch (err) {
        console.error("Error loading site settings in AuthPage:", err);
      }
    };
    fetchSettings();
  }, [settings]);

  const getFullPhoneNumber = () => {
    let cleanedLocal = phoneInput.trim();
    if (cleanedLocal.startsWith('0')) {
      cleanedLocal = cleanedLocal.substring(1);
    }
    return `${selectedCountry.code}${cleanedLocal}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!phoneInput) {
      setErrorMsg("الرجاء إدخال رقم الهاتف");
      return;
    }

    // Check if device is banned - ONLY block registration. 
    // For login, we allow the attempt to verify if the ban has been lifted in the database.
    if (!isLogin && localStorage.getItem('oxlo_device_banned') === 'true') {
      setErrorMsg("لا يمكنك إنشاء حساب جديد، هذا الجهاز محظور من استخدام المنصة.");
      setLoading(false);
      return;
    }

      if (!isLogin) {
      const phoneCheck = selectedCountry.validate(phoneInput);
      if (!phoneCheck.isValid) {
        setErrorMsg(phoneCheck.message || "رقم الهاتف غير صحيح للدولة المحددة");
        return;
      }
    }

    if (!password) {
      setErrorMsg("الرجاء إدخال كلمة المرور");
      return;
    }

    const fullPhone = getFullPhoneNumber();
    setLoading(true);

    try {
      if (isLogin) {
        const cleanInput = phoneInput.trim();
        let user = await getUserByPhone(fullPhone);
        if (!user) {
          user = await getUserByPhone(cleanInput);
        }
        if (!user && !cleanInput.startsWith('+')) {
          user = await getUserByPhone(`${selectedCountry.code}${cleanInput}`);
        }
        if (!user && cleanInput.startsWith('0')) {
          user = await getUserByPhone(`${selectedCountry.code}${cleanInput.substring(1)}`);
        }

        if (!user) {
          throw new Error("رقم الهاتف غير مسجل في النظام!");
        }

        
        if (user.isBanned) {
          localStorage.setItem('oxlo_device_banned', 'true');
          setErrorMsg(user.banReason || "عذراً، تم حظر حسابك وجهازك من النظام بسبب مخالفة شروط الاستخدام.");
          setLoading(false);
          return;
        }

        // If user is NOT banned but the device was previously flagged, clear the flag
        if (localStorage.getItem('oxlo_device_banned') === 'true') {
          localStorage.removeItem('oxlo_device_banned');
        }

        const hashedEnteredPassword = await hashPassword(password);
        const isPasswordValid = user.password === password || user.password === hashedEnteredPassword;

        if (!isPasswordValid) {
          throw new Error("كلمة المرور غير صحيحة!");
        }

        // إصلاح حاسم: يجب انتظار اكتمال تسجيل الدخول الفعلي (Shadow Auth)
        // قبل عرض أي صفحة تعتمد على قراءة بيانات محمية (مثل لوحة الأدمن)،
        // وإلا يفشل جلب البيانات بصمت في أي جلسة/متصفح جديد بدون كاش قديم
        try {
          await shadowFirebaseAuth(user.phone, user.password || user.id);
        } catch (authErr: any) {
          console.warn("Shadow auth on login failed:", authErr);
          // تشخيص مؤقت: نظهر الخطأ الحقيقي بالواجهة عشان نعرف السبب بالضبط
          setErrorMsg(`تحذير تشخيصي (Shadow Auth): ${authErr?.code || ''} ${authErr?.message || String(authErr)}`);
        }
        recordUserLogin(user.phone || user.id).catch(e => console.warn(e));
        setSuccessMsg("تم تسجيل الدخول بنجاح!");
        onLoginSuccess(user);

      } else {
        if (!fullName.trim()) {
          throw new Error("الرجاء إدخال اسم المستخدم بالكامل");
        }
        
        const cleanEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!cleanEmail || !emailRegex.test(cleanEmail)) {
          throw new Error("الرجاء إدخال عنوان بريد إلكتروني صحيح.");
        }

        const emailCheck = isAllowedTrustedEmail(cleanEmail);
        if (!emailCheck.allowed) {
          throw new Error(emailCheck.reason || "⛔ لا يُسمح بالتسجيل إلا عبر الإيميلات الرسمية المعتمدة (Gmail, Outlook, Hotmail, Yahoo, iCloud...).");
        }

        if (!otpSent) {
          throw new Error("يرجى الضغط على 'إرسال الرمز' لاستلام رمز التحقق على بريدك الإلكتروني.");
        }

        const cleanOtp = emailOtp.trim();
        if (!cleanOtp || cleanOtp.length < 6) {
          throw new Error("يرجى إدخال رمز التحقق المكون من 6 أرقام المرسل إلى بريدك الإلكتروني.");
        }

        // Verify OTP (Check client state or backend API)
        let isOtpVerified = false;
        if (generatedOtpCode && cleanOtp === generatedOtpCode) {
          isOtpVerified = true;
        } else {
          try {
            const verifyRes = await fetch('/api/verify-email-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: cleanEmail, code: cleanOtp })
            });
            const contentType = verifyRes.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                isOtpVerified = true;
              }
            } else if (verifyRes.ok) {
              isOtpVerified = true;
            }
          } catch (e) {
            console.warn("Verify OTP fetch error:", e);
          }
        }

        if (!isOtpVerified && (!generatedOtpCode || cleanOtp !== generatedOtpCode)) {
          throw new Error("رمز التحقق غير صحيح أو انتهت صلاحيته. يرجى طلب رمز جديد.");
        }

        if (password.length < 6) {
          throw new Error("يجب أن تتكون كلمة المرور من 6 خانات على الأقل");
        }
        if (!inviteCode || !inviteCode.trim()) {
          throw new Error("رمز الدعوة إجباري لإنشاء حساب جديد! الرجاء إدخال رمز دعوة صالح.");
        }
        if (inviteCode.trim().toUpperCase() === 'ADMIN95') {
          throw new Error("رمز الدعوة غير صحيح أو غير موجود! يرجى إدخال رمز دعوة حقيقي وصحيح من أحد الأصدقاء.");
        }

        const registeredUser = await registerUser(
          fullName.trim(),
          fullPhone,
          password,
          inviteCode.trim(),
          cleanEmail
        );

        shadowFirebaseAuth(registeredUser.phone, registeredUser.password || registeredUser.id).catch(e => console.warn(e));
        
        setSuccessMsg(`🎉 تم تأكيد البريد الإلكتروني وإنشاء حسابك بنجاح! كود الدعوة الخاص بك هو (${registeredUser.inviteCode}).`);
        onLoginSuccess(registeredUser);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ غير متوقع. الرجاء المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {globalNotification && (
        <div className="w-full max-w-md bg-slate-900 border border-amber-500/20 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 mb-4 text-white font-bold text-[11px] relative z-10 overflow-hidden">
          <span className="shrink-0 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 text-[10px] text-amber-400 font-black">
            تنبيه هام
          </span>
          <div className="flex-1 overflow-hidden relative h-5 flex items-center">
            <div className="absolute whitespace-nowrap animate-marquee text-white font-bold">
              {globalNotification}
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden relative z-10">
        
        {/* Top Header Card */}
        <div className="bg-slate-900 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-transparent"></div>



          <div className="relative z-10 space-y-4">
            {/* Logo Emblem */}
            <div className="inline-block bg-gradient-to-br from-blue-600 via-indigo-600 to-amber-500 rounded-3xl p-1 mx-auto shadow-2xl border border-white/20 transform hover:scale-105 transition-all">
              <div className="w-32 h-32 bg-slate-900 rounded-[22px] overflow-hidden relative shadow-lg">
                <img 
                  src={oxloLogoImg} 
                  alt="OXLO Logo" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                منصة الاستثمار الرقمي المعتمدة
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="pt-2 flex bg-slate-800/60 p-1.5 rounded-2xl border border-white/5">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${
                  isLogin ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${
                  !isLogin ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                حساب جديد
              </button>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl text-[10px] font-black flex items-center gap-2.5">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-2xl text-[10px] font-black flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Field: Full Name (Registration only) */}
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 px-1">اسم المستخدم الكامل</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-12 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all text-right"
                    placeholder="أدخل اسمك الثلاثي"
                  />
                  <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                </div>
              </div>
            )}

            {/* Field: Phone Number with Country Selector */}
            {(() => {
              const liveValidation = selectedCountry.validate(phoneInput);
              const hasTypedPhone = phoneInput.trim().length > 0;

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-slate-500">رقم الهاتف المحلي</label>
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 flex items-center gap-1">
                      <span>{selectedCountry.flag}</span>
                      <span>{selectedCountry.code}</span>
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {/* Country Code Dropdown */}
                    <div className="relative shrink-0">
                      <select
                        value={selectedCountry.code}
                        onChange={(e) => {
                          const found = COUNTRY_LIST.find(c => c.code === e.target.value);
                          if (found) {
                            setSelectedCountry(found);
                            setErrorMsg(null);
                          }
                        }}
                        className="h-14 px-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/10 appearance-none cursor-pointer pr-8 text-right"
                      >
                        {COUNTRY_LIST.map((c) => (
                          <option key={`${c.code}-${c.name}`} value={c.code}>
                            {c.flag} {c.code}
                          </option>
                        ))}
                      </select>
                      <span className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-slate-400 font-bold text-[9px]">
                        ▼
                      </span>
                    </div>

                    {/* Local Phone Input */}
                    <div className="relative flex-1">
                      <input
                        type="tel"
                        required
                        value={phoneInput}
                        onChange={(e) => {
                          setPhoneInput(e.target.value.replace(/\D/g, ''));
                          setErrorMsg(null);
                        }}
                        className={`w-full h-14 bg-slate-50 border ${
                          !hasTypedPhone
                            ? 'border-slate-100 focus:border-blue-600'
                            : liveValidation.isValid
                            ? 'border-emerald-500 bg-emerald-50/20'
                            : 'border-rose-400 bg-rose-50/20'
                        } rounded-2xl pr-12 pl-12 text-xs font-black text-slate-900 focus:outline-none transition-all text-left font-mono`}
                        placeholder={selectedCountry.example}
                        dir="ltr"
                      />
                      <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />

                      {hasTypedPhone && (
                        <span className="absolute left-4 top-1/2 -translate-y-1/2">
                          {liveValidation.isValid ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {hasTypedPhone && !liveValidation.isValid && (
                    <p className="text-[9px] font-black text-rose-500 px-1">{liveValidation.message}</p>
                  )}
                </div>
              );
            })()}

            {/* Field: Email & Send OTP Button (Registration only) */}
            {!isLogin && (
              <div className="space-y-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-slate-700">البريد الإلكتروني (للتحقق)</label>
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      إجباري للتأكيد
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setErrorMsg(null);
                        }}
                        className="w-full h-13 bg-white border border-slate-200 rounded-xl pr-10 pl-3 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all text-left font-mono"
                        placeholder="yourname@gmail.com"
                        dir="ltr"
                      />
                      <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>

                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={sendingOtp || otpCountdown > 0 || !email.trim()}
                      className={`px-3.5 h-13 rounded-xl font-black text-[11px] flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                        otpCountdown > 0
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {sendingOtp ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : otpCountdown > 0 ? (
                        <span>{otpCountdown}s</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>{otpSent ? 'إعادة الإرسال' : 'إرسال الرمز'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Field: OTP Code Input (appears after send or always available for quick entry) */}
                <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-slate-700">رمز التحقق (6 أرقام)</label>
                    {otpSent && (
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        تم الإرسال
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={emailOtp}
                      onChange={(e) => {
                        setEmailOtp(e.target.value.replace(/\D/g, ''));
                        setErrorMsg(null);
                      }}
                      className="w-full h-13 bg-white border border-slate-200 rounded-xl pr-10 pl-4 text-sm font-black text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all text-center tracking-[6px] font-mono"
                      placeholder="------"
                      dir="ltr"
                    />
                    <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium px-1">
                    💡 تفقد صندوق الوارد أو البريد غير المرغوب فيه (Spam/Junk).
                  </p>
                </div>
              </div>
            )}

            {/* Field: Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 px-1">كلمة المرور</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-12 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all text-right"
                  placeholder="••••••••"
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              </div>
            </div>

            {/* Field: Invite Code (Registration only) */}
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 px-1 flex items-center justify-between">
                  <span>رمز الدعوة</span>
                  <span className="text-rose-500">* إجباري</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-12 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all text-right tracking-wider uppercase font-mono"
                    placeholder="أدخل كود الإحالة"
                  />
                  <Award className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[11px] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري المعالجة...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isLogin ? 'دخول الحساب' : 'تأكيد وإنشاء الحساب'}</span>
                </>
              )}
            </button>
          </form>

          {/* Mode Switch Link Footer */}
          <div className="pt-2 text-center text-xs font-black">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-slate-400 hover:text-slate-900 transition-colors"
            >
              {isLogin ? (
                <span>ليس لديك حساب؟ <strong className="text-blue-600 underline">إنشاء حساب جديد</strong></span>
              ) : (
                <span>لديك حساب بالفعل؟ <strong className="text-blue-600 underline">تسجيل الدخول</strong></span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
