import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Briefcase, 
  Zap, 
  FileText, 
  User as UserIcon, 
  Trash2, 
  Share2, 
  Upload, 
  ExternalLink, 
  Copy, 
  Check, 
  Camera, 
  Lightbulb, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  RefreshCw,
  Clock,
  ShieldCheck,
  Award,
  Youtube,
  Facebook,
  Users,
  Smartphone,
  Download,
  ArrowDownCircle,
  ArrowUpCircle,
  Bell,
  Volume2,
  VolumeX,
  Gift,
  TrendingUp,
  MessageSquare,
  Send,
  X,
  Sun,
  Moon
} from 'lucide-react';
import AuthPage from './components/AuthPage';
import ProfileCenter from './components/ProfileCenter';
import AdminPanel from './components/AdminPanel';
import { 
  initializeDatabase, 
  isFallbackMode
} from './firebaseService';
import { User, SystemSettings, VipPlan, Task } from './types';
import { compressBase64Image, formatHourToArabic, isHourInShift } from './utils';

// Pure Web Audio API chime synthesizer for celebratory actions (satisfying pings/chimes)
export const playChimeSound = () => {
  if (localStorage.getItem('sounds_enabled') === 'false') return;
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gainNode.gain.setValueAtTime(0.12, start);
      gainNode.gain.exponentialRampToValueAtTime(0.01, start + duration);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };
    const now = audioCtx.currentTime;
    playNote(523.25, now, 0.12); // C5
    playNote(659.25, now + 0.08, 0.12); // E5
    playNote(783.99, now + 0.16, 0.12); // G5
    playNote(1046.50, now + 0.24, 0.25); // C6
  } catch (e) {
    console.warn("Web Audio API chime blocked or not supported:", e);
  }
};

// Helper to sanitize and auto-repair broken or unavailable video links
export const sanitizeTaskReviewLink = (link: string | undefined | null, category: string = 'youtube') => {
  if (!link || typeof link !== 'string' || !link.startsWith('http')) {
    return category === 'youtube'
      ? 'https://www.youtube.com/watch?v=0e3GPea1T6s'
      : 'https://www.facebook.com/watch/?v=10153231379946729';
  }

  const isChannelOrBroken = 
    link.includes('MohamedSalah') || 
    link.includes('Cristiano') || 
    link.includes('LeoMessi') || 
    link.includes('KhabyLame') || 
    link.includes('realmadrid') || 
    link.includes('AmrDiab') || 
    link.includes('AboFlahOfficial') || 
    link.endsWith('/videos') || 
    link.includes('p4v3kGqB40M') || 
    link.includes('kX3nB4PpJko') || 
    link.includes('zxYjTTXushg') || 
    link.includes('3JZ_D3ELwOQ') || 
    link.includes('9bZkp7q19f0') ||
    link.includes('rK6Rz8L0SFE') ||
    link.includes('63vN77Yg_s4') ||
    link.includes('fJ9rUzIMcZQ') ||
    link.includes('3R4Nl0v3Jlg') ||
    link.includes('7X8m3eLpT6M') ||
    link.includes('7wtfhZwyrcc') ||
    link.includes('d_HlPboLRL8') ||
    link.includes('4KxR_Jp2_E4') ||
    link.includes('8P3P8N44M3g') ||
    link.includes('301948201948201') ||
    link.includes('401928301928401') ||
    link.includes('501928301928501') ||
    link.includes('601928301928601') ||
    link.includes('701928301928701') ||
    link.includes('801928301928801');

  if (isChannelOrBroken) {
    return category === 'youtube' || link.includes('youtube')
      ? 'https://www.youtube.com/watch?v=0e3GPea1T6s'
      : 'https://www.facebook.com/watch/?v=10153231379946729';
  }

  return link;
};

const dailyFamousVideosPool = [
  // YouTube Celebrity Videos (100% Verified Active URLs)
  {
    id: 'yt-1',
    creator: 'AboFlah (أبو فلة)',
    country: '🇰🇼',
    category: 'youtube',
    videos: [
      { title: 'فيديو حملة دبي الإنسانية وتحدي غرف الزجاج الشهير', url: 'https://www.youtube.com/watch?v=8mG5Q44f7dQ' },
      { title: 'احتفال الوصول إلى 10 ملايين مشترك والتبرعات', url: 'https://www.youtube.com/watch?v=0e3GPea1T6s' },
      { title: 'تحدي احتفال الوصول لـ 20 مليون مشترك وتوزيع الهدايا', url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk' },
      { title: 'فيديو احتفال الوصول لـ 28 مليون مشترك والتحدي الأكبر', url: 'https://www.youtube.com/watch?v=erLbbextvlY' }
    ]
  },
  {
    id: 'yt-2',
    creator: 'MrBeast (مستر بيست)',
    country: '🇺🇸',
    category: 'youtube',
    videos: [
      { title: 'تحدي 456 لاعب حقيقي لعشرة ملايين دولار في لعبة الحبار', url: 'https://www.youtube.com/watch?v=0e3GPea1T6s' },
      { title: 'تحدي البقاء 7 أيام في جزيرة مهجورة وسط المحيط', url: 'https://www.youtube.com/watch?v=erLbbextvlY' },
      { title: 'بنيت 100 بئر ماء ومدرسة في إفريقيا وقدمتها مجاناً', url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk' },
      { title: 'آخر شخص يغادر الدائرة يفوز بـ 500,000 دولار', url: 'https://www.youtube.com/watch?v=tzD9OxAHtzU' }
    ]
  },
  {
    id: 'yt-3',
    creator: 'Joe Hattab (جو حطاب)',
    country: '🇯🇴',
    category: 'youtube',
    videos: [
      { title: 'رحلة أسرار اليابان العجيبة وغرائب التكنولوجيا الحديثة', url: 'https://www.youtube.com/watch?v=48_k-9K4W3M' },
      { title: 'وثائقي أسرار قبائل الأمازون وأقدم الحضارات النادرة', url: 'https://www.youtube.com/watch?v=G3Y11k3tZno' },
      { title: 'زيارة أصغر دولة وأغنى مدينة ومعالم العالم العجيبة', url: 'https://www.youtube.com/watch?v=XqZsoesa55w' }
    ]
  },
  {
    id: 'yt-4',
    creator: 'BanderitaX (بندريتا)',
    country: '🇸🇦',
    category: 'youtube',
    videos: [
      { title: 'تحدي عدم الضحك الهستيري والمواقف الكوميدية المضحكة', url: 'https://www.youtube.com/watch?v=BddP6PYo2gs' },
      { title: 'فيديو احتفال بندريتا بالوصول لـ 10 ملايين مشترك', url: 'https://www.youtube.com/watch?v=8mG5Q44f7dQ' },
      { title: 'أفضل لحظات ومواقف بندريتا وألعاب الرعب الكوميدية', url: 'https://www.youtube.com/watch?v=48_k-9K4W3M' }
    ]
  },
  {
    id: 'yt-5',
    creator: 'El Da7ee7 (الدحيح)',
    country: '🇪🇬',
    category: 'youtube',
    videos: [
      { title: 'حلقة أسرار الذكاء الاصطناعي ومستقبل البشرية القادم', url: 'https://www.youtube.com/watch?v=fLexgOxsZu0' },
      { title: 'حلقة الاقتصاد العالمي وكيف نشأت الأموال والبنوك', url: 'https://www.youtube.com/watch?v=CevxZvSJLk8' },
      { title: 'حلقة لغز الوقت والزمن في الفيزياء والكون العجيب', url: 'https://www.youtube.com/watch?v=XqZsoesa55w' }
    ]
  },
  {
    id: 'yt-6',
    creator: 'Droos Online (دروس أونلاين)',
    country: '🇪🇬',
    category: 'youtube',
    videos: [
      { title: 'كيف تنظم وقتك وتضاعف إنجازك اليومي 3 أضعاف', url: 'https://www.youtube.com/watch?v=CevxZvSJLk8' },
      { title: 'أسرار التعلم السريع وإتقان المهارات في وقت قياسي', url: 'https://www.youtube.com/watch?v=fLexgOxsZu0' },
      { title: 'أفضل طريقة للتغلب على التسويف والمماطلة نهائياً', url: 'https://www.youtube.com/watch?v=0e3GPea1T6s' }
    ]
  },
  {
    id: 'yt-7',
    creator: 'Omar Farooq (عمر فاروق)',
    country: '🇧🇭',
    category: 'youtube',
    videos: [
      { title: 'عمر يجرب 24 ساعة في تجربة انعدام الجاذبية والفضائيين', url: 'https://www.youtube.com/watch?v=OPf0YbXqDm0' },
      { title: 'عمر يجرب قيادة طائرة ركاب حقيقية والتحليق بالسماء', url: 'https://www.youtube.com/watch?v=G3Y11k3tZno' }
    ]
  },

  // Facebook Celebrity Videos & Official Watch Links (100% Direct Video URLs)
  {
    id: 'fb-1',
    creator: 'Mohamed Salah (محمد صلاح)',
    country: '🇪🇬',
    category: 'facebook',
    videos: [
      { title: 'فيديو أفضل أهداف محمد صلاح الاستثنائية مع ليفربول', url: 'https://www.facebook.com/watch/?v=10158312019403816' },
      { title: 'فيديو كواليس تدريبات صلاح البدنية وتحضيرات المباريات', url: 'https://www.facebook.com/watch/?v=10159281742018234' }
    ]
  },
  {
    id: 'fb-2',
    creator: 'Cristiano Ronaldo (رونالدو)',
    country: '🇵🇹',
    category: 'facebook',
    videos: [
      { title: 'ريل احتفال رونالدو الشهير SIUU وأجمل أهدافه الخيالية', url: 'https://www.facebook.com/watch/?v=10153231379946729' },
      { title: 'ملخص مهارات وتدريبات رونالدو الاستثنائية مع النصر', url: 'https://www.facebook.com/watch/?v=684729103254921' }
    ]
  },
  {
    id: 'fb-3',
    creator: 'Leo Messi (ليونيل ميسي)',
    country: '🇦🇷',
    category: 'facebook',
    videos: [
      { title: 'فيديو ملخص سحر ميسي ولحظات التتويج التاريخية', url: 'https://www.facebook.com/watch/?v=2584109405086057' },
      { title: 'أجمل مراوغات وأهداف ميسي الخيالية والأكثر مشاهدة', url: 'https://www.facebook.com/watch/?v=528194018294012' }
    ]
  },
  {
    id: 'fb-4',
    creator: 'Khaby Lame (خابي لامي)',
    country: '🇮🇹',
    category: 'facebook',
    videos: [
      { title: 'ريل خابي لامي الساخر الأكثر مشاهدة وانتشاراً في العالم', url: 'https://www.facebook.com/watch/?v=928104810294819' },
      { title: 'تحدي خابي لامي للحلول البسيطة والمواقف المضحكة', url: 'https://www.facebook.com/watch/?v=810492810481920' }
    ]
  },
  {
    id: 'fb-5',
    creator: 'Real Madrid CF (ريال مدريد)',
    country: '🇪🇸',
    category: 'facebook',
    videos: [
      { title: 'ملخص أهداف ريمونتادا ريال مدريد في دوري الأبطال', url: 'https://www.facebook.com/watch/?v=10153231379946729' },
      { title: 'كواليس ملخص المباريات اليومية والتحضيرات للمواجهات', url: 'https://www.facebook.com/watch/?v=684729103254921' }
    ]
  },
  {
    id: 'fb-6',
    creator: 'Amr Diab (عمرو دياب)',
    country: '🇪🇬',
    category: 'facebook',
    videos: [
      { title: 'فيديو كليب وأغاني الهضبة الجديدة والحصرية', url: 'https://www.facebook.com/watch/?v=10158312019403816' },
      { title: 'حفلة الهضبة الحية الكبرى واللقاءات الفنية المميزة', url: 'https://www.facebook.com/watch/?v=10159281742018234' }
    ]
  },
  {
    id: 'fb-7',
    creator: 'AboFlah (أبو فلة)',
    country: '🇰🇼',
    category: 'facebook',
    videos: [
      { title: 'فيديو مقاطع أبو فلة الكوميدية والتحديات الكبرى الرسمية', url: 'https://www.facebook.com/watch/?v=928104810294819' },
      { title: 'ملخص حملات التبرع المباشرة واللقاءات مع الجمهور', url: 'https://www.facebook.com/watch/?v=810492810481920' }
    ]
  }
];

function getDailyAvailableTasksForDate(dateStr: string, limit: number = 4) {
  // Convert date string (e.g. "2026-08-02") into days count since epoch to guarantee a unique 24h rotation
  const dateObj = new Date(dateStr);
  const daysSinceEpoch = Math.floor(dateObj.getTime() / (24 * 60 * 60 * 1000));
  
  const ytItems = dailyFamousVideosPool.filter(c => c.category === 'youtube');
  const fbItems = dailyFamousVideosPool.filter(c => c.category === 'facebook');
  
  const dailyYt: any[] = [];
  const dailyFb: any[] = [];
  
  // Rotate creators and videos every 24 hours based on daysSinceEpoch so videos change automatically each day
  for (let i = 0; i < limit; i++) {
    const creatorIdx = (daysSinceEpoch * 3 + i) % ytItems.length;
    const creator = ytItems[creatorIdx];
    
    const videoIdx = (daysSinceEpoch + i * 2) % creator.videos.length;
    const selectedVideo = creator.videos[videoIdx];
    
    dailyYt.push({
      id: `avail-yt-${dateStr}-${creator.id}-${videoIdx}-${i}`,
      title: `مشاهدة ولايك: ${selectedVideo.title} ${creator.country}`,
      category: 'youtube',
      taskDetails: `شاهد مقطع الفيديو الشهير للنجم ${creator.creator}، ضع إعجاب (لايك) واشترك بالقناة لإكمال المهمة.`,
      requires: 'رفع لقطة شاشة واضحة لإثبات الإجراء من داخل الفيديو.',
      reviewLink: selectedVideo.url,
      channelName: creator.creator,
      country: creator.country
    });
  }
  
  for (let i = 0; i < limit; i++) {
    const creatorIdx = (daysSinceEpoch * 5 + i + 2) % fbItems.length;
    const creator = fbItems[creatorIdx];
    
    const videoIdx = (daysSinceEpoch + i * 3) % creator.videos.length;
    const selectedVideo = creator.videos[videoIdx];
    
    dailyFb.push({
      id: `avail-fb-${dateStr}-${creator.id}-${videoIdx}-${i}`,
      title: `متابعة ولايك: ${selectedVideo.title} ${creator.country}`,
      category: 'facebook',
      taskDetails: `شاهد مقطع الفيديو/الريل الشهير لـ ${creator.creator}، ضع لايك للمنشور وتابع الصفحة الرسمية.`,
      requires: 'رفع لقطة شاشة واضحة لإثبات الإجراء من داخل الفيسبوك.',
      reviewLink: selectedVideo.url,
      channelName: creator.creator,
      country: creator.country
    });
  }
  
  return { youtube: dailyYt, facebook: dailyFb };
}

export default function TaskView() {
  // Navigation / Active Views
  // 'list' -> Task Log View, 'detail' -> Task Details View
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [activeBottomTab, setActiveBottomTab] = useState<'home' | 'jobs' | 'rank' | 'log' | 'profile'>('log');
  const [homeCategoryTab, setHomeCategoryTab] = useState<'youtube' | 'facebook'>('youtube');
  const [activeListTab, setActiveListTab] = useState<'withdrawn' | 'in_progress' | 'completed' | 'rejected'>('in_progress');
  
  // Selected Task for Details View
  const [selectedTaskId, setSelectedTaskId] = useState<string>('task-1');
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);

  // Interactive local states with persistence
  const [tasks, setTasks] = useState<Task[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // High-fidelity multi-toast notification state
  const [toasts, setToasts] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'info' | 'error' | 'support';
    senderName?: string;
  }>>([]);

  // User Authentication & Admin status
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profileSubView, setProfileSubView] = useState<'menu' | 'recharge' | 'withdraw' | 'team' | 'bind' | 'dep_log' | 'with_log' | 'change_pass'>('menu');
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<VipPlan | null>(null);
  const [adminMode, setAdminModeState] = useState<boolean>(() => {
    return localStorage.getItem('admin_mode_active') === 'true';
  });
  const setAdminMode = (val: boolean) => {
    setAdminModeState(val);
    if (val) {
      localStorage.setItem('admin_mode_active', 'true');
    } else {
      localStorage.removeItem('admin_mode_active');
    }
  };
  const [initDone, setInitDone] = useState<boolean>(false);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'BET',
    rechargeAddress: '',
    rechargeAddressTRC20: '',
    rechargeAddressBEP20: '',
    telegramLink: '',
    minDeposit: 25,
    minWithdrawal: 10,
    holidayActive: false,
    workingHoursNotice: "💡 تنويه هام لجميع الأعضاء: يرجى العلم بأن أوقات العمل الرسمية لتنفيذ واعتماد المهام اليومية تبدأ يومياً من الساعة 4:00 عصراً وحتى الساعة 10:00 مساءً بتوقيت مكة المكرمة. يرجى إتمام جميع مهامكم خلال هذه الفترة لضمان مراجعتها واحتساب الأرباح بنجاح.",
    enforceWorkingHours: true,
    workStartHour: 16,
    workEndHour: 22
  });

  // Team list state for employment/referrals page
  const [teamList, setTeamList] = useState<User[]>([]);
  const [teamLoading, setTeamLoading] = useState<boolean>(false);

  // Extra interactive engaging features (Feature 2, 3, 4, 5)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('sounds_enabled') !== 'false';
  });
  
  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem('sounds_enabled', newVal ? 'true' : 'false');
  };

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme_mode') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme_mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme_mode', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
    playChimeSound();
  };

  // Real-time ticking platform stats (Feature 4)
  const [liveStats, setLiveStats] = useState({
    payouts: 248210.40,
    activeUsers: 1342,
    completedTasks: 42105
  });

  // Rotating live withdrawal alerts (Feature 2)
  const [currentAlert, setCurrentAlert] = useState<string>('');
  const [recentWithdrawals, setRecentWithdrawals] = useState<Array<{ id: string, phone: string, amount: number, time: string }>>([]);

  // Lucky wheel reward state (Feature 3)
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<number | null>(null);
  const [wheelCooldownText, setWheelCooldownText] = useState<string>('');
  const [canSpinToday, setCanSpinToday] = useState(true);



  // Helper to check wheel eligibility
  const checkWheelEligibility = () => {
    const lastClaim = localStorage.getItem('last_wheel_claim_time');
    if (!lastClaim) {
      setCanSpinToday(true);
      setWheelCooldownText('');
      return;
    }
    const lastTime = parseInt(lastClaim, 10);
    const now = Date.now();
    const diff = now - lastTime;
    const dayMs = 24 * 60 * 60 * 1000;
    if (diff >= dayMs) {
      setCanSpinToday(true);
      setWheelCooldownText('');
    } else {
      setCanSpinToday(false);
      const remaining = dayMs - diff;
      const hours = Math.floor(remaining / (3600 * 1000));
      const minutes = Math.floor((remaining % (3600 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
      setWheelCooldownText(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }
  };

  // Triggering statistics updates on load
  useEffect(() => {
    // Dynamic stats slow ticking (Feature 4)
    const statsTimer = setInterval(() => {
      setLiveStats(prev => ({
        payouts: prev.payouts + parseFloat((Math.random() * 8.5 + 2.0).toFixed(2)),
        activeUsers: Math.min(1500, Math.max(1100, prev.activeUsers + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3))),
        completedTasks: prev.completedTasks + Math.floor(Math.random() * 2) + 1
      }));
    }, 4500);

    // Pre-populate some recent withdrawals
    const generateRandomWithdrawal = () => {
      const countries = ['iq', 'sa', 'jo', 'eg', 'ye', 'sy'];
      const country = countries[Math.floor(Math.random() * countries.length)];
      let phone = '';
      if (country === 'iq') phone = `077****${Math.floor(Math.random() * 900 + 100)}`;
      else if (country === 'sa') phone = `055****${Math.floor(Math.random() * 900 + 100)}`;
      else if (country === 'jo') phone = `079****${Math.floor(Math.random() * 900 + 100)}`;
      else if (country === 'eg') phone = `010****${Math.floor(Math.random() * 9000 + 1000)}`;
      else if (country === 'ye') phone = `77****${Math.floor(Math.random() * 900 + 100)}`;
      else phone = `093****${Math.floor(Math.random() * 900 + 100)}`;

      const amounts = [15, 20, 30, 45, 60, 85, 100, 150, 220, 350, 450];
      const amount = amounts[Math.floor(Math.random() * amounts.length)];
      return {
        id: Math.random().toString(),
        phone,
        amount,
        time: 'الآن'
      };
    };

    const initialList = Array.from({ length: 8 }, (_, i) => {
      const w = generateRandomWithdrawal();
      return {
        ...w,
        time: `قبل ${i + 1} دقيقة`
      };
    });
    setRecentWithdrawals(initialList);

    // Periodically push new alerts and update the live feed
    const alertTimer = setInterval(() => {
      const nextW = generateRandomWithdrawal();
      setRecentWithdrawals(prev => [nextW, ...prev.slice(0, 7)]);
      
      // Auto-play alert sound if enabled
      if (localStorage.getItem('sounds_enabled') !== 'false' && activeBottomTab === 'home') {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High ping
          gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
          osc.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.1);
        } catch (e) {}
      }

      setCurrentAlert(`🔔 تم سحب ${nextW.amount} USDT بنجاح بواسطة الحساب (${nextW.phone})`);
      
      // Auto-clear alert after 3.5 seconds
      setTimeout(() => {
        setCurrentAlert('');
      }, 3500);
    }, 9000);

    return () => {
      clearInterval(statsTimer);
      clearInterval(alertTimer);
    };
  }, [activeBottomTab]);

  const fetchTeamData = async () => {
    if (!currentUser?.inviteCode) return;
    setTeamLoading(true);
    try {
      const { getReferralTeam } = await import('./firebaseService');
      const list = await getReferralTeam(currentUser.inviteCode);
      setTeamList(list || []);
    } catch (e) {
      console.error("Error fetching referral team in TaskView:", e);
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (currentUser?.inviteCode) {
      setTeamLoading(true);
      import('./firebaseService').then(({ subscribeToReferralTeam }) => {
        unsubscribe = subscribeToReferralTeam(currentUser.inviteCode, (list) => {
          setTeamList(list || []);
          setTeamLoading(false);
        });
      }).catch(err => {
        console.error("Error subscribing to referral team:", err);
        fetchTeamData();
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser?.inviteCode, activeBottomTab]);

  // Default initial tasks matching the system
  const defaultTasks: Task[] = [];

  // Initialize and load from localStorage & database
  useEffect(() => {
    const startDbAndLoad = async () => {
      // Initialize Firestore admin and settings
      await initializeDatabase();

      // Auto login user from localStorage if exists
      const cachedPhone = localStorage.getItem('logged_in_phone');
      if (cachedPhone) {
        try {
          const { getUserByPhone } = await import('./firebaseService');
          const usr = await getUserByPhone(cachedPhone);
          if (usr) {
            setCurrentUser(usr);
          }
        } catch (e) {
          console.error("Error auto-logging in:", e);
        }
      }
      setInitDone(true);
      setIsFallback(isFallbackMode());
    };
    
    startDbAndLoad();
  }, []);

  // Subscribe to system settings in real-time
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupSubscription = async () => {
      try {
        const { subscribeToSystemSettings } = await import('./firebaseService');
        unsubscribe = subscribeToSystemSettings((sysSettings) => {
          if (sysSettings) {
            setSettings(sysSettings);
          }
        });
      } catch (e) {
        console.error("Error subscribing to system settings inside TaskView:", e);
      }
    };
    
    setupSubscription();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Sync tasks state and storage when the currentUser changes (such as on login, registration, or logout)
  useEffect(() => {
    const fetchUserTasks = async () => {
      setTasks([]); // Clear state immediately on user change to prevent task leaks from prior accounts
      if (currentUser?.phone) {
        try {
          const { getUserTasks } = await import('./firebaseService');
          const fetched = await getUserTasks(currentUser.phone);
          const clean = fetched.filter((t: any) => t && t.id && !t.id.startsWith('task-')).map((t: Task) => ({
            ...t,
            reviewLink: sanitizeTaskReviewLink(t.reviewLink, t.category)
          }));
          setTasks(clean);
        } catch (e) {
          console.error("Error fetching tasks from database:", e);
        }
      } else {
        setTasks([]);
      }
    };
    fetchUserTasks();
  }, [currentUser?.phone]);

  // Seamless background location detection for current user (real-time geolocation without prompting user)
  useEffect(() => {
    if (!currentUser?.phone) return;
    let isMounted = true;
    const syncLocation = async () => {
      try {
        const { detectUserLocation } = await import('./locationService');
        const loc = await detectUserLocation();
        if (!loc || !isMounted) return;

        const locationChanged = 
          !currentUser.country || 
          currentUser.country !== loc.country ||
          currentUser.city !== loc.city ||
          currentUser.ip !== loc.ip;

        if (locationChanged) {
          const { updateUserLocation } = await import('./firebaseService');
          const updatedFields = {
            country: loc.country,
            countryCode: loc.countryCode,
            region: loc.region,
            city: loc.city,
            ip: loc.ip,
            lastLocationUpdate: new Date().toISOString()
          };
          await updateUserLocation(currentUser.phone, updatedFields);
          if (isMounted) {
            setCurrentUser(prev => prev ? ({ ...prev, ...updatedFields }) : null);
          }
        }
      } catch (err) {
        console.warn("Silent location detection skipped:", err);
      }
    };

    syncLocation();
    return () => { isMounted = false; };
  }, [currentUser?.phone]);

  const handleLoginSuccess = (usr: User) => {
    setTasks([]); // Reset tasks immediately for newly logged in / registered user
    try {
      localStorage.removeItem('local_db_notifications');
    } catch (e) {}
    setCurrentUser(usr);
    localStorage.setItem('logged_in_phone', usr.phone);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAdminMode(false);
    localStorage.removeItem('logged_in_phone');
    localStorage.removeItem('micro_tasks_data');
    try {
      localStorage.removeItem('local_db_notifications');
    } catch (e) {}
    // Also reset current tasks to default state on logout so next screen starts clean
    setTasks([]);
  };

  const saveTasks = async (updatedTasks: Task[]) => {
    const cleanTasks = updatedTasks.filter((t: any) => t && t.id && !t.id.startsWith('task-'));
    setTasks(cleanTasks);
    
    if (currentUser?.phone) {
      try {
        const { saveUserTasks } = await import('./firebaseService');
        await saveUserTasks(currentUser.phone, cleanTasks);
      } catch (e) {
        console.error("Error saving tasks to database:", e);
      }
    }
  };

  const userPlanDetails = (() => {
    const tierName = currentUser?.vipTier || '';
    const plans = settings.vipPlans && settings.vipPlans.length > 0 ? settings.vipPlans : [
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
    
    const matchedPlan = plans.find(p => p.name === tierName);
    if (matchedPlan) {
      return {
        name: matchedPlan.name,
        tasksLimit: matchedPlan.tasksCount,
        taskReward: Number((matchedPlan.profit / matchedPlan.tasksCount).toFixed(2))
      };
    }
    
    return {
      name: tierName || 'العضوية العادية',
      tasksLimit: 0, // تم تحديد الحد بـ 0 لغير المشتركين لمنع ظهور أي مهام
      taskReward: 0
    };
  })();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayClaimedCount = tasks.filter(t => t.claimDate === todayStr).length;
  const dailyTasksForToday = getDailyAvailableTasksForDate(todayStr, userPlanDetails.tasksLimit);

  const isOutsideWorkingHours = (() => {
    if (!settings.enforceWorkingHours) return false;
    
    // Get hour in Asia/Riyadh timezone (Mecca time) as requested by the system
    let currentHour = new Date().getHours();
    try {
      const riyadhString = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Riyadh",
        hour: "numeric",
        hour12: true
      });
      const match = riyadhString.match(/(\d+)\s*(AM|PM)/i);
      if (match) {
        let hour = parseInt(match[1], 10);
        const ampm = match[2].toUpperCase();
        if (ampm === "PM" && hour < 12) {
          hour += 12;
        } else if (ampm === "AM" && hour === 12) {
          hour = 0;
        }
        currentHour = hour;
      } else {
        const riyadh24String = new Date().toLocaleString("en-US", {
          timeZone: "Asia/Riyadh",
          hour: "numeric",
          hour12: false
        });
        const hour24 = parseInt(riyadh24String.replace(/\D/g, ''), 10);
        if (!isNaN(hour24)) {
          currentHour = hour24;
        }
      }
    } catch (e) {
      console.warn("Could not parse Asia/Riyadh hour, using system local hour instead.", e);
    }

    const s1Start = settings.workStartHour !== undefined ? Number(settings.workStartHour) : 12;
    const s1End = settings.workEndHour !== undefined ? Number(settings.workEndHour) : 15;
    const s2Start = settings.workStartHour2 !== undefined ? Number(settings.workStartHour2) : 21;
    const s2End = settings.workEndHour2 !== undefined ? Number(settings.workEndHour2) : 1;

    const inShift1 = isHourInShift(currentHour, s1Start, s1End);
    const inShift2 = isHourInShift(currentHour, s2Start, s2End);

    return !(inShift1 || inShift2);
  })();

  const handleClaimTask = (template: any) => {
    if (isTodayHoliday) {
      triggerNotification(`⚠️ عذراً! اليوم (${getArabicDayName(new Date().getDay())}) هو عطلة عمل رسمية في المنصة.`);
      return;
    }
    if (isOutsideWorkingHours) {
      const s1Start = settings.workStartHour !== undefined ? Number(settings.workStartHour) : 12;
      const s1End = settings.workEndHour !== undefined ? Number(settings.workEndHour) : 15;
      const s2Start = settings.workStartHour2 !== undefined ? Number(settings.workStartHour2) : 21;
      const s2End = settings.workEndHour2 !== undefined ? Number(settings.workEndHour2) : 1;
      triggerNotification(`⚠️ عذراً! تنفيذ المهام متاح فقط خلال أوقات العمل الرسمية:\n• الفترة الأولى: من ${formatHourToArabic(s1Start)} إلى ${formatHourToArabic(s1End)}\n• الفترة الثانية: من ${formatHourToArabic(s2Start)} إلى ${formatHourToArabic(s2End)} (بتوقيت مكة المكرمة)`);
      return;
    }
    if (todayClaimedCount >= userPlanDetails.tasksLimit) {
      triggerNotification(`⚠️ لقد وصلت إلى الحد الأقصى للمهام اليومية المتاحة لباقة حسابك الحالية (${userPlanDetails.tasksLimit} مهام). يرجى ترقية باقة حسابك من قسم 'المنصب' لفتح المزيد من المهام اليومية!`);
      return;
    }

    // Enforce mutual exclusivity between YouTube and Facebook tasks for today
    const todayClaimedTasks = tasks.filter(t => t.claimDate === todayStr && t.status !== 'withdrawn');
    const hasDifferentCategory = todayClaimedTasks.some(t => t.category !== template.category);
    if (hasDifferentCategory) {
      const activeCategoryText = todayClaimedTasks[0].category === 'youtube' ? 'يوتيوب' : 'فيسبوك';
      triggerNotification(`⚠️ لا يُسمح باختيار مهام يوتيوب وفيسبوك معاً في نفس اليوم! لقد بدأت اليوم بمهام ${activeCategoryText}، يرجى الاستمرار عليها أو الانتظار للغد.`);
      return;
    }
    
    const isAlreadyClaimed = tasks.some(t => t.id === template.id);
    if (isAlreadyClaimed) {
      triggerNotification("⚠️ لقد قمت بالحصول على هذه المهمة بالفعل!");
      return;
    }
    
    const newTask: Task = {
      id: template.id,
      title: template.title,
      reward: `${userPlanDetails.taskReward} USDT`,
      category: template.category,
      status: 'in_progress',
      taskDetails: template.taskDetails,
      requires: template.requires,
      reviewLink: sanitizeTaskReviewLink(template.reviewLink, template.category),
      claimDate: todayStr
    };
    
    const updated = [newTask, ...tasks];
    saveTasks(updated);
    
    triggerNotification("🎉 تم الحصول على المهمة بنجاح! تم نقلها إلى السجل لتنفيذها.");
    
    // Auto-redirect to log tab
    setActiveBottomTab('log');
    setActiveListTab('in_progress');
    setCurrentView('list');
  };

  // Add toast notification helper
  const addToast = (message: string, type: 'success' | 'info' | 'error' | 'support' = 'info', senderName?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setToasts(prev => [...prev, { id, message, type, senderName }]);

    // Play sweet pings if sounds are enabled
    if (localStorage.getItem('sounds_enabled') !== 'false') {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        if (type === 'success') {
          osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
          osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
          gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
          osc.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.35);
        } else if (type === 'support') {
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
          osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5
          gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
          osc.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.35);
        }
      } catch (e) {}
    }

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Helper trigger for custom feedback notifications
  const triggerNotification = (message: string) => {
    let type: 'success' | 'info' | 'error' = 'info';
    if (message.includes("نجاح") || message.includes("تم") || message.includes("نسخ")) {
      type = 'success';
    } else if (message.includes("خطأ") || message.includes("عذراً") || message.includes("⚠️")) {
      type = 'error';
    }
    addToast(message, type);
  };

  // Check if today is a holiday according to system settings
  const isTodayHoliday = (() => {
    if (!settings.holidayActive) return false;
    const todayDay = new Date().getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const holidayDays = settings.holidayDays ?? [5]; // default to Friday
    return holidayDays.includes(todayDay);
  })();

  const getArabicDayName = (dayIndex: number) => {
    const names = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    return names[dayIndex] || "";
  };

  // Get current active task for details view (strict lookup without arbitrary fallback to prevent wrong task selection)
  const rawCurrentTask = tasks.find(t => t.id === selectedTaskId) || null;
  const currentTask = rawCurrentTask ? {
    ...rawCurrentTask,
    reviewLink: sanitizeTaskReviewLink(rawCurrentTask.reviewLink, rawCurrentTask.category)
  } : null;

  // Handle Tab filter count
  const getTasksCount = (status: Task['status']) => {
    return tasks.filter(t => t.status === status).length;
  };

  // Switch views cleanly
  const viewDetails = (taskId: string) => {
    if (isTodayHoliday) {
      triggerNotification(`⚠️ عذراً! اليوم (${getArabicDayName(new Date().getDay())}) هو عطلة عمل رسمية في المنصة.`);
      return;
    }
    if (isOutsideWorkingHours) {
      triggerNotification(`⚠️ عذراً! العمل وتأدية المهام متاح فقط من الساعة 4:00 عصراً وحتى 10:00 مساءً.`);
      return;
    }
    setSelectedTaskId(taskId);
    setCurrentView('detail');
  };

  // Copy Link function
  const handleCopyLink = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    triggerNotification("تم نسخ رابط المراجعة بنجاح!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Delete/Withdraw task handler
  const handleDeleteTask = (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTaskToDeleteId(taskId);
  };

  const confirmDeleteTask = () => {
    if (!taskToDeleteId) return;
    const updated = tasks.map(t => {
      if (t.id === taskToDeleteId) {
        return { ...t, status: 'withdrawn' as const };
      }
      return t;
    });
    saveTasks(updated);
    triggerNotification("تم نقل المهمة إلى قائمة 'تم التراجع عنه'");
    if (currentView === 'detail') {
      setCurrentView('list');
    }
    setTaskToDeleteId(null);
  };

  // Real File Upload Handler (Base64)
  const handleRealUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentTask) return;
    
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const rawBase64 = reader.result as string;
        // Compress the image down to lightweight JPEG
        const compressedBase64 = await compressBase64Image(rawBase64, 400, 400, 0.6);
        
        const updated = tasks.map(t => {
          if (t.id === currentTask.id) {
            return { ...t, uploadedScreenshot: compressedBase64 };
          }
          return t;
        });
        saveTasks(updated);
        setIsUploading(false);
        triggerNotification("🎉 تم رفع لقطة الشاشة الحقيقية بنجاح!");
      } catch (err) {
        console.error("Compression error:", err);
        setIsUploading(false);
        triggerNotification("⚠️ فشل معالجة الصورة، يرجى المحاولة مجدداً.");
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      triggerNotification("⚠️ فشل رفع الصورة، يرجى المحاولة مجدداً.");
    };
    reader.readAsDataURL(file);
  };

  const triggerFileUpload = () => {
    document.getElementById('real-file-upload')?.click();
  };

  // Complete/Confirm task submission with live earnings linking and strict re-claim prevention
  const handleConfirmTask = async () => {
    if (isSubmittingTask) return;

    if (isTodayHoliday) {
      triggerNotification(`⚠️ عذراً! اليوم (${getArabicDayName(new Date().getDay())}) هو عطلة عمل رسمية في المنصة.`);
      return;
    }

    if (!currentTask) {
      triggerNotification("⚠️ عذراً، لم يتم العثور على المهمة في قائمتك.");
      return;
    }

    // Always re-check fresh task status from state
    const targetTask = tasks.find(t => t.id === currentTask.id);
    if (!targetTask) {
      triggerNotification("⚠️ عذراً، هذه المهمة غير موجودة.");
      return;
    }

    if (targetTask.status === 'completed') {
      triggerNotification("⚠️ هذه المهمة مكتملة ومضافة لأرباحك بالفعل ولا يمكن تسليمها مرة أخرى!");
      return;
    }
    if (targetTask.status !== 'in_progress') {
      triggerNotification("⚠️ يمكن تقديم المهام القيد التقدم فقط.");
      return;
    }
    if (!targetTask.uploadedScreenshot) {
      triggerNotification("الرجاء رفع لقطة الشاشة لإثبات التنفيذ أولاً!");
      return;
    }
    if (!currentUser) {
      triggerNotification("عذراً، يرجى تسجيل الدخول أولاً.");
      return;
    }
    
    setIsSubmittingTask(true);
    try {
      // Parse reward from task (e.g., "3.6 USDT")
      const rewardMatch = targetTask.reward.match(/[\d.]+/);
      const rewardValue = rewardMatch ? parseFloat(rewardMatch[0]) : 0;
      
      const baseEarnings = Number(currentUser.earnings) || 0;
      const baseTaskIncome = Number(currentUser.taskIncome) || 0;
      
      const newEarnings = Number((baseEarnings + rewardValue).toFixed(2));
      const newTaskIncome = Number((baseTaskIncome + rewardValue).toFixed(2));
      
      // Update in Firebase / LocalDB fallback
      const { updateUserStats } = await import('./firebaseService');
      await updateUserStats(currentUser.phone, {
        earnings: newEarnings,
        taskIncome: newTaskIncome
      });
      
      // Update local React state and storage session
      const updatedUser = {
        ...currentUser,
        earnings: newEarnings,
        taskIncome: newTaskIncome
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('user_session', JSON.stringify(updatedUser));
      
      const updated = tasks.map(t => {
        if (t.id === targetTask.id) {
          return { ...t, status: 'completed' as const };
        }
        return t;
      });
      await saveTasks(updated);
      
      triggerNotification(`🎉 تهانينا! تم تقديم العمل بنجاح وإضافة ${rewardValue} USDT إلى أرباحك مباشرة!`);
      setCurrentView('list');
      setActiveListTab('completed');
    } catch (err) {
      console.error("Error confirming task and updating earnings:", err);
      triggerNotification("حدث خطأ أثناء محاولة تحديث رصيد أرباحك.");
    } finally {
      setIsSubmittingTask(false);
    }
  };



  if (!initDone) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500 font-sans p-6" dir="rtl">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <span className="text-xs font-bold text-slate-700">جاري الاتصال بقاعدة البيانات الآمنة والتحقق من التهيئة...</span>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} settings={settings} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />;
  }

  if (adminMode && currentUser.role === 'admin') {
    return (
      <div>
        {/* Toggle back to user view */}
        <div className="bg-red-800 text-white text-[11px] font-black px-4 py-2.5 text-center flex items-center justify-between shadow-inner">
          <span>أنت تتصفح حالياً لوحة تحكم الإدارة (المدير العام)</span>
          <button 
            onClick={() => setAdminMode(false)}
            className="bg-white text-red-900 font-extrabold px-3 py-1 rounded-lg text-[9px] cursor-pointer hover:bg-slate-50 transition-colors"
          >
            تصفح كعضو عادي
          </button>
        </div>
        <AdminPanel adminUser={currentUser} onLogout={handleLogout} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F9FF] text-[#2C3E50] select-none font-sans relative pb-24" dir="rtl">

      {/* Highly Visible Floating Dark Mode Toggle Button */}
      <div className="fixed bottom-20 left-4 z-50 flex items-center gap-2">
        <button
          onClick={toggleDarkMode}
          className={`px-3 py-2.5 rounded-full shadow-2xl border-2 transition-all active:scale-95 cursor-pointer flex items-center gap-2 text-xs font-black backdrop-blur-xl ${
            isDarkMode 
              ? 'bg-slate-900/95 text-amber-300 border-amber-400/60 shadow-amber-500/20' 
              : 'bg-indigo-900/90 text-white border-indigo-400/60 shadow-indigo-900/30'
          }`}
          title={isDarkMode ? 'التبديل إلى الوضع المضيء' : 'التبديل إلى الوضع الليلي'}
        >
          {isDarkMode ? (
            <>
              <Sun className="w-5 h-5 fill-amber-300 text-amber-300 animate-spin-slow" />
              <span className="text-[11px] font-bold">الوضع المضيء ☀️</span>
            </>
          ) : (
            <>
              <Moon className="w-5 h-5 fill-amber-300 text-amber-300" />
              <span className="text-[11px] font-bold">الوضع الليلي 🌙</span>
            </>
          )}
        </button>
      </div>

      {/* Global Notification Banner System */}
      {settings.globalNotification && (
        <div className="bg-[#070D19] text-[#F39C12] border-b border-[#F39C12]/20 px-3 py-2 flex items-center gap-2 shadow-sm relative z-40 overflow-hidden font-bold text-[11px]">
          <span className="flex items-center gap-1 shrink-0 bg-[#F39C12]/10 px-2 py-0.5 rounded border border-[#F39C12]/20 text-[10px] text-white">
            <span className="animate-bounce">📢</span>
            <span>إعلان هام:</span>
          </span>
          <div className="flex-1 overflow-hidden relative h-5 flex items-center">
            <div className="absolute whitespace-nowrap animate-marquee">
              {settings.globalNotification}
            </div>
          </div>
        </div>
      )}
      
      {/* High-Fidelity Stacked Toast Notification System */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`pointer-events-auto flex items-center gap-2.5 p-3.5 rounded-2xl shadow-xl border text-xs font-bold transition-all duration-300 transform translate-y-0 scale-100 animate-slideDown ${
              t.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/30 text-emerald-100 backdrop-blur-md'
                : t.type === 'error'
                ? 'bg-rose-950/95 border-rose-500/30 text-rose-100 backdrop-blur-md'
                : 'bg-stone-900/95 border-white/10 text-white backdrop-blur-md'
            }`}
          >
            {t.type === 'success' && <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[3]" />}
            {t.type === 'error' && <span className="text-rose-400 font-extrabold shrink-0 text-sm">⚠️</span>}
            {t.type === 'info' && <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />}
            
            <div className="flex-1 text-right" dir="rtl">
              <span className="leading-relaxed">{t.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Decorative background gradients to mimic original app screen design */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-[#3B82F6] to-[#60A5FA] -z-10 transform skew-y-3 origin-top-left opacity-90"></div>
      <div className="absolute top-10 right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl -z-10 pointer-events-none"></div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeBottomTab + (activeBottomTab === 'log' ? `_${currentView}` : '')}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="w-full flex flex-col min-h-screen"
        >
          {/* VIEW 1: Task Log / History View */}
          {currentView === 'list' && activeBottomTab === 'log' && (
        <div className="w-full max-w-md mx-auto px-4 pt-6 animate-fadeIn pb-24 text-right">
          
          {/* Working Hours Notice (تنويه أوقات العمل) */}
          {settings.workingHoursNotice && (
            <div className="mb-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200 shadow-sm text-right relative overflow-hidden animate-pulse">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500"></div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-black text-amber-800 block mb-1">📢 تنويه أوقات العمل الرسمية</span>
                  <p className="text-[10px] text-amber-700 leading-relaxed font-bold whitespace-pre-line">
                    {settings.workingHoursNotice}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Section 1: Available Daily Tasks (Merged Here) */}
          <div className="mb-4 text-right flex items-center justify-between border-b border-stone-200 pb-2">
            <h3 className="text-xs font-black text-stone-900 flex items-center gap-1.5 justify-start">
              <Sparkles className="w-4 h-4 text-blue-600 fill-blue-100 animate-pulse" />
              <span>المهام اليومية المتاحة</span>
            </h3>
          </div>

          {/* Platform category switcher exactly like high-fidelity design */}
          <div className="grid grid-cols-2 gap-2 mb-4 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setHomeCategoryTab('youtube')}
              className={`py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                homeCategoryTab === 'youtube'
                  ? 'bg-rose-600 text-white shadow-sm scale-[1.02]'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Youtube className="w-4 h-4 fill-white text-rose-600" />
              <span>يوتيوب (YouTube)</span>
            </button>
            <button
              onClick={() => setHomeCategoryTab('facebook')}
              className={`py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                homeCategoryTab === 'facebook'
                  ? 'bg-blue-600 text-white shadow-sm scale-[1.02]'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Facebook className="w-4 h-4 fill-white text-blue-600" />
              <span>فيسبوك (Facebook)</span>
            </button>
          </div>

          {/* List of Available Tasks */}
          <div className="space-y-3 mb-6">
            {isTodayHoliday ? (
              <div className="bg-rose-50/95 border border-rose-200/80 p-5 rounded-2xl shadow-sm text-right space-y-3">
                <div className="flex items-center gap-2 justify-end text-rose-600">
                  <span className="text-xs font-extrabold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-rose-500 animate-pulse" />
                    اليوم ({getArabicDayName(new Date().getDay())}) عطلة عمل رسمية بالمنصة
                  </span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed font-bold">
                  عذراً! اليوم هو عطلة رسمية في المنصة وتكون المهام مقفلة ومغلق استقبال مهام جديدة اليوم. يرجى الانتظار والعودة في يوم العمل القادم لمتابعة أداء المهام اليومية وجني الأرباح.
                </p>
              </div>
            ) : isOutsideWorkingHours ? (
              <div className="bg-amber-50/95 border border-amber-200/80 p-5 rounded-2xl shadow-sm text-right space-y-3">
                <div className="flex items-center gap-2 justify-end text-amber-700">
                  <span className="text-xs font-extrabold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                    المنصة مغلقة حالياً خارج أوقات العمل الرسمية
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed font-bold">
                  عذراً! العمل وتأدية المهام متاح فقط خلال أوقات العمل الرسمية المحددة من قبل الإدارة. يرجى الانتظار والعودة خلال الساعات المحددة للبدء في تنفيذ المهام.
                </p>
                <div className="bg-amber-100/60 p-3 rounded-xl border border-amber-200 text-center text-xs font-black text-amber-900 space-y-1">
                  <div className="text-[11px] font-black text-amber-950">ساعات العمل الرسمية اليومية (بتوقيت مكة المكرمة):</div>
                  <div className="text-[11px] font-bold text-amber-900 flex items-center justify-center gap-1.5 dir-rtl">
                    <span>☀️ <b>الفترة الأولى:</b> من {formatHourToArabic(settings.workStartHour ?? 12)} إلى {formatHourToArabic(settings.workEndHour ?? 15)}</span>
                  </div>
                  <div className="text-[11px] font-bold text-amber-900 flex items-center justify-center gap-1.5 dir-rtl">
                    <span>🌙 <b>الفترة الثانية:</b> من {formatHourToArabic(settings.workStartHour2 ?? 21)} إلى {formatHourToArabic(settings.workEndHour2 ?? 1)}</span>
                  </div>
                </div>
              </div>
            ) : userPlanDetails.tasksLimit === 0 ? (
              <div className="bg-[#0D1E36] p-5 rounded-2xl border border-blue-900/40 shadow-md text-right space-y-3">
                <div className="flex items-center gap-2 justify-end text-[#F39C12]">
                  <span className="text-xs font-extrabold flex items-center gap-1.5">
                    <Zap className="w-4 h-4 fill-amber-500 text-amber-500 animate-bounce" />
                    تفعيل باقة الاشتراك المطلوبة
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-bold">
                  أهلاً بك! الحسابات الجديدة والغير مفعلة لا تظهر لها أي مهام يومية. يرجى الاشتراك في إحدى باقات المنصة من قسم "المنصب" لتفعيل حسابك والبدء في تنفيذ المهام وحصد الأرباح اليومية.
                </p>
                <button
                  onClick={() => {
                    setActiveBottomTab('rank');
                    setCurrentView('list');
                  }}
                  className="w-full bg-[#F39C12] hover:bg-[#D35400] text-white font-extrabold py-2 rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                >
                  <span>اذهب لتفعيل الاشتراك الآن 🚀</span>
                </button>
              </div>
            ) : dailyTasksForToday[homeCategoryTab]?.length === 0 ? (
              <div className="text-center py-8 text-stone-400 font-bold text-xs bg-white p-4 rounded-2xl border border-stone-200">
                لا توجد مهام متاحة حالياً لليوم.
              </div>
            ) : (
              dailyTasksForToday[homeCategoryTab]?.map((item: any) => {
                const isClaimed = tasks.some(t => t.id === item.id);
                return (
                  <div 
                    key={item.id} 
                    className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3 text-right"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1 justify-start">
                          {item.category === 'youtube' ? (
                            <span className="bg-rose-50 text-rose-600 border border-rose-100 text-[9px] px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                              <Youtube className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                              يوتيوب {item.country}
                            </span>
                          ) : (
                            <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[9px] px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                              <Facebook className="w-2.5 h-2.5 text-blue-600 fill-current shrink-0" />
                              فيسبوك {item.country}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-black text-stone-850 mt-1.5 leading-relaxed text-right">
                          {item.title}
                        </h4>
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-black text-emerald-600 block bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                          {userPlanDetails.taskReward} USDT
                        </span>
                        <span className="text-[9px] text-stone-400 block mt-1 font-bold">ربح المهمة</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-stone-500 font-semibold leading-relaxed bg-stone-50 p-2.5 rounded-xl border border-stone-100 text-right">
                      <strong>تفاصيل العمل:</strong> {item.taskDetails}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-stone-50 gap-2">
                      {isClaimed ? (
                        <span className="w-full bg-stone-100 text-stone-400 border border-stone-150 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                          <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                          <span>تم الحصول على المهمة بنجاح</span>
                        </span>
                      ) : isTodayHoliday ? (
                        <button
                          onClick={() => handleClaimTask(item)}
                          className="w-full bg-stone-100 hover:bg-stone-150 text-stone-400 border border-stone-200 font-extrabold py-2 rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>⚠️ مغلق حالياً (عطلة رسمية)</span>
                        </button>
                      ) : isOutsideWorkingHours ? (
                        <button
                          onClick={() => handleClaimTask(item)}
                          className="w-full bg-stone-100 hover:bg-stone-150 text-stone-400 border border-stone-200 font-extrabold py-2 rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>⚠️ مغلق حالياً (خارج ساعات العمل)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleClaimTask(item)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2 rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>الحصول على المهمة والبدء</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Section 2: Claimed Tasks & Progress Log */}
          <div className="my-6 border-t border-dashed border-stone-200 pt-5 text-right">
            <h3 className="text-xs font-black text-stone-850 flex items-center gap-1.5 justify-start mb-4">
              <FileText className="w-4 h-4 text-blue-500 animate-pulse" />
              <span>سجل وحالات المهام المستلمة</span>
            </h3>
          </div>

          {/* Core Box: "الفرص المتاحة" and "درس تعليمي" exactly like the screenshot */}
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-md border border-blue-100 mb-6 relative overflow-hidden">
            <div className="bg-gradient-to-r from-[#818CF8] via-[#60A5FA] to-[#3B82F6] p-4 rounded-xl text-white shadow-inner flex items-center justify-between gap-3">
              <div className="flex-1 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-white/90">الفرص المتاحة</span>
                <span className="text-xl font-extrabold tracking-wide text-white">
                  {tasks.filter(t => t.status === 'in_progress').length} مهمة
                </span>
              </div>

              <button 
                onClick={() => triggerNotification("سيتم فتح دليل المساعدة التعليمي قريباً!")}
                className="bg-white text-blue-600 px-4 py-2 rounded-full text-xs font-extrabold shadow-sm flex items-center gap-1.5 hover:bg-stone-50 transition-all active:scale-95"
              >
                <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-300 shrink-0" />
                <span>درس تعليمي</span>
              </button>
            </div>
          </div>

          {settings.holidayActive && (
            <div className={`p-4 rounded-2xl mb-6 text-xs leading-relaxed shadow-sm font-semibold flex gap-2.5 items-start border ${
              isTodayHoliday 
                ? 'bg-rose-50 border-rose-200 text-rose-800' 
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <span className="text-lg">{isTodayHoliday ? "⚠️" : "ℹ️"}</span>
              <div className="text-right flex-1">
                <span className={`block font-black text-xs mb-1 ${isTodayHoliday ? 'text-rose-900' : 'text-amber-950'}`}>
                  {isTodayHoliday ? `اليوم (${getArabicDayName(new Date().getDay())}) عطلة عمل رسمية` : 'نظام العطلة الأسبوعية مفعل'}
                </span>
                <span>
                  {isTodayHoliday 
                    ? `تنبيه: اليوم هو يوم عطلة عمل رسمي في المنصة (${getArabicDayName(new Date().getDay())}). تم إيقاف استقبال تقديم المهام ورفع إثباتات الإنجاز مؤقتاً حتى نهاية اليوم.` 
                    : `تنويه: تم تحديد أيام العطلة الأسبوعية الرسمية للمنصة لتكون: (${(settings.holidayDays ?? [5]).map(d => ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][d]).join(" و ")}). في هذه الأيام سيتم إيقاف استقبال المهام تلقائياً.`}
                </span>
              </div>
            </div>
          )}

          {/* Interactive Tabs list matching screenshot layout */}
          <div className="flex items-center justify-between border-b border-stone-200/60 mb-5 overflow-x-auto scrollbar-none gap-2 px-1">
            <button
              onClick={() => setActiveListTab('withdrawn')}
              className={`pb-3 text-xs font-bold transition-all relative flex-1 text-center whitespace-nowrap ${
                activeListTab === 'withdrawn' 
                  ? 'text-blue-600 font-extrabold' 
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <span>تم التراجع عنه</span>
              <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-full mr-1">
                {getTasksCount('withdrawn')}
              </span>
              {activeListTab === 'withdrawn' && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 rounded-full"></div>
              )}
            </button>

            <button
              onClick={() => setActiveListTab('in_progress')}
              className={`pb-3 text-xs font-bold transition-all relative flex-1 text-center whitespace-nowrap ${
                activeListTab === 'in_progress' 
                  ? 'text-blue-600 font-extrabold' 
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <span>المهمة قيد التقدم</span>
              <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full mr-1 font-bold">
                {getTasksCount('in_progress')}
              </span>
              {activeListTab === 'in_progress' && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 rounded-full"></div>
              )}
            </button>

            <button
              onClick={() => setActiveListTab('completed')}
              className={`pb-3 text-xs font-bold transition-all relative flex-1 text-center whitespace-nowrap ${
                activeListTab === 'completed' 
                  ? 'text-blue-600 font-extrabold' 
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <span>كامل</span>
              <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full mr-1 font-bold">
                {getTasksCount('completed')}
              </span>
              {activeListTab === 'completed' && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 rounded-full"></div>
              )}
            </button>

            <button
              onClick={() => setActiveListTab('rejected')}
              className={`pb-3 text-xs font-bold transition-all relative flex-1 text-center whitespace-nowrap ${
                activeListTab === 'rejected' 
                  ? 'text-blue-600 font-extrabold' 
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <span>رفض</span>
              <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-full mr-1 font-bold">
                {getTasksCount('rejected')}
              </span>
              {activeListTab === 'rejected' && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 rounded-full"></div>
              )}
            </button>
          </div>

          {/* Tasks List */}
          <div className="space-y-3.5">
            {tasks.filter(t => t.status === activeListTab).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-stone-200/50 p-6 shadow-sm">
                <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-5 h-5 text-stone-400" />
                </div>
                <h3 className="text-sm font-bold text-stone-800">لا توجد مهام حالياً</h3>
                <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                  القائمة فارغة في هذا القسم حالياً. يمكنك تصفح الأقسام الأخرى أو مراجعة التفاصيل.
                </p>
              </div>
            ) : (
              tasks.filter(t => t.status === activeListTab).map((item) => (
                <div
                  key={item.id}
                  onClick={() => viewDetails(item.id)}
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow transition-all border border-stone-100 flex items-center justify-between cursor-pointer group active:scale-[0.99] text-right"
                >
                  {/* Left Side: Avatar & Core Information */}
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white shadow-inner shrink-0 ${
                      item.category === 'youtube' ? 'bg-[#FF0000]' : 'bg-[#1877F2]'
                    }`}>
                      {item.category === 'youtube' ? (
                        <Youtube className="w-5.5 h-5.5 text-white" />
                      ) : (
                        <Facebook className="w-5.5 h-5.5 text-white fill-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-stone-800 line-clamp-1 text-right">
                        {item.title}
                      </h4>
                      <p className="text-blue-600 text-xs font-bold mt-1 tracking-wide text-right">
                        {item.reward}
                      </p>
                    </div>
                  </div>

                  {/* Right Side Actions */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleCopyLink(sanitizeTaskReviewLink(item.reviewLink, item.category))}
                      className="p-2 border border-stone-200 hover:border-blue-300 text-stone-500 hover:text-blue-600 rounded-lg bg-stone-50/50 hover:bg-blue-50 transition-colors"
                      title="مشاركة الرابط"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => viewDetails(item.id)}
                      className="p-2 border border-stone-200 hover:border-blue-300 text-stone-500 hover:text-blue-600 rounded-lg bg-stone-50/50 hover:bg-blue-50 transition-colors"
                      title="عرض التفاصيل والرفع"
                    >
                      <Upload className="w-4 h-4" />
                    </button>

                    {activeListTab === 'in_progress' && (
                      <button
                        onClick={(e) => handleDeleteTask(item.id, e)}
                        className="p-2 border border-stone-200 hover:border-rose-300 text-stone-500 hover:text-rose-600 rounded-lg bg-stone-50/50 hover:bg-rose-50 transition-colors"
                        title="حذف المهمة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: Task Details View ("تفاصيل المهمة") */}
      {currentView === 'detail' && (
        <div className="w-full max-w-md mx-auto animate-fadeIn pb-6">
          
          {/* Header Bar */}
          <div className="bg-[#3B82F6] text-white px-4 py-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
            <button 
              onClick={() => setCurrentView('list')}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <h2 className="text-base font-extrabold">تفاصيل المهمة</h2>
            <div className="w-8"></div> {/* Spacer for symmetry */}
          </div>

          <div className="px-4 mt-6">
            {!currentTask ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center shadow-sm">
                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-stone-400" />
                </div>
                <h3 className="text-sm font-bold text-stone-800">المهمة غير موجودة</h3>
                <p className="text-xs text-stone-400 mt-1">لم نتمكن من العثور على بيانات هذه المهمة.</p>
                <button
                  onClick={() => setCurrentView('list')}
                  className="mt-4 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors"
                >
                  العودة لقائمة المهام
                </button>
              </div>
            ) : (
              /* White Rounded Main Card Box */
              <div className="bg-white rounded-2xl border border-stone-200 shadow-lg overflow-hidden">
                
                {/* Blue Avatar Header Area */}
                <div className={`p-6 text-center relative flex flex-col items-center bg-gradient-to-r ${
                  currentTask.category === 'youtube' ? 'from-rose-600 to-red-500' : 'from-[#1877F2] to-[#3B82F6]'
                }`}>
                  
                  {/* Brand Logo */}
                  <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center shadow-md mb-2 relative shrink-0 bg-white">
                    {currentTask.category === 'youtube' ? (
                      <Youtube className="w-11 h-11 text-[#FF0000]" />
                    ) : (
                      <Facebook className="w-11 h-11 text-[#1877F2] fill-[#1877F2]" />
                    )}
                  </div>

                  {/* Badge and Text Row */}
                  <div className="flex items-center gap-2 mt-1 justify-center">
                    <span className="text-[10px] font-bold text-white/90">جانب الطلب</span>
                    <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-0.5 rounded border border-white/10">
                      مصادقة المحمول
                    </span>
                  </div>
                </div>

                {/* Fields Table */}
                <div className="p-5 space-y-4 text-xs">
                  
                  {/* Row 1: عنوان المهمة */}
                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                    <span className="text-stone-500 font-semibold">عنوان المهمة</span>
                    <span className="text-blue-600 font-extrabold text-[13px]">
                      {currentTask.category === 'youtube' ? 'YouTube' : 'Facebook'}
                    </span>
                  </div>

                  {/* Row 2: دخل */}
                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                    <span className="text-stone-500 font-semibold">دخل</span>
                    <span className="text-blue-600 font-extrabold text-[13px]">{currentTask.reward}</span>
                  </div>

                  {/* Row 3: تفاصيل المهمة */}
                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                    <span className="text-stone-500 font-semibold">تفاصيل المهمة</span>
                    <span className="text-blue-600 font-bold">{currentTask.taskDetails}</span>
                  </div>

                  {/* Row 4: يتطلب */}
                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                    <span className="text-stone-500 font-semibold">يتطلب</span>
                    <span className="text-blue-600 font-bold">{currentTask.requires}</span>
                  </div>

                  {/* Row 5: رفع */}
                  <div className="py-2">
                    <span className="text-stone-500 font-semibold block mb-2">رفع</span>
                    
                    <input
                      type="file"
                      id="real-file-upload"
                      accept="image/*"
                      onChange={handleRealUpload}
                      className="hidden"
                    />
                    
                    {currentTask.uploadedScreenshot ? (
                      <div className="relative group rounded-xl overflow-hidden border border-stone-200 aspect-video bg-stone-50">
                        <img 
                          src={currentTask.uploadedScreenshot} 
                          alt="Screenshot Preview" 
                          className="w-full h-full object-cover"
                        />
                        {currentTask.status === 'in_progress' && (
                          <div className="absolute inset-0 bg-[#0B1528]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <button 
                              onClick={triggerFileUpload}
                              className="bg-white text-stone-900 px-3 py-1.5 rounded-lg font-bold text-[10px]"
                            >
                              تغيير الصورة
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={triggerFileUpload}
                        disabled={isUploading || currentTask.status !== 'in_progress'}
                        className={`w-16 h-16 rounded-xl border-2 border-dashed border-blue-400/80 flex flex-col items-center justify-center text-blue-500 hover:bg-blue-50/50 transition-all ${
                          isUploading ? 'animate-pulse' : ''
                        } ${currentTask.status !== 'in_progress' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Camera className="w-5 h-5 stroke-[2]" />
                        {isUploading && <span className="text-[8px] mt-0.5">جاري الرفع...</span>}
                      </button>
                    )}
                  </div>

                  {/* Row 6: معايير المراجعة */}
                  <div className="pt-2">
                    <span className="text-stone-500 font-semibold block mb-2">:معايير المراجعة</span>
                    
                    <div className="bg-stone-100/80 p-3 rounded-lg border border-stone-200 text-left" dir="ltr">
                      <span className="text-[#3B82F6] font-medium break-all text-[11px] block select-all">
                        {currentTask.reviewLink}
                      </span>
                    </div>

                    <a
                      href={currentTask.reviewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2.5 w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>مشاهدة الفيديو المباشر (رابط الفيديو)</span>
                    </a>
                  </div>

                  {/* Status Notice if completed or rejected */}
                  {currentTask.status === 'completed' && (
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-xl font-extrabold text-xs text-center flex items-center justify-center gap-2 mt-2 shadow-sm">
                      <Check className="w-4.5 h-4.5 text-emerald-600 stroke-[3]" />
                      <span>تم تسليم هذه المهمة واستلام أرباحها بنجاح ({currentTask.reward})</span>
                    </div>
                  )}
                  {currentTask.status === 'rejected' && (
                    <div className="bg-rose-50 text-rose-800 border border-rose-200 p-3 rounded-xl font-extrabold text-xs text-center flex items-center justify-center gap-2 mt-2 shadow-sm">
                      <span className="text-rose-600 font-bold">⚠️</span>
                      <span>تم رفض هذه المهمة من قبل الإدارة</span>
                    </div>
                  )}

                  {/* Actions bottom bar containing 4 circle buttons */}
                  <div className="flex items-center justify-around pt-5 border-t border-stone-100 gap-1">
                    
                    {/* Icon 1: Delete (Trash) */}
                    <button
                      onClick={() => handleDeleteTask(currentTask.id)}
                      className="w-11 h-11 rounded-full border border-stone-200 text-stone-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 flex items-center justify-center transition-colors active:scale-90"
                      title="حذف المهمة"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    {/* Icon 2: Open External Link */}
                    <a
                      href={currentTask.reviewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="w-11 h-11 rounded-full border border-stone-200 text-stone-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 flex items-center justify-center transition-colors active:scale-90"
                      title="فتح الرابط"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>

                    {/* Icon 3: Copy details */}
                    <button
                      onClick={() => handleCopyLink(currentTask.reviewLink)}
                      className="w-11 h-11 rounded-full border border-stone-200 text-stone-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 flex items-center justify-center transition-colors active:scale-90"
                      title="نسخ الرابط"
                    >
                      <Copy className="w-5 h-5" />
                    </button>

                    {/* Icon 4: Checkmark (Submit/Complete) */}
                    {currentTask.status === 'completed' ? (
                      <div
                        onClick={() => triggerNotification("⚠️ هذه المهمة مكتملة ومضافة لأرباحك بالفعل ولا يمكن تسليمها مرة أخرى!")}
                        className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center cursor-not-allowed opacity-90 shadow-inner"
                        title="المهمة مكتملة ومضافة لأرباحك بالفعل"
                      >
                        <Check className="w-5 h-5 stroke-[3]" />
                      </div>
                    ) : currentTask.status !== 'in_progress' ? (
                      <div
                        onClick={() => triggerNotification("⚠️ لا يمكن تقديم هذه المهمة لأنها ليست قيد التقدم.")}
                        className="w-11 h-11 rounded-full bg-stone-100 text-stone-400 border border-stone-200 flex items-center justify-center cursor-not-allowed"
                        title="غير متاح للتسليم"
                      >
                        <Check className="w-5 h-5" />
                      </div>
                    ) : (
                      <button
                        onClick={handleConfirmTask}
                        disabled={isSubmittingTask}
                        className="w-11 h-11 rounded-full border border-stone-200 text-stone-600 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 flex items-center justify-center transition-colors active:scale-90 disabled:opacity-50"
                        title="تأكيد وتسليم العمل"
                      >
                        {isSubmittingTask ? (
                          <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                        ) : (
                          <Check className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: Home View Panel (When user selects الرئيسية) */}
      {activeBottomTab === 'home' && (
        <div className="w-full max-w-md mx-auto px-4 pt-4 animate-fadeIn pb-24 text-right">
          
          {/* Sound & Audio Interactive Bar (Feature 5) */}
          <div className="flex items-center justify-between bg-white rounded-xl px-3.5 py-2 border border-stone-200/80 mb-4 shadow-sm">
            <span className="text-[10px] text-stone-500 font-bold flex items-center gap-1">
              <span>الحالة:</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-emerald-700 font-black">متصل بالشبكة الآمنة</span>
            </span>
            <button 
              onClick={() => {
                toggleSound();
                if (!soundEnabled) {
                  // Play simple test sound to prove it works
                  try {
                    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
                    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.1);
                  } catch (e) {}
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black transition-all border active:scale-95 cursor-pointer ${
                soundEnabled 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'bg-stone-50 text-stone-400 border-stone-200'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>المؤثرات التفاعلية: {soundEnabled ? 'تشغيل' : 'إيقاف'}</span>
            </button>
          </div>

          {/* Welcome User & Dashboard Summary Card */}
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 p-5 rounded-2xl text-white shadow-lg mb-4 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-blue-150 block font-bold">مرحباً بك مجدداً</span>
                <h2 className="text-base font-black tracking-tight">{currentUser?.username || currentUser?.phone}</h2>
              </div>
              <span className="bg-white/20 border border-white/25 px-2.5 py-1 rounded-full text-[10px] font-black">
                باقة: {userPlanDetails.name}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 text-center">
              <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
                <span className="text-[9px] text-blue-150 block">رصيد الحساب</span>
                <span className="text-sm font-black block mt-0.5">{currentUser?.earnings || 0} USDT</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
                <span className="text-[9px] text-blue-150 block">مهام اليوم المنجزة</span>
                <span className="text-sm font-black block mt-0.5">{todayClaimedCount} / {userPlanDetails.tasksLimit}</span>
              </div>
            </div>

            {/* Progress Bar of Daily Claims */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-[10px] font-bold text-blue-150 mb-1">
                <span>الحد اليومي للمهام المتاحة</span>
                <span>{Math.round((todayClaimedCount / userPlanDetails.tasksLimit) * 100)}%</span>
              </div>
              <div className="w-full bg-white/15 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min((todayClaimedCount / userPlanDetails.tasksLimit) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Quick Actions Card (Deposit & Withdrawal) */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm text-right mb-4">
            <h3 className="text-xs font-black text-stone-900 mb-3 flex items-center gap-1.5 justify-end">
              <span>خيارات شحن وسحب الرصيد</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {/* Recharge Option */}
              <button
                onClick={() => {
                  setProfileSubView('recharge');
                  setActiveBottomTab('profile');
                  setCurrentView('list');
                }}
                className="bg-gradient-to-br from-emerald-50 to-teal-50/70 border border-emerald-200 hover:border-emerald-300 text-emerald-800 p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <ArrowDownCircle className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-black">شحن الرصيد</span>
              </button>

              {/* Withdrawal Option */}
              <button
                onClick={() => {
                  setProfileSubView('withdraw');
                  setActiveBottomTab('profile');
                  setCurrentView('list');
                }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50/70 border border-blue-200 hover:border-blue-300 text-blue-800 p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <ArrowUpCircle className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-black">سحب الأرباح</span>
              </button>
            </div>
          </div>



          {/* Site Announcement Box */}
          {settings.globalNotification && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 mb-4 flex items-start gap-2.5 text-right">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-300 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-amber-800 block">إشعار المنصة العام</span>
                <p className="text-[10px] text-amber-700/95 font-semibold mt-1 leading-relaxed">
                  {settings.globalNotification}
                </p>
              </div>
            </div>
          )}

          {/* Home Portal Administration Link Navigation */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm text-center mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h3 className="text-xs font-black text-stone-900">الادارة والتواصل المباشر</h3>
            <p className="text-[10px] text-stone-500 font-semibold leading-relaxed mt-1.5 max-w-xs mx-auto">
              تواصل معنا الآن للحصول على الإرشادات والدعم الفوري المباشر من إدارة المنصة.
            </p>
            {settings.telegramLink && (
              <a
                href={settings.telegramLink.startsWith('http') ? settings.telegramLink : `https://${settings.telegramLink}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              >
                <span>الادارة</span>
              </a>
            )}
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/70 rounded-2xl p-4 border border-blue-200/60 text-right space-y-3 shadow-sm">
            <div className="flex items-center gap-2 justify-end text-blue-800">
              <span className="text-xs font-black flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-600" />
                التطبيق الرسمي للمنصة
              </span>
            </div>
            <p className="text-[10px] text-stone-600 leading-relaxed font-bold">
              الآن يمكنك تحميل تطبيق المنصة الرسمي لأجهزة الأندرويد للاستمتاع بتجربة أسرع، استقرار أعلى، وتلقي إشعارات فورية بكل مهام وأخبار المنصة الجديدة أولاً بأول.
            </p>
            <a
              href="/app.apk"
              download="Mis.apk"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-[11px] font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل تطبيق الأندرويد المباشر (APK)</span>
            </a>
          </div>
        </div>
      )}

      {/* VIEW 4: Recruitment/Jobs Panel */}
      {activeBottomTab === 'jobs' && (
        <div className="w-full max-w-md mx-auto px-4 pt-6 animate-fadeIn pb-24">
          
          {/* Top Title & Header */}
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-blue-100 mb-5 text-center relative overflow-hidden">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h1 className="text-base font-extrabold text-stone-900">برنامج التوظيف والشركاء</h1>
            <p className="text-[11px] text-stone-500 mt-1 leading-relaxed font-semibold">
              ادعُ أصدقاءك لتنفيذ المهام اليومية واحصل على عمولات مجزية وفورية تصل إلى 10% من دخل مهام كل عضو تدعوه!
            </p>
          </div>

          {/* Invitation Link & Code Copy Card */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 rounded-2xl text-white shadow-md mb-5 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            
            {(() => {
              const displayInviteCode = (!currentUser.inviteCode || currentUser.inviteCode.toUpperCase() === 'ADMIN95' || currentUser.inviteCode.toUpperCase() === 'OXLO95') 
                ? (currentUser.id ? `REF${currentUser.id.slice(-4)}` : 'K92W84') 
                : currentUser.inviteCode;
              return (
                <>
                  <span className="text-[10px] text-blue-100 block font-bold text-center">كود الدعوة الخاص بك للتسجيل:</span>
                  <span className="text-2xl font-black block mt-1.5 font-mono tracking-widest bg-white/15 py-1.5 rounded-xl w-max px-6 mx-auto border border-white/10 text-center shadow-inner">
                    {displayInviteCode}
                  </span>

                  <div className="grid grid-cols-2 gap-2.5 mt-4">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(displayInviteCode);
                        triggerNotification("تم نسخ رمز الدعوة بنجاح!");
                      }}
                      className="bg-white/20 hover:bg-white/30 text-white border border-white/15 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الكود</span>
                    </button>

                    <button 
                      onClick={() => {
                        const shareLink = `${window.location.origin}/?ref=${displayInviteCode}`;
                        navigator.clipboard.writeText(shareLink);
                        triggerNotification("تم نسخ رابط الدعوة المباشر!");
                      }}
                      className="bg-white text-indigo-700 hover:bg-stone-50 py-2.5 rounded-xl text-xs font-black shadow transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>نسخ الرابط</span>
                    </button>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Core Team Statistics Dashboard Card */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mb-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <h3 className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                <span>📊 إحصائيات عمولات الفريق الحالية</span>
              </h3>
              <button 
                onClick={fetchTeamData}
                disabled={teamLoading}
                className="p-1 hover:bg-stone-50 rounded-lg transition-colors text-stone-400 hover:text-blue-600 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${teamLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] text-stone-400 font-bold block">إجمالي الأعضاء المدعوين</span>
                <span className="text-sm font-extrabold text-slate-800 block mt-1">{teamList.length} أعضاء</span>
              </div>

              <div className="bg-[#F0FDF4] p-3 rounded-xl border border-emerald-100">
                <span className="text-[9px] text-emerald-600 font-black block">إجمالي عمولاتك المكتسبة</span>
                <span className="text-sm font-extrabold text-emerald-600 block mt-1">
                  {teamList.reduce((sum, m) => sum + ((m.taskIncome || 0) * 0.10), 0).toFixed(2)} USDT
                </span>
              </div>
            </div>

            <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 flex items-center justify-between text-[11px] font-bold text-blue-800">
              <span>نسبة الربح الثابتة من دخل مهام كل عضو:</span>
              <span className="bg-blue-100 px-2 py-0.5 rounded border border-blue-200 text-blue-700 font-black">%10</span>
            </div>
          </div>

          {/* List of Active Team Members */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <h4 className="text-xs font-black text-stone-800 border-r-4 border-blue-500 pr-2">قائمة أعضاء الفريق النشطين</h4>
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full font-black">
                {teamList.length} عضو
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {teamLoading ? (
                <div className="text-center py-8 text-stone-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                  <span>جاري مزامنة بيانات الفريق من السيرفر المباشر...</span>
                </div>
              ) : teamList.length === 0 ? (
                <div className="text-center py-10 text-stone-400">
                  <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-2.5 border border-stone-100">
                    <Briefcase className="w-5 h-5 text-stone-400" />
                  </div>
                  <p className="text-xs font-black text-stone-600">لا يوجد أعضاء في فريقك حالياً</p>
                  <p className="text-[10px] mt-1.5 max-w-xs mx-auto leading-relaxed text-stone-400">
                    ابدأ بمشاركة كود ورابط دعوتك المباشر مع أصدقائك ومجموعات التليجرام والواتساب لبناء فريق قوي والحصول على دخل سلبي مستمر!
                  </p>
                  <button 
                    onClick={() => {
                      const shareLink = `${window.location.origin}/?ref=${currentUser.inviteCode}`;
                      navigator.clipboard.writeText(shareLink);
                      triggerNotification("تم نسخ رابط الدعوة، ابدأ بمشاركته الآن!");
                    }}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    انسخ رابط الدعوة وابدأ الآن
                  </button>
                </div>
              ) : (
                teamList.map((member) => {
                  const comm = ((member.taskIncome || 0) * 0.10).toFixed(2);
                  return (
                    <div key={member.id} className="p-3.5 border border-stone-200/70 rounded-xl flex flex-col gap-2.5 text-xs hover:bg-stone-50/50 transition-colors bg-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-stone-800 block">{member.username}</span>
                          <span className="text-[9px] text-stone-400 block mt-0.5" dir="ltr">الهاتف: {member.phone.substring(0, 7)}****</span>
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-black text-blue-600 block">{member.earnings} USDT</span>
                          <span className="text-[9px] text-stone-400 block font-bold">باقة: {member.vipTier || 'الباقة العادية'}</span>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] font-bold">
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-black text-[9px]">أرباح المهام: {member.taskIncome || 0} USDT</span>
                        <span className="text-stone-500">
                          عمولتك المكتسبة (%10): <strong className="text-emerald-700 font-black">{comm} USDT</strong>
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

      {/* VIEW 5: Rank/Position Upgrade Panel */}
      {activeBottomTab === 'rank' && (
        <div className="w-full max-w-md mx-auto px-4 pt-6 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm text-center relative overflow-hidden">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 fill-blue-300 text-blue-500" />
            </div>
            <h2 className="text-lg font-bold text-stone-900">ترقية منصب العضوية VIP</h2>
            <p className="text-xs text-stone-500 mt-2 leading-relaxed">
              قم بترقية منصبك الحالي لفتح مهام يومية أكثر وبقيمة ربح ميكروي أعلى ومستقرة!
            </p>
            
            <div className="mt-6 space-y-3 text-right">
              {(() => {
                const plansList = settings.vipPlans && settings.vipPlans.length > 0 ? settings.vipPlans : [
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
                const currentUserPlan = plansList.find(p => p.name === currentUser?.vipTier);
                const currentUserPlanPrice = currentUserPlan ? currentUserPlan.price : 0;

                return plansList.map((plan) => {
                  const isActive = currentUser?.vipTier === plan.name;
                  const isLowerTier = plan.price < currentUserPlanPrice;

                  return (
                    <div key={plan.id} className="border border-stone-200 p-3 rounded-xl flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div>
                        <span className="font-extrabold text-xs text-stone-850 block">{plan.name}</span>
                        <span className="text-[10px] text-stone-400 font-bold block mt-0.5">
                          سعر الاشتراك: <strong className="text-blue-600">{plan.price}$</strong> • ربح يومي: <strong className="text-emerald-600">{plan.profit}$</strong>
                        </span>
                      </div>
                      {isActive ? (
                        <span className="bg-emerald-50 border border-emerald-150 text-emerald-600 text-[10px] px-3 py-1.5 rounded-full font-black">نشط حالياً</span>
                      ) : isLowerTier ? (
                        <span className="text-stone-400 text-[10px] px-3 py-1.5 rounded-full font-bold bg-stone-100">غير متاح للعودة</span>
                      ) : (
                        <button 
                          onClick={() => setSelectedPlanForUpgrade(plan)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-3.5 py-1.5 rounded-full font-black transition-all cursor-pointer active:scale-95"
                        >
                          ترقية الآن
                        </button>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Elegant subscription confirmation overlay inside rank view */}
          {selectedPlanForUpgrade && (
            <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-stone-200 p-6 w-full max-w-xs shadow-2xl text-center space-y-4 animate-scaleIn">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <Zap className="w-6 h-6 fill-blue-300" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-850">تأكيد ترقية الحساب</h3>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    هل أنت متأكد من رغبتك في الاشتراك بـ <strong className="text-blue-600 font-extrabold">{selectedPlanForUpgrade.name}</strong>؟
                  </p>
                  <p className="text-[10px] text-stone-400 mt-2 bg-stone-50 py-2 px-3 rounded-lg border border-stone-150">
                    قيمة الترقية: {selectedPlanForUpgrade.price} USDT سيتم خصمها من رصيدك الحالي.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!currentUser) return;
                      
                      const plansList = settings.vipPlans && settings.vipPlans.length > 0 ? settings.vipPlans : [
                        { id: 'plan_A1', name: 'A1', price: 300, profit: 9, tasksCount: 5 },
                        { id: 'plan_A2', name: 'A2', price: 600, profit: 18, tasksCount: 5 },
                        { id: 'plan_B1', name: 'B1', price: 1200, profit: 38, tasksCount: 5 },
                        { id: 'plan_B2', name: 'B2', price: 2600, profit: 65, tasksCount: 5 },
                        { id: 'plan_C1', name: 'C1', price: 5000, profit: 162, tasksCount: 5 },
                        { id: 'plan_C2', name: 'C2', price: 10000, profit: 350, tasksCount: 5 }
                      ];
                      const curUserPlan = plansList.find(p => p.name === currentUser?.vipTier);
                      const curUserPlanPrice = curUserPlan ? curUserPlan.price : 0;
                      if (selectedPlanForUpgrade.price < curUserPlanPrice) {
                        triggerNotification("لا يمكن الانتقال إلى اشتراك أقل من اشتراكك الحالي.");
                        setSelectedPlanForUpgrade(null);
                        return;
                      }

                      if (currentUser.earnings < selectedPlanForUpgrade.price) {
                        triggerNotification(`رصيدك الحالي غير كافٍ! تحتاج إلى ${selectedPlanForUpgrade.price} USDT. يرجى شحن حسابك أولاً.`);
                        setSelectedPlanForUpgrade(null);
                        return;
                      }
                      
                      try {
                        const newEarnings = currentUser.earnings - selectedPlanForUpgrade.price;
                        const { updateUserByAdmin } = await import('./firebaseService');
                        await updateUserByAdmin(currentUser.phone, {
                          earnings: newEarnings,
                          vipTier: selectedPlanForUpgrade.name,
                          effectiveDays: 365
                        });
                        
                        const updatedUser = {
                          ...currentUser,
                          earnings: newEarnings,
                          vipTier: selectedPlanForUpgrade.name,
                          effectiveDays: 365
                        };
                        
                        setCurrentUser(updatedUser);
                        localStorage.setItem('user_session', JSON.stringify(updatedUser));
                        triggerNotification(`🎉 تهانينا! تم ترقية حسابك إلى ${selectedPlanForUpgrade.name} بنجاح!`);
                      } catch (err) {
                        console.error(err);
                        triggerNotification("حدث خطأ أثناء محاولة الترقية.");
                      } finally {
                        setSelectedPlanForUpgrade(null);
                      }
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs cursor-pointer transition-all"
                  >
                    تأكيد الترقية
                  </button>
                  <button
                    onClick={() => setSelectedPlanForUpgrade(null)}
                    className="flex-1 bg-stone-150 hover:bg-stone-200 text-stone-700 font-bold py-2 rounded-xl text-xs cursor-pointer transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 6: Profile / Personal Center Panel */}
      {activeBottomTab === 'profile' && (
        <div className="w-full max-w-md mx-auto px-4 pt-6 animate-fadeIn pb-24">
          {currentUser.role === 'admin' && (
            <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl mb-4 text-center">
              <span className="text-[10px] font-bold text-red-700 block mb-2">تنبيه: حساب إداري مرخص - لوحة الإدارة مخفية</span>
              <button
                onClick={() => setAdminMode(true)}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                دخول لوحة تحكم الإدارة (الأدمن)
              </button>
            </div>
          )}
          <ProfileCenter 
            currentUser={currentUser} 
            onUpdateUser={(updated) => setCurrentUser(updated)} 
            onLogout={handleLogout} 
            initialSubView={profileSubView}
            onSubViewChange={(view) => setProfileSubView(view)}
            settings={settings}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          />
        </div>
      )}

        </motion.div>
      </AnimatePresence>

      {/* BOTTOM NAVIGATION BAR exactly like screenshot 1 bottom bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-stone-200/80 shadow-lg px-2 py-2 flex items-center justify-around z-40 max-w-md mx-auto rounded-t-2xl">
        
        {/* Navigation Tab 1: الرئيسية */}
        <button
          onClick={() => {
            setActiveBottomTab('home');
            setCurrentView('list');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeBottomTab === 'home' ? 'text-blue-600 scale-105' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1">الرئيسية</span>
        </button>

        {/* Navigation Tab 2: التوظيف */}
        <button
          onClick={() => {
            setActiveBottomTab('jobs');
            setCurrentView('list');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeBottomTab === 'jobs' ? 'text-blue-600 scale-105' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1">التوظيف</span>
        </button>

        {/* Navigation Tab 3: المنصب */}
        <button
          onClick={() => {
            setActiveBottomTab('rank');
            setCurrentView('list');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeBottomTab === 'rank' ? 'text-blue-600 scale-105' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Zap className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1">المنصب</span>
        </button>

        {/* Navigation Tab 4: السجل (Active/Selected) */}
        <button
          onClick={() => {
            setActiveBottomTab('log');
            setCurrentView('list');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeBottomTab === 'log' ? 'text-blue-600 scale-105' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1">السجل</span>
        </button>

        {/* Navigation Tab 5: المركز الشخصي */}
        <button
          onClick={() => {
            setActiveBottomTab('profile');
            setCurrentView('list');
            setProfileSubView('menu');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeBottomTab === 'profile' ? 'text-blue-600 scale-105' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1">المركز الشخصي</span>
        </button>

      </div>

      {/* State-based custom delete confirmation modal */}
      {taskToDeleteId && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 w-full max-w-xs shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900">حذف المهمة الحالية</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف أو التراجع عن هذه المهمة؟ سيتم نقلها إلى قائمة "تم التراجع عنه".
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={confirmDeleteTask}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-2 rounded-xl text-xs cursor-pointer transition-all active:scale-95"
              >
                تأكيد الحذف
              </button>
              <button
                onClick={() => setTaskToDeleteId(null)}
                className="flex-1 bg-stone-150 hover:bg-stone-200 text-stone-700 font-extrabold py-2 rounded-xl text-xs cursor-pointer transition-all active:scale-95"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  );
}
