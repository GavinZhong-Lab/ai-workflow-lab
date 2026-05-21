'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, BookOpen, Play, Square, RotateCw, AlertTriangle } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';

// ============ Types ============

interface AdminNovel {
  id: string; title: string; author: string | null; coverUrl: string | null;
  category: string | null; status: string; wordCount: number;
  sourceType: string; isActive: boolean; isFeatured: boolean; sortOrder: number;
  _count: { chapters: number }; createdAt: string;
}

interface AdminBanner {
  id: string; title: string; imageUrl: string; linkNovelId: string | null;
  sortOrder: number; isActive: boolean;
}

interface Translator {
  id: string; provider: string; name: string; apiEndpoint: string | null;
  priority: number; isActive: boolean; apiKey: string;
}

interface ScraperStatus {
  isRunning: boolean;
  siteName?: string; durationHours?: number;
  elapsedMinutes?: number; remainingMinutes?: number;
  deadline?: string; startedAt?: string;
  currentNovelTitle?: string | null;
  currentChapterIndex?: number; currentTotalChapters?: number;
  stats?: { novelsTotal: number; novelsCompleted: number; novelsIncomplete: number; chaptersTotal: number; errors: number };
  lastLog?: { id: string; status: string; siteName: string; novelCount: number; chapterCount: number; startedAt: string; finishedAt: string | null; message: string | null; createdAt: string } | null;
}

interface ScraperLog {
  id: string; siteName: string; status: string;
  novelCount: number; chapterCount: number;
  startedAt: string; finishedAt: string | null;
  message: string | null; createdAt: string;
}

interface IncompleteNovel {
  id: string; novelTitle: string; siteName: string; status: string;
  fetchedChapters: number; totalChapters: number; lastChapterIndex: number;
  updatedAt: string;
}

type Tab = 'novels' | 'banners' | 'translators' | 'scraper';
type ModalType = null | 'novel-create' | 'novel-edit' | 'chapter-create' | 'banner-create' | 'banner-edit' | 'translator-create' | 'translator-edit';

function Skelly({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-[rgb(var(--color-border))/60]', className)} />;
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-[rgb(var(--color-text))]">{title}</h3>
              <button onClick={onClose} className="text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]"><X className="w-5 h-5" /></button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ConfirmDialog({ open, onClose, onConfirm, title, message }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-[rgb(var(--color-text-muted))]">{message}</p>
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] text-sm text-[rgb(var(--color-text))]">Cancel</button>
        <button onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm">Delete</button>
      </div>
    </Modal>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return <span className={cn('text-xs px-2 py-0.5 rounded-full', active ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400')}>{active ? 'Active' : 'Inactive'}</span>;
}

// ============ Main Page ============

export default function AdminReaderPage() {
  const t = useTranslations('reader');
  const [tab, setTab] = useState<Tab>('novels');
  const [modal, setModal] = useState<ModalType>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<{ type: string; id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [novels, setNovels] = useState<AdminNovel[]>([]);
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [translators, setTranslators] = useState<Translator[]>([]);
  const [scraperStatus, setScraperStatus] = useState<ScraperStatus | null>(null);
  const [scraperLogs, setScraperLogs] = useState<ScraperLog[]>([]);
  const [incompleteNovels, setIncompleteNovels] = useState<IncompleteNovel[]>([]);

  // Form
  const [form, setForm] = useState<Record<string, string | number | boolean>>({});

  const TAB_ITEMS: { key: Tab; label: string }[] = [
    { key: 'novels', label: t('admin.tabs.novels') },
    { key: 'banners', label: t('admin.tabs.banners') },
    { key: 'translators', label: t('admin.tabs.translators') },
    { key: 'scraper', label: t('admin.tabs.scraper') },
  ];

  // ============ Fetch ============

  const fetchNovels = useCallback(async () => {
    try {
      const res = await api.get<{ code: number; data: { list: AdminNovel[] }; message: string }>('/api/v1/admin/reader/novels');
      setNovels(res.data.list);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
  }, []);

  const fetchBanners = useCallback(async () => {
    try {
      const res = await api.get<{ code: number; data: { list: AdminBanner[] }; message: string }>('/api/v1/admin/reader/banners');
      setBanners(res.data.list);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
  }, []);

  const fetchTranslators = useCallback(async () => {
    try {
      const res = await api.get<{ code: number; data: { list: Translator[] }; message: string }>('/api/v1/admin/reader/translators');
      setTranslators(res.data.list);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
  }, []);

  const fetchScraper = useCallback(async () => {
    try {
      const [statusRes, incompleteRes, logsRes] = await Promise.all([
        api.get<{ code: number; data: ScraperStatus; message: string }>('/api/v1/admin/reader/scraper/status'),
        api.get<{ code: number; data: { list: IncompleteNovel[] }; message: string }>('/api/v1/admin/reader/scraper/incomplete'),
        api.get<{ code: number; data: { list: ScraperLog[] }; message: string }>('/api/v1/admin/reader/scraper/logs'),
      ]);
      setScraperStatus(statusRes.data);
      setIncompleteNovels(incompleteRes.data.list);
      setScraperLogs(logsRes.data.list);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchNovels(), fetchBanners(), fetchTranslators(), fetchScraper(),
    ]).finally(() => setLoading(false));
  }, [fetchNovels, fetchBanners, fetchTranslators, fetchScraper]);

  // Auto-poll scraper status when running
  useEffect(() => {
    if (!scraperStatus?.isRunning) return;
    const interval = setInterval(fetchScraper, 3000);
    return () => clearInterval(interval);
  }, [scraperStatus?.isRunning, fetchScraper]);

  // ============ Actions ============

  const openModal = (type: ModalType, id?: string, data?: Record<string, string | number | boolean>) => {
    setModal(type);
    setEditId(id || null);
    setForm(data || {});
  };

  const closeModal = () => { setModal(null); setEditId(null); setForm({}); };

  const handleSave = async () => {
    setSaving(true);
    try {
      switch (modal) {
        case 'novel-create':
          await api.post('/api/v1/admin/reader/novels', form);
          break;
        case 'novel-edit':
          await api.patch(`/api/v1/admin/reader/novels/${editId}`, form);
          break;
        case 'chapter-create':
          await api.post(`/api/v1/admin/reader/novels/${editId}/chapters`, form);
          break;
        case 'banner-create':
          await api.post('/api/v1/admin/reader/banners', form);
          break;
        case 'banner-edit':
          await api.patch(`/api/v1/admin/reader/banners/${editId}`, form);
          break;
        case 'translator-create':
          await api.post('/api/v1/admin/reader/translators', form);
          break;
        case 'translator-edit':
          await api.patch(`/api/v1/admin/reader/translators/${editId}`, form);
          break;
      }
      closeModal();
      await Promise.all([fetchNovels(), fetchBanners(), fetchTranslators()]);
    } catch (err) { setError(err instanceof Error ? err.message : t('admin.common.saving')); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    try {
      const { type, id } = confirmDel;
      switch (type) {
        case 'novel': await api.delete(`/api/v1/admin/reader/novels/${id}`); await fetchNovels(); break;
        case 'banner': await api.delete(`/api/v1/admin/reader/banners/${id}`); await fetchBanners(); break;
        case 'translator': await api.delete(`/api/v1/admin/reader/translators/${id}`); await fetchTranslators(); break;
        case 'chapter': await api.delete(`/api/v1/admin/reader/chapters/${id}`); await fetchNovels(); break;
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Delete failed'); }
  };

  const scraperAction = async (action: string, id?: string) => {
    try {
      if (action === 'start') await api.post('/api/v1/admin/reader/scraper/start', { durationHours: 1 });
      else if (action === 'stop') await api.post('/api/v1/admin/reader/scraper/stop');
      else if (action === 'resume') await api.post(`/api/v1/admin/reader/scraper/incomplete/${id}/resume`);
      else if (action === 'abandon') await api.post(`/api/v1/admin/reader/scraper/incomplete/${id}/abandon`);
      await fetchScraper();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); }
  };

  // ============ Form Fields ============

  const Field = ({ label, name, type = 'text', required }: { label: string; name: string; type?: string; required?: boolean }) => (
    <label className="block">
      <span className="text-xs text-[rgb(var(--color-text-muted))]">{label}</span>
      {type === 'checkbox' ? (
        <input type="checkbox" checked={!!form[name]} onChange={(e) => setForm(f => ({ ...f, [name]: e.target.checked }))} className="ml-2" />
      ) : type === 'select' ? (
        <select value={String(form[name] || '')} onChange={(e) => setForm(f => ({ ...f, [name]: e.target.value }))} required={required}
          className="w-full mt-1 px-3 py-2 rounded-lg bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] text-sm text-[rgb(var(--color-text))]">
          <option value="">{t('admin.common.select')}</option>
          {name === 'provider' && ['DEEPL', 'GOOGLE', 'MICROSOFT'].map(v => <option key={v} value={v}>{v}</option>)}
          {name === 'status' && ['SERIAL', 'COMPLETED'].map(v => <option key={v} value={v}>{v}</option>)}
          {name === 'category' && ['玄幻', '仙侠', '都市', '历史', '科幻', '游戏', '悬疑', '轻小说', '短篇'].map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      ) : (
        <input type={type} value={String(form[name] || '')} onChange={(e) => setForm(f => ({ ...f, [name]: type === 'number' ? parseInt(e.target.value) || 0 : e.target.value }))} required={required}
          className="w-full mt-1 px-3 py-2 rounded-lg bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] text-sm text-[rgb(var(--color-text))]" />
      )}
    </label>
  );

  // ============ Render ============

  if (loading) {
    return (
      <div className="space-y-6">
        <Skelly className="h-8 w-48" />
        <div className="flex gap-2">{Array.from({ length: 4 }).map((_, i) => <Skelly key={i} className="h-10 w-28" />)}</div>
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skelly key={i} className="h-10 w-full" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-purple-500/20 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h1 className="font-display text-xl text-[rgb(var(--color-text))]">{t('admin.title')}</h1>
          <p className="text-xs text-[rgb(var(--color-text-muted))]">{t('admin.subtitle')}</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between">
          <span className="text-sm text-red-400">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 rounded-xl bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] w-fit">
        {TAB_ITEMS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', tab === t.key ? 'bg-amber-500 text-ink-900' : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ==== NOVELS TAB ==== */}
      {tab === 'novels' && (
        <div className="space-y-4">
          <button onClick={() => openModal('novel-create')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 text-ink-900 text-sm font-medium hover:bg-amber-400 transition-colors">
            <Plus className="w-4 h-4" /> {t('admin.novels.add')}
          </button>

          <div className="rounded-xl border border-[rgb(var(--color-border))] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[rgb(var(--color-surface))]">
                <tr>
                  <th className="text-left px-4 py-3 text-[rgb(var(--color-text-muted))] font-medium">{t('admin.novels.title')}</th>
                  <th className="text-left px-4 py-3 text-[rgb(var(--color-text-muted))] font-medium">{t('admin.novels.author')}</th>
                  <th className="text-left px-4 py-3 text-[rgb(var(--color-text-muted))] font-medium hidden md:table-cell">{t('admin.novels.category')}</th>
                  <th className="text-left px-4 py-3 text-[rgb(var(--color-text-muted))] font-medium hidden md:table-cell">{t('admin.novels.chapters')}</th>
                  <th className="text-left px-4 py-3 text-[rgb(var(--color-text-muted))] font-medium hidden md:table-cell">{t('admin.novels.status')}</th>
                  <th className="text-right px-4 py-3 text-[rgb(var(--color-text-muted))] font-medium">{t('admin.novels.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {novels.map((novel, i) => (
                  <motion.tr key={novel.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-t border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-surface))/50]">
                    <td className="px-4 py-3 text-[rgb(var(--color-text))]">{novel.title}</td>
                    <td className="px-4 py-3 text-[rgb(var(--color-text-muted))]">{novel.author || '-'}</td>
                    <td className="px-4 py-3 text-[rgb(var(--color-text-muted))] hidden md:table-cell">{novel.category || '-'}</td>
                    <td className="px-4 py-3 text-[rgb(var(--color-text-muted))] hidden md:table-cell">{novel._count.chapters}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{novel.isActive ? <StatusBadge active /> : <StatusBadge active={false} />}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openModal('chapter-create', novel.id)} title="Add Chapter" className="p-1.5 rounded hover:bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] hover:text-green-400 transition-colors"><Plus className="w-4 h-4" /></button>
                        <button onClick={() => openModal('novel-edit', novel.id, { title: novel.title, author: novel.author || '', description: '', category: novel.category || '', status: novel.status, isActive: novel.isActive, isFeatured: novel.isFeatured, sortOrder: novel.sortOrder })} className="p-1.5 rounded hover:bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] hover:text-amber-500 transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setConfirmDel({ type: 'novel', id: novel.id, name: novel.title })} className="p-1.5 rounded hover:bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {novels.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[rgb(var(--color-text-muted))]">{t('admin.novels.noNovels')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==== BANNERS TAB ==== */}
      {tab === 'banners' && (
        <div className="space-y-4">
          <button onClick={() => openModal('banner-create')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 text-ink-900 text-sm font-medium hover:bg-amber-400 transition-colors">
            <Plus className="w-4 h-4" /> {t('admin.banners.add')}
          </button>
          <div className="rounded-xl border border-[rgb(var(--color-border))] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[rgb(var(--color-surface))]">
                <tr>
                  <th className="text-left px-4 py-3 text-[rgb(var(--color-text-muted))] font-medium">{t('admin.banners.title')}</th>
                  <th className="text-left px-4 py-3 text-[rgb(var(--color-text-muted))] font-medium hidden md:table-cell">{t('admin.banners.imageUrl')}</th>
                  <th className="text-left px-4 py-3 text-[rgb(var(--color-text-muted))] font-medium">{t('admin.banners.sort')}</th>
                  <th className="text-left px-4 py-3 text-[rgb(var(--color-text-muted))] font-medium">{t('admin.banners.active')}</th>
                  <th className="text-right px-4 py-3 text-[rgb(var(--color-text-muted))] font-medium">{t('admin.novels.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((b, i) => (
                  <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-t border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-surface))/50]">
                    <td className="px-4 py-3 text-[rgb(var(--color-text))]">{b.title}</td>
                    <td className="px-4 py-3 text-[rgb(var(--color-text-muted))] hidden md:table-cell truncate max-w-[200px]">{b.imageUrl}</td>
                    <td className="px-4 py-3 text-[rgb(var(--color-text-muted))]">{b.sortOrder}</td>
                    <td className="px-4 py-3">{b.isActive ? <StatusBadge active /> : <StatusBadge active={false} />}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openModal('banner-edit', b.id, { title: b.title, imageUrl: b.imageUrl, linkNovelId: b.linkNovelId || '', sortOrder: b.sortOrder, isActive: b.isActive })} className="p-1.5 rounded hover:bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] hover:text-amber-500 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setConfirmDel({ type: 'banner', id: b.id, name: b.title })} className="p-1.5 rounded hover:bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </motion.tr>
                ))}
                {banners.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[rgb(var(--color-text-muted))]">{t('admin.banners.noBanners')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==== TRANSLATORS TAB ==== */}
      {tab === 'translators' && (
        <div className="space-y-4">
          <button onClick={() => openModal('translator-create')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 text-ink-900 text-sm font-medium hover:bg-amber-400 transition-colors">
            <Plus className="w-4 h-4" /> {t('admin.translators.add')}
          </button>
          <div className="rounded-xl border border-[rgb(var(--color-border))] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[rgb(var(--color-surface))]">
                <tr>
                  <th className="text-left px-4 py-3 text-[rgb(var(--color-text-muted))] font-medium">{t('admin.translators.name')}</th>
                  <th className="text-left px-4 py-3 text-[rgb(var(--color-text-muted))] font-medium">{t('admin.translators.provider')}</th>
                  <th className="text-left px-4 py-3 text-[rgb(var(--color-text-muted))] font-medium hidden md:table-cell">{t('admin.translators.apiKey')}</th>
                  <th className="text-left px-4 py-3 text-[rgb(var(--color-text-muted))] font-medium">{t('admin.translators.priority')}</th>
                  <th className="text-left px-4 py-3 text-[rgb(var(--color-text-muted))] font-medium">{t('admin.translators.active')}</th>
                  <th className="text-right px-4 py-3 text-[rgb(var(--color-text-muted))] font-medium">{t('admin.novels.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {translators.map((t, i) => (
                  <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-t border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-surface))/50]">
                    <td className="px-4 py-3 text-[rgb(var(--color-text))]">{t.name}</td>
                    <td className="px-4 py-3 text-[rgb(var(--color-text-muted))]">{t.provider}</td>
                    <td className="px-4 py-3 text-[rgb(var(--color-text-muted))] hidden md:table-cell font-mono text-xs">{t.apiKey || '-'}</td>
                    <td className="px-4 py-3 text-[rgb(var(--color-text-muted))]">{t.priority}</td>
                    <td className="px-4 py-3">{t.isActive ? <StatusBadge active /> : <StatusBadge active={false} />}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openModal('translator-edit', t.id, { provider: t.provider, name: t.name, apiKey: '', apiEndpoint: t.apiEndpoint || '', priority: t.priority, isActive: t.isActive })} className="p-1.5 rounded hover:bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] hover:text-amber-500 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setConfirmDel({ type: 'translator', id: t.id, name: t.name })} className="p-1.5 rounded hover:bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </motion.tr>
                ))}
                {translators.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[rgb(var(--color-text-muted))]">{t('admin.translators.noTranslators')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==== SCRAPER TAB ==== */}
      {tab === 'scraper' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="p-5 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn('w-3 h-3 rounded-full', scraperStatus?.isRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-400')} />
                <span className="text-sm text-[rgb(var(--color-text))] font-medium">
                  {scraperStatus?.isRunning ? t('admin.scraper.running') : t('admin.scraper.idle')}
                </span>
                {scraperStatus?.isRunning && (
                  <span className="text-xs text-[rgb(var(--color-text-muted))]">
                    {scraperStatus.elapsedMinutes}m {t('admin.scraper.elapsed')} · {scraperStatus.remainingMinutes}m {t('admin.scraper.remaining')}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                {!scraperStatus?.isRunning ? (
                  <button onClick={() => scraperAction('start')} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-400 transition-colors">
                    <Play className="w-4 h-4" /> {t('admin.scraper.start')}
                  </button>
                ) : (
                  <button onClick={() => scraperAction('stop')} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-400 transition-colors">
                    <Square className="w-4 h-4" /> {t('admin.scraper.stop')}
                  </button>
                )}
                <button onClick={fetchScraper} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))] text-sm text-[rgb(var(--color-text))] hover:border-amber-500/20 transition-colors">
                  <RotateCw className="w-4 h-4" /> {t('admin.scraper.refresh')}
                </button>
              </div>
            </div>

            {scraperStatus?.isRunning && (
              <>
                {/* Stats cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="p-3 rounded-lg bg-[rgb(var(--color-bg))]">
                    <p className="text-xs text-[rgb(var(--color-text-muted))]">{t('admin.scraper.stats.site')}</p>
                    <p className="text-sm text-[rgb(var(--color-text))] capitalize">{scraperStatus.siteName || '-'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[rgb(var(--color-bg))]">
                    <p className="text-xs text-[rgb(var(--color-text-muted))]">{t('admin.scraper.stats.novels')}</p>
                    <p className="text-sm text-[rgb(var(--color-text))]">{scraperStatus.stats?.novelsTotal || 0}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[rgb(var(--color-bg))]">
                    <p className="text-xs text-[rgb(var(--color-text-muted))]">{t('admin.scraper.stats.chapters')}</p>
                    <p className="text-sm text-[rgb(var(--color-text))]">{scraperStatus.stats?.chaptersTotal || 0}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[rgb(var(--color-bg))]">
                    <p className="text-xs text-[rgb(var(--color-text-muted))]">{t('admin.scraper.stats.completed')}</p>
                    <p className="text-sm text-green-400">{scraperStatus.stats?.novelsCompleted || 0}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[rgb(var(--color-bg))]">
                    <p className="text-xs text-[rgb(var(--color-text-muted))]">{t('admin.scraper.stats.errors')}</p>
                    <p className={cn('text-sm', (scraperStatus.stats?.errors || 0) > 0 ? 'text-red-400' : 'text-[rgb(var(--color-text))]')}>{scraperStatus.stats?.errors || 0}</p>
                  </div>
                </div>

                {/* Current novel progress bar */}
                {scraperStatus.currentNovelTitle && (
                  <div className="p-3 rounded-lg bg-[rgb(var(--color-bg))] space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[rgb(var(--color-text))] truncate flex-1">{scraperStatus.currentNovelTitle}</p>
                      <span className="text-xs text-[rgb(var(--color-text-muted))] ml-2 shrink-0">
                        {scraperStatus.currentChapterIndex}/{scraperStatus.currentTotalChapters} {t('admin.scraper.chaptersCount')}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[rgb(var(--color-border))] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                        animate={{ width: `${(scraperStatus.currentTotalChapters && scraperStatus.currentChapterIndex) ? (scraperStatus.currentChapterIndex / scraperStatus.currentTotalChapters * 100) : 0}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Scraper Logs */}
          {scraperLogs.length > 0 && (
            <div className="p-4 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
              <h3 className="text-sm font-medium text-[rgb(var(--color-text))] mb-3">{t('admin.scraper.recentLogs')}</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {scraperLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-lg bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))]">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[rgb(var(--color-text))] capitalize">{log.siteName}</span>
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded-full',
                          log.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' :
                          log.status === 'FAILED' ? 'bg-red-500/10 text-red-400' :
                          log.status === 'RUNNING' ? 'bg-blue-500/10 text-blue-400' :
                          'bg-gray-500/10 text-gray-400'
                        )}>{log.status}</span>
                      </div>
                      <span className="text-[10px] text-[rgb(var(--color-text-muted))]">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-[rgb(var(--color-text-muted))]">
                      <span>{t('admin.scraper.stats.novels')}: {log.novelCount}</span>
                      <span>{t('admin.scraper.stats.chapters')}: {log.chapterCount}</span>
                      {log.finishedAt && <span>{t('admin.scraper.duration')}: {Math.round((new Date(log.finishedAt).getTime() - new Date(log.startedAt).getTime()) / 60000)}m</span>}
                      {log.message && <span className={cn('truncate', log.status === 'RUNNING' ? 'text-amber-400' : 'text-red-400')}>{log.message}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Incomplete Novels */}
          <div className="p-4 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
            <h3 className="text-sm font-medium text-[rgb(var(--color-text))] mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              {t('admin.scraper.incompleteNovels')} ({incompleteNovels.length})
            </h3>
            {incompleteNovels.length === 0 ? (
              <p className="text-sm text-[rgb(var(--color-text-muted))]">{t('admin.scraper.noIncomplete')}</p>
            ) : (
              <div className="space-y-2">
                {incompleteNovels.map((n) => (
                  <div key={n.id} className="flex items-center gap-3 p-3 rounded-lg bg-[rgb(var(--color-bg))]">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[rgb(var(--color-text))] truncate">{n.novelTitle}</p>
                      <p className="text-xs text-[rgb(var(--color-text-muted))]">{n.siteName} · {n.fetchedChapters}/{n.totalChapters} {t('admin.scraper.chaptersCount')} · {t('admin.scraper.lastChapter')}: {new Date(n.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', n.status === 'FAILED' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400')}>{n.status}</span>
                    <button onClick={() => scraperAction('resume', n.id)} className="px-3 py-1.5 rounded-lg bg-amber-500 text-ink-900 text-xs font-medium hover:bg-amber-400 transition-colors">{t('admin.scraper.resume')}</button>
                    <button onClick={() => scraperAction('abandon', n.id)} className="px-3 py-1.5 rounded-lg bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))] text-xs text-[rgb(var(--color-text-muted))] hover:text-red-400 transition-colors">{t('admin.scraper.abandon')}</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ MODALS ============ */}

      {/* Novel Create/Edit */}
      <Modal open={modal === 'novel-create' || modal === 'novel-edit'} onClose={closeModal} title={modal === 'novel-create' ? t('admin.novels.add') : t('admin.novels.edit')}>
        <div className="space-y-3">
          <Field label={t('admin.novels.title')} name="title" required />
          <Field label={t('admin.novels.author')} name="author" />
          <Field label={t('admin.novels.description')} name="description" />
          <Field label={t('admin.novels.category')} name="category" type="select" />
          <Field label={t('admin.novels.status')} name="status" type="select" />
          <Field label={t('admin.novels.sortOrder')} name="sortOrder" type="number" />
          <div className="flex gap-4">
            <Field label={t('admin.novels.isActive')} name="isActive" type="checkbox" />
            <Field label={t('admin.novels.isFeatured')} name="isFeatured" type="checkbox" />
          </div>
          <button onClick={handleSave} disabled={saving} className="w-full py-2 rounded-lg bg-amber-500 text-ink-900 text-sm font-medium hover:bg-amber-400 disabled:opacity-50 transition-colors">
            {saving ? t('admin.common.saving') : t('admin.common.save')}
          </button>
        </div>
      </Modal>

      {/* Chapter Create */}
      <Modal open={modal === 'chapter-create'} onClose={closeModal} title={t('admin.novels.addChapter')}>
        <div className="space-y-3">
          <Field label={t('admin.common.chapterIndex')} name="chapterIndex" type="number" required />
          <Field label={t('admin.novels.title')} name="title" required />
          <label className="block">
            <span className="text-xs text-[rgb(var(--color-text-muted))]">{t('admin.common.content')}</span>
            <textarea value={String(form.content || '')} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] text-sm text-[rgb(var(--color-text))] h-32 resize-y" />
          </label>
          <Field label={t('admin.common.wordCount')} name="wordCount" type="number" />
          <button onClick={handleSave} disabled={saving} className="w-full py-2 rounded-lg bg-amber-500 text-ink-900 text-sm font-medium hover:bg-amber-400 disabled:opacity-50 transition-colors">
            {saving ? t('admin.common.saving') : t('admin.common.save')}
          </button>
        </div>
      </Modal>

      {/* Banner Create/Edit */}
      <Modal open={modal === 'banner-create' || modal === 'banner-edit'} onClose={closeModal} title={modal === 'banner-create' ? t('admin.banners.add') : t('admin.banners.edit')}>
        <div className="space-y-3">
          <Field label={t('admin.banners.title')} name="title" required />
          <Field label={t('admin.banners.imageUrl')} name="imageUrl" required />
          <Field label={t('admin.banners.linkNovelId')} name="linkNovelId" />
          <Field label={t('admin.banners.sort')} name="sortOrder" type="number" />
          <Field label={t('admin.banners.active')} name="isActive" type="checkbox" />
          <button onClick={handleSave} disabled={saving} className="w-full py-2 rounded-lg bg-amber-500 text-ink-900 text-sm font-medium hover:bg-amber-400 disabled:opacity-50 transition-colors">
            {saving ? t('admin.common.saving') : t('admin.common.save')}
          </button>
        </div>
      </Modal>

      {/* Translator Create/Edit */}
      <Modal open={modal === 'translator-create' || modal === 'translator-edit'} onClose={closeModal} title={modal === 'translator-create' ? t('admin.translators.add') : t('admin.translators.edit')}>
        <div className="space-y-3">
          <Field label={t('admin.translators.name')} name="name" required />
          <Field label={t('admin.translators.provider')} name="provider" type="select" required />
          <Field label={t('admin.translators.apiKey')} name="apiKey" type="password" required={modal === 'translator-create'} />
          <Field label={t('admin.translators.endpoint')} name="apiEndpoint" />
          <Field label={t('admin.translators.priorityHint')} name="priority" type="number" />
          <Field label={t('admin.translators.active')} name="isActive" type="checkbox" />
          <button onClick={handleSave} disabled={saving} className="w-full py-2 rounded-lg bg-amber-500 text-ink-900 text-sm font-medium hover:bg-amber-400 disabled:opacity-50 transition-colors">
            {saving ? t('admin.common.saving') : t('admin.common.save')}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={handleDelete}
        title={t('admin.common.confirmDelete')}
        message={confirmDel ? t('admin.common.confirmDeleteMsg').replace('{name}', confirmDel.name) : ''}
      />
    </div>
  );
}
