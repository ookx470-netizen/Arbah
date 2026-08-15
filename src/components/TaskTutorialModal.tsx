import React, { useState } from 'react';
import { 
  X, 
  Lightbulb, 
  CheckCircle2, 
  ExternalLink, 
  Upload, 
  DollarSign, 
  ChevronLeft, 
  ChevronRight, 
  PlayCircle, 
  ShieldCheck, 
  AlertTriangle,
  Smartphone,
  Eye,
  Camera
} from 'lucide-react';

interface TaskTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToJobs?: () => void;
}

export const TaskTutorialModal: React.FC<TaskTutorialModalProps> = ({
  isOpen,
  onClose,
  onNavigateToJobs
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  if (!isOpen) return null;

  const steps = [
    {
      id: 1,
      title: "1. استلام المهمة اليومية",
      subtitle: "من صفحة التوظيف",
      badge: "الخطوة الأولى",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      icon: PlayCircle,
      iconBg: "from-blue-600 to-indigo-600",
      description: "توجه إلى قسم التوظيف واطلع على المهام المتاحة لباقة VIP الخاصة بك:",
      points: [
        "اختر منصة التواصل المطلوبة (YouTube ،TikTok ،Facebook).",
        "احصل على رمز المهمة اليومي المعتمد وأدخله لتأكيد استلام المهمة.",
        "ستنتقل المهمة فوراً إلى قائمة (قيد التنفيذ) في صفحة السجل."
      ],
      tip: "تأكد من استلام كامل عدد مهامك المسموحة يومياً حسب فئة باقتك لضمان أعلى عائد."
    },
    {
      id: 2,
      title: "2. فتح الرابط والتفاعل",
      subtitle: "تنفيذ المطلوب بدقة",
      badge: "الخطوة الثانية",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      icon: Eye,
      iconBg: "from-amber-500 to-orange-600",
      description: "اضغط على المهمة في قائمة قيد التنفيذ لمشاهدة التفاصيل وتنفيذ العمل:",
      points: [
        "اضغط على زر (فتح الرابط) أو انسخ الرابط لفتح الفيديو أو القناة المطلوبة.",
        "قم بعمل الإعجاب (Like)، المتابعة (Subscribe/Follow) وفق المطلوب في تفاصيل المهمة.",
        "التقط لقطة شاشة واضحة (Screenshot) تظهر تفاعلك مع المحتوى."
      ],
      tip: "يجب أن تكون لقطة الشاشة واضحة تماماً وتظهر زر الإعجاب أو المتابعة مفعلاً."
    },
    {
      id: 3,
      title: "3. رفع إثبات الإنجاز والإرسال",
      subtitle: "إرفاق لقطة الشاشة",
      badge: "الخطوة الثالثة",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      icon: Camera,
      iconBg: "from-purple-600 to-pink-600",
      description: "ارفع الصورة الملتقطة لتأكيد إتمامك للمهمة بنجاح:",
      points: [
        "اضغط على خانة (رفع) في صفحة تفاصيل المهمة واختر لقطة الشاشة من هاتفك.",
        "تأكد من معاينة الصورة والتأكد من وضوح تفاصيل التفاعل فيها.",
        "اضغط على زر (إرسال المهمة للمراجعة) لاعتمادها رسمياً من النظام."
      ],
      tip: "النظام الذكي يتحقق من صحة الصورة لمنع التكرار وضمان سرعة المعالجة الفورية."
    },
    {
      id: 4,
      title: "4. اعتماد المهمة وإضافة الأرباح",
      subtitle: "استلام العائد المالي",
      badge: "الخطوة الرابعة",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      icon: DollarSign,
      iconBg: "from-emerald-500 to-teal-600",
      description: "مبروك! تمت العملية وتضاف الأرباح تلقائياً إلى رصيدك:",
      points: [
        "تنتقل المهمة تلقائياً إلى تبويب (مكتملة) في السجل.",
        "يضاف مبلغ مكافأة المهمة (USDT) مباشرة إلى رصيدك الإجمالي.",
        "يمكنك طلب سحب أرباحك فوراً إلى عنوان محفظتك الرقمية في أي وقت."
      ],
      tip: "تجد سجل كامل بأرباحك وسحوباتك في المركز الشخصي بكل شفافية وأمان."
    }
  ];

  const activeStep = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden text-right flex flex-col max-h-[92vh]">
        
        {/* Glow ambient background effect */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Top Header */}
        <div className="relative p-5 pb-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
              <Lightbulb className="w-5 h-5 fill-amber-400/20" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>درس تعليمي: كيفية عمل المهام</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold">دليل إرشادي مصور خطوة بخطوة</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator Tabs */}
        <div className="px-5 pt-3 pb-1 shrink-0">
          <div className="grid grid-cols-4 gap-1.5 bg-slate-950/60 p-1 rounded-2xl border border-slate-800/80">
            {steps.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`py-2 px-1 rounded-xl text-[10px] font-black transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  currentStep === idx
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>خطوة {s.id}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${currentStep === idx ? 'bg-white' : 'bg-slate-700'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Active Step Header Card */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black ${activeStep.badgeColor}`}>
                {activeStep.badge}
              </span>
              <span className="text-[10px] font-extrabold text-slate-400">
                {currentStep + 1} من {steps.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${activeStep.iconBg} flex items-center justify-center text-white shrink-0 shadow-lg border border-white/20`}>
                <activeStep.icon className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">{activeStep.title}</h4>
                <p className="text-[11px] text-slate-400 font-bold mt-0.5">{activeStep.subtitle}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-bold mt-3 leading-relaxed">
              {activeStep.description}
            </p>
          </div>

          {/* Action Points List */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              خطوات التنفيذ المطلوبة:
            </span>
            {activeStep.points.map((pt, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-xs text-slate-200 font-bold leading-relaxed flex-1">
                  {pt}
                </p>
              </div>
            ))}
          </div>

          {/* Pro Tip Box */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-black text-amber-300 block mb-0.5">نصيحة هامة لضمان القبول</span>
              <p className="text-[10px] text-amber-200/90 font-bold leading-relaxed">
                {activeStep.tip}
              </p>
            </div>
          </div>

          {/* Golden Rules / Quality Guarantee */}
          <div className="border border-slate-800 bg-slate-900/90 rounded-2xl p-3 text-[10px] text-slate-400 space-y-1.5 font-bold">
            <div className="flex items-center gap-1.5 text-emerald-400 font-black">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>شروط قبول المهمة الفوري:</span>
            </div>
            <p>• عدم تكرار لقطات شاشة سابقة لنفس المهمة.</p>
            <p>• إتمام الإعجاب أو المتابعة لحساب صاحب المهمة بالشكل المطلوب.</p>
          </div>

        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 shrink-0 flex items-center justify-between gap-2.5">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-850 text-slate-400 hover:text-white text-xs font-black transition-all cursor-pointer"
            >
              إغلاق
            </button>
          )}

          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 cursor-pointer active:scale-95"
            >
              <span>الخطوة التالية</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onNavigateToJobs) {
                  onNavigateToJobs();
                }
              }}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>فهمت، ابدأ تنفيذ المهام الآن</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
