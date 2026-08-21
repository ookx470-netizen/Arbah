import React, { useState, useEffect, useCallback } from 'react';
import { Youtube, Facebook, Trash2, Check, X, RefreshCw, Upload, Eye, EyeOff } from 'lucide-react';
import {
  bulkAddVideoLinks,
  getAllVideoPoolItems,
  deleteVideoPoolItem,
  toggleVideoPoolItemActive,
  VideoPoolItem,
  VideoPlatform
} from '../firebaseService';

const PLATFORMS: { key: VideoPlatform; label: string; color: string }[] = [
  { key: 'youtube', label: 'يوتيوب', color: 'border-rose-500/40 text-rose-400' },
  { key: 'tiktok', label: 'تيك توك', color: 'border-slate-400/40 text-slate-200' },
  { key: 'facebook', label: 'فيسبوك', color: 'border-blue-500/40 text-blue-400' },
  { key: 'instagram', label: 'انستقرام', color: 'border-pink-500/40 text-pink-400' }
];

// أيقونة تيك توك/انستقرام كـ SVG بسيط (lucide ما فيه أيقونة رسمية لهم)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1018.16 12 6.16 6.16 0 0012 5.84zM12 16a4 4 0 114-4 4 4 0 01-4 4zm6.41-10.85a1.44 1.44 0 11-1.44-1.44 1.44 1.44 0 011.44 1.44z" />
    </svg>
  );
}

function platformIcon(p: VideoPlatform, className: string) {
  if (p === 'youtube') return <Youtube className={className} />;
  if (p === 'facebook') return <Facebook className={className} />;
  if (p === 'instagram') return <InstagramIcon className={className} />;
  return <TikTokIcon className={className} />;
}

export default function VideoPoolManager() {
  const [pasteBoxes, setPasteBoxes] = useState<Record<VideoPlatform, string>>({
    youtube: '', tiktok: '', facebook: '', instagram: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [items, setItems] = useState<VideoPoolItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState<VideoPlatform | 'all'>('all');
  const [showInactive, setShowInactive] = useState(true);

  const loadItems = useCallback(async () => {
    setLoadingList(true);
    try {
      const all = await getAllVideoPoolItems();
      setItems(all);
    } catch (e) {
      console.warn('فشل تحميل مجموعة الروابط:', e);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const counts = PLATFORMS.reduce((acc, p) => {
    acc[p.key] = items.filter(i => i.platform === p.key && i.active).length;
    return acc;
  }, {} as Record<VideoPlatform, number>);

  async function handleBulkSubmit() {
    setSubmitting(true);
    setResultMsg(null);
    setErrorMsg(null);

    const summaries: string[] = [];
    let anyWork = false;

    try {
      for (const p of PLATFORMS) {
        const raw = pasteBoxes[p.key].trim();
        if (!raw) continue;
        anyWork = true;
        const urls = raw.split('\n').map(u => u.trim()).filter(Boolean);
        const { added, skipped } = await bulkAddVideoLinks(p.key, urls);
        summaries.push(`${p.label}: تم إضافة ${added} (تجاهل ${skipped} مكرر)`);
      }

      if (!anyWork) {
        setErrorMsg('لم تُدخل أي روابط.');
        setSubmitting(false);
        return;
      }

      setResultMsg(summaries.join(' • '));
      setPasteBoxes({ youtube: '', tiktok: '', facebook: '', instagram: '' });
      await loadItems();
    } catch (e: any) {
      setErrorMsg(e?.message || 'حدث خطأ أثناء الإضافة.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('حذف هذا الرابط نهائيًا؟')) return;
    try {
      await deleteVideoPoolItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      console.warn('فشل الحذف:', e);
    }
  }

  async function handleToggle(id: string, current: boolean) {
    try {
      await toggleVideoPoolItemActive(id, !current);
      setItems(prev => prev.map(i => i.id === id ? { ...i, active: !current } : i));
    } catch (e) {
      console.warn('فشل التبديل:', e);
    }
  }

  const filteredItems = items.filter(i => {
    if (filterPlatform !== 'all' && i.platform !== filterPlatform) return false;
    if (!showInactive && !i.active) return false;
    return true;
  });

  return (
    <div className="space-y-5 text-right" dir="rtl">

      {/* عدادات سريعة */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PLATFORMS.map(p => (
          <div key={p.key} className={`bg-[#0B1528] border ${p.color} rounded-xl p-3 flex items-center justify-between`}>
            <span className="text-[11px] font-bold text-slate-300">{p.label}</span>
            <span className="text-lg font-black">{counts[p.key] ?? 0}</span>
          </div>
        ))}
      </div>

      {/* لصق جماعي */}
      <div className="bg-[#0B1528] p-5 rounded-2xl shadow-xl border border-blue-900/40 text-white">
        <div className="flex items-center gap-2 mb-4 border-b border-blue-900/30 pb-3">
          <Upload className="w-5 h-5 text-[#F39C12]" />
          <h2 className="text-sm font-extrabold text-[#F39C12]">إضافة روابط بالجملة (لصق جماعي)</h2>
        </div>
        <p className="text-[11px] text-slate-400 mb-4">
          الصق رابط واحد بكل سطر. الروابط المكررة (لنفس المنصة) تُتجاهل تلقائيًا سواء كانت مكررة بنفس اللصقة أو موجودة أصلاً بالمجموعة.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          {PLATFORMS.map(p => (
            <div key={p.key} className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                {platformIcon(p.key, "w-3.5 h-3.5")}
                {p.label}
              </label>
              <textarea
                value={pasteBoxes[p.key]}
                onChange={(e) => setPasteBoxes(prev => ({ ...prev, [p.key]: e.target.value }))}
                placeholder={`https://...\nhttps://...\nhttps://...`}
                rows={6}
                className="w-full bg-[#070D19] border border-blue-900/30 rounded-lg p-2.5 text-[11px] text-slate-200 font-mono resize-y focus:outline-none focus:border-[#F39C12]/50"
                dir="ltr"
              />
            </div>
          ))}
        </div>

        {resultMsg && (
          <div className="mt-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold p-2.5 rounded-lg flex items-center gap-2">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{resultMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mt-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-bold p-2.5 rounded-lg flex items-center gap-2">
            <X className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          onClick={handleBulkSubmit}
          disabled={submitting}
          className="mt-4 w-full bg-[#F39C12] hover:bg-[#e08e0b] disabled:opacity-50 text-[#0B1528] font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          <span>{submitting ? 'جارِ الإضافة...' : 'إضافة كل الروابط'}</span>
        </button>
      </div>

      {/* عرض/إدارة الروابط الموجودة */}
      <div className="bg-[#0B1528] p-5 rounded-2xl shadow-xl border border-blue-900/40 text-white">
        <div className="flex items-center justify-between mb-4 border-b border-blue-900/30 pb-3 flex-wrap gap-2">
          <h2 className="text-sm font-extrabold text-[#F39C12]">الروابط الحالية ({filteredItems.length})</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value as VideoPlatform | 'all')}
              className="bg-[#070D19] border border-blue-900/30 rounded-lg px-2 py-1.5 text-[10px] text-slate-200"
            >
              <option value="all">كل المنصات</option>
              {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
            <button
              onClick={() => setShowInactive(v => !v)}
              className="flex items-center gap-1 bg-[#070D19] border border-blue-900/30 rounded-lg px-2 py-1.5 text-[10px] text-slate-300"
            >
              {showInactive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              {showInactive ? 'عرض المعطّل' : 'إخفاء المعطّل'}
            </button>
            <button
              onClick={loadItems}
              className="flex items-center gap-1 bg-[#070D19] border border-blue-900/30 rounded-lg px-2 py-1.5 text-[10px] text-slate-300"
            >
              <RefreshCw className={`w-3 h-3 ${loadingList ? 'animate-spin' : ''}`} />
              تحديث
            </button>
          </div>
        </div>

        {loadingList ? (
          <div className="text-center py-8 text-slate-500 text-xs">جارِ التحميل...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">لا توجد روابط بعد.</div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-1.5">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className={`flex items-center gap-2 p-2 rounded-lg border text-[10.5px] ${
                  item.active ? 'bg-[#070D19] border-blue-900/20' : 'bg-[#070D19]/50 border-rose-900/20 opacity-50'
                }`}
              >
                {platformIcon(item.platform, "w-3.5 h-3.5 shrink-0")}
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 truncate text-slate-300 hover:text-[#F39C12] transition-colors"
                  dir="ltr"
                >
                  {item.url}
                </a>
                <button
                  onClick={() => handleToggle(item.id, item.active)}
                  className={`shrink-0 p-1.5 rounded-md ${item.active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-slate-500/10'}`}
                  title={item.active ? 'معطّل هذا الرابط' : 'فعّل هذا الرابط'}
                >
                  {item.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="shrink-0 p-1.5 rounded-md text-rose-400 hover:bg-rose-500/10"
                  title="حذف نهائي"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
