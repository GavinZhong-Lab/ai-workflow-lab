'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { useTranslations } from '@/hooks/use-translations';

interface AppItem {
  id: string;
  key: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  isGeneral: boolean;
  isFeatured: boolean;
  isActive: boolean;
  industries: string[];
  sortOrder: number;
  _count?: { modules: number };
}

interface BannerItem {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  linkAppKey: string | null;
  isActive: boolean;
  sortOrder: number;
}

type Tab = 'apps' | 'banners';
type ModalType = null | 'app-create' | 'app-edit' | 'banner-create' | 'banner-edit';

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-[rgb(var(--color-border))/60] ${className}`} />;
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
        </div>
      ))}
    </div>
  );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-[rgb(var(--color-text))]">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-[rgb(var(--color-border))/40]">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function ConfirmModal({ open, onClose, onConfirm, message, desc }: { open: boolean; onClose: () => void; onConfirm: () => void; message: string; desc: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl p-6 w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg text-[rgb(var(--color-text))] mb-2">{message}</h3>
        <p className="text-sm text-[rgb(var(--color-text-muted))] mb-6">{desc}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[rgb(var(--color-border))] text-sm">No</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600">Yes</button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminAppsPage() {
  const t = useTranslations('admin');
  const tc = useTranslations('common');

  const [activeTab, setActiveTab] = useState<Tab>('apps');
  const [apps, setApps] = useState<AppItem[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ type: 'app' | 'banner'; id: string } | null>(null);

  const [form, setForm] = useState({
    key: '', name: '', description: '', iconUrl: '', isGeneral: false, isFeatured: false, isActive: true, sortOrder: 0, industries: '',
    title: '', imageUrl: '', linkAppKey: '',
  });

  const fetchApps = useCallback(async () => {
    const res = await api.get<{ code: number; data: AppItem[] }>('/api/v1/admin/apps');
    if (res.code === 0) setApps(res.data);
  }, []);

  const fetchBanners = useCallback(async () => {
    const res = await api.get<{ code: number; data: BannerItem[] }>('/api/v1/admin/banners');
    if (res.code === 0) setBanners(res.data);
  }, []);

  useEffect(() => {
    Promise.all([fetchApps(), fetchBanners()]).finally(() => setLoading(false));
  }, [fetchApps, fetchBanners]);

  const closeModal = () => { setModalType(null); setEditingId(null); };

  // --- App actions ---
  const openCreateApp = () => {
    setForm({ key: '', name: '', description: '', iconUrl: '', isGeneral: false, isFeatured: false, isActive: true, sortOrder: 0, industries: '', title: '', imageUrl: '', linkAppKey: '' });
    setModalType('app-create');
  };

  const openEditApp = (app: AppItem) => {
    setEditingId(app.id);
    setForm({
      key: app.key, name: app.name, description: app.description || '', iconUrl: app.iconUrl || '',
      isGeneral: app.isGeneral, isFeatured: app.isFeatured, isActive: app.isActive,
      sortOrder: app.sortOrder, industries: (app.industries as string[]).join(', '),
      title: '', imageUrl: '', linkAppKey: '',
    });
    setModalType('app-edit');
  };

  const saveApp = async () => {
    const industries = form.industries.split(',').map((s) => s.trim()).filter(Boolean);
    if (modalType === 'app-edit' && editingId) {
      const body = { name: form.name, description: form.description || undefined, iconUrl: form.iconUrl || undefined, isGeneral: form.isGeneral, isFeatured: form.isFeatured, isActive: form.isActive, sortOrder: form.sortOrder, industries };
      await api.patch(`/api/v1/admin/apps/${editingId}`, body);
    } else {
      const body = { key: form.key, name: form.name, description: form.description || undefined, iconUrl: form.iconUrl || undefined, isGeneral: form.isGeneral, isFeatured: form.isFeatured, isActive: form.isActive, sortOrder: form.sortOrder, industries };
      await api.post('/api/v1/admin/apps', body);
    }
    closeModal();
    await fetchApps();
  };

  // --- Banner actions ---
  const openCreateBanner = () => {
    setForm({ key: '', name: '', description: '', iconUrl: '', isGeneral: false, isFeatured: false, isActive: true, sortOrder: 0, industries: '', title: '', imageUrl: '', linkAppKey: '' });
    setModalType('banner-create');
  };

  const openEditBanner = (b: BannerItem) => {
    setEditingId(b.id);
    setForm({ key: '', name: '', description: b.description || '', iconUrl: '', isGeneral: false, isFeatured: false, isActive: b.isActive, sortOrder: b.sortOrder, industries: '', title: b.title, imageUrl: b.imageUrl, linkAppKey: b.linkAppKey || '' });
    setModalType('banner-edit');
  };

  const saveBanner = async () => {
    const body = { title: form.title, description: form.description || undefined, imageUrl: form.imageUrl, linkAppKey: form.linkAppKey || undefined, isActive: form.isActive, sortOrder: form.sortOrder };
    if (modalType === 'banner-edit' && editingId) {
      await api.patch(`/api/v1/admin/banners/${editingId}`, body);
    } else {
      await api.post('/api/v1/admin/banners', body);
    }
    closeModal();
    await fetchBanners();
  };

  // --- Delete ---
  const confirmDeleteApp = (app: AppItem) => { setConfirmTarget({ type: 'app', id: app.id }); setConfirmOpen(true); };
  const confirmDeleteBanner = (b: BannerItem) => { setConfirmTarget({ type: 'banner', id: b.id }); setConfirmOpen(true); };

  const executeDelete = async () => {
    if (!confirmTarget) return;
    if (confirmTarget.type === 'app') {
      await api.delete(`/api/v1/admin/apps/${confirmTarget.id}`);
      await fetchApps();
    } else {
      await api.delete(`/api/v1/admin/banners/${confirmTarget.id}`);
      await fetchBanners();
    }
    setConfirmOpen(false);
    setConfirmTarget(null);
  };

  const isAppModal = modalType === 'app-create' || modalType === 'app-edit';
  const isBannerModal = modalType === 'banner-create' || modalType === 'banner-edit';
  const isEditing = modalType === 'app-edit' || modalType === 'banner-edit';

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="w-48 h-8" />
        <div className="flex gap-2">
          <Skeleton className="w-24 h-9" />
          <Skeleton className="w-24 h-9" />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-500" />
          <h1 className="font-display text-2xl text-[rgb(var(--color-text))]">{t('title')}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[rgb(var(--color-border))]">
        <button
          onClick={() => setActiveTab('apps')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'apps'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]'
          }`}
        >
          {t('apps')}
        </button>
        <button
          onClick={() => setActiveTab('banners')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'banners'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]'
          }`}
        >
          {t('banners')}
        </button>
      </div>

      {/* Apps Table */}
      {activeTab === 'apps' && (
        <>
          <div className="flex justify-end">
            <button onClick={openCreateApp} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-ink-900 text-sm font-medium hover:bg-amber-400 transition-colors">
              <Plus className="w-4 h-4" />{t('createApp')}
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[rgb(var(--color-border))]">
            <table className="w-full text-sm">
              <thead className="bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))]">
                <tr>
                  <th className="text-left p-3 text-[rgb(var(--color-text-muted))] font-medium">{t('name')}</th>
                  <th className="text-left p-3 text-[rgb(var(--color-text-muted))] font-medium">{t('key')}</th>
                  <th className="text-center p-3 text-[rgb(var(--color-text-muted))] font-medium">{t('isGeneral')}</th>
                  <th className="text-center p-3 text-[rgb(var(--color-text-muted))] font-medium">{t('isFeatured')}</th>
                  <th className="text-center p-3 text-[rgb(var(--color-text-muted))] font-medium">{t('isActive')}</th>
                  <th className="text-center p-3 text-[rgb(var(--color-text-muted))] font-medium">{t('sortOrder')}</th>
                  <th className="text-right p-3 text-[rgb(var(--color-text-muted))] font-medium">{tc('actions' as never)}</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr key={app.id} className="border-b border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-surface))/50]">
                    <td className="p-3 text-[rgb(var(--color-text))] font-medium">{app.name}</td>
                    <td className="p-3 text-[rgb(var(--color-text-muted))] font-mono text-xs">{app.key}</td>
                    <td className="p-3 text-center">{app.isGeneral ? '✓' : ''}</td>
                    <td className="p-3 text-center">{app.isFeatured ? '✓' : ''}</td>
                    <td className="p-3 text-center"><span className={`inline-block w-2 h-2 rounded-full ${app.isActive ? 'bg-green-500' : 'bg-red-500'}`} /></td>
                    <td className="p-3 text-center text-[rgb(var(--color-text-muted))]">{app.sortOrder}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditApp(app)} className="p-1.5 rounded hover:bg-[rgb(var(--color-border))/40]"><Pencil className="w-4 h-4 text-[rgb(var(--color-text-muted))]" /></button>
                        <button onClick={() => confirmDeleteApp(app)} className="p-1.5 rounded hover:bg-red-500/10"><Trash2 className="w-4 h-4 text-red-500" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {apps.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-[rgb(var(--color-text-muted))]">{tc('noData')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Banners Table */}
      {activeTab === 'banners' && (
        <>
          <div className="flex justify-end">
            <button onClick={openCreateBanner} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-ink-900 text-sm font-medium hover:bg-amber-400 transition-colors">
              <Plus className="w-4 h-4" />{t('createBanner')}
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[rgb(var(--color-border))]">
            <table className="w-full text-sm">
              <thead className="bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))]">
                <tr>
                  <th className="text-left p-3 text-[rgb(var(--color-text-muted))] font-medium">{t('titleField')}</th>
                  <th className="text-left p-3 text-[rgb(var(--color-text-muted))] font-medium">{t('imageUrl')}</th>
                  <th className="text-left p-3 text-[rgb(var(--color-text-muted))] font-medium">{t('linkAppKey')}</th>
                  <th className="text-center p-3 text-[rgb(var(--color-text-muted))] font-medium">{t('isActive')}</th>
                  <th className="text-center p-3 text-[rgb(var(--color-text-muted))] font-medium">{t('sortOrder')}</th>
                  <th className="text-right p-3 text-[rgb(var(--color-text-muted))] font-medium">{tc('actions' as never)}</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((b) => (
                  <tr key={b.id} className="border-b border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-surface))/50]">
                    <td className="p-3 text-[rgb(var(--color-text))] font-medium">{b.title}</td>
                    <td className="p-3 text-[rgb(var(--color-text-muted))] font-mono text-xs truncate max-w-[200px]">{b.imageUrl}</td>
                    <td className="p-3 text-[rgb(var(--color-text-muted))] font-mono text-xs">{b.linkAppKey || '-'}</td>
                    <td className="p-3 text-center"><span className={`inline-block w-2 h-2 rounded-full ${b.isActive ? 'bg-green-500' : 'bg-red-500'}`} /></td>
                    <td className="p-3 text-center text-[rgb(var(--color-text-muted))]">{b.sortOrder}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditBanner(b)} className="p-1.5 rounded hover:bg-[rgb(var(--color-border))/40]"><Pencil className="w-4 h-4 text-[rgb(var(--color-text-muted))]" /></button>
                        <button onClick={() => confirmDeleteBanner(b)} className="p-1.5 rounded hover:bg-red-500/10"><Trash2 className="w-4 h-4 text-red-500" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {banners.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-[rgb(var(--color-text-muted))]">{tc('noData')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* App Form Modal */}
      <Modal open={isAppModal} onClose={closeModal} title={isEditing ? t('editApp') : t('createApp')}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[rgb(var(--color-text-muted))] mb-1">{t('key')} *</label>
              <input value={form.key} disabled={modalType === 'app-edit'} onChange={(e) => setForm({ ...form, key: e.target.value })} className="w-full px-3 py-1.5 rounded-lg bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))] text-sm text-[rgb(var(--color-text))] disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-xs text-[rgb(var(--color-text-muted))] mb-1">{t('name')} *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-1.5 rounded-lg bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))] text-sm text-[rgb(var(--color-text))]" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[rgb(var(--color-text-muted))] mb-1">{t('description')}</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-1.5 rounded-lg bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))] text-sm text-[rgb(var(--color-text))] resize-none" />
          </div>
          <div>
            <label className="block text-xs text-[rgb(var(--color-text-muted))] mb-1">{t('iconUrl')}</label>
            <input value={form.iconUrl} onChange={(e) => setForm({ ...form, iconUrl: e.target.value })} className="w-full px-3 py-1.5 rounded-lg bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))] text-sm text-[rgb(var(--color-text))]" />
          </div>
          <div>
            <label className="block text-xs text-[rgb(var(--color-text-muted))] mb-1">{t('industries')} (comma separated)</label>
            <input value={form.industries} onChange={(e) => setForm({ ...form, industries: e.target.value })} placeholder="互联网/信息技术/软件开发, 教育/在线教育/K12" className="w-full px-3 py-1.5 rounded-lg bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))] text-sm text-[rgb(var(--color-text))]" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isGeneral} onChange={(e) => setForm({ ...form, isGeneral: e.target.checked })} />{t('isGeneral')}</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />{t('isFeatured')}</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />{t('isActive')}</label>
          </div>
          <div>
            <label className="block text-xs text-[rgb(var(--color-text-muted))] mb-1">{t('sortOrder')}</label>
            <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="w-24 px-3 py-1.5 rounded-lg bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))] text-sm text-[rgb(var(--color-text))]" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-[rgb(var(--color-border))] text-sm">{tc('cancel')}</button>
            <button onClick={saveApp} disabled={!form.key || !form.name} className="px-4 py-2 rounded-lg bg-amber-500 text-ink-900 text-sm font-medium hover:bg-amber-400 disabled:opacity-50 transition-colors">{tc('save')}</button>
          </div>
        </div>
      </Modal>

      {/* Banner Form Modal */}
      <Modal open={isBannerModal} onClose={closeModal} title={isEditing ? t('editBanner') : t('createBanner')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[rgb(var(--color-text-muted))] mb-1">{t('titleField')} *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-1.5 rounded-lg bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))] text-sm text-[rgb(var(--color-text))]" />
          </div>
          <div>
            <label className="block text-xs text-[rgb(var(--color-text-muted))] mb-1">{t('description')}</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-1.5 rounded-lg bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))] text-sm text-[rgb(var(--color-text))] resize-none" />
          </div>
          <div>
            <label className="block text-xs text-[rgb(var(--color-text-muted))] mb-1">{t('imageUrl')} *</label>
            <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="w-full px-3 py-1.5 rounded-lg bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))] text-sm text-[rgb(var(--color-text))]" />
          </div>
          <div>
            <label className="block text-xs text-[rgb(var(--color-text-muted))] mb-1">{t('linkAppKey')}</label>
            <input value={form.linkAppKey} onChange={(e) => setForm({ ...form, linkAppKey: e.target.value })} className="w-full px-3 py-1.5 rounded-lg bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))] text-sm text-[rgb(var(--color-text))]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />{t('isActive')}</label>
            <div>
              <label className="block text-xs text-[rgb(var(--color-text-muted))] mb-1">{t('sortOrder')}</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="w-24 px-3 py-1.5 rounded-lg bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))] text-sm text-[rgb(var(--color-text))]" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-[rgb(var(--color-border))] text-sm">{tc('cancel')}</button>
            <button onClick={saveBanner} disabled={!form.title || !form.imageUrl} className="px-4 py-2 rounded-lg bg-amber-500 text-ink-900 text-sm font-medium hover:bg-amber-400 disabled:opacity-50 transition-colors">{tc('save')}</button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal open={confirmOpen} onClose={() => { setConfirmOpen(false); setConfirmTarget(null); }} onConfirm={executeDelete} message={t('deleteConfirm')} desc={t('deleteConfirmDesc')} />
    </div>
  );
}
