import React, { useState, useEffect } from 'react';
import { getUserByPhone, registerUser, getSystemSettings, hashPassword } from '../firebaseService';
import { User } from '../types';
import { ShieldCheck, Phone, Lock, User as UserIcon, Award, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Sun, Moon } from 'lucide-react';
import { COUNTRY_LIST, CountryInfo } from '../utils/phoneValidation';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
  settings?: any;
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
}

export default function AuthPage({ onLoginSuccess, settings, isDarkMode, toggleDarkMode }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [fullName, setFullName] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(COUNTRY_LIST[0]); // Iraq (+964) default
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [siteName, setSiteName] = useState<string>((settings?.siteName && settings.siteName !== 'BET') ? settings.siteName : 'OXLO');
  const [globalNotification, setGlobalNotification] = useState<string>(settings?.globalNotification ?? '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
    // 1. Auto-parse referral/invite code from URL link (e.g. ?ref=INVITE123)
    try {
      const search = window.location.search || (window.location.hash.includes('?') ? window.location.hash.substring(window.location.hash.indexOf('?')) : '');
      const params = new URLSearchParams(search);
      const urlRef = params.get('ref') || params.get('invite') || params.get('code') || params.get('inviteCode');
      if (urlRef && urlRef.trim() !== '') {
        const cleanCode = urlRef.trim().toUpperCase();
        setIsLogin(false); // Switch to registration form automatically
        setInviteCode(cleanCode);
        setSuccessMsg(`🎉 تم إدراج رمز الدعوة تلقائياً من رابط الأحالة: (${cleanCode})`);
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

  // Parse final phone number
  const getFullPhoneNumber = () => {
    // strip out leading zeros from local phone if any
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

    // Basic Validation
    if (!phoneInput) {
      setErrorMsg("الرجاء إدخال رقم الهاتف");
      return;
    }

    // Per-country phone validation ONLY for creating new accounts
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
        // Find user by formatted phone or raw phone input or variations to support legacy accounts
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

        const hashedEnteredPassword = await hashPassword(password);
        const isPasswordValid = user.password === password || user.password === hashedEnteredPassword;

        if (!isPasswordValid) {
          throw new Error("كلمة المرور غير صحيحة!");
        }

        setSuccessMsg("تم تسجيل الدخول بنجاح! جاري توجيهك...");
        setTimeout(() => {
          onLoginSuccess(user!);
        }, 1000);

      } else {
        // Registration
        if (!fullName.trim()) {
          throw new Error("الرجاء إدخال اسم المستخدم بالكامل");
        }
        if (password.length < 6) {
          throw new Error("يجب أن تتكون كلمة المرور من 6 خانات على الأقل");
        }
        if (!inviteCode || !inviteCode.trim()) {
          throw new Error("رمز الدعوة إجباري لإنشاء حساب جديد! الرجاء إدخال رمز دعوة صالح أو استخدام رابط الإحالة.");
        }

        const registeredUser = await registerUser(
          fullName.trim(),
          fullPhone,
          password,
          inviteCode.trim()
        );

        setSuccessMsg(`🎉 تم إنشاء حسابك بنجاح! كود الدعوة الخاص بك هو (${registeredUser.inviteCode}). جاري التوجيه التلقائي...`);
        setTimeout(() => {
          onLoginSuccess(registeredUser);
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ غير متوقع. الرجاء المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 gap-2" dir="rtl">
      
      {globalNotification && (
        <div className="w-full max-w-md bg-[#070D19] text-[#F39C12] border border-[#F39C12]/20 px-3 py-2 flex items-center gap-2 rounded-2xl shadow-sm overflow-hidden font-bold text-[11px] mb-2">
          <span className="flex items-center gap-1 shrink-0 bg-[#F39C12]/10 px-2 py-0.5 rounded border border-[#F39C12]/20 text-[10px] text-white">
            <span className="animate-bounce">📢</span>
            <span>تنبيه:</span>
          </span>
          <div className="flex-1 overflow-hidden relative h-4 flex items-center">
            <div className="absolute whitespace-nowrap animate-marquee">
              {globalNotification}
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Banner with modern gradient and professional OXLO emblem */}
        <div className="bg-gradient-to-br from-indigo-700 via-blue-600 to-indigo-900 p-8 text-center text-white relative overflow-hidden">
          {/* Theme Mode Toggle Button */}
          {toggleDarkMode && (
            <button
              onClick={toggleDarkMode}
              className="absolute top-4 left-4 z-20 p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title={isDarkMode ? 'الوضع المضيء' : 'الوضع الليلي'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-300 fill-amber-300" /> : <Moon className="w-4 h-4 text-blue-200 fill-blue-200" />}
              <span className="hidden sm:inline">{isDarkMode ? 'الوضع المضيء' : 'الوضع الليلي'}</span>
            </button>
          )}

          {/* Subtle ambient background glow circles */}
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-blue-400/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"></div>

          {/* Professional High-Tech OXLO Emblem */}
          <div className="relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 rounded-3xl p-1 mx-auto mb-3 shadow-2xl border-2 border-white/30 transform hover:scale-105 transition-all duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex flex-col items-center justify-center relative overflow-hidden shadow-inner border border-amber-400/20">
                {/* Decorative background grid effect */}
                <div className="absolute inset-0 bg-[radial-gradient(#eab308_1px,transparent_1px)] [background-size:8px_8px] opacity-20"></div>
                
                {/* Sleek Monogram Emblem Icon */}
                <div className="relative z-10 flex items-center justify-center">
                  <svg className="w-12 h-12 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Outer stylized O ring */}
                    <circle cx="50" cy="50" r="40" stroke="url(#oxloGrad)" strokeWidth="9" strokeDasharray="210 30" />
                    {/* Inner X diamond core */}
                    <path d="M35 35L65 65M65 35L35 65" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
                    <defs>
                      <linearGradient id="oxloGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FDE047" />
                        <stop offset="0.5" stopColor="#F59E0B" />
                        <stop offset="1" stopColor="#3B82F6" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                
                {/* Official Star Badge */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-full flex items-center justify-center text-slate-950 border-2 border-white shadow-md">
                  <span className="text-[10px] font-black leading-none">★</span>
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-yellow-400 drop-shadow-sm font-sans uppercase">
              {siteName && siteName !== 'BET' ? siteName : 'OXLO'}
            </h2>
            <p className="text-[11px] text-indigo-100 font-extrabold mt-1 tracking-wide opacity-90">
              ⚡ منصة OXLO الرقمية المعتمدة
            </p>
          </div>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs font-bold mb-4 animate-fadeIn text-center">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-xl text-xs font-bold mb-4 animate-fadeIn text-center">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field: Full Name (Only for Registration) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">اسم المستخدم كامل</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="مثال: أحمد علي حسن"
                  />
                </div>
              </div>
            )}

            {/* Field: Phone with Country Code Selector */}
            {(() => {
              const liveValidation = selectedCountry.validate(phoneInput);
              const hasTypedPhone = phoneInput.trim().length > 0;

              return (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-600">رقم الهاتف المحلي</label>
                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
                      <span>{selectedCountry.flag}</span>
                      <span>{selectedCountry.name}</span>
                      <span dir="ltr">({selectedCountry.code})</span>
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {/* Country Code Dropdown Selector */}
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
                        className="h-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer pr-8"
                      >
                        {COUNTRY_LIST.map((c) => (
                          <option key={`${c.code}-${c.name}`} value={c.code}>
                            {c.flag} {c.code} ({c.name})
                          </option>
                        ))}
                      </select>
                      <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 font-bold text-[10px]">
                        ▼
                      </span>
                    </div>

                    {/* Local Phone Number Input with Live Validation Icons */}
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </span>
                      <input
                        type="tel"
                        required
                        value={phoneInput}
                        onChange={(e) => {
                          setPhoneInput(e.target.value.replace(/\D/g, ''));
                          setErrorMsg(null);
                        }} // numbers only
                        className={`w-full pr-11 ${hasTypedPhone ? 'pl-10' : 'pl-4'} py-3 bg-slate-50 border ${
                          !hasTypedPhone
                            ? 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
                            : liveValidation.isValid
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                            : 'border-rose-400 ring-2 ring-rose-500/20 bg-rose-50/20'
                        } rounded-xl text-xs font-bold text-slate-800 focus:outline-none transition-all text-left font-mono`}
                        placeholder={selectedCountry.example}
                        dir="ltr"
                      />
                      {/* Live verification icon on left side of input */}
                      {hasTypedPhone && (
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          {liveValidation.isValid ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" title="رقم هاتف صحيح ومطابق" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse shrink-0" title={liveValidation.message} />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dynamic live status feedback */}
                  {hasTypedPhone && !liveValidation.isValid && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px] font-bold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200/80">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{liveValidation.message}</span>
                    </div>
                  )}
                  {hasTypedPhone && liveValidation.isValid && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200/80">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>رقم الهاتف صحيح ومطابق لمعايير {selectedCountry.name} ✓</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Field: Password */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">كلمة المرور</label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Field: Invitation Code (Only for Registration) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رمز الدعوة (إجباري) <span className="text-rose-600 font-extrabold">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <Award className="w-4 h-4 text-amber-500" />
                  </span>
                  <input
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="أدخل رمز دعوة المستدعي (إجباري)"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold text-xs shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري التحميل...</span>
                </>
              ) : (
                <span>{isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}</span>
              )}
            </button>
          </form>

          {/* Toggle Action Link */}
          <div className="mt-5 text-center text-xs">
            <span className="text-slate-500">
              {isLogin ? 'ليس لديك حساب مسبق؟ ' : 'لديك حساب بالفعل؟ '}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-blue-600 font-extrabold hover:underline"
            >
              {isLogin ? 'أنشئ حساباً من هنا' : 'سجل دخولك هنا'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
