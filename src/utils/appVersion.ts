/**
 * ============================================================
 * نظام التحديث التلقائي الصامت
 * ============================================================
 *
 * المشكلة التي يعالجها: كان بعض الأعضاء يبقون على نسخة قديمة من
 * الموقع محفوظة بمتصفحهم، فلا تصلهم الإصلاحات وتظهر لهم أخطاء
 * لا يعاني منها غيرهم — والحل السابق كان يتطلب منهم مسح بيانات
 * المتصفح يدويًا، وهو ما لا يجيده أغلب المستخدمين.
 *
 * كيف يعمل:
 *  1. يقرأ رقم الإصدار المخزّن محليًا بالجهاز.
 *  2. يجلب رقم الإصدار الحقيقي من الخادم (بلا أي كاش).
 *  3. إن اختلفا: يمسح كل الكاش ويسجّل الإصدار الجديد ثم يعيد
 *     التحميل مرة واحدة — كل ذلك صامتًا دون أي إشعار للمستخدم.
 *
 * حماية من الحلقات اللانهائية: يُسجَّل وقت آخر تحديث، ولا يُعاد
 * التحديث أكثر من مرة خلال دقيقة واحدة مهما حدث.
 */

const VERSION_KEY = 'oxlo_app_version';
const LAST_RELOAD_KEY = 'oxlo_last_auto_reload';
const RELOAD_GUARD_MS = 60 * 1000; // لا نعيد التحميل أكثر من مرة بالدقيقة

async function clearAllCaches(): Promise<void> {
  // 1) مسح كاش Service Worker
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (e) {
    console.warn('تعذّر مسح الكاش:', e);
  }

  // 2) إلغاء تسجيل أي Service Worker قديم ليُعاد تثبيته محدّثًا
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch (e) {
    console.warn('تعذّر إلغاء تسجيل Service Worker:', e);
  }
}

function canReloadNow(): boolean {
  try {
    const last = Number(localStorage.getItem(LAST_RELOAD_KEY) || 0);
    return Date.now() - last > RELOAD_GUARD_MS;
  } catch {
    return true;
  }
}

function markReloaded(): void {
  try {
    localStorage.setItem(LAST_RELOAD_KEY, String(Date.now()));
  } catch {}
}

/**
 * يتحقق من وجود نسخة أحدث ويطبّقها صامتًا.
 * يُستدعى مرة عند بدء التطبيق، ثم دوريًا كل 30 دقيقة.
 */
export async function checkForUpdate(): Promise<void> {
  try {
    // نجلب رقم الإصدار متجاوزين أي كاش (cache: 'no-store' + بصمة زمنية)
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) return;

    const data = await res.json();
    const serverVersion = String(data?.version || '').trim();
    if (!serverVersion) return;

    const localVersion = (localStorage.getItem(VERSION_KEY) || '').trim();

    // أول تشغيل على هذا الجهاز — نسجّل الإصدار فقط بلا إعادة تحميل
    if (!localVersion) {
      localStorage.setItem(VERSION_KEY, serverVersion);
      return;
    }

    // النسخة محدّثة — لا شيء لفعله
    if (localVersion === serverVersion) return;

    // نسخة قديمة: نمسح كل شيء ونحدّث صامتًا
    if (!canReloadNow()) return;

    await clearAllCaches();
    localStorage.setItem(VERSION_KEY, serverVersion);
    markReloaded();

    // إعادة تحميل قسرية تتجاوز كاش المتصفح
    window.location.reload();
  } catch (e) {
    // فشل الفحص لا يعطّل التطبيق إطلاقًا
    console.warn('تعذّر فحص التحديثات:', e);
  }
}

/**
 * يبدأ المراقبة: فحص فوري عند التشغيل، ثم كل 30 دقيقة،
 * وأيضًا عند عودة المستخدم للتطبيق بعد غياب.
 */
export function startAutoUpdate(): void {
  checkForUpdate();

  setInterval(checkForUpdate, 30 * 60 * 1000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForUpdate();
    }
  });
}

/**
 * تحديث يدوي فوري (لزر "تحديث التطبيق" بالمركز الشخصي).
 * يمسح كل شيء ويعيد التحميل دون شروط.
 */
export async function forceRefreshApp(): Promise<void> {
  await clearAllCaches();
  try {
    localStorage.removeItem(VERSION_KEY);
    localStorage.removeItem(LAST_RELOAD_KEY);
  } catch {}
  window.location.reload();
}
