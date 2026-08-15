import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  ArrowLeft, 
  TrendingUp, 
  Crown, 
  ChevronLeft,
  X,
  Play,
  Layers,
  Gift,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { User, SystemSettings } from '../types';

interface WelcomeTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  settings: SystemSettings;
  onNavigateToUpgrade: () => void;
  onNavigateToJobs: () => void;
  onNavigateToSupport: () => void;
}

export const WelcomeTourModal: React.FC<WelcomeTourModalProps> = ({
  isOpen,
  onClose,
  user,
  settings,
  onNavigateToUpgrade,
  onNavigateToJobs,
  onNavigateToSupport,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Reset to first step on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const steps = [
    {
      id: 'welcome',
      badge: 'مرحباً بك في OXLO',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      icon: BookOpen,
      iconBg: 'from-blue-600 via-indigo-600 to-cyan-500 shadow-blue-500/25',
      title: `أهلاً بك يا ${user.username || 'عضو OXLO'}! 🎉`,
      subtitle: 'تم تجهيز حسابك الرقمي بنجاح. إليك دليل البدء السريع للانطلاق وجني الأرباح:',
      content: (
        <div className="space-y-2.5">
          <div className="bg-gradient-to-br from-blue-950/60 via-slate-900 to-indigo-950/40 rounded-2xl p-4 border border-blue-800/40 text-right space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400">كود الدعوة الخاص بك:</span>
              <span className="bg-blue-600/20 border border-blue-500/40 text-blue-300 font-mono font-black text-xs px-2.5 py-0.5 rounded-lg">
                {user.inviteCode || 'OXLO'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-bold leading-relaxed">
              منصة OXLO تتيح لك تنفيذ المهام اليومية المصغرة واستلام العوائد مباشرة بعملة USDT الرقمية.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
              <Zap className="w-4 h-4 text-amber-400 mx-auto" />
              <div className="text-[10px] font-black text-white">مهام فورية</div>
              <div className="text-[9px] text-slate-400 font-bold">بثوانٍ معدودة</div>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
              <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto" />
              <div className="text-[10px] font-black text-white">أرباح يومية</div>
              <div className="text-[9px] text-slate-400 font-bold">عوائد مضمونة</div>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
              <ShieldCheck className="w-4 h-4 text-cyan-400 mx-auto" />
              <div className="text-[10px] font-black text-white">سحب سريع</div>
              <div className="text-[9px] text-slate-400 font-bold">شبكة Polygon</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'how-it-works',
      badge: 'الخطوات الـ 3 الأساسية',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      icon: Layers,
      iconBg: 'from-amber-500 via-orange-500 to-yellow-500 shadow-amber-500/25',
      title: 'كيف تبدأ الربح بـ 3 خطوات؟',
      subtitle: 'آلية العمل بسيطة وواضحة لجميع الأعضاء:',
      content: (
        <div className="space-y-2.5 text-right">
          {/* Step 1 */}
          <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              1
            </div>
            <div className="space-y-0.5">
              <div className="text-[11px] font-black text-white flex items-center gap-1.5">
                <span>تفعيل باقة VIP المناسبة</span>
                <span className="text-[9px] bg-blue-500/20 text-blue-300 font-bold px-1.5 py-0.2 rounded border border-blue-500/30">خطوة 1</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                اختر الباقة التي تناسب طموحك من صفحة الترقيات (المنصب) لفتح المهام اليومية والعوائد.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              2
            </div>
            <div className="space-y-0.5">
              <div className="text-[11px] font-black text-white flex items-center gap-1.5">
                <span>استلام رمز المهام وتنفيذها</span>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/30">خطوة 2</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                افتح صفحة التوظيف بالرمز اليومي، تفاعل مع فيديوهات المنصات المعتمدة، وارفع لقطة الشاشة.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              3
            </div>
            <div className="space-y-0.5">
              <div className="text-[11px] font-black text-white flex items-center gap-1.5">
                <span>جني الأرباح وسحبها فورا</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">خطوة 3</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                تُضاف أرباح المهام إلى رصيدك فوراً، ويمكنك سحبها مباشرة إلى عنوان محفظتك بأمان.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'referral-rewards',
      badge: 'مكافآت إضافية ودعم',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: Gift,
      iconBg: 'from-emerald-500 via-teal-500 to-green-600 shadow-emerald-500/25',
      title: 'ضاعف دخلك مع فريقك',
      subtitle: 'مزايا إضافية متاحة لك من اللحظة الأولى:',
      content: (
        <div className="space-y-2.5 text-right">
          <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 rounded-xl p-3 border border-emerald-800/40 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-xs">
              <Crown className="w-4 h-4" />
              <span>عمولات دعوة الأصدقاء (3 مستويات):</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed font-bold">
              شارك رمز دعوتك <strong>({user.inviteCode})</strong> مع أصدقائك واحصل على عمولات فورية تصل حتى 10% من إيداعات وأرباح فريقك!
            </p>
          </div>

          <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[11px] font-black text-white">هل تحتاج مساعدة؟</div>
              <div className="text-[9px] text-slate-400 font-bold">فريق الدعم الفني متواجد 24/7</div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToSupport();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer"
            >
              دردشة الدعم الفني
            </button>
          </div>
        </div>
      )
    }
  ];

  const activeStep = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
      onNavigateToUpgrade();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
      <div className="bg-slate-900 border border-slate-750 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl shadow-blue-950/50 flex flex-col animate-scaleIn text-white relative">
        
        {/* Top Decorative Header */}
        <div className="relative bg-gradient-to-b from-slate-800/80 via-slate-900/60 to-slate-900 p-5 pb-3 border-b border-slate-800 text-center">
          
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border mb-3 shadow-sm mx-auto">
            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black ${activeStep.badgeColor}`}>
              {activeStep.badge}
            </span>
          </div>

          {/* Titles */}
          <h2 className="text-base font-black text-white tracking-tight">
            {activeStep.title}
          </h2>
          <p className="text-[11px] text-slate-400 font-bold mt-0.5">
            {activeStep.subtitle}
          </p>

          {/* Progress Indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentStep 
                    ? 'w-6 bg-blue-500 shadow-sm shadow-blue-500/50' 
                    : 'w-1.5 bg-slate-700 hover:bg-slate-600'
                }`}
                title={`الخطوة ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto max-h-[55vh]">
          {activeStep.content}
        </div>

        {/* Footer Navigation Controls */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-2">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
            >
              <span>السابق</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 text-xs font-black transition-all cursor-pointer shrink-0"
            >
              تخطي
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95 ${
              isLastStep
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
            }`}
          >
            <span>{isLastStep ? '🚀 بدء العمل وترقية الباقة الآن' : 'متابعة الخطوة التالية'}</span>
            {isLastStep ? <Crown className="w-3.5 h-3.5" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </div>
  );
};
