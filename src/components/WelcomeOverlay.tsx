import React from 'react';
import { Lock, Zap, ShieldCheck, HelpCircle } from 'lucide-react';

interface WelcomeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToUpgrade: () => void;
}

export const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({
  isOpen,
  onClose,
  onNavigateToUpgrade,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-stone-200 p-6 w-full max-w-sm shadow-2xl text-center space-y-5 animate-scaleIn">
        {/* Header Visual */}
        <div className="relative w-16 h-16 bg-gradient-to-tr from-amber-500 to-yellow-400 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-yellow-500/10">
          <Lock className="w-7 h-7 stroke-[2.5]" />
          <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full border-2 border-white">
            <Zap className="w-3.5 h-3.5 fill-white" />
          </div>
        </div>

        {/* Text Title */}
        <div className="space-y-2">
          <h3 className="text-base font-black text-stone-900">🔒 قفل السجل والرمز السري</h3>
          <p className="text-[11px] text-stone-500 font-medium leading-relaxed">
            أهلاً بك في منصة <strong>Oxlo</strong>! لقد تم إقفال السجل والمهام اليومية لحماية جودة وحصرية العمل للأعضاء النشطين.
          </p>
        </div>

        {/* Informative Steps Cards */}
        <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-150 text-right space-y-3">
          <span className="text-[10px] font-black text-stone-800 block border-b border-stone-200 pb-1.5">
            💡 كيف تبدأ العمل في 3 خطوات بسيطة؟
          </span>
          
          <div className="flex gap-2.5 items-start">
            <div className="bg-blue-50 text-blue-600 rounded-lg p-1.5 text-xs font-black min-w-[24px] text-center">
              1
            </div>
            <div className="space-y-0.5">
              <h4 className="text-[10.5px] font-black text-stone-900">اشترك في باقة VIP</h4>
              <p className="text-[9.5px] text-stone-500 leading-normal">
                قم بترقية حسابك إلى باقة VIP نشطة للتحقق من أهليتك واستحقاقك للأرباح.
              </p>
            </div>
          </div>

          <div className="flex gap-2.5 items-start">
            <div className="bg-emerald-50 text-emerald-600 rounded-lg p-1.5 text-xs font-black min-w-[24px] text-center">
              2
            </div>
            <div className="space-y-0.5">
              <h4 className="text-[10.5px] font-black text-stone-900">استلم الرمز اليومي المتغير</h4>
              <p className="text-[9.5px] text-stone-500 leading-normal">
                يرسل المسؤول الرمز المعتمد لليوم مباشرة عبر جرس إشعارات المشتركين VIP فقط.
              </p>
            </div>
          </div>

          <div className="flex gap-2.5 items-start">
            <div className="bg-amber-50 text-amber-600 rounded-lg p-1.5 text-xs font-black min-w-[24px] text-center">
              3
            </div>
            <div className="space-y-0.5">
              <h4 className="text-[10.5px] font-black text-stone-900">أدخل الرمز وابدأ الأرباح!</h4>
              <p className="text-[9.5px] text-stone-500 leading-normal">
                افتح صفحة السجل، ضع الرمز اليومي لتفعيل المهام، وابدأ بالضغط وجني الأموال!
              </p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={onNavigateToUpgrade}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl text-xs cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/10"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>الذهاب لصفحة ترقيات VIP والاشتراك</span>
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-extrabold py-2.5 rounded-xl text-xs cursor-pointer transition-all active:scale-95"
          >
            إغلاق النافذة المؤقتة
          </button>
        </div>
      </div>
    </div>
  );
};
