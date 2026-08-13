import React, { useState, useEffect, useRef } from 'react';
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
  markAllNotificationsAsRead,
  recordUserLogout,
  subscribeToUserChat,
  subscribeToSupportMessages,
  sendSupportMessage,
  markChatAsReadByUser
} from '../firebaseService';
import { User, Deposit, Withdrawal, SystemSettings, UserNotification, SupportMessage, SupportChat } from '../types';
import { compressBase64Image, calculateRemainingEffectiveDays } from '../utils';
import { 
  ChevronLeft, 
  Copy, 
  Check, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Users, 
  User as UserIcon,
  UserPlus,
  ShieldCheck,
  BadgeCheck,
  Wallet, 
  History, 
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
  Moon,
  Send,
  HelpCircle,
  Info
} from 'lucide-react';

interface ProfileCenterProps {
  currentUser: User;
  onUpdateUser: (updated: User) => void;
  onLogout: () => void;
  initialSubView?: 'menu' | 'recharge' | 'withdraw' | 'team' | 'bind' | 'dep_log' | 'with_log' | 'change_pass' | 'support' | 'jobs';
  onSubViewChange?: (view: 'menu' | 'recharge' | 'withdraw' | 'team' | 'bind' | 'dep_log' | 'with_log' | 'change_pass' | 'support' | 'jobs') => void;
  settings?: SystemSettings;
}

export default function ProfileCenter({ 
  currentUser, 
  onUpdateUser, 
  onLogout,
  initialSubView,
  onSubViewChange,
  settings: propSettings,
}: ProfileCenterProps) {
  const [activeSubView, _setActiveSubView] = useState<'menu' | 'recharge' | 'withdraw' | 'team' | 'bind' | 'dep_log' | 'with_log' | 'change_pass' | 'support'>(initialSubView || 'menu');

  useEffect(() => {
    if (initialSubView) {
      _setActiveSubView(initialSubView);
    }
  }, [initialSubView]);

  const setActiveSubView = (view: 'menu' | 'recharge' | 'withdraw' | 'team' | 'bind' | 'dep_log' | 'with_log' | 'change_pass' | 'support' | 'jobs') => {
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
  const [showBlockWithdrawalModal, setShowBlockWithdrawalModal] = useState<boolean>(false);

  // Form states
  const [selectedNetwork, setSelectedNetwork] = useState<'BEP20' | 'TRC20' | 'POLYGON'>('BEP20');
  const [selectedWithdrawNetwork, setSelectedWithdrawNetwork] = useState<'BEP20' | 'TRC20' | 'POLYGON'>('BEP20');
  const [rechargeAmount, setRechargeAmount] = useState<string>('');
  const [rechargeHash, setRechargeHash] = useState<string>('');
  const [rechargeScreenshot, setRechargeScreenshot] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawWallet, setWithdrawWallet] = useState<string>('');
  const [bindWalletInput, setBindWalletInput] = useState<string>(currentUser.walletAddress || '');

  // Support Chat states
  const [supportChat, setSupportChat] = useState<SupportChat | null>(null);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportMsgText, setSupportMsgText] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to support chat and messages
  useEffect(() => {
    if (!currentUser?.phone) return;

    const userPhone = currentUser.phone.trim();
    const unsubChat = subscribeToUserChat(userPhone, (chat) => {
      setSupportChat(chat);
    });

    const unsubMsgs = subscribeToSupportMessages(userPhone, (msgs) => {
      setSupportMessages(msgs);
    });

    return () => {
      unsubChat();
      unsubMsgs();
    };
  }, [currentUser?.phone]);

  // Mark chat as read when sub-view is 'support' or when support messages update
  useEffect(() => {
    if (activeSubView === 'support' && currentUser?.phone) {
      markChatAsReadByUser(currentUser.phone.trim()).catch(err => console.warn(err));
    }
  }, [activeSubView, supportMessages.length, currentUser?.phone]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (activeSubView === 'support') {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [supportMessages.length, activeSubView]);

  const handleSendSupportMessage = async (e?: React.FormEvent, overrideText?: string, overrideAnswer?: string) => {
    if (e) e.preventDefault();
    const textToSend = overrideText || supportMsgText.trim();
    if (!textToSend || !currentUser) return;

    if (!overrideText) {
      setSupportMsgText('');
    }

    const userPhone = currentUser.phone.trim();
    const userName = currentUser.username || currentUser.phone;

    try {
      await sendSupportMessage(userPhone, userName, textToSend, 'user', userName);

      if (overrideAnswer) {
        await new Promise(r => setTimeout(r, 600));
        await sendSupportMessage(userPhone, userName, overrideAnswer, 'admin', settings.supportAgentName || "مريم (الدعم الفني)");
        return;
      }

      // Trigger AI Support Agent Auto-Reply (Maryam - مريم)
      fetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPhone,
          username: userName,
          vipTier: currentUser.vipTier,
          earnings: currentUser.earnings,
          userMessage: textToSend,
          recentMessages: supportMessages
        })
      }).then(res => res.json()).then(async (data) => {
        const replyText = data.reply || `أهلاً بك يا ${userName}! أنا مريم مستشارة الدعم الفني لمنصة oxlo (تأسست في 2026/05/03). أوقات السحب والإيداع متوفرة يومياً، والمهام تنفتح بـ 12 ظهراً و8 مساءً.`;
        await sendSupportMessage(userPhone, userName, replyText, 'admin', settings.supportAgentName || "مريم (الدعم الفني)");
      }).catch(async err => {
        console.warn("AI Support Auto-Reply trigger failed:", err);
        const fallbackReply = `أهلاً بك يا ${userName}! أنا مريم مستشارة الدعم الفني لمنصة oxlo (تأسست في 2026/05/03). كيف يمكنني مساعدتك الآن؟`;
        await sendSupportMessage(userPhone, userName, fallbackReply, 'admin', settings.supportAgentName || "مريم (الدعم الفني)");
      });

    } catch (err) {
      console.warn("Error sending support message:", err);
    }
  };

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
        } else if (activeSubView === 'team' || activeSubView === 'jobs') {
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
    if (msg.includes("تعليق ميزة السحب") || msg.includes("سحب الأرباح") || msg.includes("VIP (B1)")) {
      setShowBlockWithdrawalModal(true);
      return;
    }
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

    if (currentUser.isWithdrawalBlocked) {
      showToast("🔒 نأسف لإعلامك بأنه قد تم تعليق ميزة السحب مؤقتاً لحسابك لدواعي الأمان والتحقق من جودة النشاط. لتفعيل السحب التلقائي مجدداً ومواصلة العمل وجني الأرباح بشكل طبيعي، يرجى دعوة (2) من المشتركين الجدد والنشطين على الأقل للترقية فئة VIP (B1) باستخدام رابط الإحالة الخاص بك. نشكر تفهمكم وحرصكم على استدامة المجتمع الرقمي للمنصة.");
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
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-start gap-2.5 animate-fadeIn border border-white/10 max-w-[90vw] w-max md:max-w-sm" dir="rtl">
          <Bell className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed text-right">{toastMsg}</span>
        </div>
      )}

      {/* Blocked Withdrawal Detailed Modal Notice */}
      {showBlockWithdrawalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
          <div className="bg-white rounded-3xl border border-red-100 shadow-2xl max-w-sm w-full overflow-hidden animate-scaleUp">
            
            {/* Header: Warm warning tone */}
            <div className="bg-gradient-to-br from-red-500 via-rose-600 to-red-700 p-6 text-white text-center relative">
              <button 
                onClick={() => setShowBlockWithdrawalModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer text-white"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner border border-white/15">
                <Lock className="w-7 h-7 text-amber-300 animate-pulse" />
              </div>
              
              <h3 className="text-sm font-extrabold tracking-wide">تعليق ميزة السحب مؤقتاً</h3>
              <p className="text-[9px] text-red-100 font-bold mt-1">إشعار أمني وهام بخصوص حسابك الشخصي</p>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-4">
              
              <p className="text-[11px] text-slate-600 leading-relaxed text-right font-medium">
                نأسف لإعلامك بأنه قد تم تعليق ميزة السحب مؤقتاً لحسابك لدواعي الأمان والتحقق من جودة النشاط وضمان استدامة المجتمع الرقمي للمنصة.
              </p>

              {/* Requirement highlights */}
              <div className="bg-amber-50/75 border border-amber-100 rounded-2xl p-3.5 space-y-2">
                <span className="text-[10px] font-black text-amber-800 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  الشرط المطلوب لإعادة التفعيل:
                </span>
                <p className="text-[10px] text-slate-700 leading-relaxed font-bold text-right">
                  يرجى دعوة <span className="text-red-600 font-black text-[11px] underline">(2) من المشتركين الجدد والنشطين</span> على الأقل للترقية إلى فئة <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded-md font-extrabold text-[9px]">VIP (B1)</span> باستخدام رابط أو كود الإحالة الخاص بك.
                </p>
              </div>

              {/* Benefits details */}
              <p className="text-[9px] text-slate-500 leading-relaxed text-right">
                💡 فور قيام المشتركين الجدد بالتسجيل والترقية، سيتم إعادة تشغيل نظام السحب التلقائي لحسابك مباشرةً لمواصلة جني الأرباح وسحبها بشكل طبيعي وآمن.
              </p>

              {/* Invitation Info Box */}
              <div className="border border-slate-100 bg-slate-50/55 rounded-2xl p-3 space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-500">كود الدعوة الخاص بك:</span>
                  <span className="font-black text-indigo-600 tracking-wider font-mono">{currentUser.inviteCode}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleCopy(currentUser.inviteCode);
                  }}
                  className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-indigo-150 active:scale-[0.98]"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ كود الدعوة الحصري</span>
                </button>
              </div>

              {/* Action Close Buttons */}
              <button
                type="button"
                onClick={() => setShowBlockWithdrawalModal(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 rounded-xl transition-all cursor-pointer text-center text-[11px] shadow-md active:scale-[0.98]"
              >
                حسناً، فهمت وموافق
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Main personal center menu screen */}
      {activeSubView === 'menu' && (
        <div className="animate-fadeIn pb-28">
          
          {/* Top Banner with refined gradient and typography */}
          <div className="bg-slate-900 pt-10 pb-16 px-6 text-white flex items-center justify-between relative rounded-b-[3rem] shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent opacity-50"></div>
            
            <div className="relative z-10 flex items-center gap-4">
              {/* Profile image with circular layout */}
              <div className="w-16 h-16 rounded-2xl border-2 border-white/10 bg-slate-800 overflow-hidden shadow-xl rotate-3">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-black tracking-tight" dir="ltr">{getMaskedPhone()}</h2>
                  <div className={`px-2 py-0.5 rounded-full text-[8px] font-black border ${
                    calculateRemainingEffectiveDays(currentUser) > 0 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {calculateRemainingEffectiveDays(currentUser) > 0 ? 'نشط' : 'غير نشط'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400">@{currentUser.username}</span>
                  <div className="h-1 w-1 bg-slate-700 rounded-full"></div>
                  <span className="text-[10px] font-black text-amber-400">
                    {currentUser.vipTier || 'العضوية العادية'}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-3">
              <button
                onClick={() => setShowNotifModal(true)}
                className="relative w-11 h-11 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all cursor-pointer active:scale-95 flex items-center justify-center group"
              >
                <Bell className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-black text-[9px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 border-2 border-slate-900 shadow-lg">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Overlapping Primary Stats Card */}
          <div className="px-5 -mt-10 relative z-20">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-7 shadow-xl space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100/50 group hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                      <Wallet className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-black text-slate-500">الرصيد الكلي</span>
                  </div>
                  <span className="text-lg font-black text-slate-900">
                    {Number(currentUser.earnings || 0).toFixed(2)} <span className="text-xs text-slate-400 font-bold ml-1">USDT</span>
                  </span>
                </div>

                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100/50 group hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                      <History className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-black text-slate-500">أرباح المهام</span>
                  </div>
                  <span className="text-lg font-black text-slate-900">
                    {Number(currentUser.taskIncome || 0).toFixed(2)} <span className="text-xs text-slate-400 font-bold ml-1">USDT</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between px-2 pt-2 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold text-slate-400">حالة الحساب</span>
                </div>
                <span className="text-[10px] font-black text-slate-900 bg-slate-50 px-4 py-1.5 rounded-full">
                  {calculateRemainingEffectiveDays(currentUser)} أيام من النشاط
                </span>
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
              nextPlan = plansList[0];
            }

            let targetPrice = nextPlan ? nextPlan.price : (plansList[plansList.length - 1]?.price || 150);
            let nextTierName = nextPlan ? `${nextPlan.name}` : "أعلى مستوى";
            let percentage = nextPlan ? Math.min(100, Math.max(0, Math.round((currentEarn / targetPrice) * 100))) : 100;

            return (
              <div className="px-5 mt-6">
                <div className="bg-slate-900 rounded-[2rem] p-6 text-white border border-white/5 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  <div className="relative z-10 space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                          <Award className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-amber-500 block mb-0.5">ترقية العضوية</span>
                          <span className="text-[8px] text-slate-400 font-bold">المستوى القادم: {nextTierName}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-white">{percentage}%</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                        <span>{Number(currentEarn).toFixed(0)} USDT</span>
                        <span>الهدف: {targetPrice} USDT</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}


          {/* Menu Items Grid */}
          <div className="px-5 mt-4 relative z-20">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden divide-y divide-slate-50">
              
              {[
                { id: 'recharge', label: 'شحن الحساب', sub: 'BEP20 / TRC20 / Polygon', icon: ArrowDownCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
                { id: 'withdraw', label: 'سحب الأرباح', sub: 'فقط USDT Polygon', icon: ArrowUpCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { id: 'bind', label: 'ربط المحفظة', sub: 'USDT Polygon للسحب', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { id: 'jobs', label: 'توظيف الموظفين', sub: 'برنامج الدعوات والعمولات', icon: UserPlus, color: 'text-purple-600', bg: 'bg-purple-50' },
                { id: 'dep_log', label: 'سجل الإيداع', sub: 'تتبع طلبات شحنك', icon: History, color: 'text-slate-600', bg: 'bg-slate-50' },
                { id: 'with_log', label: 'سجل السحب', sub: 'تتبع طلبات سحبك', icon: History, color: 'text-slate-600', bg: 'bg-slate-50' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSubView(item.id as any)}
                  className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-all group active:bg-slate-100"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 ${item.bg} rounded-xl flex items-center justify-center ${item.color} shrink-0 shadow-sm border border-white/50`}>
                      <item.icon className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 block">{item.label}</span>
                      <span className="text-[9px] font-bold text-slate-400 block mt-0.5 uppercase tracking-wider">{item.sub}</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:translate-x-[-4px] transition-transform" />
                </button>
              ))}



              {/* Support */}
              <button
                onClick={() => setActiveSubView('support')}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-all group active:bg-slate-100"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0 shadow-sm border border-white/50 relative">
                    <MessageSquare className="w-5 h-5 stroke-[2.5]" />
                    {supportChat?.unreadByUser && (
                      <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 block">الدعم الفني</span>
                    <span className="text-[9px] font-bold text-slate-400 block mt-0.5 uppercase tracking-wider">محادثة مباشرة 24/7</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {supportChat?.unreadByUser && (
                    <span className="bg-rose-500 text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter animate-bounce">New</span>
                  )}
                  <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:translate-x-[-4px] transition-transform" />
                </div>
              </button>

              {/* Password */}
              <button
                onClick={() => setActiveSubView('change_pass')}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-all group active:bg-slate-100"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0 shadow-sm border border-white/50">
                    <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 block">تأمين الحساب</span>
                    <span className="text-[9px] font-bold text-slate-400 block mt-0.5 uppercase tracking-wider">تغيير كلمة المرور</span>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:translate-x-[-4px] transition-transform" />
              </button>

              {/* Logout */}
              <button
                onClick={async () => {
                  if (currentUser) {
                    await recordUserLogout(currentUser.phone || currentUser.id).catch(e => console.warn(e));
                  }
                  onLogout();
                }}
                className="w-full p-6 flex items-center justify-between hover:bg-rose-50/50 transition-all group active:bg-rose-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 shrink-0 shadow-sm border border-white/50">
                    <LogOut className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-rose-600 block">تسجيل الخروج</span>
                    <span className="text-[9px] font-bold text-rose-300 block mt-0.5 uppercase tracking-wider">الخروج الآمن</span>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-rose-300 group-hover:translate-x-[-4px] transition-transform" />
              </button>

            </div>
          </div>

        </div>
      )}

      {/* Sub View: Recharge (شحن الحساب) */}
      {activeSubView === 'recharge' && (
        <div className="animate-fadeIn pb-10">
          {/* Header */}
          <div className="bg-slate-900 pt-10 pb-12 px-6 text-white rounded-b-[3rem] shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-600/10 opacity-50"></div>
            <div className="relative z-10 flex items-center justify-between">
              <button onClick={() => setActiveSubView('menu')} className="w-11 h-11 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-center transition-all">
                <ChevronLeft className="w-6 h-6 rotate-180 text-white" />
              </button>
              <h3 className="text-sm font-black tracking-tight">شحن الرصيد (USDT)</h3>
              <div className="w-11"></div>
            </div>
          </div>

          <div className="px-5 -mt-6 relative z-20 space-y-6">
            {/* Network Selector */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-5">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-[11px] font-black text-slate-900">1. اختر شبكة الإيداع</h4>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[9px] font-black text-emerald-600">إيداع فوري</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {['BEP20', 'TRC20', 'POLYGON'].map((net) => (
                  <button
                    key={net}
                    type="button"
                    onClick={() => setSelectedNetwork(net as any)}
                    className={`h-24 rounded-3xl border transition-all flex flex-col items-center justify-center gap-2 group ${
                      selectedNetwork === net
                        ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-[1.02]'
                        : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      selectedNetwork === net ? 'bg-white/10 text-blue-400' : 'bg-white text-slate-400 shadow-sm'
                    }`}>
                      <QrCode className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase">{net}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Address Card */}
            {(() => {
              const currentAddress = selectedNetwork === 'BEP20'
                ? (settings.rechargeAddressBEP20 || "0x...")
                : selectedNetwork === 'TRC20'
                ? (settings.rechargeAddressTRC20 || "T...")
                : (settings.rechargeAddress || "0x...");

              return (
                <div className="bg-slate-900 p-7 rounded-[2.5rem] text-white border border-white/5 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20 uppercase">
                        {selectedNetwork} Network
                      </span>
                      <button 
                        onClick={() => handleCopy(currentAddress)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                      >
                        <Copy className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-slate-500 block">عنوان المحفظة الرسمي</span>
                      <div className="bg-black/20 p-4 rounded-2xl border border-white/5 font-mono text-[11px] font-black break-all text-left text-white/90 leading-relaxed tracking-wider shadow-inner">
                        {currentAddress}
                      </div>
                    </div>

                    <div className="flex gap-2 p-3 bg-white/5 rounded-2xl border border-white/5 items-start">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      <p className="text-[9px] font-bold text-slate-400 leading-relaxed">
                        تنبيه: تأكد من تحويل العملات عبر شبكة <span className="text-white font-black">{selectedNetwork}</span> حصراً لتجنب فقدان الرصيد.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Form */}
            <form onSubmit={handleRechargeSubmit} className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
              <h4 className="text-[11px] font-black text-slate-900 px-1">2. تأكيد الإيداع</h4>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 px-1">المبلغ المشحون (USDT)</label>
                  <input
                    type="number"
                    required
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 px-1">إرفاق صورة الإيصال</label>
                  <label className="flex flex-col items-center justify-center h-32 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2rem] cursor-pointer hover:bg-slate-100 transition-all group overflow-hidden relative">
                    {rechargeScreenshot ? (
                      <div className="absolute inset-0 group">
                        <img src={rechargeScreenshot} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                          <RefreshCw className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <ArrowDownCircle className="w-8 h-8 text-slate-200 group-hover:text-blue-600 transition-colors mb-2" />
                        <span className="text-[10px] font-black text-slate-400">اضغط لرفع لقطة الشاشة</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[11px] shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
                <span>إرسال طلب التأكيد</span>
              </button>
            </form>

            {/* Custom Recharge Notices / Alerts from Admin */}
            {(settings.rechargeNotice || settings.rechargeNotice2) && (
              <div className="space-y-3">
                {settings.rechargeNotice && (
                  <div className="bg-amber-50/90 p-5 rounded-[2rem] border border-amber-200/80 flex gap-3 items-start shadow-sm">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-amber-900 leading-relaxed whitespace-pre-line">
                      {settings.rechargeNotice}
                    </p>
                  </div>
                )}
                {settings.rechargeNotice2 && (
                  <div className="bg-teal-50/90 p-5 rounded-[2rem] border border-teal-200/80 flex gap-3 items-start shadow-sm">
                    <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-teal-900 leading-relaxed whitespace-pre-line">
                      {settings.rechargeNotice2}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}


      {/* Sub View: Withdraw (سحب الأرباح) */}
      {activeSubView === 'withdraw' && (
        <div className="animate-fadeIn pb-10">
          {/* Header */}
          <div className="bg-slate-900 pt-10 pb-12 px-6 text-white rounded-b-[3rem] shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-600/10 opacity-50"></div>
            <div className="relative z-10 flex items-center justify-between">
              <button onClick={() => setActiveSubView('menu')} className="w-11 h-11 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-center transition-all">
                <ChevronLeft className="w-6 h-6 rotate-180 text-white" />
              </button>
              <h3 className="text-sm font-black tracking-tight">سحب الأرباح (USDT)</h3>
              <div className="w-11"></div>
            </div>
          </div>

          <div className="px-5 -mt-6 relative z-20 space-y-6">
            {/* Balance Card */}
            <div className="bg-slate-900 p-7 rounded-[2.5rem] text-white border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="relative z-10 space-y-2">
                <span className="text-[10px] font-black text-slate-400">الرصيد المتاح للسحب</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black">{Number(currentUser.earnings || 0).toFixed(2)}</span>
                  <span className="text-xs font-bold text-blue-400">USDT</span>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[9px] font-bold text-slate-500">المحفظة المرتبطة</span>
                  </div>
                  <span className="text-[9px] font-black text-slate-300 truncate max-w-[150px]" dir="ltr">
                    {currentUser.walletAddress || "لا يوجد عنوان مرتبط"}
                  </span>
                </div>
              </div>
            </div>

            {/* Withdraw Form */}
            <form onSubmit={handleWithdrawSubmit} className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
              <h4 className="text-[11px] font-black text-slate-900 px-1">1. تفاصيل السحب</h4>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 px-1">اختر شبكة السحب</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['BEP20', 'TRC20', 'POLYGON'].map((net) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setSelectedWithdrawNetwork(net as any)}
                        className={`py-3 rounded-xl border text-[10px] font-black transition-all ${
                          selectedWithdrawNetwork === net
                            ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                            : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {net}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 px-1">المبلغ المراد سحبه</label>
                  <input
                    type="number"
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all"
                  />
                  {parseFloat(withdrawAmount) > 0 && (
                    <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-3 text-[10px] space-y-1 mt-1 text-amber-900">
                      <div className="flex justify-between font-bold">
                        <span>رسوم السحب (15%):</span>
                        <span className="text-amber-700 font-black">-{(parseFloat(withdrawAmount) * 0.15).toFixed(2)} USDT</span>
                      </div>
                      <div className="flex justify-between font-black border-t border-amber-200/50 pt-1 text-emerald-700">
                        <span>الرصيد الصافي المضمون وصوله المحفظة:</span>
                        <span>{(parseFloat(withdrawAmount) * 0.85).toFixed(2)} USDT</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 px-1">عنوان محفظة {selectedWithdrawNetwork}</label>
                  <input
                    type="text"
                    value={withdrawWallet}
                    onChange={(e) => setWithdrawWallet(e.target.value)}
                    placeholder={currentUser.walletAddress || "أدخل العنوان هنا"}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 text-[11px] font-black text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[11px] shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowUpCircle className="w-4 h-4" />}
                <span>إنشاء طلب سحب</span>
              </button>
            </form>

            {/* Custom Withdrawal Notices / Alerts from Admin */}
            <div className="space-y-3">
              {settings.withdrawNotice && (
                <div className="bg-amber-50/90 p-5 rounded-[2rem] border border-amber-200/80 flex gap-3 items-start shadow-sm">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-amber-900 leading-relaxed whitespace-pre-line">
                    {settings.withdrawNotice}
                  </p>
                </div>
              )}
              {settings.withdrawNotice2 && (
                <div className="bg-teal-50/90 p-5 rounded-[2rem] border border-teal-200/80 flex gap-3 items-start shadow-sm">
                  <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-teal-900 leading-relaxed whitespace-pre-line">
                    {settings.withdrawNotice2}
                  </p>
                </div>
              )}
              {settings.withdrawRatesInfo && (
                <div className="bg-blue-50/90 p-4 rounded-[2rem] border border-blue-200/80 flex gap-3 items-start shadow-sm">
                  <BadgeCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-blue-900 leading-relaxed whitespace-pre-line">
                    {settings.withdrawRatesInfo}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Sub View: Team / Jobs (توظيف الموظفين) */}
      {(activeSubView === 'team' || activeSubView === 'jobs') && (
        <div className="animate-fadeIn pb-10">
          {/* Header */}
          <div className="bg-slate-900 pt-10 pb-12 px-6 text-white rounded-b-[3rem] shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-600/10 opacity-50"></div>
            <div className="relative z-10 flex items-center justify-between">
              <button onClick={() => setActiveSubView('menu')} className="w-11 h-11 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-center transition-all">
                <ChevronLeft className="w-6 h-6 rotate-180 text-white" />
              </button>
              <h3 className="text-sm font-black tracking-tight">توظيف الموظفين</h3>
              <div className="w-11"></div>
            </div>
          </div>

          <div className="px-5 -mt-6 relative z-20 space-y-6">
            {/* Invite Card */}
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white border border-white/5 shadow-2xl relative overflow-hidden text-center space-y-5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              
              <div className="space-y-3 relative z-10">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">كود الدعوة الخاص بك</span>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl font-black font-mono tracking-tighter text-blue-400">{currentUser.inviteCode}</span>
                  <button onClick={() => handleCopy(currentUser.inviteCode)} className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                    <Copy className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                <button 
                  onClick={() => {
                    const shareLink = `${window.location.origin}/?ref=${currentUser.inviteCode}`;
                    handleCopy(shareLink);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-xl text-xs font-black transition-all active:scale-[0.98] shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-2"
                >
                  <span>نسخ رابط الدعوة المباشر</span>
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase">نسبة العمولة</span>
                <span className="text-sm font-black text-slate-900">10%</span>
              </div>
              <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase">أرباح الفريق</span>
                <span className="text-sm font-black text-blue-600">
                  {teamList.reduce((sum, m) => sum + ((m.taskIncome || 0) * 0.10), 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* List */}
            <div className="bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-2">
              <div className="flex items-center justify-between p-6 pb-2">
                <h4 className="text-[11px] font-black text-slate-900 uppercase">الأعضاء ({teamList.length})</h4>
                <RefreshCw className={`w-4 h-4 text-slate-300 ${loading ? 'animate-spin' : ''}`} />
              </div>

              <div className="space-y-1">
                {teamList.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <Users className="w-8 h-8 text-slate-100 mx-auto" />
                    <p className="text-[10px] font-black text-slate-300">لا يوجد أعضاء في فريقك حالياً</p>
                  </div>
                ) : (
                  teamList.map((member) => (
                    <div key={member.id} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between mx-2 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-black text-slate-900 block">{member.username}</span>
                          <span className="text-[9px] font-bold text-slate-400 block" dir="ltr">{member.phone.substring(0, 7)}****</span>
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] font-black text-blue-600 block">{Number(member.earnings || 0).toFixed(2)} USDT</span>
                        <span className="text-[9px] font-bold text-slate-400 block">{member.vipTier || 'باقة عادية'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub View: Bind Wallet (ربط المحفظة) */}
      {activeSubView === 'bind' && (
        <div className="animate-fadeIn pb-10">
          {/* Header */}
          <div className="bg-slate-900 pt-10 pb-12 px-6 text-white rounded-b-[3rem] shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-600/10 opacity-50"></div>
            <div className="relative z-10 flex items-center justify-between">
              <button onClick={() => setActiveSubView('menu')} className="w-11 h-11 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-center transition-all">
                <ChevronLeft className="w-6 h-6 rotate-180 text-white" />
              </button>
              <h3 className="text-sm font-black tracking-tight">ربط المحفظة</h3>
              <div className="w-11"></div>
            </div>
          </div>

          <div className="px-5 -mt-6 relative z-20 space-y-6">
            <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
              <div className="space-y-2 px-1">
                <h4 className="text-[11px] font-black text-slate-900">إعدادات محفظة Polygon</h4>
                <p className="text-[9px] font-bold text-slate-400 leading-relaxed">
                  اربط عنوان محفظة بوليجون (MATIC/USDT) لاستلام أرباحك تلقائياً وبشكل آمن وفوري.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 px-1">عنوان المحفظة (0x...)</label>
                <input
                  type="text"
                  value={bindWalletInput}
                  onChange={(e) => setBindWalletInput(e.target.value)}
                  placeholder="0x..."
                  className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 text-[11px] font-black text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all text-left"
                  dir="ltr"
                />
              </div>

              <button
                onClick={handleBindWallet}
                disabled={loading}
                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[11px] shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
                <span>حفظ العنوان</span>
              </button>
            </div>

            {currentUser.walletAddress && (
              <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black text-emerald-800">العنوان المرتبط حالياً:</span>
                </div>
                <div className="bg-white/80 p-4 rounded-2xl border border-emerald-100 font-mono text-[10px] font-black text-emerald-900 break-all leading-relaxed shadow-sm" dir="ltr">
                  {currentUser.walletAddress}
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Sub View: Deposit Log (سجل الإيداع) */}
      {activeSubView === 'dep_log' && (
        <div className="animate-fadeIn pb-10">
          {/* Header */}
          <div className="bg-slate-900 pt-10 pb-12 px-6 text-white rounded-b-[3rem] shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-600/10 opacity-50"></div>
            <div className="relative z-10 flex items-center justify-between">
              <button onClick={() => setActiveSubView('menu')} className="w-11 h-11 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center transition-all">
                <ChevronLeft className="w-6 h-6 rotate-180 text-white" />
              </button>
              <h3 className="text-sm font-black tracking-tight">سجل الإيداع</h3>
              <div className="w-11"></div>
            </div>
          </div>

          <div className="px-5 -mt-6 relative z-20 space-y-4">
            {loading ? (
              <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-xl text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">جاري التحميل...</p>
              </div>
            ) : deposits.length === 0 ? (
              <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-xl text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto border border-slate-100">
                  <ArrowUpCircle className="w-8 h-8" />
                </div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">لا توجد إيداعات</p>
              </div>
            ) : (
              deposits.map((dep) => (
                <div key={dep.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase block">المبلغ</span>
                      <span className="text-sm font-black text-slate-900">{dep.amount} USDT</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black border ${
                      dep.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      dep.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      'bg-rose-50 text-rose-600 border-rose-200'
                    }`}>
                      {dep.status === 'pending' ? 'بانتظار الموافقة' : dep.status === 'approved' ? 'تم النجاح' : 'مرفوض'}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-[8px] font-black text-slate-400" dir="ltr">
                    <span>{new Date(dep.createdAt).toLocaleString('ar-EG')}</span>
                    <span className="truncate max-w-[150px]">TX: {dep.txHash}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Sub View: Withdrawal Log (سجل السحب) */}
      {activeSubView === 'with_log' && (
        <div className="animate-fadeIn pb-10">
          {/* Header */}
          <div className="bg-slate-900 pt-10 pb-12 px-6 text-white rounded-b-[3rem] shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-600/10 opacity-50"></div>
            <div className="relative z-10 flex items-center justify-between">
              <button onClick={() => setActiveSubView('menu')} className="w-11 h-11 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-center transition-all">
                <ChevronLeft className="w-6 h-6 rotate-180 text-white" />
              </button>
              <h3 className="text-sm font-black tracking-tight">سجل السحوبات</h3>
              <div className="w-11"></div>
            </div>
          </div>

          <div className="px-5 -mt-6 relative z-20 space-y-4">
            {loading ? (
              <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-xl text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">جاري التحميل...</p>
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-xl text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto border border-slate-100">
                  <ArrowDownCircle className="w-8 h-8" />
                </div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">لا توجد سحوبات</p>
              </div>
            ) : (
              withdrawals.map((withd) => (
                <div key={withd.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase block">المبلغ المسحوب</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{withd.amount} USDT</span>
                        <span className="text-[8px] font-black bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-lg" dir="ltr">
                          {withd.currency || 'BEP20'}
                        </span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black border ${
                      withd.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      withd.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      'bg-rose-50 text-rose-600 border-rose-200'
                    }`}>
                      {withd.status === 'pending' ? 'قيد المعالجة' : withd.status === 'approved' ? 'تم التحويل' : 'مرفوض'}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-[8px] font-black text-slate-400" dir="ltr">
                    <span>{new Date(withd.createdAt).toLocaleString('ar-EG')}</span>
                    <span className="truncate max-w-[150px]">Wallet: {withd.walletAddress?.substring(0, 10)}...</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Sub View: Change Password (تغيير كلمة المرور) */}
      {activeSubView === 'change_pass' && (
        <div className="animate-fadeIn pb-10">
          {/* Header */}
          <div className="bg-slate-900 pt-10 pb-12 px-6 text-white rounded-b-[3rem] shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-600/10 opacity-50"></div>
            <div className="relative z-10 flex items-center justify-between">
              <button onClick={() => setActiveSubView('menu')} className="w-11 h-11 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-center transition-all">
                <ChevronLeft className="w-6 h-6 rotate-180 text-white" />
              </button>
              <h3 className="text-sm font-black tracking-tight">كلمة المرور</h3>
              <div className="w-11"></div>
            </div>
          </div>

          <div className="px-5 -mt-6 relative z-20 space-y-6">
            <form onSubmit={handleChangePassword} className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
              <div className="space-y-2 px-1">
                <h4 className="text-[11px] font-black text-slate-900">تغيير كلمة المرور</h4>
                <p className="text-[9px] font-bold text-slate-400 leading-relaxed">
                  تأكد من اختيار كلمة مرور قوية لحماية حسابك وأرباحك.
                </p>
              </div>

              {passError && (
                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 text-rose-600 text-[10px] font-black flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-emerald-600 text-[10px] font-black flex gap-2">
                  <BadgeCheck className="w-4 h-4 shrink-0" />
                  <span>{passSuccess}</span>
                </div>
              )}

              <div className="space-y-4">
                {[
                  { label: 'كلمة المرور الحالية', value: oldPassword, setter: setOldPassword, icon: Lock },
                  { label: 'كلمة المرور الجديدة', value: newPassword, setter: setNewPassword, icon: KeyRound },
                  { label: 'تأكيد كلمة المرور', value: confirmPassword, setter: setConfirmPassword, icon: BadgeCheck }
                ].map((field, idx) => (
                  <div key={idx} className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 px-1">{field.label}</label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={field.value}
                        onChange={(e) => field.setter(e.target.value)}
                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-12 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all text-right"
                      />
                      <field.icon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[11px] shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>تحديث كلمة المرور</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sub View: Support Chat (الدعم الفني المباشر) */}
      {activeSubView === 'support' && (
        <div className="animate-fadeIn h-[calc(100vh-160px)] flex flex-col bg-white overflow-hidden rounded-[2.5rem] border border-slate-100 shadow-2xl mx-4 mb-10">
          {/* Header */}
          <div className="bg-slate-900 p-6 text-white shrink-0 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-600/10"></div>
            <button onClick={() => setActiveSubView('menu')} className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center relative z-10">
              <ChevronLeft className="w-5 h-5 rotate-180" />
            </button>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-11 h-11 bg-blue-600 rounded-full flex items-center justify-center font-black text-sm border-2 border-white/20">
                {settings.supportAgentName ? settings.supportAgentName.charAt(0) : "OX"}
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[11px] font-black tracking-tight">{settings.supportAgentName || "فريق الدعم الفني"}</h4>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[9px] font-bold text-slate-400">متصل الآن</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            {supportMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-10">
                <div className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center text-blue-600 border border-slate-50">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-900">أهلاً بك في الدعم المباشر</h4>
                  <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                    فريقنا متواجد لمساعدتك في أي وقت. اطرح سؤالك وسنرد عليك فوراً.
                  </p>
                </div>
              </div>
            ) : (
              supportMessages.map((msg) => {
                const isMe = msg.sender === 'user';
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] space-y-1.5 ${isMe ? 'text-right' : 'text-left'}`}>
                      <div className={`p-4 rounded-3xl text-[11px] font-bold leading-relaxed shadow-sm ${
                        isMe 
                          ? 'bg-slate-900 text-white rounded-tr-none' 
                          : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[8px] font-black text-slate-300 block px-1">
                        {new Date(msg.timestamp || msg.createdAt || new Date()).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick FAQ / Questions Pills */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 shrink-0 space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                ⚡ الأسئلة الشائعة والرد الفوري:
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
              {(settings.supportFaqs && settings.supportFaqs.length > 0 ? settings.supportFaqs : [
                { question: "القادة", answer: `أهلاً بك يا ${currentUser.username || 'عزيزنا العميل'}! يرجى دعوة (2) من المشتركين الجدد والنشطين على الأقل للترقية إلى فئة VIP (B1) باستخدام رابط أو كود الإحالة الخاص بك.` },
                { question: "المنصب", answer: "يمكنك الاطلاع على كافة باقات الاشتراكات والترقية فوراً من تبويب 'المنصب' في شريط الملاحة السفلي." },
                { question: "متى تأسست المنصة؟", answer: "تأسست منصة oxlo في تاريخ 2026/05/03 لتكون المنصة الرائدة في المهام الرقمية وأرباح USDT." },
                { question: "ما هي باقات VIP والأرباح؟", answer: "الباقات المتاحة:\n• A1: اشتراك $50 / ربح $2\n• A2: اشتراك $100 / ربح $4\n• B1: اشتراك $300 / ربح $9\n• B2: اشتراك $600 / ربح $22\n• C1: اشتراك $1200 / ربح $45" },
                { question: "كيفية شحن الحساب؟", answer: "يمكنك شحن رصيدك بالذهاب إلى 'المركز الشخصي' ثم 'شحن الحساب' والتحويل لعنوان المحفظة المعتمد مع رفقة الهاش واللقطة." },
                { question: "أوقات العمل والعطلات؟", answer: "أوقات تنفيذ واعتماد المهام: الفترة الأولى (02:00 ظهراً - 05:00 عصراً)، الفترة الثانية (09:00 مساءً - 12:00 منتصف الليل). الجمعة والسبت عطلة رسمية." }
              ]).map((faq, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendSupportMessage(undefined, faq.question, faq.answer)}
                  className="px-3.5 py-1.5 bg-white hover:bg-blue-600 hover:text-white text-slate-700 rounded-xl border border-slate-200 text-[10px] font-black whitespace-nowrap shadow-sm transition-all active:scale-95 shrink-0 cursor-pointer"
                >
                  {faq.question}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <form onSubmit={handleSendSupportMessage} className="p-4 bg-white border-t border-slate-100 shrink-0">
            <div className="relative flex items-center gap-2">
              <input
                type="text"
                value={supportMsgText}
                onChange={(e) => setSupportMsgText(e.target.value)}
                placeholder="اكتب رسالتك..."
                className="flex-1 h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-[11px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all text-right"
              />
              <button
                type="submit"
                disabled={!supportMsgText.trim()}
                className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-50 transition-all shrink-0"
              >
                <Send className="w-5 h-5 rotate-180" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notifications Modal Popover */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 w-full max-w-sm shadow-2xl overflow-hidden animate-scaleIn">
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-black text-sm">الإشعارات</h3>
              </div>
              <button
                onClick={() => setShowNotifModal(false)}
                className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto border border-slate-100">
                    <Bell className="w-8 h-8" />
                  </div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">لا توجد إشعارات</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationAsRead(n.id)}
                    className={`p-5 rounded-[2rem] border transition-all cursor-pointer ${
                      n.read ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-blue-50 border-blue-100 text-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className={`text-[10px] leading-relaxed ${n.read ? 'font-bold' : 'font-black'}`}>{n.message}</p>
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1 shadow-sm shadow-blue-400"></div>
                      )}
                    </div>
                    <span className="block text-[8px] font-black text-slate-300 mt-2" dir="ltr">
                      {new Date(n.createdAt).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => markAllNotificationsAsRead(currentUser)}
                className="flex-1 h-12 bg-white hover:bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl text-[10px] font-black transition-all shadow-sm"
              >
                قراءة الكل
              </button>
              <button
                onClick={() => setShowNotifModal(false)}
                className="flex-1 h-12 bg-slate-900 text-white rounded-2xl text-[10px] font-black transition-all shadow-sm"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
