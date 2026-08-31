// رفع رقم الإصدار يجبر المتصفحات على تثبيت نسخة جديدة كليًا
// وحذف كل الكاش القديم — غيّره عند كل تحديث مهم.
const CACHE_NAME = 'oxlo-cache-v3';
const OFFLINE_URL = '/';

const APP_SHELL = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// استقبال أمر التفعيل الفوري من التطبيق عند اكتشاف نسخة جديدة
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // لا تتدخل في طلبات Firebase / API الخارجية — دائمًا شبكة حية
  if (
    request.method !== 'GET' ||
    request.url.includes('firestore.googleapis.com') ||
    request.url.includes('firebaseapp.com') ||
    request.url.includes('googleapis.com') ||
    request.url.includes('identitytoolkit') ||
    request.url.includes('/api/')
  ) {
    return;
  }

  const url = new URL(request.url);

  // ============================================================
  // إصلاح جوهري: صفحة HTML وملفات الكود (JS/CSS) تُطلب من الشبكة
  // أولًا دائمًا (Network First)، والكاش يُستخدم فقط عند انقطاع
  // الإنترنت. النسخة السابقة كانت تعرض الكاش أولًا، فكان المستخدم
  // يبقى على نسخة قديمة من الموقع حتى بعد إعادة التحميل، ولا
  // تصله أي تحديثات إلا بفتح متصفح خفي أو مسح البيانات يدويًا.
  // ============================================================
  const isDocument =
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html');

  const isAppCode =
    request.destination === 'script' ||
    request.destination === 'style' ||
    url.pathname.startsWith('/assets/');

  if (isDocument || isAppCode) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  
  // باقي الموارد (صور، خطوط، أيقونات) — الكاش أولًا للسرعة،
  // فهذه الملفات نادرًا ما تتغير ولا تؤثر على منطق التطبيق.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
