'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Puzzle } from 'lucide-react';
import { api } from '@/lib/api';
import { useTranslations } from '@/hooks/use-translations';

interface AppModule {
  key: string;
  name: string;
  description: string | null;
  sortOrder: number;
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

function AppDetailSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="w-24 h-8" />
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-48 h-7" />
          <Skeleton className="w-96 h-5" />
        </div>
      </div>
      <Skeleton className="w-32 h-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}

export default function AppDetailPage({ params }: { params: { locale: string } }) {
  const { appKey } = useParams<{ appKey: string }>();
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
          setApp(res.data);
        } else {
          setError(res.message || 'App not found');
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [appKey]);

  if (loading) return <AppDetailSkeleton />;

  if (error || !app) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
          <Puzzle className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="font-display text-xl text-[rgb(var(--color-text))] mb-2">
          {t('appNotFound')}
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

  return (
    <div className="space-y-8">
      {/* Back button */}
      <button
        onClick={() => router.push(`/${params.locale}/apps`)}
        className="flex items-center gap-1.5 text-sm text-[rgb(var(--color-text-muted))] hover:text-amber-500 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backToMarketplace')}
      </button>

      {/* App header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4"
      >
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center text-amber-500 font-bold text-2xl shrink-0">
          {app.name[0]}
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-2xl text-[rgb(var(--color-text))]">{app.name}</h1>
          {app.description && (
            <p className="mt-1 text-[rgb(var(--color-text-muted))]">{app.description}</p>
          )}
        </div>
      </motion.div>

      {/* Modules */}
      <section>
        <h2 className="font-display text-lg text-[rgb(var(--color-text))] mb-4">{t('modules')}</h2>
        {app.modules.length === 0 ? (
          <p className="text-[rgb(var(--color-text-muted))] text-sm">{t('noModules')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {app.modules.map((mod, i) => (
              <motion.button
                key={mod.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => router.push(`/${params.locale}/apps/${app.key}/${mod.key}`)}
                className="text-left p-5 rounded-xl bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] hover:border-amber-500/20 transition-colors group"
              >
                <h3 className="font-semibold text-[rgb(var(--color-text))] group-hover:text-amber-500 transition-colors">
                  {mod.name}
                </h3>
                {mod.description && (
                  <p className="mt-1 text-sm text-[rgb(var(--color-text-muted))] line-clamp-2">
                    {mod.description}
                  </p>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
