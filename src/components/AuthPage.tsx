import React, { useState, useEffect } from 'react';
import { getUserByPhone, registerUser, getSystemSettings, hashPassword, recordUserLogin, shadowFirebaseAuth } from '../firebaseService';
import { User } from '../types';
import { ShieldCheck, Phone, Lock, User as UserIcon, Award, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Sun, Moon } from 'lucide-react';
import { COUNTRY_LIST, CountryInfo } from '../utils/phoneValidation';
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
    try {
      const search = window.location.search || (window.location.hash.includes('?') ? window.location.hash.substring(window.location.hash.indexOf('?')) : '');
      const params = new URLSearchParams(search);
      const urlRef = params.get('ref') || params.get('invite') || params.get('code') || params.get('inviteCode');
      if (urlRef && urlRef.trim() !== '') {
        const cleanCode = urlRef.trim().toUpperCase();
        setIsLogin(false);
        setInviteCode(cleanCode);
        setSuccessMsg(`🎉 تم إدراج رمز الدعوة تلقائياً من رابط الإحالة: (${cleanCode})`);
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

        const hashedEnteredPassword = await hashPassword(password);
        const isPasswordValid = user.password === password || user.password === hashedEnteredPassword;

        if (!isPasswordValid) {
          throw new Error("كلمة المرور غير صحيحة!");
        }

        shadowFirebaseAuth(user.phone, user.password || user.id).catch(e => console.warn(e));
        recordUserLogin(user.phone || user.id).catch(e => console.warn(e));
        setSuccessMsg("تم تسجيل الدخول بنجاح!");
        onLoginSuccess(user);

      } else {
        if (!fullName.trim()) {
          throw new Error("الرجاء إدخال اسم المستخدم بالكامل");
        }
        if (password.length < 6) {
          throw new Error("يجب أن تتكون كلمة المرور من 6 خانات على الأقل");
        }
        if (!inviteCode || !inviteCode.trim()) {
          throw new Error("رمز الدعوة إجباري لإنشاء حساب جديد! الرجاء إدخال رمز دعوة صالح.");
        }

        const registeredUser = await registerUser(
          fullName.trim(),
          fullPhone,
          password,
          inviteCode.trim()
        );

        shadowFirebaseAuth(registeredUser.phone, registeredUser.password || registeredUser.id).catch(e => console.warn(e));
        
        setSuccessMsg(`🎉 تم إنشاء حسابك بنجاح! كود الدعوة الخاص بك هو (${registeredUser.inviteCode}).`);
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
