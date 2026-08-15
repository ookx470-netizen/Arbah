import React from 'react';
import { BookOpen, ChevronLeft, X, ArrowLeft } from 'lucide-react';

interface QuickGuidePromptToastProps {
  isOpen: boolean;
  onOpenGuide: () => void;
  onClose: () => void;
  userName?: string;
}

export const QuickGuidePromptToast: React.FC<QuickGuidePromptToastProps> = ({
  isOpen,
  onOpenGuide,
  onClose,
  userName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto animate-fadeIn" dir="rtl">
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-500/40 rounded-2xl p-3.5 shadow-2xl shadow-blue-950/70 text-white flex items-center justify-between gap-3 backdrop-blur-xl relative overflow-hidden">
        {/* Subtle Ambient Light */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/15 rounded-full blur-xl pointer-events-none" />

        {/* Right Icon + Text info */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/30 border border-white/20">
            <BookOpen className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white">
                {userName ? `أهلاً بك ${userName}!` : 'أهلاً بك في OXLO!'}
              </span>
              <span className="bg-blue-500/20 text-blue-300 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-blue-400/30">
                جديد
              </span>
            </div>
            <p className="text-[10px] text-slate-300 font-bold mt-0.5 leading-tight">
              اضغط على <span className="text-amber-300 font-extrabold">دليل البدء والتعليمات</span> للتعرف على آلية الأرباح
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 relative z-10 shrink-0">
          <button
            type="button"
            onClick={onOpenGuide}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-black px-3 py-2 rounded-xl shadow-md shadow-blue-600/30 active:scale-95 transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
          >
            <span>فتح الدليل</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-all cursor-pointer"
            title="إغلاق التنبيه"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
