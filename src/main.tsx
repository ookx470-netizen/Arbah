import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ============================================================
// تنظيف رابط الإحالة من شريط العنوان.
//
// كان رمز الدعوة (?ref=XXXXXX) يبقى ظاهرًا في الرابط حتى بعد إنشاء
// الحساب، فيراه العضو دائمًا ويشاركه بالخطأ. نحفظه هنا مؤقتًا في
// الجلسة (لتستخدمه صفحة التسجيل عند الحاجة) ثم نزيله من الرابط فورًا.
// ============================================================
try {
  const params = new URLSearchParams(window.location.search);
  const refCode =
    params.get('ref') || params.get('invite') ||
    params.get('code') || params.get('inviteCode');

  if (refCode && refCode.trim() !== '') {
    // نحفظه مؤقتًا حتى تلتقطه صفحة التسجيل إن كان الزائر جديدًا
    sessionStorage.setItem('pending_ref_code', refCode.trim().toUpperCase());
  }

  const hasRefParam =
    params.has('ref') || params.has('invite') ||
    params.has('code') || params.has('inviteCode');

  if (hasRefParam && window.history && window.history.replaceState) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
} catch (e) {
  console.warn('URL cleanup skipped:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// ============================================================
// تسجيل Service Worker مع كشف تلقائي للتحديثات.
//
// المشكلة التي يعالجها: كان المستخدم يبقى على نسخة قديمة من الموقع
// حتى بعد رفع تحديثات جديدة، ولا تصله إلا عند فتح متصفح خفي أو مسح
// بيانات الموقع يدويًا. الآن يُفحص وجود نسخة جديدة عند كل تشغيل،
// وتُطبَّق فورًا بإعادة تحميل تلقائية واحدة.
// ============================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // فحص فوري عند التشغيل + فحص دوري كل 60 دقيقة
        registration.update().catch(() => {});
        setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000);

        // عند العثور على نسخة جديدة، فعّلها فور جاهزيتها
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // نسخة جديدة جاهزة ونسخة قديمة تعمل حاليًا — نستبدلها
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch((err) => {
        console.warn('SW registration failed:', err);
      });

    // عند تفعيل النسخة الجديدة، أعد التحميل مرة واحدة فقط
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}
