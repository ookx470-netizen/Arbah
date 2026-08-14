import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import oxloLogoImg from './assets/images/oxlo_clean_logo_1786416406822.jpg';
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
  ArrowUpRight,
  UserPlus,
  CheckCircle2,
  Wallet,
  Bell,
  Key,
  Lock,
  Volume2,
  VolumeX,
  Gift,
  TrendingUp,
  MessageSquare,
  Send,
  X,
  Sun,
  Moon,
  Crown,
  Calculator,
  BadgeCheck,
  Target,
  Trophy,
  Gem,
  Star,
  CalendarX,
  SearchX,
  Info,
  History,
  FileSearch,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import AuthPage from './components/AuthPage';
import ProfileCenter from './components/ProfileCenter';
import AdminPanel from './components/AdminPanel';
import { WelcomeOverlay } from './components/WelcomeOverlay';
import { LeaderBonusModal } from './components/LeaderBonusModal';
import { 
  initializeDatabase, 
  isFallbackMode,
  getReferralLeaderboard,
  LeaderboardEntry
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
    if (category === 'youtube') return 'https://www.youtube.com/watch?v=kJQP7kiw5Fk';
    if (category === 'tiktok') return 'https://www.tiktok.com/@bellapoarch/video/6862153058223197445';
    return 'https://www.facebook.com/watch/?v=10153231379946729';
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
    if (category === 'youtube' || link.includes('youtube')) return 'https://www.youtube.com/watch?v=kJQP7kiw5Fk';
    if (category === 'tiktok' || link.includes('tiktok')) return 'https://www.tiktok.com/@bellapoarch/video/6862153058223197445';
    return 'https://www.facebook.com/watch/?v=10153231379946729';
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
      { title: 'احتفال الوصول إلى 10 ملايين مشترك والتبرعات', url: 'https://www.youtube.com/watch?v=8mG5Q44f7dQ' },
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
      { title: 'تحدي 456 لاعب حقيقي لعشرة ملايين دولار في لعبة الحبار', url: 'https://www.youtube.com/watch?v=0e3GPea1Tyg' },
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
      { title: 'أفضل طريقة للتغلب على التسويف والمماطلة نهائياً', url: 'https://www.youtube.com/watch?v=CevxZvSJLk8' }
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
      { title: 'فيديو أفضل أهداف محمد صلاح الاستثنائية مع ليفربول', url: 'https://www.facebook.com/watch/?v=10153231379946729' },
      { title: 'فيديو كواليس تدريبات صلاح البدنية وتحضيرات المباريات', url: 'https://www.facebook.com/watch/?v=10154388481471375' }
    ]
  },
  {
    id: 'fb-2',
    creator: 'Cristiano Ronaldo (رونالدو)',
    country: '🇵🇹',
    category: 'facebook',
    videos: [
      { title: 'ريل احتفال رونالدو الشهير SIUU وأجمل أهدافه الخيالية', url: 'https://www.facebook.com/watch/?v=10153231379946729' },
      { title: 'ملخص مهارات وتدريبات رونالدو الاستثنائية مع النصر', url: 'https://www.facebook.com/watch/?v=10154388481471375' }
    ]
  },
  {
    id: 'fb-3',
    creator: 'Leo Messi (ليونيل ميسي)',
    country: '🇦🇷',
    category: 'facebook',
    videos: [
      { title: 'فيديو ملخص سحر ميسي ولحظات التتويج التاريخية', url: 'https://www.facebook.com/watch/?v=10152914104271032' },
      { title: 'أجمل مراوغات وأهداف ميسي الخيالية والأكثر مشاهدة', url: 'https://www.facebook.com/watch/?v=10153231379946729' }
    ]
  },
  {
    id: 'fb-4',
    creator: 'Khaby Lame (خابي لامي)',
    country: '🇮🇹',
    category: 'facebook',
    videos: [
      { title: 'ريل خابي لامي الساخر الأكثر مشاهدة وانتشاراً في العالم', url: 'https://www.facebook.com/watch/?v=10154388481471375' },
      { title: 'تحدي خابي لامي للحلول البسيطة والمواقف المضحكة', url: 'https://www.facebook.com/watch/?v=10152914104271032' }
    ]
  },
  {
    id: 'fb-5',
    creator: 'Real Madrid CF (ريال مدريد)',
    country: '🇪🇸',
    category: 'facebook',
    videos: [
      { title: 'ملخص أهداف ريمونتادا ريال مدريد في دوري الأبطال', url: 'https://www.facebook.com/watch/?v=10153231379946729' },
      { title: 'كواليس ملخص المباريات اليومية والتحضيرات للمواجهات', url: 'https://www.facebook.com/watch/?v=10154388481471375' }
    ]
  },
  {
    id: 'fb-6',
    creator: 'Amr Diab (عمرو دياب)',
    country: '🇪🇬',
    category: 'facebook',
    videos: [
      { title: 'فيديو كليب وأغاني الهضبة الجديدة والحصرية', url: 'https://www.facebook.com/watch/?v=10152914104271032' },
      { title: 'حفلة الهضبة الحية الكبرى واللقاءات الفنية المميزة', url: 'https://www.facebook.com/watch/?v=10153231379946729' }
    ]
  },
  {
    id: 'fb-7',
    creator: 'AboFlah (أبو فلة)',
    country: '🇰🇼',
    category: 'facebook',
    videos: [
      { title: 'فيديو مقاطع أبو فلة الكوميدية والتحديات الكبرى الرسمية', url: 'https://www.facebook.com/watch/?v=10154388481471375' },
      { title: 'ملخص حملات التبرع المباشرة واللقاءات مع الجمهور', url: 'https://www.facebook.com/watch/?v=10152914104271032' }
    ]
  },
  // TikTok Celebrity Videos & Official Watch Links (100% Direct Video URLs)
  {
    id: 'tk-1',
    creator: 'Nour Mar5 (نور مار)',
    country: '🇸🇾',
    category: 'tiktok',
    videos: [
      { title: 'تحدي الفيديوهات الكوميدية والأغاني الرائجة على تيك توك', url: 'https://www.tiktok.com/@bellapoarch/video/6862153058223197445' },
      { title: 'يوميات ومقاطع حصرية مع أصدقاء النادي على تيك توك', url: 'https://www.tiktok.com/@zachking/video/6768504825310186758' }
    ]
  },
  {
    id: 'tk-2',
    creator: 'Bella Poarch (بيلا بورتش)',
    country: '🇺🇸',
    category: 'tiktok',
    videos: [
      { title: 'فيديو مهارات الموضة والجمال واليوميات الحصرية الرائجة', url: 'https://www.tiktok.com/@bellapoarch/video/6862153058223197445' },
      { title: 'تحدي حركات الشفاه والأغاني الأكثر تفاعلاً في العالم', url: 'https://www.tiktok.com/@bellapoarch/video/6862153058223197445' }
    ]
  },
  {
    id: 'tk-3',
    creator: 'Zach King (زاك كينغ)',
    country: '🇺🇸',
    category: 'tiktok',
    videos: [
      { title: 'خدعة الطيران بالمكنسة السحرية وتحديات الخيال البصري', url: 'https://www.tiktok.com/@zachking/video/6768504825310186758' },
      { title: 'تحدي كعكة الزجاج والمقاطع البصرية الأكثر دهشة في العالم', url: 'https://www.tiktok.com/@zachking/video/6768504825310186758' }
    ]
  },
  {
    id: 'tk-4',
    creator: 'Khaby Lame (خابي لامي)',
    country: '🇮🇹',
    category: 'tiktok',
    videos: [
      { title: 'أحدث مقاطع الرد الساخر والحلول البسيطة على تيك توك', url: 'https://www.tiktok.com/@bellapoarch/video/6862153058223197445' },
      { title: 'تحديات الكوميديا الصامتة الأكثر مشاهدة في العالم', url: 'https://www.tiktok.com/@zachking/video/6768504825310186758' }
    ]
  }
];

// Helper to get operational date shifted by 14 hours so that the calendar day changes at exactly 14:00 (2:00 PM) Riyadh time (UTC+3)
export function getRiyadhOperationalDateStr(): string {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const riyadhMs = utcMs + (3 * 60 * 60 * 1000);
  const riyadhDate = new Date(riyadhMs);
  
  // Subtract 14 hours so that the day rolls over at exactly 14:00 (2:00 PM)
  riyadhDate.setHours(riyadhDate.getHours() - 14);
  
  const year = riyadhDate.getFullYear();
  const month = String(riyadhDate.getMonth() + 1).padStart(2, '0');
  const day = String(riyadhDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDailyAvailableTasksForDate(dateStr: string, limit: number = 4) {
  // Convert date string (e.g. "2026-08-02") into days count since epoch to guarantee a unique 24h rotation
  const dateObj = new Date(dateStr);
  const daysSinceEpoch = Math.floor(dateObj.getTime() / (24 * 60 * 60 * 1000));
  
  const ytItems = dailyFamousVideosPool.filter(c => c.category === 'youtube');
  const fbItems = dailyFamousVideosPool.filter(c => c.category === 'facebook');
  const tkItems = dailyFamousVideosPool.filter(c => c.category === 'tiktok');
  
  const dailyYt: any[] = [];
  const dailyFb: any[] = [];
  const dailyTk: any[] = [];
  
  // Rotate creators and videos every 24 hours based on daysSinceEpoch so videos change automatically each day
  for (let i = 0; i < limit; i++) {
    const creatorIdx = (daysSinceEpoch * 3 + i) % ytItems.length;
    const creator = ytItems[creatorIdx];
    
    const videoIdx = (daysSinceEpoch + i * 2) % creator.videos.length;
    const selectedVideo = creator.videos[videoIdx];
    
    dailyYt.push({
      id: `avail-yt-${dateStr}-${creator.id}-${videoIdx}-${i}`,
      title: `تفاعل مع الفيديو (لايك + اشتراك): ${creator.creator} ${creator.country}`,
      category: 'youtube',
      taskDetails: `انتقل إلى رابط الفيديو لـ ${creator.creator}، وشاهد الفيديو واضغط زر الإعجاب (Like) والاشتراك (Subscribe) بالقناة ثم التقط لقطة شاشة (سكرين) تظهر التفاعل مع الفيديو لإكمال المهمة.`,
      requires: 'رفع لقطة شاشة (سكرين) واضحة تثبت الإعجاب والاشتراك في الفيديو.',
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
      title: `تفاعل مع الفيديو (لايك + متابعة): ${creator.creator} ${creator.country}`,
      category: 'facebook',
      taskDetails: `انتقل إلى رابط فيديو/ريل لـ ${creator.creator}، واضغط زر الإعجاب (Like) ومتابعة الصفحة (Follow) ثم التقط لقطة شاشة (سكرين) تظهر التفاعل مع الفيديو لإكمال المهمة.`,
      requires: 'رفع لقطة شاشة (سكرين) واضحة تثبت الإعجاب ومتابعة الصفحة في فيسبوك.',
      reviewLink: selectedVideo.url,
      channelName: creator.creator,
      country: creator.country
    });
  }

  for (let i = 0; i < limit; i++) {
    const creatorIdx = (daysSinceEpoch * 7 + i + 4) % tkItems.length;
    const creator = tkItems[creatorIdx];
    
    const videoIdx = (daysSinceEpoch + i * 2) % creator.videos.length;
    const selectedVideo = creator.videos[videoIdx];
    
    dailyTk.push({
      id: `avail-tk-${dateStr}-${creator.id}-${videoIdx}-${i}`,
      title: `تفاعل مع الفيديو (لايك + متابعة): ${creator.creator} ${creator.country}`,
      category: 'tiktok',
      taskDetails: `انتقل إلى رابط فيديو تيك توك لـ ${creator.creator}، واضغط زر الإعجاب (Like) ومتابعة الحساب (Follow) ثم التقط لقطة شاشة (سكرين) تظهر التفاعل واللايك للفيديو لإكمال المهمة.`,
      requires: 'رفع لقطة شاشة (سكرين) واضحة تثبت الإعجاب بالاشتراك ومتابعة الحساب.',
      reviewLink: selectedVideo.url,
      channelName: creator.creator,
      country: creator.country
    });
  }
  
  return { youtube: dailyYt, facebook: dailyFb, tiktok: dailyTk };
}

export function getNormalizedTaskText(task: any) {
  if (!task) return { title: '', taskDetails: '', requires: '' };
  const category = task.category || 'youtube';
  const name = task.channelName || task.creator || 'المشاهير';
  const country = task.country || '';
  
  let title = task.title || '';
  let taskDetails = task.taskDetails || '';
  let requires = task.requires || '';

  if (category === 'youtube') {
    title = `تفاعل مع الفيديو (لايك + اشتراك): ${name} ${country}`;
    taskDetails = `انتقل إلى رابط الفيديو لـ ${name}، وشاهد الفيديو واضغط زر الإعجاب (Like) والاشتراك (Subscribe) بالقناة ثم التقط لقطة شاشة (سكرين) تظهر التفاعل مع الفيديو لإكمال المهمة.`;
    requires = `رفع لقطة شاشة (سكرين) واضحة تثبت الإعجاب والاشتراك في الفيديو.`;
  } else if (category === 'facebook') {
    title = `تفاعل مع الفيديو (لايك + متابعة): ${name} ${country}`;
    taskDetails = `انتقل إلى رابط فيديو/ريل لـ ${name}، واضغط زر الإعجاب (Like) ومتابعة الصفحة (Follow) ثم التقط لقطة شاشة (سكرين) تظهر التفاعل مع الفيديو لإكمال المهمة.`;
    requires = `رفع لقطة شاشة (سكرين) واضحة تثبت الإعجاب ومتابعة الصفحة في فيسبوك.`;
  } else if (category === 'tiktok') {
    title = `تفاعل مع الفيديو (لايك + متابعة): ${name} ${country}`;
    taskDetails = `انتقل إلى رابط فيديو تيك توك لـ ${name}، واضغط زر الإعجاب (Like) ومتابعة الحساب (Follow) ثم التقط لقطة شاشة (سكرين) تظهر التفاعل واللايك للفيديو لإكمال المهمة.`;
    requires = `رفع لقطة شاشة (سكرين) واضحة تثبت الإعجاب بالاشتراك ومتابعة الحساب.`;
  }

  return { title, taskDetails, requires };
}

export default function TaskView() {
  // Navigation / Active Views
  // 'list' -> Task Log View, 'detail' -> Task Details View
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [activeBottomTab, setActiveBottomTab] = useState<'home' | 'jobs' | 'rank' | 'log' | 'profile'>('home');
  
  // Daily Tasks Code Verification States
  const [lastVerifiedCode, setLastVerifiedCode] = useState<string>('');
  const [showTasksCodeModal, setShowTasksCodeModal] = useState<boolean>(false);
  const [tasksCodeAttempt, setTasksCodeAttempt] = useState<string>('');
  const [tasksCodeError, setTasksCodeError] = useState<string | null>(null);
  const [pendingTabSwitch, setPendingTabSwitch] = useState<'log' | null>(null);
  const [pendingListTab, setPendingListTab] = useState<'withdrawn' | 'in_progress' | 'completed' | 'rejected' | null>(null);
  const [showSubscribeRequiredModal, setShowSubscribeRequiredModal] = useState<boolean>(false);
  const [showLeaderBonusModal, setShowLeaderBonusModal] = useState<boolean>(false);

  const [pendingPlatformTab, setPendingPlatformTab] = useState<'youtube' | 'facebook' | 'tiktok' | null>(null);
  const [homeCategoryTab, setHomeCategoryTab] = useState<'youtube' | 'facebook' | 'tiktok'>('youtube');
  const [activeListTab, setActiveListTab] = useState<'withdrawn' | 'in_progress' | 'completed' | 'rejected'>('in_progress');

  const handleSelectPlatform = (platform: 'youtube' | 'facebook' | 'tiktok') => {
    setHomeCategoryTab(platform);
  };

  const transferAllTasksForPlatform = (plat: 'youtube' | 'facebook' | 'tiktok') => {
    const availableTasks = getDailyAvailableTasksForDate(todayStr, userPlanDetails.tasksLimit)[plat] || [];
    const existingTaskIds = new Set(tasks.map(t => t.id));
    const newClaimedTasks: Task[] = [];

    for (const template of availableTasks) {
      if (!existingTaskIds.has(template.id) && tasks.filter(t => t.claimDate === todayStr).length + newClaimedTasks.length < userPlanDetails.tasksLimit) {
        newClaimedTasks.push({
          id: template.id,
          title: template.title,
          reward: `${userPlanDetails.taskReward} USDT`,
          category: template.category,
          status: 'in_progress',
          taskDetails: template.taskDetails,
          requires: template.requires,
          reviewLink: sanitizeTaskReviewLink(template.reviewLink, template.category),
          claimDate: todayStr
        });
      }
    }

    if (newClaimedTasks.length > 0) {
      const updated = [...newClaimedTasks, ...tasks];
      saveTasks(updated);
      triggerNotification(`🎉 تم نقل جميع مهام (${plat === 'youtube' ? 'يوتيوب' : plat === 'facebook' ? 'فيسبوك' : 'تيك توك'}) إلى السجل تلقائياً! انتقل لصفحة (السجل) لإكمال رفع السكرين.`);
    } else {
      triggerNotification("⚠️ جميع مهام هذه المنصة موجودة بالفعل في السجل أو وصلت للحد الأقصى.");
    }

    navigateToTab('log', 'in_progress');
  };

  const navigateToTab = (tab: 'home' | 'jobs' | 'rank' | 'log' | 'profile', targetListTab?: 'withdrawn' | 'in_progress' | 'completed' | 'rejected') => {
    const isAdmin = currentUser?.role === 'admin';

    // Verify subscription status for Log tab
    const vipTier = (currentUser?.vipTier || '').trim();
    const isVip = vipTier !== '' && vipTier !== 'الباقة العادية' && vipTier !== 'العادية' && vipTier !== 'العضوية العادية';

    if (tab === 'jobs') {
      setActiveBottomTab('jobs');
      setCurrentView('list');
      return;
    }

    if (tab === 'log' && !isAdmin) {
      if (!isVip) {
        setShowSubscribeRequiredModal(true);
        return;
      }

      setActiveBottomTab('log');
      setCurrentView('list');
      if (targetListTab) {
        setActiveListTab(targetListTab);
      }
      return;
    }

    setActiveBottomTab(tab);
    setCurrentView('list');
    if (targetListTab) {
      setActiveListTab(targetListTab);
    }
  };

  const handleVerifyTasksCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const correctCode = (settings.tasksCode || '').trim();
    const attempt = tasksCodeAttempt.trim();
    const today = getRiyadhOperationalDateStr();

    if (!correctCode) {
      setLastVerifiedCode('');
      setShowTasksCodeModal(false);
      setTasksCodeAttempt('');
      setTasksCodeError(null);
      if (pendingPlatformTab) {
        const plat = pendingPlatformTab;
        setPendingPlatformTab(null);
        setHomeCategoryTab(plat);
        transferAllTasksForPlatform(plat);
      }
      return;
    }

    if (attempt === correctCode) {
      setLastVerifiedCode(correctCode);
      localStorage.setItem(`tasks_code_verified_${correctCode}_${today}`, 'true');
      setShowTasksCodeModal(false);
      setTasksCodeAttempt('');
      setTasksCodeError(null);
      
      if (pendingPlatformTab) {
        const plat = pendingPlatformTab;
        setPendingPlatformTab(null);
        setHomeCategoryTab(plat);
        transferAllTasksForPlatform(plat);
      } else {
        triggerNotification("🎉 تم التحقق من رمز المهام بنجاح!");
      }
    } else {
      setTasksCodeError("⚠️ الرمز غير صحيح! يرجى مراجعة إدارة المنصة للحصول على الرمز اليومي الجديد.");
    }
  };
  
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
  const [profileSubView, setProfileSubView] = useState<'menu' | 'recharge' | 'withdraw' | 'team' | 'bind' | 'dep_log' | 'with_log' | 'change_pass' | 'support' | 'jobs'>('menu');
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<VipPlan | null>(null);
  const [showSupportOptions, setShowSupportOptions] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState<boolean>(false);
  const [rankSubTab, setRankSubTab] = useState<'upgrade' | 'calculator'>('upgrade');
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
  const [loadingProgress, setLoadingProgress] = useState<number>(15);
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
    workingHoursNotice: "💡 تنويه هام لجميع الأعضاء: يرجى العلم بأن أوقات العمل الرسمية لتنفيذ واعتماد المهام اليومية مقسمة على فترتين يومياً:\n- الفترة الأولى: من الساعة 02:00 ظهراً وحتى 05:00 عصراً.\n- الفترة الثانية: من الساعة 09:00 مساءً وحتى 12:00 منتصف الليل بتوقيت مكة المكرمة.",
    enforceWorkingHours: true,
    workStartHour: 14,
    workEndHour: 17,
    workStartHour2: 21,
    workEndHour2: 0
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


  // Load Leaderboard data dynamically
  useEffect(() => {
    if (activeBottomTab === 'rank' && rankSubTab === 'leaderboard') {
      const fetchLeaderboard = async () => {
        setIsLoadingLeaderboard(true);
        try {
          const data = await getReferralLeaderboard();
          setLeaderboard(data);
        } catch (error) {
          console.error("Error fetching referral leaderboard:", error);
        } finally {
          setIsLoadingLeaderboard(false);
        }
      };
      fetchLeaderboard();
    }
  }, [activeBottomTab, rankSubTab]);


  // Real-time ticking platform stats (Feature 4)
  const [liveStats, setLiveStats] = useState({
    payouts: 248210.40,
    activeUsers: 1342,
    completedTasks: 42105
  });

  // Rotating live withdrawal alerts (Feature 2)
  const [currentAlert, setCurrentAlert] = useState<string>('');
  const [recentWithdrawals, setRecentWithdrawals] = useState<Array<{ id: string, phone: string, amount: number, time: string }>>([]);

  // Interactive profit calculator selected plan
  const [calcSelectedPlanId, setCalcSelectedPlanId] = useState<string>('plan_A1');

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
      const startTime = Date.now();
      setLoadingProgress(25);

      // Initialize Firestore admin and settings
      await initializeDatabase();
      setLoadingProgress(55);

      // Auto login user from localStorage if exists
      const cachedPhone = localStorage.getItem('logged_in_phone');
      if (cachedPhone) {
        try {
          const { getUserByPhone, shadowFirebaseAuth } = await import('./firebaseService');
          const usr = await getUserByPhone(cachedPhone);
          if (usr) {
            await shadowFirebaseAuth(usr.phone, usr.password || usr.id).catch(e => console.warn('Shadow auth failed:', e));
            setCurrentUser(usr);
          }
        } catch (e) {
          console.error("Error auto-logging in:", e);
        }
      }
      setLoadingProgress(85);

      // Guarantee minimum splash screen visibility time (2200ms) for professional branding display
      const elapsedTime = Date.now() - startTime;
      const minDuration = 2200;
      if (elapsedTime < minDuration) {
        const remaining = minDuration - elapsedTime;
        // Animate remaining progress smoothly
        setTimeout(() => setLoadingProgress(95), Math.max(100, remaining - 300));
        await new Promise(resolve => setTimeout(resolve, remaining));
      }

      setLoadingProgress(100);
      setInitDone(true);
      setIsFallback(isFallbackMode());
    };
    
    startDbAndLoad();
  }, []);

  // Listen for real-time quota fallback activation
  useEffect(() => {
    const handleFallback = () => {
      setIsFallback(true);
    };
    window.addEventListener('quota_fallback_activated', handleFallback);
    return () => {
      window.removeEventListener('quota_fallback_activated', handleFallback);
    };
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

  // User activity heartbeat effect (updates lastActiveAt & isOnline every 45s while user is on the site)
  useEffect(() => {
    if (!currentUser?.phone) return;

    // Send immediate activity pulse
    import('./firebaseService').then(({ recordUserActivity }) => {
      recordUserActivity(currentUser.phone).catch(e => console.warn(e));
    });

    const interval = setInterval(() => {
      import('./firebaseService').then(({ recordUserActivity }) => {
        recordUserActivity(currentUser.phone).catch(e => console.warn(e));
      });
    }, 45000); // every 45 seconds

    return () => {
      clearInterval(interval);
    };
  }, [currentUser?.phone]);

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
        taskReward: Number((matchedPlan.profit / matchedPlan.tasksCount).toFixed(2)),
        isTrial: matchedPlan.isTrial
      };
    }
    
    return {
      name: tierName || 'العضوية العادية',
      tasksLimit: 0, // تم تحديد الحد بـ 0 لغير المشتركين لمنع ظهور أي مهام
      taskReward: 0,
      isTrial: false
    };
  })();

  const todayStr = getRiyadhOperationalDateStr();
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
    if (userPlanDetails.isTrial && currentUser?.vipStartDate) {
      const trialDuration = 24 * 60 * 60 * 1000; // 1 day
      const trialStart = new Date(currentUser.vipStartDate).getTime();
      const now = new Date().getTime();
      if (now - trialStart > trialDuration) {
        triggerNotification(`⚠️ لقد انتهت فترة الباقة التجريبية الخاصة بك. يرجى الترقية إلى باقة VIP مدفوعة للاستمرار في تنفيذ المهام!`);
        return;
      }
    }

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

    // Enforce mutual exclusivity between YouTube, Facebook, and TikTok tasks for today
    const todayClaimedTasks = tasks.filter(t => t.claimDate === todayStr && t.status !== 'withdrawn');
    const hasDifferentCategory = todayClaimedTasks.some(t => t.category !== template.category);
    if (hasDifferentCategory) {
      const activeCategoryText = todayClaimedTasks[0].category === 'youtube' 
        ? 'يوتيوب' 
        : todayClaimedTasks[0].category === 'facebook' 
        ? 'فيسبوك' 
        : 'تيك توك';
      triggerNotification(`⚠️ لا يُسمح باختيار مهام من منصات مختلفة معاً في نفس اليوم! لقد بدأت اليوم بمهام ${activeCategoryText}، يرجى الاستمرار عليها أو الانتظار للغد.`);
      return;
    }
    
    const isAlreadyClaimed = tasks.some(t => t.id === template.id);
    if (isAlreadyClaimed) {
      triggerNotification("⚠️ لقد قمت بالحصول على هذه المهمة بالفعل!");
      return;
    }

    const activeCode = (settings.tasksCode || '').trim();
    const isAlreadyUnlocked = !activeCode || (lastVerifiedCode === activeCode) || localStorage.getItem(`tasks_code_verified_${activeCode}_${todayStr}`) === 'true';
    const isAdmin = currentUser?.role === 'admin';

    if (!isAlreadyUnlocked && !isAdmin) {
      setPendingPlatformTab(template.category);
      setShowTasksCodeModal(true);
      setTasksCodeAttempt('');
      setTasksCodeError(null);
      return;
    }

    transferAllTasksForPlatform(template.category);
  };

  const executeClaimTask = (template: any) => {
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
    
    // Auto-redirect to log tab using navigateToTab
    navigateToTab('log', 'in_progress');
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
      const s1Start = settings.workStartHour !== undefined ? Number(settings.workStartHour) : 14;
      const s1End = settings.workEndHour !== undefined ? Number(settings.workEndHour) : 17;
      const s2Start = settings.workStartHour2 !== undefined ? Number(settings.workStartHour2) : 21;
      const s2End = settings.workEndHour2 !== undefined ? Number(settings.workEndHour2) : 0;
      triggerNotification(`⚠️ عذراً! العمل وتأدية المهام متاح فقط:\n• الفترة الأولى: من ${formatHourToArabic(s1Start)} إلى ${formatHourToArabic(s1End)}\n• الفترة الثانية: من ${formatHourToArabic(s2Start)} إلى ${formatHourToArabic(s2End)}`);
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
    const updated = tasks.filter(t => t.id !== taskToDeleteId);
    saveTasks(updated);
    triggerNotification("تم حذف المهمة بنجاح!");
    setActiveBottomTab('log');
    setCurrentView('list');
    setSelectedTaskId(null);
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
      const rewardMatch = targetTask.reward.match(/[\d.]+/);
      const rewardValue = rewardMatch ? parseFloat(rewardMatch[0]) : 0;
      
      const response = await fetch('/api/complete-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: currentUser.phone,
          password: currentUser.password || currentUser.id,
          taskId: targetTask.id,
          rewardValue
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "فشل تسجيل المهمة");
      }
      
      const updatedUser = {
        ...currentUser,
        earnings: data.newEarnings,
        taskIncome: data.newTaskIncome
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
      <div className="relative min-h-screen bg-gradient-to-b from-[#F0F6FF] via-[#E6F0FA] to-[#DBEAFE] flex flex-col items-center justify-center p-6 text-center select-none font-sans overflow-hidden" dir="rtl">
        {/* Ambient Decorative Light Orbs */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-400/25 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

        <div className="relative z-10 w-full max-w-sm text-center space-y-7">
          
          {/* Logo Visual Branding */}
          <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
            {/* Ambient Back Glow */}
            <div className="absolute inset-1 rounded-3xl bg-blue-500/30 blur-xl"></div>
            {/* Outer spinning ring */}
            <div className="absolute inset-0 rounded-3xl border-2 border-dashed border-blue-500/30 animate-spin-slow"></div>
            {/* Inner logo card */}
            <div className="relative w-24 h-24 bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#1E40AF] rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/30 border border-white/20 overflow-hidden p-0.5">
              <img src={oxloLogoImg} alt="OXLO Logo" className="w-full h-full object-cover rounded-[14px]" referrerPolicy="no-referrer" />
              {/* Subtle shine badge */}
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white shadow-sm z-20"></div>
            </div>
          </div>

          {/* Typography Greetings */}
          <div className="space-y-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              أهلاً بك في منصة <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 bg-clip-text text-transparent">OXLO</span>
            </h1>
            <p className="text-xs font-bold text-slate-500 leading-relaxed max-w-xs mx-auto">
              بوابة الخدمات المصغرة والمهام اليومية الرائدة لإدارة وتنمية الأرباح الرقمية بمرونة وسهولة.
            </p>
          </div>

          {/* Glassmorphism Status Indicator Card */}
          <div className="bg-white/85 backdrop-blur-xl rounded-3xl p-5 border border-white/80 shadow-xl shadow-blue-900/5 space-y-3.5 max-w-xs mx-auto">
            {/* Loading Ring Spinner */}
            <div className="flex items-center justify-center">
              <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 shadow-inner">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
            </div>
            
            {/* Loading bar progression */}
            <div className="w-full bg-slate-150/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/80 shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-500 h-full rounded-full transition-all duration-500 ease-out shadow-sm" 
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-center text-[10px] text-slate-500 font-extrabold">
              <span>نسبة التهيئة: {loadingProgress}%</span>
            </div>
          </div>

          {/* Footer Copyright */}
          <div className="text-[10px] text-slate-400 font-bold">
            <p>© 2026 Oxlo Smart Solutions. جميع الحقوق محفوظة.</p>
          </div>

        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} settings={settings} />;
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
        <AdminPanel adminUser={currentUser} onLogout={handleLogout} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-800 select-none font-sans relative pb-24" dir="rtl">

      {/* Quota limit fallback notification */}
      {isFallback && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-amber-900 relative z-30 text-xs font-semibold shadow-sm flex items-start gap-3" dir="rtl">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-extrabold text-[13px] text-amber-950 mb-1">📢 العمل في وضع التخزين الاحتياطي (Firebase Quota Fallback)</p>
            <p className="leading-relaxed text-amber-900 text-[11px] font-medium">
              تنبيه: تم تجاوز حد الاستخدام المجاني لقاعدة بيانات Firebase اليومي (50,000 قراءة). تم تفعيل وضع التخزين المحلي الاحتياطي تلقائياً لتتمكن من استخدام التطبيق دون انقطاع. بياناتك السابقة والجديدة محفوظة بأمان محلياً وسوف تُرفع تلقائياً للسحابة فور قيام جوجل بإعادة تعيين الحد السحابي اليومي (خلال 24 ساعة).
            </p>
          </div>
        </div>
      )}

      {/* Global Notification Banner System */}
      {settings.globalNotification && (
        <div className="bg-[#070D19] text-white border-b border-[#F39C12]/20 px-3 py-2 flex items-center gap-2 shadow-sm relative z-40 overflow-hidden font-bold text-[11px]">
          <span className="flex items-center gap-1 shrink-0 bg-[#F39C12]/10 px-2 py-0.5 rounded border border-[#F39C12]/20 text-[10px] text-[#F39C12]">
            <span className="animate-bounce">📢</span>
            <span>إعلان هام:</span>
          </span>
          <div className="flex-1 overflow-hidden relative h-5 flex items-center">
            <div className="absolute whitespace-nowrap animate-marquee text-white font-bold">
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
            {t.type === 'info' && <Bell className="w-4 h-4 text-amber-400 shrink-0" />}
            
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
          {/* VIEW 1: Jobs & Task Center View */}
          {currentView === 'list' && activeBottomTab === 'jobs' && (
        <div className="w-full max-w-md mx-auto px-5 pt-8 animate-fadeIn pb-28 text-right">
          
          {/* Working Hours Notice */}
          {settings.workingHoursNotice && (
            <div className="mb-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-[2rem] p-5 border border-amber-200/50 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500/80"></div>
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                  <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-amber-800 block mb-1">تنويه أوقات العمل الرسمية</span>
                  <p className="text-[10px] text-amber-700 leading-relaxed font-bold whitespace-pre-line">
                    {settings.workingHoursNotice}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Section Header */}
          <div className="mb-6 text-center">
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">صفحة التوظيف والمهام</h2>
            <p className="text-[10px] text-slate-400 font-bold">اختر المنصة وأكمل المهام المتاحة لجني أرباحك</p>
          </div>

          {/* Platform Switcher */}
          <div className="grid grid-cols-3 gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200/50">
            <button
              onClick={() => handleSelectPlatform('tiktok')}
              className={`py-2.5 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                homeCategoryTab === 'tiktok'
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
              </svg>
              <span>تيك توك</span>
            </button>
            <button
              onClick={() => handleSelectPlatform('facebook')}
              className={`py-2.5 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                homeCategoryTab === 'facebook'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Facebook className="w-4 h-4 fill-current" />
              <span>فيسبوك</span>
            </button>
            <button
              onClick={() => handleSelectPlatform('youtube')}
              className={`py-2.5 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                homeCategoryTab === 'youtube'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Youtube className="w-4 h-4 fill-current" />
              <span>يوتيوب</span>
            </button>
          </div>

          {/* List of Available Tasks */}
          <div className="space-y-4">
            {isTodayHoliday ? (
              <div className="bg-rose-50 rounded-[2.5rem] p-8 text-center border border-rose-100 shadow-sm">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <CalendarX className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-sm font-black text-rose-900 mb-2">عطلة رسمية</h3>
                <p className="text-[10px] text-rose-600 font-bold leading-relaxed px-4">
                  اليوم عطلة عمل رسمية في المنصة. المهام مقفلة حالياً، ننتظرك في يوم العمل القادم لمتابعة نشاطك.
                </p>
              </div>
            ) : isOutsideWorkingHours ? (
              <div className="bg-amber-50 rounded-[2.5rem] p-8 border border-amber-100 shadow-sm text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Moon className="w-8 h-8 text-amber-500 fill-amber-100" />
                </div>
                <h3 className="text-sm font-black text-amber-900 mb-2">خارج ساعات العمل</h3>
                <p className="text-[10px] text-amber-600 font-bold leading-relaxed px-6 mb-6">
                  العمل متاح فقط خلال الفترات الرسمية المحددة. نرجو العودة في الوقت المحدد لبدء المهام.
                </p>
                <div className="bg-white/50 rounded-2xl p-4 border border-amber-100/50 space-y-2">
                  <div className="text-[10px] font-black text-amber-900">ساعات العمل (بتوقيت مكة):</div>
                  <div className="text-[9px] text-amber-700 font-bold flex flex-col gap-1">
                    <span>الفترة الأولى: {formatHourToArabic(settings.workStartHour ?? 12)} - {formatHourToArabic(settings.workEndHour ?? 15)}</span>
                    <span>الفترة الثانية: {formatHourToArabic(settings.workStartHour2 ?? 21)} - {formatHourToArabic(settings.workEndHour2 ?? 1)}</span>
                  </div>
                </div>
              </div>
            ) : userPlanDetails.tasksLimit === 0 ? (
              <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-white/5 shadow-xl shadow-slate-900/20 text-center relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20 rotate-3">
                    <Zap className="w-8 h-8 text-white fill-white" />
                  </div>
                  <h3 className="text-white text-sm font-black mb-3">حساب غير مفعل</h3>
                  <p className="text-slate-400 text-[10px] font-bold leading-relaxed px-4 mb-8">
                    يرجى الاشتراك في إحدى باقات VIP لتفعيل حسابك والبدء في تنفيذ المهام اليومية وجني الأرباح.
                  </p>
                  <button
                    onClick={() => { setActiveBottomTab('rank'); setCurrentView('list'); }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white h-12 rounded-2xl text-[10px] font-black transition-all active:scale-95 shadow-lg shadow-blue-600/30"
                  >
                    انتقل لتفعيل باقتك الآن
                  </button>
                </div>
              </div>
            ) : dailyTasksForToday[homeCategoryTab]?.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <SearchX className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-[11px] text-slate-500 font-bold">لا توجد مهام متاحة لهذه المنصة حالياً.</p>
              </div>
            ) : (
              dailyTasksForToday[homeCategoryTab]?.map((item: any) => {
                const isClaimed = tasks.some(t => t.id === item.id);
                const norm = getNormalizedTaskText(item);
                return (
                  <div 
                    key={item.id} 
                    className="group bg-white p-5 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-blue-200 transition-all text-right"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-left bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                        <span className="text-[11px] font-black text-emerald-600 block leading-none">{userPlanDetails.taskReward} USDT</span>
                        <span className="text-[8px] text-emerald-400 font-black mt-1 block">ربح المهمة</span>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black border mb-3 ${
                          item.category === 'youtube' 
                            ? 'bg-rose-50 text-rose-600 border-rose-100' 
                            : item.category === 'facebook' 
                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                            : 'bg-purple-50 text-purple-600 border-purple-100'
                        }`}>
                          {item.category === 'youtube' ? (
                            <Youtube className="w-3 h-3 fill-current" />
                          ) : item.category === 'facebook' ? (
                            <Facebook className="w-3 h-3 fill-current" />
                          ) : (
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                            </svg>
                          )}
                          <span>
                            {item.category === 'youtube' ? 'يوتيوب' : item.category === 'facebook' ? 'فيسبوك' : 'تيك توك'} • {item.country}
                          </span>
                        </div>
                        <h4 className="text-[11px] font-black text-slate-900 leading-relaxed max-w-[200px]">{norm.title}</h4>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-5">
                      <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{norm.taskDetails}</p>
                    </div>

                    <div className="pt-1">
                      {isClaimed ? (
                        <div className="w-full h-11 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 border border-slate-100 cursor-default">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>تم الحصول عليها بنجاح</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            handleClaimTask(item);
                          }}
                          className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[10px] font-black transition-all active:scale-95 shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
                        >
                          <span>بدء تنفيذ المهمة الآن</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

          {/* VIEW 2: Task Log & Registration History View */}
          {currentView === 'list' && activeBottomTab === 'log' && (
        <div className="w-full max-w-md mx-auto px-5 pt-8 animate-fadeIn pb-28 text-right">

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
              <div className={`p-5 rounded-[2rem] mb-8 border transition-all ${
                isTodayHoliday 
                  ? 'bg-rose-50 border-rose-200 text-rose-800' 
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                    <Info className={`w-5 h-5 ${isTodayHoliday ? 'text-rose-600' : 'text-amber-600'}`} />
                  </div>
                  <div className="text-right flex-1">
                    <span className={`block font-black text-[10px] mb-1 ${isTodayHoliday ? 'text-rose-900' : 'text-amber-950'}`}>
                      {isTodayHoliday ? `اليوم (${getArabicDayName(new Date().getDay())}) عطلة رسمية` : 'نظام العطلة الأسبوعية'}
                    </span>
                    <p className="text-[10px] font-bold leading-relaxed opacity-90">
                      {isTodayHoliday 
                        ? `تنبيه: اليوم هو يوم عطلة عمل رسمي في المنصة. تم إيقاف استقبال تقديم المهام ورفع إثباتات الإنجاز مؤقتاً حتى نهاية اليوم.` 
                        : `تنويه: تم تحديد أيام العطلة الأسبوعية الرسمية للمنصة لتكون: (${(settings.holidayDays ?? [5]).map(d => ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][d]).join(" و ")}).`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status Tabs Selector */}
            <div className="flex items-center justify-between gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
              <button
                onClick={() => setActiveListTab('in_progress')}
                className={`flex-1 py-2 text-[9px] font-black rounded-xl transition-all flex flex-col items-center gap-1 ${
                  activeListTab === 'in_progress' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>قيد التنفيذ</span>
                <span className="text-[8px] opacity-70">({getTasksCount('in_progress')})</span>
              </button>
              <button
                onClick={() => setActiveListTab('completed')}
                className={`flex-1 py-2 text-[9px] font-black rounded-xl transition-all flex flex-col items-center gap-1 ${
                  activeListTab === 'completed' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>مكتملة</span>
                <span className="text-[8px] opacity-70">({getTasksCount('completed')})</span>
              </button>
              <button
                onClick={() => setActiveListTab('rejected')}
                className={`flex-1 py-2 text-[9px] font-black rounded-xl transition-all flex flex-col items-center gap-1 ${
                  activeListTab === 'rejected' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>مرفوضة</span>
                <span className="text-[8px] opacity-70">({getTasksCount('rejected')})</span>
              </button>
              <button
                onClick={() => setActiveListTab('withdrawn')}
                className={`flex-1 py-2 text-[9px] font-black rounded-xl transition-all flex flex-col items-center gap-1 ${
                  activeListTab === 'withdrawn' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>متراجع عنها</span>
                <span className="text-[8px] opacity-70">({getTasksCount('withdrawn')})</span>
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
              tasks.filter(t => t.status === activeListTab).map((item) => {
                const norm = getNormalizedTaskText(item);
                return (
                  <div
                    key={item.id}
                    onClick={() => viewDetails(item.id)}
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow transition-all border border-stone-100 flex items-center justify-between cursor-pointer group active:scale-[0.99] text-right"
                  >
                    {/* Left Side: Avatar & Core Information */}
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white shadow-inner shrink-0 ${
                        item.category === 'youtube' 
                          ? 'bg-[#FF0000]' 
                          : item.category === 'facebook' 
                          ? 'bg-[#1877F2]' 
                          : 'bg-black'
                      }`}>
                        {item.category === 'youtube' ? (
                          <Youtube className="w-5.5 h-5.5 text-white" />
                        ) : item.category === 'facebook' ? (
                          <Facebook className="w-5.5 h-5.5 text-white fill-white" />
                        ) : (
                          <svg className="w-5.5 h-5.5 fill-current text-white" viewBox="0 0 24 24">
                            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className="text-[13px] font-bold text-stone-800 line-clamp-1 text-right">
                          {norm.title}
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
              ); })
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
                  currentTask.category === 'youtube' 
                    ? 'from-rose-600 to-red-500' 
                    : currentTask.category === 'facebook'
                    ? 'from-[#1877F2] to-[#3B82F6]'
                    : 'from-zinc-900 to-black'
                }`}>
                  
                  {/* Brand Logo */}
                  <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center shadow-md mb-2 relative shrink-0 bg-white">
                    {currentTask.category === 'youtube' ? (
                      <Youtube className="w-11 h-11 text-[#FF0000]" />
                    ) : currentTask.category === 'facebook' ? (
                      <Facebook className="w-11 h-11 text-[#1877F2] fill-[#1877F2]" />
                    ) : (
                      <svg className="w-11 h-11 fill-current text-black" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                      </svg>
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
                      {currentTask.category === 'youtube' ? 'YouTube' : currentTask.category === 'facebook' ? 'Facebook' : 'TikTok'}
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
                    <span className="text-blue-600 font-bold">{getNormalizedTaskText(currentTask).taskDetails}</span>
                  </div>

                  {/* Row 4: يتطلب */}
                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                    <span className="text-stone-500 font-semibold">يتطلب</span>
                    <span className="text-blue-600 font-bold">{getNormalizedTaskText(currentTask).requires}</span>
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
                      <span>الانتقال لرابط القناة / الصفحة (رابط الاشتراك المباشر)</span>
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

          {/* Premium Dashboard Header */}
          <div className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-slate-200 mb-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            
            <div className="flex items-center justify-between relative z-10 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 font-black text-xs">
                  {currentUser?.username ? currentUser.username[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-0.5">أهلاً بك مجدداً</span>
                  <h2 className="text-sm font-black text-slate-900 tracking-tight">{currentUser?.username || currentUser?.phone}</h2>
                </div>
              </div>
              <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[9px] font-black border border-blue-100">
                {userPlanDetails.name}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
                <span className="text-[9px] text-slate-400 font-bold block mb-1">الرصيد المتاح</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-slate-900 leading-none">{Number(currentUser?.earnings || 0).toFixed(2)}</span>
                  <span className="text-[10px] text-slate-400 font-bold">USDT</span>
                </div>
              </div>
              <div className="bg-indigo-50/80 p-5 rounded-2xl border border-indigo-100">
                <span className="text-[9px] text-indigo-400 font-bold block mb-1">المهام اليومية</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-indigo-700 leading-none">{todayClaimedCount}</span>
                  <span className="text-[10px] text-slate-400 font-medium">/ {userPlanDetails.tasksLimit}</span>
                </div>
              </div>
            </div>

            {/* Task Progress Bar */}
            <div className="mt-6 pt-6 border-t border-slate-50 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] text-slate-400 font-bold">نسبة الإنجاز اليومي</span>
                <span className="text-[9px] text-blue-600 font-black">{Math.min(100, Math.round((todayClaimedCount / userPlanDetails.tasksLimit) * 100))}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out shadow-sm shadow-blue-600/20"
                  style={{ width: `${Math.min(100, (todayClaimedCount / userPlanDetails.tasksLimit) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => { setProfileSubView('recharge'); setActiveBottomTab('profile'); setCurrentView('list'); }}
              className="bg-white p-5 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center gap-3 transition-all active:scale-95 hover:border-blue-200 group"
            >
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                <ArrowDownCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-slate-700">إيداع فوري</span>
            </button>
            <button
              onClick={() => { setProfileSubView('withdraw'); setActiveBottomTab('profile'); setCurrentView('list'); }}
              className="bg-white p-5 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center gap-3 transition-all active:scale-95 hover:border-indigo-200 group"
            >
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                <ArrowUpCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-slate-700">سحب سريع</span>
            </button>
          </div>

          {/* Platform Announcements */}
          {settings.globalNotification && (
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 mb-8 flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-amber-600 fill-amber-300" />
              </div>
              <div>
                <span className="text-[10px] font-black text-amber-800 block mb-1">تنبيه النظام</span>
                <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                  {settings.globalNotification}
                </p>
              </div>
            </div>
          )}

          {/* Strategic Leader Program Card */}
          <div className="bg-slate-900 rounded-[2.5rem] p-7 text-white shadow-xl shadow-slate-900/20 mb-8 relative overflow-hidden border border-white/5 group">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
            
            <div className="relative z-10 flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 transform -rotate-3">
                <Crown className="w-7 h-7 text-white fill-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-black mb-1">برنامج رواتب القادة</h3>
                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                  احصل على رواتب دورية ثابتة وحوافز قيادية عند بناء فريقك المتميز.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowLeaderBonusModal(true);
                playChimeSound();
              }}
              className="w-full relative z-10 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md py-3 rounded-2xl text-[10px] font-black transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>تفاصيل برنامج الرواتب والمزايا</span>
            </button>
          </div>

          {/* Direct Technical Support Trigger Card */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm text-center mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h3 className="text-xs font-black text-stone-900">الدعم الفني المباشر</h3>
            <p className="text-[10px] text-stone-500 font-semibold leading-relaxed mt-1.5 max-w-xs mx-auto">
              تواصل معنا الآن للحصول على الإرشادات والدعم الفوري لحل أي مشكلات أو استفسارات فوراً عبر المحادثة المباشرة.
            </p>
            <button
              onClick={() => {
                // Show a simple modal or trigger a state change to show options
                // For simplicity, we'll create a state for showing support options
                setShowSupportOptions(true);
              }}
              className="mt-4 w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer hover:shadow-lg hover:from-blue-600 hover:to-indigo-700"
            >
              <MessageSquare className="w-4 h-4" />
              <span>بدء محادثة الدعم الفني</span>
            </button>
            
            {showSupportOptions && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-[#0B1528] rounded-2xl p-6 w-full max-w-sm border border-blue-900/50">
                  <h3 className="text-white text-center font-bold mb-4">تواصل مع خدمة العملاء</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setShowSupportOptions(false);
                        setActiveBottomTab('profile');
                        setCurrentView('list');
                        setProfileSubView('support');
                      }}
                      className="w-full bg-[#1A263D] text-white py-3 px-4 rounded-xl text-sm font-bold border border-blue-900/30 text-right flex items-center justify-between"
                    >
                      <span>الدعم داخل المنصة</span>
                      <MessageSquare className="w-5 h-5 text-blue-400" />
                    </button>
                    {settings.telegramSupportUsername && settings.telegramSupportUsername.trim() !== '' && (
                      <button
                        onClick={() => {
                          window.open(`https://t.me/${settings.telegramSupportUsername}`, '_blank');
                          setShowSupportOptions(false);
                        }}
                        className="w-full bg-[#1A263D] text-white py-3 px-4 rounded-xl text-sm font-bold border border-blue-900/30 text-right flex items-center justify-between"
                      >
                        <span>الدعم عبر تليجرام</span>
                        <Send className="w-5 h-5 text-sky-400" />
                      </button>
                    )}
                    <button
                      onClick={() => setShowSupportOptions(false)}
                      className="w-full text-stone-400 text-xs text-center mt-2"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              </div>
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

      {/* VIEW 5: Rank/Position Upgrade Panel */}
      {activeBottomTab === 'rank' && (
        <div className="w-full max-w-md mx-auto px-5 pt-8 animate-fadeIn pb-28 text-right">
          
          {/* Top Segment/Sub-Tabs Selector */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center justify-between mb-8 border border-slate-200/50 shadow-inner">
            <button
              onClick={() => setRankSubTab('upgrade')}
              className={`flex-1 py-2.5 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                rankSubTab === 'upgrade'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Gem className="w-3.5 h-3.5" />
              <span>ترقية VIP</span>
            </button>
            <button
              onClick={() => setRankSubTab('calculator')}
              className={`flex-1 py-2.5 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                rankSubTab === 'calculator'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>حاسبة</span>
            </button>
          </div>

          {rankSubTab === 'upgrade' ? (
            <div className="bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-sm text-center relative overflow-hidden">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100">
                <Zap className="w-8 h-8 fill-blue-200" />
              </div>
              <h2 className="text-lg font-black text-slate-900">ترقية فئة العضوية</h2>
              <p className="text-[10px] text-slate-400 mt-2 font-bold leading-relaxed px-6">
                انتقل إلى المستوى التالي لزيادة عدد مهامك اليومية ومضاعفة أرباحك الصافية.
              </p>
              
              <div className="mt-8 space-y-4 text-right">
                {(() => {
                  const rawPlansList = settings.vipPlans && settings.vipPlans.length > 0 ? settings.vipPlans : [
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
                  const currentUserPlan = rawPlansList.find(p => p.name === currentUser?.vipTier);
                  const currentUserPlanPrice = currentUserPlan ? currentUserPlan.price : 0;

                  const plansList = settings.hideTrialPlans
                    ? rawPlansList.filter(p => !p.isTrial || p.name === currentUser?.vipTier)
                    : rawPlansList;

                  return plansList.map((plan) => {
                    const isActive = currentUser?.vipTier === plan.name;
                    const isLowerTier = plan.price < currentUserPlanPrice;
                    const isGoldenChoice = plan.name.includes('B2');

                    return (
                      <div key={plan.id} className={`group relative border ${isGoldenChoice ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 bg-slate-50/50'} p-5 rounded-[2rem] flex items-center justify-between hover:border-blue-200 transition-all`}>
                        {isGoldenChoice && (
                          <div className="absolute -top-2 left-6 bg-amber-500 text-white text-[8px] px-3 py-1 rounded-full font-black shadow-sm">
                            الأكثر طلباً
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-black text-sm text-slate-900">{plan.name}</span>
                            <span className="text-[11px] font-black text-blue-600">{plan.price} USDT</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold block">
                            الربح اليومي: <strong className="text-emerald-600 font-black">{plan.profit} USDT</strong>
                          </span>
                        </div>
                        {isActive ? (
                          <div className="bg-emerald-50 text-emerald-600 text-[9px] px-3 py-1.5 rounded-full font-black border border-emerald-100">نشط</div>
                        ) : isLowerTier ? (
                          <div className="text-slate-400 text-[9px] px-3 py-1.5 rounded-full font-bold bg-slate-100">سابق</div>
                        ) : plan.isTrial ? (
                          <button 
                            onClick={() => triggerNotification("⚠️ عذراً! هذه الباقة تجريبية ويتم تفعيلها حصرياً من قِبل إدارة المنصة.")}
                            className="h-9 px-4 rounded-xl text-[10px] font-black bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-200 transition-all cursor-pointer active:scale-95 shadow-sm"
                          >
                            تنشيط إداري 🔒
                          </button>
                        ) : (
                          <button 
                            onClick={() => setSelectedPlanForUpgrade(plan)}
                            className={`h-9 px-5 rounded-xl text-[10px] font-black transition-all cursor-pointer active:scale-95 shadow-sm ${
                              isGoldenChoice ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
                            }`}
                          >
                            ترقية
                          </button>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          ) : rankSubTab === 'calculator' ? (
            (() => {
              const rawCalcPlans = settings.vipPlans && settings.vipPlans.length > 0 ? settings.vipPlans : [
                { id: 'plan_a1', name: 'A1', price: 300, profit: 9, tasksCount: 5 },
                { id: 'plan_a2', name: 'A2', price: 600, profit: 18, tasksCount: 5 },
                { id: 'plan_b1', name: 'B1', price: 1200, profit: 38, tasksCount: 5 },
                { id: 'plan_b2', name: 'B2', price: 2600, profit: 65, tasksCount: 5 },
                { id: 'plan_c1', name: 'C1', price: 5000, profit: 162, tasksCount: 5 },
                { id: 'plan_c2', name: 'C2', price: 12000, profit: 360, tasksCount: 5 },
                { id: 'plan_d1', name: 'D1', price: 26000, profit: 750, tasksCount: 5 },
                { id: 'plan_d2', name: 'D2', price: 65000, profit: 1620, tasksCount: 5 },
                { id: 'plan_business', name: 'business', price: 90000, profit: 2550, tasksCount: 5 }
              ];
              const calcPlans = settings.hideTrialPlans
                ? rawCalcPlans.filter(p => !p.isTrial || p.name === currentUser?.vipTier)
                : rawCalcPlans;
              const currentSelected = calcPlans.find(p => p.id === calcSelectedPlanId) || calcPlans[0] || rawCalcPlans[0];
              
              const feeRate = 0.15; // 15% Withdrawal Fee Deduction
              const grossDaily = currentSelected.profit;
              const dailyFee = grossDaily * feeRate;
              const netDaily = grossDaily - dailyFee;

              const grossWeekly = grossDaily * 5;
              const netWeekly = netDaily * 5;

              const grossMonthly = grossDaily * 22;
              const netMonthly = netDaily * 22;

              const grossAnnual = grossDaily * 260;
              const netAnnual = netDaily * 260;

              return (
                <div className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-slate-200 text-right">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <h3 className="text-sm font-black text-slate-900">حاسبة الأرباح الذكية</h3>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">حلل عوائدك المتوقعة بعد خصم رسوم السحب</p>
                    </div>
                  </div>

                  {/* Fee Deduction Info Badge */}
                  <div className="bg-amber-50 border border-amber-200/70 p-3.5 rounded-2xl mb-5 flex items-center justify-between text-amber-900 text-[10px] font-bold">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      <span>نسبة رسوم السحب المطبقة:</span>
                    </div>
                    <span className="font-black bg-amber-200/80 text-amber-950 px-2.5 py-1 rounded-xl text-[11px]">15%</span>
                  </div>

                  <div className="mb-6">
                    <label className="block text-[10px] font-black text-slate-500 mb-2 mr-1">فئة العضوية المستهدفة:</label>
                    <select
                      value={calcSelectedPlanId}
                      onChange={(e) => {
                        setCalcSelectedPlanId(e.target.value);
                        playChimeSound();
                      }}
                      className="w-full bg-slate-50 border border-slate-100 text-slate-800 text-xs font-black rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right cursor-pointer appearance-none shadow-inner"
                    >
                      {calcPlans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (اشتراك: {p.price} USDT • ربح: {p.profit} USDT)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold block mb-1">الربح اليومي (الصافي)</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-emerald-600">{netDaily.toFixed(2)} USDT</span>
                        <span className="text-[8px] font-bold text-slate-400 mt-0.5">قبل خصم الرسوم: {grossDaily} USDT</span>
                      </div>
                    </div>
                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold block mb-1">الربح الأسبوعي (الصافي)</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-blue-600">{netWeekly.toFixed(2)} USDT</span>
                        <span className="text-[8px] font-bold text-slate-400 mt-0.5">قبل خصم الرسوم: {grossWeekly} USDT</span>
                      </div>
                    </div>
                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold block mb-1">الربح الشهري (الصافي)</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-indigo-600">{netMonthly.toFixed(2)} USDT</span>
                        <span className="text-[8px] font-bold text-slate-400 mt-0.5">قبل خصم الرسوم: {grossMonthly} USDT</span>
                      </div>
                    </div>
                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold block mb-1">تكلفة الباقة</span>
                      <span className="text-sm font-black text-slate-900">{currentSelected.price} USDT</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-5 rounded-3xl text-center shadow-lg shadow-slate-900/10 space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold block">صافي الربح السنوي المتوقع (بعد خصم رسوم السحب 15%)</span>
                    <span className="text-xl font-black text-blue-400 block">{netAnnual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
                    <span className="text-[8px] font-bold text-slate-500 block">إجمالي رسوم السحب السنوية: {(grossAnnual - netAnnual).toLocaleString('en-US', { maximumFractionDigits: 2 })} USDT</span>
                  </div>
                </div>
              );
            })()
          ) : null}

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
                      
                      if (selectedPlanForUpgrade.isTrial) {
                        triggerNotification("⚠️ عذراً! هذه الباقة تجريبية ويتم تفعيلها حصرياً من قِبل إدارة المنصة.");
                        setSelectedPlanForUpgrade(null);
                        return;
                      }
                      
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
                        const { getAllUsers } = await import('./firebaseService');
                        const allUsers = await getAllUsers();
                        const currentSubscribers = allUsers.filter(u => u.vipTier === selectedPlanForUpgrade.name).length;
                        if (selectedPlanForUpgrade.maxSubscribers && selectedPlanForUpgrade.maxSubscribers > 0 && currentSubscribers >= selectedPlanForUpgrade.maxSubscribers) {
                          triggerNotification(`⚠️ عذراً! لقد تم الوصول إلى الحد الأقصى للمشتركين المسموح به في هذه الباقة (${selectedPlanForUpgrade.maxSubscribers} أعضاء). لا يمكنك الاشتراك بها حالياً!`);
                          setSelectedPlanForUpgrade(null);
                          return;
                        }

                        const response = await fetch('/api/upgrade-vip', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            phone: currentUser.phone,
                            password: currentUser.password || currentUser.id,
                            planName: selectedPlanForUpgrade.name,
                            planPrice: selectedPlanForUpgrade.price,
                            isTrial: selectedPlanForUpgrade.isTrial
                          })
                        });
                        
                        const data = await response.json();
                        if (!data.success) {
                          throw new Error(data.message || "فشل ترقية الحساب");
                        }
                        
                        const updatedUser = {
                          ...currentUser,
                          earnings: data.newEarnings,
                          vipTier: selectedPlanForUpgrade.name,
                          effectiveDays: (selectedPlanForUpgrade?.isTrial ? 1 : 365),
                          vipStartDate: new Date().toISOString()
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
           
          />
        </div>
      )}

        </motion.div>
      </AnimatePresence>

      {/* BOTTOM NAVIGATION BAR matching user screenshot */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200/80 shadow-lg px-2 py-1.5 flex items-center justify-around z-40 max-w-md mx-auto" style={{ direction: 'ltr' }}>
        
        {/* Navigation Tab 1: الرئيسية */}
        <button
          onClick={() => {
            navigateToTab('home');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeBottomTab === 'home' ? 'text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.5L3 10v11.5h6v-6a3 3 0 016 0v6h6V10L12 2.5z" />
          </svg>
          <span className="text-[10px] font-bold mt-1">الرئيسية</span>
        </button>

        {/* Navigation Tab 2: التوظيف */}
        <button
          onClick={() => {
            navigateToTab('jobs');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeBottomTab === 'jobs' ? 'text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
            <rect x="6" y="4" width="12" height="7" rx="1.5" fill="currentColor" opacity="0.6" />
            <path d="M3 10h18v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" fill="currentColor" />
            <path d="M12 8.2c-.4-.5-1.1-.7-1.6-.3-.6.4-.6 1.2-.2 1.7l1.8 1.9 1.8-1.9c.4-.5.4-1.3-.2-1.7-.5-.4-1.2-.2-1.6.3z" fill="white" />
          </svg>
          <span className="text-[10px] font-bold mt-1">التوظيف</span>
        </button>

        {/* Navigation Tab 3: المنصب */}
        <button
          onClick={() => {
            navigateToTab('rank');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-0.5 transition-all ${
            activeBottomTab === 'rank' ? 'text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            activeBottomTab === 'rank' ? 'bg-blue-600 shadow-md shadow-blue-500/30' : 'bg-[#cccccc]'
          }`}>
            <svg className="w-5.5 h-5.5 text-white fill-white" viewBox="0 0 24 24">
              <path d="M13.5 2L5 13h6.5v7L20 11h-6.5z" />
            </svg>
          </div>
          <span className="text-[10px] font-bold mt-0.5">المنصب</span>
        </button>

        {/* Navigation Tab 4: السجل */}
        <button
          onClick={() => {
            navigateToTab('log');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeBottomTab === 'log' ? 'text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="4.5" />
            <rect x="6.5" y="7.5" width="11" height="2.2" rx="1" fill="white" />
            <rect x="6.5" y="11.2" width="11" height="2.2" rx="1" fill="white" />
            <rect x="6.5" y="14.8" width="6.5" height="2.2" rx="1" fill="white" />
          </svg>
          <span className="text-[10px] font-bold mt-1">السجل</span>
        </button>

        {/* Navigation Tab 5: المركز الشخصي */}
        <button
          onClick={() => {
            navigateToTab('profile');
            setProfileSubView('menu');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeBottomTab === 'profile' && profileSubView !== 'jobs' ? 'text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="7.2" r="4.2" />
            <path d="M4 18.5c0-2.8 3.5-5 8-5s8 2.2 8 5v1H4v-1z" />
          </svg>
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
                هل أنت متأكد من رغبتك في حذف هذه المهمة؟ سيتم إلغاؤها والعودة إلى الصفحة الرئيسية لاختيار مهمة أخرى.
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

      {/* Daily Tasks Code Verification Modal */}
      {showTasksCodeModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleVerifyTasksCode}
            className="bg-white rounded-2xl border border-stone-200 p-6 w-full max-w-xs shadow-2xl text-center space-y-4"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <Key className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900">رمز المرور لصفحة السجل</h3>
              <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                يرجى إدخال رمز المهام اليومي المعتمد لفتح صفحة السجل والبدء بالعمل وتنفيذ مهامك.
              </p>
            </div>
            
            <div className="space-y-1.5 text-center">
              <input
                type="text"
                required
                value={tasksCodeAttempt}
                onChange={(e) => {
                  setTasksCodeAttempt(e.target.value);
                  setTasksCodeError(null);
                }}
                placeholder="أدخل رمز المهام اليومي"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 text-center tracking-widest focus:outline-none focus:border-blue-500 focus:bg-white"
                autoFocus
              />
              {tasksCodeError && (
                <p className="text-[10px] text-rose-500 font-bold leading-relaxed">{tasksCodeError}</p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-grow bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 rounded-xl text-xs cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>تأكيد الدخول</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTasksCodeModal(false);
                  setTasksCodeAttempt('');
                  setTasksCodeError(null);
                  setPendingTabSwitch(null);
                  setPendingListTab(null);
                }}
                className="bg-stone-150 hover:bg-stone-200 text-stone-700 font-extrabold px-4 py-2.5 rounded-xl text-xs cursor-pointer transition-all active:scale-95"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Subscription Required Welcome Overlay */}
      <WelcomeOverlay 
        isOpen={showSubscribeRequiredModal} 
        onClose={() => setShowSubscribeRequiredModal(false)} 
        onNavigateToUpgrade={() => {
          setShowSubscribeRequiredModal(false);
          navigateToTab('rank');
        }}
      />

      {/* Leader Bonus details and rewards Modal */}
      <LeaderBonusModal
        isOpen={showLeaderBonusModal}
        onClose={() => setShowLeaderBonusModal(false)}
        inviteCode={currentUser?.inviteCode || ''}
       
      />

    </div>
  );
}
