'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Puzzle } from 'lucide-react';
import { api } from '@/lib/api';
import { useTranslations } from '@/hooks/use-translations';

interface AppModule {
  key: string;
  name: string;
  description: string | null;
}

interface AppDetail {
  id: string;
  key: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  isActive: boolean;
  modules: AppModule[];
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[rgb(var(--color-border))/60] ${className}`} />;
}

function ModulePageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="w-24 h-8" />
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div>
          <Skeleton className="w-40 h-7" />
          <Skeleton className="w-64 h-5 mt-1" />
        </div>
      </div>
      <div className="p-8 rounded-xl border border-[rgb(var(--color-border))] flex items-center justify-center">
        <Skeleton className="w-full h-64" />
      </div>
    </div>
  );
}

export default function AppModulePage({ params }: { params: { locale: string } }) {
  const { appKey, page: pageKey } = useParams<{ appKey: string; page: string }>();
  const router = useRouter();
  const t = useTranslations('apps');
  const tc = useTranslations('common');

  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ code: number; data: AppDetail | null; message: string }>(`/api/v1/apps/${appKey}`)
      .then((res) => {
        if (res.code === 0 && res.data) {
          if (!res.data.isActive) {
            setError('offline');
            return;
          }
          setApp(res.data);
        } else {
          setError(res.message || 'App not found');
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [appKey]);

  if (loading) return <ModulePageSkeleton />;

  if (error || !app) {
    const isOffline = error === 'offline';
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
          <Puzzle className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="font-display text-xl text-[rgb(var(--color-text))] mb-2">
          {isOffline ? t('offlineApp') : t('appNotFound')}
        </h2>
        <p className="text-[rgb(var(--color-text-muted))] mb-6">{t('appNotFoundDesc')}</p>
        <button
          onClick={() => router.push(`/${params.locale}/apps`)}
          className="px-4 py-2 rounded-lg bg-amber-500 text-ink-900 font-medium hover:bg-amber-400 transition-colors"
        >
          {t('backToMarketplace')}
        </button>
      </div>
    );
  }

  const currentModule = app.modules.find((m) => m.key === pageKey);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => router.push(`/${params.locale}/apps`)}
          className="text-[rgb(var(--color-text-muted))] hover:text-amber-500 transition-colors"
        >
          {t('title')}
        </button>
        <span className="text-[rgb(var(--color-text-muted))]">/</span>
        <button
          onClick={() => router.push(`/${params.locale}/apps/${app.key}`)}
          className="text-[rgb(var(--color-text-muted))] hover:text-amber-500 transition-colors"
        >
          {app.name}
        </button>
        {currentModule && (
          <>
            <span className="text-[rgb(var(--color-text-muted))]">/</span>
            <span className="text-amber-500">{currentModule.name}</span>
          </>
        )}
      </div>

      {/* Module header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center text-amber-500 font-bold">
          {(currentModule?.name || pageKey)[0].toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-xl text-[rgb(var(--color-text))]">
            {currentModule?.name || pageKey}
          </h1>
          {currentModule?.description && (
            <p className="text-sm text-[rgb(var(--color-text-muted))]">{currentModule.description}</p>
          )}
        </div>
      </motion.div>

      {/* Module content area — lazy-loaded per app/page combination */}
      <div className="p-8 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Puzzle className="w-12 h-12 text-[rgb(var(--color-border))] mb-4" />
          <p className="text-[rgb(var(--color-text-muted))]">
            {currentModule?.name || pageKey} — module content will be loaded here.
          </p>
        </div>
      </div>
    </div>
  );
}
