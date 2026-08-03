import React, { useState, useEffect } from 'react';
import { 
  getSystemSettings, 
  updateUserWallet, 
  updateUserPassword,
  createDeposit, 
  createWithdrawal, 
  getUserDeposits, 
  getUserWithdrawals, 
  getReferralTeam,
  subscribeToReferralTeam,
  getUserByPhone,
  subscribeToUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../firebaseService';
import { User, Deposit, Withdrawal, SystemSettings, UserNotification } from '../types';
import { compressBase64Image } from '../utils';
import { 
  ChevronLeft, 
  Copy, 
  Check, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Users, 
  Wallet, 
  History, 
  Sparkles, 
  RefreshCw, 
  QrCode, 
  LogOut,
  AlertCircle,
  KeyRound,
  Lock,
  Bell,
  Award,
  X,
  MessageSquare,
  Sun,
  Moon
} from 'lucide-react';

interface ProfileCenterProps {
  currentUser: User;
  onUpdateUser: (updated: User) => void;
  onLogout: () => void;
  initialSubView?: 'menu' | 'recharge' | 'withdraw' | 'team' | 'bind' | 'dep_log' | 'with_log' | 'change_pass';
  onSubViewChange?: (view: 'menu' | 'recharge' | 'withdraw' | 'team' | 'bind' | 'dep_log' | 'with_log' | 'change_pass') => void;
  settings?: SystemSettings;
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
}

export default function ProfileCenter({ 
  currentUser, 
  onUpdateUser, 
  onLogout,
  initialSubView,
  onSubViewChange,
  settings: propSettings,
  isDarkMode,
  toggleDarkMode
}: ProfileCenterProps) {
  const [activeSubView, _setActiveSubView] = useState<'menu' | 'recharge' | 'withdraw' | 'team' | 'bind' | 'dep_log' | 'with_log' | 'change_pass'>(initialSubView || 'menu');

  useEffect(() => {
    if (initialSubView) {
      _setActiveSubView(initialSubView);
    }
  }, [initialSubView]);

  const setActiveSubView = (view: 'menu' | 'recharge' | 'withdraw' | 'team' | 'bind' | 'dep_log' | 'with_log' | 'change_pass') => {
    _setActiveSubView(view);
    if (onSubViewChange) {
      onSubViewChange(view);
    }
  };
  const [settings, setSettings] = useState<SystemSettings>(propSettings || {
    siteName: 'OXLO',
    rechargeAddress: '',
    rechargeAddressTRC20: '',
    rechargeAddressBEP20: '',
    telegramLink: '',
    minDeposit: 25,
    minWithdrawal: 10,
    holidayActive: false
  });

  useEffect(() => {
    if (propSettings) {
      setSettings(propSettings);
    }
  }, [propSettings]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [teamList, setTeamList] = useState<User[]>([]);

  // Notifications State
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [showNotifModal, setShowNotifModal] = useState<boolean>(false);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToUserNotifications(currentUser, (notifList) => {
      setNotifications(notifList);
    });
    return () => unsub();
  }, [currentUser]);

  // Local inputs
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form states
  const [selectedNetwork, setSelectedNetwork] = useState<'BEP20' | 'TRC20' | 'POLYGON'>('BEP20');
  const [selectedWithdrawNetwork, setSelectedWithdrawNetwork] = useState<'BEP20' | 'TRC20' | 'POLYGON'>('BEP20');
  const [rechargeAmount, setRechargeAmount] = useState<string>('');
  const [rechargeHash, setRechargeHash] = useState<string>('');
  const [rechargeScreenshot, setRechargeScreenshot] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawWallet, setWithdrawWallet] = useState<string>('');
  const [bindWalletInput, setBindWalletInput] = useState<string>(currentUser.walletAddress || '');

  // Password Change Form states
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!oldPassword.trim()) {
      setPassError("الرجاء إدخال كلمة المرور الحالية.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPassError("يجب أن تتكون كلمة المرور الجديدة من 6 خانات على الأقل.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("كلمتا المرور الجديدة وتأكيدها غير متطابقتين.");
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await updateUserPassword(currentUser.phone, oldPassword, newPassword);
      onUpdateUser(updatedUser);
      localStorage.setItem('user_session', JSON.stringify(updatedUser));
      setPassSuccess("🎉 تم تغيير كلمة المرور بنجاح!");
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPassSuccess(null);
        setActiveSubView('menu');
      }, 1500);
    } catch (err: any) {
      setPassError(err.message || "حدث خطأ أثناء تغيير كلمة المرور.");
    } finally {
      setLoading(false);
    }
  };

  // Load context based on active view
  useEffect(() => {
    let unsubTeam: (() => void) | undefined;
    const fetchSubViewData = async () => {
      setLoading(true);
      try {
        // Always refresh user info to get the latest updated balances/stats
        const freshUser = await getUserByPhone(currentUser.phone);
        if (freshUser) {
          onUpdateUser(freshUser);
        }

        // Always fetch system settings to validate limits and get official info if not passed from parent
        if (!propSettings) {
          const sysSettings = await getSystemSettings();
          setSettings(sysSettings);
        }

        if (activeSubView === 'dep_log') {
          const list = await getUserDeposits(currentUser.phone);
          setDeposits(list);
        } else if (activeSubView === 'with_log') {
          const list = await getUserWithdrawals(currentUser.phone);
          setWithdrawals(list);
        } else if (activeSubView === 'team') {
          unsubTeam = subscribeToReferralTeam(currentUser.inviteCode, (list) => {
            setTeamList(list);
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubViewData();

    return () => {
      if (unsubTeam) unsubTeam();
    };
  }, [activeSubView, currentUser.inviteCode]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    showToast("تم النسخ بنجاح!");
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleBindWallet = async () => {
    if (!bindWalletInput.trim()) {
      showToast("الرجاء إدخال عنوان محفظة صالح");
      return;
    }
    setLoading(true);
    try {
      await updateUserWallet(currentUser.phone, bindWalletInput.trim());
      onUpdateUser({ ...currentUser, walletAddress: bindWalletInput.trim() });
      showToast("تم ربط المحفظة بنجاح!");
      setActiveSubView('menu');
    } catch (err) {
      showToast("فشل ربط المحفظة");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const rawBase64 = reader.result as string;
          // Compress the deposit screenshot to a very small size to prevent Firestore/localStorage size issues
          const compressed = await compressBase64Image(rawBase64, 400, 400, 0.6);
          setRechargeScreenshot(compressed);
        } catch (err) {
          console.error("Compression error:", err);
          showToast("حدث خطأ أثناء معالجة الصورة، يرجى المحاولة مجدداً.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast("الرجاء إدخال مبلغ صالح للشحن");
      return;
    }
    
    // Dynamic minimum deposit validation set by admin
    const minDep = settings.minDeposit ?? 25;
    if (amount < minDep) {
      showToast(`الحد الأدنى للإيداع هو ${minDep}$`);
      return;
    }

    if (!rechargeScreenshot) {
      showToast("الرجاء رفع صورة إيصال التحويل للتحقق");
      return;
    }

    setLoading(true);
    const currencyName = selectedNetwork === 'BEP20' 
      ? 'USDT (BEP20)' 
      : selectedNetwork === 'TRC20' 
      ? 'USDT (TRC20)' 
      : 'USDT (Polygon)';

    try {
      await createDeposit(currentUser.id, currentUser.username, currentUser.phone, amount, '', rechargeScreenshot, currencyName);
      showToast("تم إرسال طلب الشحن بنجاح! بانتظار موافقة الإدارة 🎉");
      setRechargeAmount('');
      setRechargeHash('');
      setRechargeScreenshot('');
      setActiveSubView('dep_log');
    } catch (err: any) {
      showToast(err.message || "فشل إرسال طلب الشحن");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast("الرجاء إدخال مبلغ صالح للسحب");
      return;
    }

    // Withdrawal lock check
    const todayDay = new Date().getDay();
    if (settings.withdrawLockActive || (settings.withdrawLockDays && settings.withdrawLockDays.includes(todayDay))) {
      showToast("عذراً، عمليات السحب مغلقة حالياً من قبل الإدارة.");
      return;
    }

    // Dynamic minimum withdrawal validation set by admin
    const minWith = settings.minWithdrawal ?? 10;
    if (amount < minWith) {
      showToast(`الحد الأدنى للسحب هو ${minWith}$`);
      return;
    }

    if (amount > currentUser.earnings) {
      showToast("رصيدك الحالي غير كافٍ لإجراء هذا السحب!");
      return;
    }

    const finalWallet = withdrawWallet.trim() || currentUser.walletAddress;
    if (!finalWallet) {
      showToast("الرجاء تحديد عنوان محفظة السحب الخاصة بك");
      return;
    }

    const withdrawCurrency = selectedWithdrawNetwork === 'BEP20'
      ? 'USDT (BEP20)'
      : selectedWithdrawNetwork === 'TRC20'
      ? 'USDT (TRC20)'
      : 'USDT (Polygon)';

    setLoading(true);
    try {
      await createWithdrawal(currentUser.id, currentUser.username, currentUser.phone, amount, finalWallet, withdrawCurrency);
      showToast("تم تقديم طلب السحب بنجاح وخصم المبلغ من الرصيد مؤقتاً!");
      setWithdrawAmount('');
      setWithdrawWallet('');
      // Update local state earnings immediately
      onUpdateUser({ ...currentUser, earnings: currentUser.earnings - amount });
      setActiveSubView('with_log');
    } catch (err: any) {
      showToast(err.message || "فشل إرسال طلب السحب");
    } finally {
      setLoading(false);
    }
  };

  // Mask user phone for privacy exactly like screenshot
  const getMaskedPhone = () => {
    const ph = currentUser.phone;
    if (ph.length > 5) {
      return `****${ph.substring(ph.length - 5)}`;
    }
    return ph;
  };

  return (
    <div className="w-full max-w-md mx-auto text-stone-800" dir="rtl">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-stone-900/90 backdrop-blur-md text-white px-5 py-3 rounded-full shadow-xl text-xs font-bold flex items-center gap-2 animate-fadeIn border border-white/10">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main personal center menu screen */}
      {activeSubView === 'menu' && (
        <div className="animate-fadeIn">
          
          {/* Blue top banner with character profile avatar */}
          <div className="bg-gradient-to-b from-[#3B82F6] to-[#4F46E5] pt-8 pb-14 px-6 text-white flex items-center justify-between relative rounded-b-3xl shadow-lg">
            
            <div className="flex items-center gap-3">
              {/* Profile image with circular layout */}
              <div className="w-14 h-14 rounded-full border-2 border-white/90 bg-blue-100 overflow-hidden shadow-inner">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-sm font-extrabold tracking-wide" dir="ltr">{getMaskedPhone()}</h2>
                  {currentUser.effectiveDays > 0 ? (
                    <span className="bg-emerald-500/30 backdrop-blur-md text-emerald-200 text-[8px] font-bold px-1.5 py-0.5 rounded border border-emerald-400/20">
                      فعال
                    </span>
                  ) : (
                    <span className="bg-rose-500/30 backdrop-blur-md text-rose-200 text-[8px] font-bold px-1.5 py-0.5 rounded border border-rose-400/20">
                      غير فعال
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 justify-start">
                  <p className="text-[10px] text-white/80 font-bold">{currentUser.username}</p>
                  <span className="bg-amber-500 text-stone-950 text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-sm shrink-0 animate-pulse">
                    الباقة: {currentUser.vipTier || 'العادية'} ({currentUser.effectiveDays > 0 ? 'مفعلة' : 'غير مفعلة'})
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Theme Mode and In-App Notifications Bell Icon Button */}
            <div className="flex items-center gap-2">
              {toggleDarkMode && (
                <button
                  onClick={toggleDarkMode}
                  className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all cursor-pointer active:scale-95 flex items-center justify-center text-white"
                  title={isDarkMode ? 'التبديل إلى الوضع المضيء' : 'التبديل إلى الوضع الليلي'}
                >
                  {isDarkMode ? <Sun className="w-5 h-5 text-amber-300 fill-amber-300" /> : <Moon className="w-5 h-5 text-blue-200 fill-blue-200" />}
                </button>
              )}

              <button
                onClick={() => setShowNotifModal(true)}
                className="relative p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                title="الإشعارات"
              >
                <Bell className="w-5 h-5 text-white" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-extrabold text-[9px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 animate-bounce border-2 border-[#3B82F6]">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Overlapping Primary Stats Card - Designed exactly like screenshot 1 with User Balance & Earnings */}
          <div className="px-4 -mt-8">
            <div className="bg-white rounded-2xl border border-blue-50 p-5 shadow-lg relative overflow-hidden space-y-4">
              
              {/* Grid 1: Balance and Earnings side-by-side boxes */}
              <div className="grid grid-cols-2 gap-3.5">
                
                {/* User Account Balance Box */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/55 p-3.5 rounded-xl border border-emerald-100 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="text-[10px] font-extrabold text-emerald-700">رصيد المستخدم</span>
                  </div>
                  <span className="text-sm font-black text-emerald-600 tracking-wide">
                    {currentUser.earnings} USDT
                  </span>
                </div>

                {/* Earnings/Profits Box */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/55 p-3.5 rounded-xl border border-blue-100 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                    <span className="text-[10px] font-extrabold text-blue-700">الأرباح والمهام</span>
                  </div>
                  <span className="text-sm font-black text-blue-600 tracking-wide">
                    {currentUser.taskIncome} USDT
                  </span>
                </div>

              </div>

              {/* Sub-counters Row: يوم العمل الفعال فقط */}
              <div className="border-t border-stone-100/80 pt-3 flex items-center justify-between text-right px-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-stone-500">يوم العمل الفعال فقط:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {currentUser.effectiveDays === 0 && (
                    <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg">
                      حساب غير فعال
                    </span>
                  )}
                  <span className="text-xs font-black text-stone-800 bg-stone-100/70 px-2.5 py-1 rounded-lg">
                    {currentUser.effectiveDays} أيام فعال
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* VIP / Subscription Progress Card */}
          {(() => {
            const currentEarn = currentUser.earnings || 0;
            let plansList = (settings?.vipPlans && settings.vipPlans.length > 0) ? [...settings.vipPlans] : [
              { id: 'plan_light', name: 'light', price: 150, profit: 5, tasksCount: 5 },
              { id: 'plan_A1', name: 'A1', price: 300, profit: 9, tasksCount: 5 },
              { id: 'plan_A2', name: 'A2', price: 600, profit: 18, tasksCount: 5 },
              { id: 'plan_B1', name: 'B1', price: 1200, profit: 38, tasksCount: 5 },
              { id: 'plan_B2', name: 'B2', price: 2600, profit: 65, tasksCount: 5 },
              { id: 'plan_C1', name: 'C1', price: 5000, profit: 162, tasksCount: 5 },
              { id: 'plan_C2', name: 'C2', price: 12000, profit: 360, tasksCount: 5 },
              { id: 'plan_D1', name: 'D1', price: 26000, profit: 750, tasksCount: 5 },
              { id: 'plan_D2', name: 'D2', price: 65000, profit: 1620, tasksCount: 5 },
              { id: 'plan_business', name: 'business', price: 90000, profit: 2550, tasksCount: 5 }
            ];

            // Use plans list directly from settings without re-inserting deleted plans

            const rawTier = (currentUser.vipTier || "").trim();
            const isUnsubscribed = !rawTier || rawTier === "العضوية العادية" || rawTier === "بدون باقة" || rawTier === "غير مفعلة";
            
            const currentPlanIndex = isUnsubscribed 
              ? -1 
              : plansList.findIndex(p => p.name.toLowerCase() === rawTier.toLowerCase() || (rawTier.length > 0 && rawTier.toLowerCase().includes(p.name.toLowerCase())));
            
            let currentTierName = isUnsubscribed ? "العضوية العادية" : rawTier;
            let nextPlan = null;
            if (currentPlanIndex !== -1) {
              currentTierName = plansList[currentPlanIndex].name;
              if (currentPlanIndex < plansList.length - 1) {
                nextPlan = plansList[currentPlanIndex + 1];
              }
            } else {
              // Not subscribed yet -> Target 1 is light ($150)
              nextPlan = plansList[0];
            }

            let targetPrice = nextPlan ? nextPlan.price : (plansList[plansList.length - 1]?.price || 150);
            let nextTierName = nextPlan ? `منصب ${nextPlan.name} ($${nextPlan.price})` : "أعلى منصب (الحد الأقصى)";
            let remaining = nextPlan ? Math.max(0, targetPrice - currentEarn) : 0;
            let percentage = nextPlan ? Math.min(100, Math.max(0, Math.round((currentEarn / targetPrice) * 100))) : 100;

            return (
              <div className="px-4 mt-4">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-4 text-white border border-slate-700 shadow-md space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      <div>
                        <span className="text-xs font-black block text-amber-400">تقدم ترقية المنصب والاشتراك</span>
                        <span className="text-[9px] text-slate-300 block">الباقة الحالية: {currentTierName}</span>
                      </div>
                    </div>
                    <span className="bg-amber-400/20 text-amber-300 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-amber-400/30">
                      {percentage}%
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-300">
                      <span>الهدف القادم: {nextTierName}</span>
                      <span>{currentEarn} / {targetPrice} USDT</span>
                    </div>

                    <div className="w-full bg-slate-950/80 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                      <div 
                        className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 h-full rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Action Links List exactly like the screenshot items */}
          <div className="px-4 mt-6">
            <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden divide-y divide-stone-100">
              
              {/* Item 1: شحن الحساب */}
              <button
                onClick={() => setActiveSubView('recharge')}
                className="w-full p-4 flex items-center justify-between text-right hover:bg-slate-50/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                    <ArrowDownCircle className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-800">شحن الحساب</span>
                    <span className="text-[9px] text-stone-400 block mt-0.5">BEP20 / TRC20 / Polygon</span>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-stone-400 group-hover:translate-x-[-2px] transition-transform" />
              </button>

              {/* Item 2: سحب */}
              <button
                onClick={() => setActiveSubView('withdraw')}
                className="w-full p-4 flex items-center justify-between text-right hover:bg-slate-50/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 shrink-0">
                    <ArrowUpCircle className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-800">سحب الأرباح</span>
                    <span className="text-[9px] text-stone-400 block mt-0.5">فقط USDT Polygon</span>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-stone-400 group-hover:translate-x-[-2px] transition-transform" />
              </button>

              {/* Item 4: ربط المحفظة */}
              <button
                onClick={() => setActiveSubView('bind')}
                className="w-full p-4 flex items-center justify-between text-right hover:bg-slate-50/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                    <Wallet className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-800">ربط المحفظة الشخصية</span>
                    <span className="text-[9px] text-stone-400 block mt-0.5">USDT Polygon لسهولة السحب</span>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-stone-400 group-hover:translate-x-[-2px] transition-transform" />
              </button>

              {/* Item 5: سجل الإيداع */}
              <button
                onClick={() => setActiveSubView('dep_log')}
                className="w-full p-4 flex items-center justify-between text-right hover:bg-slate-50/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                    <History className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-800">سجل الإيداع والشحن</span>
                    <span className="text-[9px] text-stone-400 block mt-0.5">تتبع طلبات إيداعاتك السابقة</span>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-stone-400 group-hover:translate-x-[-2px] transition-transform" />
              </button>

              {/* Item 6: سجل السحب */}
              <button
                onClick={() => setActiveSubView('with_log')}
                className="w-full p-4 flex items-center justify-between text-right hover:bg-slate-50/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                    <History className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-800">سجل عمليات السحب</span>
                    <span className="text-[9px] text-stone-400 block mt-0.5">تتبع طلبات سحوباتك المكتملة</span>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-stone-400 group-hover:translate-x-[-2px] transition-transform" />
              </button>

              {/* Item 6.5: الوضع المضيء والوضع الليلي */}
              {toggleDarkMode && (
                <button
                  onClick={toggleDarkMode}
                  className="w-full p-4 flex items-center justify-between text-right hover:bg-slate-50/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-50 dark:bg-amber-950/40 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                      {isDarkMode ? <Sun className="w-5 h-5 stroke-[2.5]" /> : <Moon className="w-5 h-5 stroke-[2.5]" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-stone-800">مظهر التطبيق (الوضع الليلي)</span>
                      <span className="text-[9px] text-stone-400 block mt-0.5">
                        {isDarkMode ? 'مفعل حالياً (الوضع الليلي مريح للعين)' : 'مفعل حالياً (الوضع المضيء)'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      isDarkMode ? 'bg-indigo-900/50 text-indigo-200' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isDarkMode ? 'ليلي 🌙' : 'مضيء ☀️'}
                    </span>
                    <ChevronLeft className="w-4 h-4 text-stone-400 group-hover:translate-x-[-2px] transition-transform" />
                  </div>
                </button>
              )}

              {/* Item 7: منصة تواصل الدعم الفني والإدارة */}
              {settings.telegramLink && (
                <a
                  href={settings.telegramLink.startsWith('http') ? settings.telegramLink : `https://${settings.telegramLink}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full p-4 flex items-center justify-between text-right hover:bg-slate-50/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                      <Users className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-stone-800">الادارة</span>
                      <span className="text-[9px] text-stone-400 block mt-0.5">انقر للتواصل المباشر مع إدارة المنصة</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-stone-400 group-hover:translate-x-[-2px] transition-transform" />
                </a>
              )}

              {/* Item: تغيير كلمة المرور */}
              <button
                type="button"
                onClick={() => setActiveSubView('change_pass')}
                className="w-full p-4 flex items-center justify-between text-right hover:bg-slate-50/50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                    <KeyRound className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-800">تغيير كلمة المرور</span>
                    <span className="text-[9px] text-stone-400 block mt-0.5">تحديث كلمة مرور حسابك لتأمين أمان بياناتك</span>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-stone-400 group-hover:translate-x-[-2px] transition-transform" />
              </button>

              {/* Item 8: تسجيل الخروج باللغة العربية */}
              <button
                onClick={onLogout}
                className="w-full p-4 flex items-center justify-between text-right hover:bg-rose-50/40 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 shrink-0">
                    <LogOut className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-rose-600">تسجيل الخروج من الحساب</span>
                    <span className="text-[9px] text-rose-400 block mt-0.5">تأمين جلستك والخروج الآمن بالكامل</span>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-rose-400 group-hover:translate-x-[-2px] transition-transform" />
              </button>

            </div>
          </div>

        </div>
      )}

      {/* Sub View: Recharge (شحن الحساب) */}
      {activeSubView === 'recharge' && (
        <div className="animate-fadeIn p-4 space-y-5">
          {/* Back Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <button onClick={() => setActiveSubView('menu')} className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
              <ChevronLeft className="w-6 h-6 rotate-180 text-slate-700" />
            </button>
            <h3 className="text-sm font-black text-slate-900">شحن الحساب (USDT)</h3>
            <div className="w-8"></div>
          </div>

          {/* Network Selector Tabs */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 text-right">
                1. اختر شبكة الإيداع المعتمدة:
              </label>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                إيداع فوري
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* 1. BEP20 */}
              <button
                type="button"
                onClick={() => setSelectedNetwork('BEP20')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer relative overflow-hidden shadow-sm hover:shadow-md ${
                  selectedNetwork === 'BEP20'
                    ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-white border-amber-500 shadow-md ring-2 ring-amber-400/50 scale-[1.02]'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${selectedNetwork === 'BEP20' ? 'bg-black/20 text-yellow-300' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                  {/* Real BNB / BEP20 Logo */}
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12 3L7.5 7.5L12 12L16.5 7.5L12 3ZM3 12L1.5 13.5L3 15L4.5 13.5L3 12ZM21 12L19.5 13.5L21 15L22.5 13.5L21 12ZM12 15L7.5 19.5L12 24L16.5 19.5L12 15Z"/>
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-black block">BEP20</span>
                  <span className={`text-[9px] font-extrabold block mt-0.5 ${selectedNetwork === 'BEP20' ? 'text-amber-100' : 'text-slate-400'}`}>BNB Chain</span>
                </div>
              </button>

              {/* 2. TRC20 */}
              <button
                type="button"
                onClick={() => setSelectedNetwork('TRC20')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer relative overflow-hidden shadow-sm hover:shadow-md ${
                  selectedNetwork === 'TRC20'
                    ? 'bg-gradient-to-br from-rose-600 via-red-600 to-rose-700 text-white border-red-500 shadow-md ring-2 ring-rose-400/50 scale-[1.02]'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${selectedNetwork === 'TRC20' ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                  {/* Real TRON Logo */}
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M2.5 3.5L21.5 8.5L13.5 20.5L2.5 3.5ZM6.5 7L12 16L16.5 9.5L6.5 7Z"/>
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-black block">TRC20</span>
                  <span className={`text-[9px] font-extrabold block mt-0.5 ${selectedNetwork === 'TRC20' ? 'text-rose-100' : 'text-slate-400'}`}>TRON</span>
                </div>
              </button>

              {/* 3. POLYGON */}
              <button
                type="button"
                onClick={() => setSelectedNetwork('POLYGON')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer relative overflow-hidden shadow-sm hover:shadow-md ${
                  selectedNetwork === 'POLYGON'
                    ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white border-purple-500 shadow-md ring-2 ring-purple-400/50 scale-[1.02]'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${selectedNetwork === 'POLYGON' ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}>
                  {/* Real Polygon Logo */}
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M16.5 12L19.5 10.3V6.8L16.5 5.1L13.5 6.8V10.3L16.5 12ZM7.5 12L10.5 10.3V6.8L7.5 5.1L4.5 6.8V10.3L7.5 12ZM12 19.8L15 18.1V14.6L12 12.9L9 14.6V18.1L12 19.8Z"/>
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-black block">POLYGON</span>
                  <span className={`text-[9px] font-extrabold block mt-0.5 ${selectedNetwork === 'POLYGON' ? 'text-purple-100' : 'text-slate-400'}`}>Polygon</span>
                </div>
              </button>
            </div>
          </div>

          {/* Wallet and Destination Card */}
          {(() => {
            const currentAddress = selectedNetwork === 'BEP20'
              ? (settings.rechargeAddressBEP20 || "0x71C7656EC7ab88b098defB751B7401B5f6d8976F")
              : selectedNetwork === 'TRC20'
              ? (settings.rechargeAddressTRC20 || "sfnmQtKLfcDarAMd")
              : (settings.rechargeAddress || "e738819b080a278d");

            const cardGradient = selectedNetwork === 'BEP20'
              ? "from-slate-900 via-slate-800 to-amber-950/70 border-amber-500/40 shadow-amber-900/10"
              : selectedNetwork === 'TRC20'
              ? "from-slate-900 via-slate-800 to-rose-950/70 border-rose-500/40 shadow-rose-900/10"
              : "from-slate-900 via-slate-800 to-indigo-950/70 border-purple-500/40 shadow-purple-900/10";

            const netBadge = selectedNetwork === 'BEP20'
              ? "USDT (BEP20 / BNB Smart Chain)"
              : selectedNetwork === 'TRC20'
              ? "USDT (TRC20 / TRON Network)"
              : "USDT (Polygon Network)";

            const accentColor = selectedNetwork === 'BEP20'
              ? "text-amber-400 bg-amber-400/10 border-amber-400/30"
              : selectedNetwork === 'TRC20'
              ? "text-rose-400 bg-rose-400/10 border-rose-400/30"
              : "text-purple-400 bg-purple-400/10 border-purple-400/30";

            return (
              <div className={`bg-gradient-to-br ${cardGradient} p-5 rounded-2xl text-white shadow-xl border relative overflow-hidden transition-all duration-300 space-y-3`}>
                <QrCode className="absolute bottom-[-10px] left-[-10px] w-36 h-36 text-white/5 pointer-events-none" />
                
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${accentColor}`}>
                    {netBadge}
                  </span>
                  <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    عنوان نشط
                  </span>
                </div>

                <div className="pt-1">
                  <span className="text-[10px] text-slate-300 block font-bold mb-1.5 text-right">
                    2. انسخ عنوان المحفظة الرسمي التالي لتحويل USDT:
                  </span>
                  
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-700 font-mono text-xs font-bold select-all break-all text-left flex items-center justify-between gap-2 shadow-inner" dir="ltr">
                    <span className="flex-1 overflow-x-auto text-amber-300 tracking-wide">{currentAddress}</span>
                    <button 
                      type="button"
                      onClick={() => handleCopy(currentAddress)}
                      className="px-3 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 rounded-lg transition-all cursor-pointer text-slate-950 shrink-0 active:scale-95 flex items-center gap-1.5 text-xs font-black shadow-md"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ العنوان</span>
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-slate-300 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 leading-relaxed flex items-start gap-2 text-right">
                  <span className="text-amber-400 font-bold shrink-0">⚠️</span>
                  <span>تنبيه هامن: تأكد من اختيار شبكة <b>{selectedNetwork}</b> بداخل تطبيق محفظتك (Binance / OKX / Trust Wallet) لمنع فقدان الرصيد أثناء التحويل.</span>
                </div>
              </div>
            );
          })()}

          {/* Form to submit deposit proof */}
          <form onSubmit={handleRechargeSubmit} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-lg space-y-4">
            <h4 className="text-xs font-black text-slate-900 border-r-4 border-amber-500 pr-2.5">
              3. تأكيد التحويل ورفع إيصال الدفع
            </h4>
            
            {settings.rechargeNotice && (
              <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl text-xs font-bold text-amber-900 text-center leading-relaxed shadow-sm">
                📢 {settings.rechargeNotice}
              </div>
            )}

            {settings.rechargeNotice2 && (
              <div className="bg-teal-50/80 border border-teal-200 p-3 rounded-xl text-xs font-bold text-teal-900 text-center leading-relaxed shadow-sm">
                🔔 {settings.rechargeNotice2}
              </div>
            )}

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5 text-right">
                المبلغ المشحون بالكامل ($ USDT)
              </label>
              <input
                type="number"
                required
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                placeholder="مثال: 150"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:bg-white transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5 text-right">
                صورة إيصال الدفع للتحقق (لقطة شاشة)
              </label>
              <div className="flex flex-col items-center gap-3">
                <label className="w-full flex flex-col items-center justify-center p-5 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-100/70 transition-all text-center shadow-inner group">
                  <span className="text-xs text-slate-600 font-extrabold mb-1.5 group-hover:text-amber-600 transition-colors">
                    اضغط هنا لرفع صورة إيصال التحويل الناجح
                  </span>
                  <span className="text-[10px] text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200 font-bold shadow-sm">
                    اختر ملف الصورة
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {rechargeScreenshot && (
                  <div className="relative w-full max-h-48 rounded-xl overflow-hidden border border-slate-300 bg-slate-900 flex items-center justify-center p-1.5 shadow-md">
                    <img
                      src={rechargeScreenshot}
                      alt="Screenshot Preview"
                      className="max-h-44 object-contain rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setRechargeScreenshot('')}
                      className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-md"
                    >
                      حذف الصورة
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 py-3.5 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              <span>تأكيد وإرسال طلب الشحن للإدارة</span>
            </button>
          </form>

          <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl text-[11px] text-amber-900 leading-relaxed flex gap-2.5 shadow-sm text-right">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong className="font-extrabold block mb-0.5 text-amber-950">ملاحظة هامة:</strong>
              تستغرق عملية معالجة الإيداع ومطابقة إيصال الدفع من 5 إلى 30 دقيقة خلال أوقات العمل الرسمية. يتم إشعارك فور تفعيل الرصيد بالحساب.
            </div>
          </div>
        </div>
      )}

      {/* Sub View: Withdraw (سحب الأرباح) */}
      {activeSubView === 'withdraw' && (
        <div className="animate-fadeIn p-4 space-y-5">
          {/* Back Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <button onClick={() => setActiveSubView('menu')} className="p-1 hover:bg-stone-100 rounded-lg">
              <ChevronLeft className="w-6 h-6 rotate-180 text-stone-600" />
            </button>
            <h3 className="text-sm font-black text-stone-800">سحب الأرباح (اختر الشبكة المناسبة)</h3>
            <div className="w-8"></div>
          </div>

          {/* Wallet balance display card */}
          <div className="bg-gradient-to-br from-[#4F46E5] to-[#3B82F6] p-5 rounded-2xl text-white shadow-md">
            <span className="text-[10px] text-indigo-50 block">رصيد الأرباح المتاح للسحب الفوري</span>
            <span className="text-2xl font-black block mt-1 tracking-wide">{currentUser.earnings} USDT</span>
            <div className="border-t border-white/10 mt-3 pt-3 flex items-center justify-between text-[10px] text-indigo-50 font-bold">
              <span>المحفظة المرتبطة بالحساب:</span>
              <span className="font-mono truncate max-w-[200px]" dir="ltr">{currentUser.walletAddress || "غير مرتبطة بعد (اربطها لتلقي الدفع)"}</span>
            </div>
          </div>

          {/* Form to submit withdrawal request */}
          <form onSubmit={handleWithdrawSubmit} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-stone-800 border-r-4 border-indigo-500 pr-2">إنشاء طلب سحب جديد</h4>
            
            {/* 3 Withdrawal Network Options */}
            <div>
              <label className="block text-[10px] font-bold text-stone-600 mb-1.5">
                اختر شبكة السحب (USDT Network) <span className="text-rose-500 font-extrabold">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWithdrawNetwork('BEP20')}
                  className={`py-2.5 px-2 rounded-xl border text-[11px] font-black transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    selectedWithdrawNetwork === 'BEP20'
                      ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm ring-2 ring-amber-500/20'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <span>BEP20</span>
                  <span className="text-[8.5px] font-bold text-stone-500">BSC Smart Chain</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedWithdrawNetwork('TRC20')}
                  className={`py-2.5 px-2 rounded-xl border text-[11px] font-black transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    selectedWithdrawNetwork === 'TRC20'
                      ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm ring-2 ring-rose-500/20'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <span>TRC20</span>
                  <span className="text-[8.5px] font-bold text-stone-500">TRON Network</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedWithdrawNetwork('POLYGON')}
                  className={`py-2.5 px-2 rounded-xl border text-[11px] font-black transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    selectedWithdrawNetwork === 'POLYGON'
                      ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm ring-2 ring-purple-500/20'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <span>POLYGON</span>
                  <span className="text-[8.5px] font-bold text-stone-500">Polygon MATIC</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 mb-1.5">المبلغ المراد سحبه (بالدولار الأمريكي / USDT)</label>
              <input
                type="number"
                required
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="أقصى مبلغ متاح للسحب"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 mb-1.5">
                محفظة السحب وجهة USDT ({selectedWithdrawNetwork})
              </label>
              <input
                type="text"
                value={withdrawWallet}
                onChange={(e) => setWithdrawWallet(e.target.value)}
                placeholder={
                  currentUser.walletAddress || (
                    selectedWithdrawNetwork === 'BEP20' ? "أدخل عنوان محفظة BEP20 (0x...)" :
                    selectedWithdrawNetwork === 'TRC20' ? "أدخل عنوان محفظة TRC20 (T...)" :
                    "أدخل عنوان محفظة Polygon (0x...)"
                  )
                }
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold font-mono text-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-left"
                dir="ltr"
              />
              <p className="text-[9px] text-stone-400 mt-1">
                تلقائياً سيتم السحب إلى المحفظة التي قمت بربطها في إعدادات ملفك الشخصي إذا تركت هذا الحقل فارغاً.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white py-3 rounded-xl font-bold text-xs shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              <span>تأكيد وإنشاء طلب سحب عبر شبكة ({selectedWithdrawNetwork})</span>
            </button>
          </form>

          <div className="space-y-2.5">
            <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-xl text-[10px] text-indigo-700 leading-relaxed flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-indigo-600" />
              <span>
                <strong>تنبيه السحب:</strong> {settings.withdrawNotice || "تتم معالجة الدفع وإرساله إلى محفظتك المرتبطة خلال 24 ساعة من تاريخ الموافقة والمراجعة التلقائية."}
              </span>
            </div>

            {settings.withdrawNotice2 && (
              <div className="bg-teal-50 border border-teal-100 p-3.5 rounded-xl text-[10px] text-teal-700 leading-relaxed flex gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 text-teal-600" />
                <span>
                  <strong>تنويه إضافي:</strong> {settings.withdrawNotice2}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub View: Team (فريقي) */}
      {activeSubView === 'team' && (
        <div className="animate-fadeIn p-4 space-y-5">
          {/* Back Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <button onClick={() => setActiveSubView('menu')} className="p-1 hover:bg-stone-100 rounded-lg">
              <ChevronLeft className="w-6 h-6 rotate-180 text-stone-600" />
            </button>
            <h3 className="text-sm font-black text-stone-800">فريقي وشجرة الإحالة</h3>
            <div className="w-8"></div>
          </div>

          {/* Invitation code display */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 rounded-2xl text-white shadow-md text-center">
            <span className="text-[10px] text-emerald-100 block font-bold">شارك رمز دعوتك الحصري لمضاعفة أرباحك:</span>
            <span className="text-2xl font-black block mt-2 font-mono tracking-widest bg-white/10 py-1.5 rounded-xl w-max px-6 mx-auto border border-white/10">
              {currentUser.inviteCode}
            </span>
            <button 
              onClick={() => handleCopy(currentUser.inviteCode)}
              className="mt-3.5 bg-white text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black shadow hover:bg-stone-50 transition-all cursor-pointer flex items-center gap-1 mx-auto"
            >
              <Copy className="w-3 h-3" />
              <span>نسخ رمز الدعوة</span>
            </button>
          </div>

          {/* إحصائيات أرباح فريق الإحالة */}
          {teamList.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-emerald-950 text-xs flex flex-col space-y-2 animate-scaleIn">
              <span className="font-black text-xs text-emerald-800 block">📊 إحصائيات أرباح عمولات الفريق:</span>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white p-3 rounded-xl border border-emerald-100/50">
                  <span className="text-[10px] text-stone-400 block font-bold">نسبة الربح من دعوة الأصدقاء</span>
                  <span className="text-xs font-black text-emerald-600 block mt-0.5">%10 من دخل مهام العضو</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100/50">
                  <span className="text-[10px] text-stone-400 block font-bold">إجمالي عمولات الفريق المكتسبة</span>
                  <span className="text-xs font-black text-blue-600 block mt-0.5">
                    {teamList.reduce((sum, m) => sum + ((m.taskIncome || 0) * 0.10), 0).toFixed(2)} USDT
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Team list count */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-stone-800 border-r-4 border-emerald-500 pr-2">الأعضاء الذين دعوتهم ({teamList.length})</h4>
              <RefreshCw className="w-3.5 h-3.5 text-stone-400 animate-spin" style={{ animationPlayState: loading ? 'running' : 'paused' }} />
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-6 text-stone-400 text-xs">جاري تحميل قائمتك من قاعدة البيانات...</div>
              ) : teamList.length === 0 ? (
                <div className="text-center py-8 text-stone-400">
                  <p className="text-xs font-bold text-stone-600">لا يوجد مستخدمون مسجلون بدعوتك بعد</p>
                  <p className="text-[10px] mt-1 max-w-xs mx-auto">شارك الكود الخاص بك مع أصدقائك في العراق والدول الأخرى لتبني فريقك النشط وتضاعف عوائد العمل اليومية!</p>
                </div>
              ) : (
                teamList.map((member) => {
                  const comm = ((member.taskIncome || 0) * 0.10).toFixed(2);
                  return (
                    <div key={member.id} className="p-3.5 border border-stone-200/70 rounded-xl flex flex-col gap-2.5 text-xs hover:bg-stone-50/50 transition-colors bg-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-stone-800 block">{member.username}</span>
                          <span className="text-[9px] text-stone-400 block mt-0.5" dir="ltr">رقم الهاتف: {member.phone.substring(0, 7)}****</span>
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-black text-blue-600 block">{member.earnings} USDT</span>
                          <span className="text-[9px] text-stone-400 block font-bold">باقة: {member.vipTier || 'الباقة العادية'}</span>
                        </div>
                      </div>
                      
                      {/* Profit tracking bar / details exactly as requested by the user */}
                      <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between text-[10px] font-bold">
                        <span className="text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100 font-black text-[9px]">نسبة عمولتك: %10</span>
                        <span className="text-stone-500">
                          الربح المكتسب منه: <strong className="text-emerald-700">{comm} USDT</strong>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub View: Bind Wallet (ربط المحفظة) */}
      {activeSubView === 'bind' && (
        <div className="animate-fadeIn p-4 space-y-5">
          {/* Back Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <button onClick={() => setActiveSubView('menu')} className="p-1 hover:bg-stone-100 rounded-lg">
              <ChevronLeft className="w-6 h-6 rotate-180 text-stone-600" />
            </button>
            <h3 className="text-sm font-black text-stone-800">ربط المحفظة للمستخدم</h3>
            <div className="w-8"></div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-stone-800 border-r-4 border-blue-500 pr-2">عنوان محفظة USDT Polygon</h4>
            
            <p className="text-[10px] text-stone-500 leading-relaxed">
              يرجى ربط عنوان محفظتك الخاصة بسحب USDT (المتوافقة مع شبكة بوليجون Polygon) بشكل دائم لتسهيل وتسريع عمليات السحب التلقائي.
            </p>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 mb-1.5">عنوان محفظة Polygon (أو بوليجون)</label>
              <input
                type="text"
                value={bindWalletInput}
                onChange={(e) => setBindWalletInput(e.target.value)}
                placeholder="أدخل عنوان المحفظة 0x..."
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold font-mono text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-left"
                dir="ltr"
              />
            </div>

            <button
              onClick={handleBindWallet}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-xs shadow transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              <span>حفظ المحفظة وربطها نهائياً</span>
            </button>
          </div>

          {currentUser.walletAddress && (
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-emerald-800 text-xs">
              <span className="font-bold block">المحفظة المرتبطة حالياً بالحساب:</span>
              <span className="font-mono text-[10px] block select-all break-all mt-1 bg-white/80 p-2 rounded border border-emerald-150" dir="ltr">
                {currentUser.walletAddress}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Sub View: Deposit Log (سجل الإيداع) */}
      {activeSubView === 'dep_log' && (
        <div className="animate-fadeIn p-4 space-y-5">
          {/* Back Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <button onClick={() => setActiveSubView('menu')} className="p-1 hover:bg-stone-100 rounded-lg">
              <ChevronLeft className="w-6 h-6 rotate-180 text-stone-600" />
            </button>
            <h3 className="text-sm font-black text-stone-800">سجل الإيداع والشحن</h3>
            <div className="w-8"></div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-stone-400 text-xs">جاري تحميل سجل إيداعاتك...</div>
            ) : deposits.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-stone-200 text-center text-stone-400 text-xs">
                لا توجد طلبات شحن أو إيداع مسجلة لهذا الحساب حتى الآن.
              </div>
            ) : (
              deposits.map((dep) => (
                <div key={dep.id} className="bg-white p-4 rounded-xl border border-stone-200/60 shadow-sm text-xs font-medium space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-stone-800">إيداع {dep.amount} USDT</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border ${
                      dep.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      dep.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      'bg-rose-50 text-rose-600 border-rose-200'
                    }`}>
                      {dep.status === 'pending' ? 'بانتظار الموافقة' : dep.status === 'approved' ? 'تم الشحن بنجاح' : 'مرفوض'}
                    </span>
                  </div>

                  <div className="text-[10px] text-stone-400 flex justify-between items-center">
                    <span>التاريخ: {new Date(dep.createdAt).toLocaleString('ar-EG')}</span>
                    <span className="font-mono text-[9px] truncate max-w-[120px]" dir="ltr">هاش: {dep.txHash}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Sub View: Withdrawal Log (سجل السحب) */}
      {activeSubView === 'with_log' && (
        <div className="animate-fadeIn p-4 space-y-5">
          {/* Back Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <button onClick={() => setActiveSubView('menu')} className="p-1 hover:bg-stone-100 rounded-lg">
              <ChevronLeft className="w-6 h-6 rotate-180 text-stone-600" />
            </button>
            <h3 className="text-sm font-black text-stone-800">سجل عمليات السحب</h3>
            <div className="w-8"></div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-stone-400 text-xs">جاري تحميل سجل سحوباتك...</div>
            ) : withdrawals.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-stone-200 text-center text-stone-400 text-xs">
                لا توجد طلبات سحب مسجلة لهذا الحساب حتى الآن.
              </div>
            ) : (
              withdrawals.map((withd) => (
                <div key={withd.id} className="bg-white p-4 rounded-xl border border-stone-200/60 shadow-sm text-xs font-medium space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-stone-800">سحب {withd.amount} USDT</span>
                      <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded" dir="ltr">
                        {withd.currency || 'USDT (BEP20)'}
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border ${
                      withd.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      withd.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      'bg-rose-50 text-rose-600 border-rose-200'
                    }`}>
                      {withd.status === 'pending' ? 'بانتظار المعالجة' : withd.status === 'approved' ? 'تم التحويل والموافقة' : 'تم الرفض وإرجاع الرصيد'}
                    </span>
                  </div>

                  <div className="text-[10px] text-stone-400 flex justify-between items-center">
                    <span>التاريخ: {new Date(withd.createdAt).toLocaleString('ar-EG')}</span>
                    {withd.walletAddress && withd.walletAddress !== "تم الإدخال يدوياً" ? (
                      <span className="font-mono text-[9px] truncate max-w-[120px]" dir="ltr">المحفظة: {withd.walletAddress}</span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">سحب إداري معتمد</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Sub View: Change Password (تغيير كلمة المرور) */}
      {activeSubView === 'change_pass' && (
        <div className="animate-fadeIn p-4 space-y-5">
          {/* Back Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <button onClick={() => setActiveSubView('menu')} className="p-1 hover:bg-stone-100 rounded-lg">
              <ChevronLeft className="w-6 h-6 rotate-180 text-stone-600" />
            </button>
            <h3 className="text-sm font-black text-stone-800">تغيير كلمة المرور</h3>
            <div className="w-8"></div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-stone-800">تحديث كلمة مرور الحساب</h4>
              <p className="text-[11px] text-stone-400">يرجى إدخال كلمة المرور الحالية وكلمة المرور الجديدة</p>
            </div>

            {passError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            {passSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">كلمة المرور الحالية</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    placeholder="أدخل كلمة المرور الحالية"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">كلمة المرور الجديدة</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-stone-400">
                    <KeyRound className="w-4 h-4 text-purple-500" />
                  </span>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    placeholder="6 أحرف/أرقام على الأقل"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">تأكيد كلمة المرور الجديدة</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-stone-400">
                    <Check className="w-4 h-4 text-purple-500" />
                  </span>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    placeholder="أعد إدخال كلمة المرور الجديدة"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-xs shadow-md shadow-purple-200 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري التحديث...</span>
                  </>
                ) : (
                  <span>حفظ كلمة المرور الجديدة</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Notifications Modal Popover */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 w-full max-w-sm shadow-2xl overflow-hidden animate-scaleIn">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <h3 className="font-extrabold text-xs">إشعارات الحساب</h3>
              </div>
              <button
                onClick={() => setShowNotifModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-80 overflow-y-auto font-semibold text-right text-xs">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-stone-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <span>لا توجد إشعارات جديدة حالياً.</span>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationAsRead(n.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      n.read ? 'bg-stone-50 border-stone-150 text-stone-600' : 'bg-blue-50/70 border-blue-200 text-blue-900 font-bold'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs leading-relaxed">{n.message}</p>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1"></span>
                      )}
                    </div>
                    <span className="block text-[9px] text-stone-400 mt-1" dir="ltr">
                      {new Date(n.createdAt).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 bg-stone-50 border-t border-stone-200 flex justify-between items-center">
                <button
                  onClick={() => markAllNotificationsAsRead(currentUser.phone || currentUser.id)}
                  className="text-[10px] font-extrabold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  تعيين الكل كـ مقروء
                </button>
                <button
                  onClick={() => setShowNotifModal(false)}
                  className="bg-stone-200 hover:bg-stone-300 text-stone-700 text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
