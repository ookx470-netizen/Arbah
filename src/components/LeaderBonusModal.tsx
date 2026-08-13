import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, X, Gift, Users, Award, ShieldCheck, CheckCircle2, ChevronRight, Copy, Share2 } from 'lucide-react';

interface LeaderBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode: string;
}

export const LeaderBonusModal: React.FC<LeaderBonusModalProps> = ({
  isOpen,
  onClose,
  inviteCode,
}) => { const isDarkMode = false;
  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    alert("📋 تم نسخ كود الدعوة الخاص بك بنجاح!");
  };

  const b1Rewards = [
    { count: "3 أعضاء B1", reward: "راتب قدره 15$", desc: "حافز نقدي فوري بمجرد الترقية" },
    { count: "6 أعضاء B1", reward: "راتب 30$ كل 10 أيام", desc: "دخل مستمر يصرف بانتظام للفريق النشط" },
    { count: "10 أعضاء B1", reward: "راتب 50$ كل 10 أيام", desc: "المكافأة الكبرى للفريق القيادي المتميز" }
  ];

  const b2Rewards = [
    { count: "3 أعضاء B2", reward: "راتب 30$ كل 10 أيام", desc: "بدء أولى خطوات القيادة للنخبة" },
    { count: "6 أعضاء B2", reward: "راتب 60$ كل 10 أيام", desc: "عائد نصف شهري سخي ومستقر للفريق" },
    { count: "10 أعضاء B2", reward: "راتب 100$ كل 10 أيام", desc: "أعلى راتب قيادي للفريق الذهبي والريادة" }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
        {/* Backdrop overlay with blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: "spring", duration: 0.4 }}
          className={`relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border ${
            isDarkMode 
              ? 'bg-slate-900 border-slate-800 text-white' 
              : 'bg-white border-blue-50 text-slate-800'
          } z-10 max-h-[90vh] flex flex-col`}
        >
          {/* Header design: Gold luxury crown background */}
          <div className="relative bg-gradient-to-br from-amber-500 via-yellow-600 to-amber-700 p-6 text-white text-center shrink-0">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-all cursor-pointer text-white"
            >
              <X className="w-4 h-4" />
            </button>



            {/* Animated crown representation */}
            <div className="relative w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-inner border border-white/20 animate-bounce-slow">
              <Crown className="w-8 h-8 text-amber-300 fill-amber-300 drop-shadow" />
            </div>

            <h3 className="text-base font-black tracking-wide">برنامج قادة المنصة المتميزين 👑</h3>
            <p className="text-[10px] text-amber-100 font-extrabold mt-1">
              كيف تصبح قائداً متميزاً وتبني دخلاً دورياً ومكافآت مستمرة؟
            </p>
          </div>

          {/* Modal Content Scroll Area */}
          <div className="p-5 overflow-y-auto space-y-6 flex-1 text-right leading-relaxed">
            
            {/* Guide intro */}
            <p className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'} leading-relaxed`}>
              الريادة والقيادة في منصتنا تمنحك مزايا استثنائية! بمجرد نجاحك في دعوة الأصدقاء للترقية وبناء شبكتك الخاصة، ستحصل تلقائياً على رواتب ثابتة وحوافز تصرف بانتظام كل 10 أيام.
            </p>

            {/* B1 Rewards Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-1.5 border-amber-500/20">
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-xs">B1</div>
                <h4 className="text-xs font-black text-amber-600 dark:text-amber-400">
                  برنامج قادة الفئة الرائدة VIP (B1)
                </h4>
              </div>

              <div className="grid gap-3">
                {b1Rewards.map((reward, i) => (
                  <div 
                    key={i} 
                    className={`p-3 rounded-2xl border transition-all ${
                      isDarkMode 
                        ? 'bg-slate-800/50 border-slate-700/80 hover:bg-slate-800' 
                        : 'bg-amber-50/20 border-amber-100/70 hover:bg-amber-50/50'
                    } flex items-center justify-between gap-4`}
                  >
                    <div className="space-y-1">
                      <span className="text-[11px] font-black block text-indigo-600 dark:text-indigo-400">
                        {reward.count}
                      </span>
                      <p className={`text-[9px] font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {reward.desc}
                      </p>
                    </div>
                    <div className="bg-amber-500 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-sm text-center">
                      {reward.reward}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* B2 Rewards Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-1.5 border-emerald-500/20">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-xs">B2</div>
                <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  برنامج قادة النخبة الذهبية VIP (B2)
                </h4>
              </div>

              <div className="grid gap-3">
                {b2Rewards.map((reward, i) => (
                  <div 
                    key={i} 
                    className={`p-3 rounded-2xl border transition-all ${
                      isDarkMode 
                        ? 'bg-slate-800/50 border-slate-700/80 hover:bg-slate-800' 
                        : 'bg-emerald-50/20 border-emerald-100/70 hover:bg-emerald-50/50'
                    } flex items-center justify-between gap-4`}
                  >
                    <div className="space-y-1">
                      <span className="text-[11px] font-black block text-emerald-600 dark:text-emerald-400">
                        {reward.count}
                      </span>
                      <p className={`text-[9px] font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {reward.desc}
                      </p>
                    </div>
                    <div className="bg-emerald-600 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-sm text-center">
                      {reward.reward}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tip Note Box */}
            <div className={`p-3.5 rounded-2xl border ${
              isDarkMode 
                ? 'bg-slate-800/40 border-slate-700/60' 
                : 'bg-indigo-50/40 border-indigo-100/70'
            } space-y-1`}>
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                توضيح بخصوص تفعيل الرواتب:
              </span>
              <p className={`text-[9px] leading-relaxed font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                📌 يتم احتساب الرواتب الدورية كل 10 أيام عمل بناءً على وجود الأعضاء النشطين المؤهلين المسجلين مباشرة برمز دعوتك الشخصي، وصرف المستحقات يتم فورياً عبر المحفظة الخاصة بك.
              </p>
            </div>

            {/* Quick Referrer Copy Action */}
            <div className={`border rounded-2xl p-3.5 ${
              isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-150 bg-slate-50/40'
            } space-y-2.5`}>
              <div className="flex justify-between items-center text-[10px]">
                <span className={`font-extrabold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>كود الدعوة الحصري الخاص بك:</span>
                <span className="font-black text-amber-500 tracking-wider font-mono text-[11px]">{inviteCode}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white py-2.5 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98]"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ كود الدعوة لبدء بناء فريقك القيادي</span>
              </button>
            </div>

          </div>

          {/* Modal Footer */}
          <div className={`p-4 border-t shrink-0 flex gap-2 ${
            isDarkMode ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold py-3 rounded-xl transition-all cursor-pointer text-center text-xs shadow"
            >
              موافق، إغلاق الدليل
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
