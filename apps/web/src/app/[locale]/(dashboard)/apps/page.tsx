'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
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
  isPaid: boolean;
}

interface Banner {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  linkAppKey: string | null;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[rgb(var(--color-border))/60] ${className}`} />;
}

function MarketplaceSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="w-full h-48 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    </div>
  );
}

export default function AppsMarketplacePage({ params }: { params: { locale: string } }) {
  const router = useRouter();
  const t = useTranslations('apps');
  const tc = useTranslations('common');

  const [banners, setBanners] = useState<Banner[]>([]);
  const [featured, setFeatured] = useState<AppItem[]>([]);
  const [allApps, setAllApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerIdx, setBannerIdx] = useState(0);

  useEffect(() => {
    api.get<{ data: { banners: Banner[]; featured: AppItem[]; apps: { general: AppItem[]; industrySpecific: AppItem[] } } }>('/api/v1/apps')
      .then((res) => {
        setBanners(res.data.banners);
        setFeatured(res.data.featured);
        setAllApps([...res.data.apps.general, ...res.data.apps.industrySpecific]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Banner auto-rotate
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setBannerIdx((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const prevBanner = useCallback(() => setBannerIdx((b) => (b === 0 ? banners.length - 1 : b - 1)), [banners.length]);
  const nextBanner = useCallback(() => setBannerIdx((b) => (b + 1) % banners.length), [banners.length]);

  const openApp = (key: string) => router.push(`/${params.locale}/apps/${key}`);

  if (loading) return <MarketplaceSkeleton />;

  return (
    <div className="space-y-10">
      {/* Banner 轮播 */}
      {banners.length > 0 && (
        <div className="relative overflow-hidden rounded-xl bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))]">
          <div className="relative h-48 md:h-56 flex items-center justify-center bg-gradient-to-r from-amber-500/10 via-ink-900/50 to-amber-500/5">
            <motion.div
              key={bannerIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center px-8 cursor-pointer"
              onClick={() => banners[bannerIdx].linkAppKey && openApp(banners[bannerIdx].linkAppKey!)}
            >
              <h2 className="font-display text-2xl md:text-3xl text-[rgb(var(--color-text))]">
                {banners[bannerIdx].title}
              </h2>
              {banners[bannerIdx].description && (
                <p className="mt-2 text-[rgb(var(--color-text-muted))]">{banners[bannerIdx].description}</p>
              )}
            </motion.div>
          </div>
          {banners.length > 1 && (
            <>
              <button onClick={prevBanner} className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-ink-900/80 text-white hover:bg-ink-800 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextBanner} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-ink-900/80 text-white hover:bg-ink-800 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setBannerIdx(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${i === bannerIdx ? 'bg-amber-500' : 'bg-ink-600'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* 精选应用 */}
      {featured.length > 0 && (
        <section>
          <h2 className="font-display text-xl text-[rgb(var(--color-text))] mb-4">{t('featured')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featured.map((app) => (
              <motion.button
                key={app.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => openApp(app.key)}
                className="text-left p-5 rounded-xl bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] hover:border-amber-500/30 transition-colors group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center text-amber-500 font-bold text-lg">
                    {app.name[0]}
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[rgb(var(--color-text))] group-hover:text-amber-500 transition-colors">
                      {app.name}
                    </h3>
                    {app.isPaid && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">付费</span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-[rgb(var(--color-text-muted))] line-clamp-2">{app.description}</p>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* 所有应用 */}
      <section>
        <h2 className="font-display text-xl text-[rgb(var(--color-text))] mb-4">{t('allApps')}</h2>
        {allApps.length === 0 ? (
          <p className="text-[rgb(var(--color-text-muted))]">{t('noApps')}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {allApps.map((app, i) => (
              <motion.button
                key={app.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.03 }}
                onClick={() => openApp(app.key)}
                className="text-left p-4 rounded-xl bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] hover:border-amber-500/20 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/15 to-amber-600/15 flex items-center justify-center text-amber-500 font-bold text-sm mb-2">
                  {app.name[0]}
                </div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-medium text-[rgb(var(--color-text))] group-hover:text-amber-500 transition-colors">
                    {app.name}
                  </h3>
                  {app.isPaid && (
                    <span className="px-1 py-0.5 rounded text-[9px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">付费</span>
                  )}
                </div>
                <p className="text-xs text-[rgb(var(--color-text-muted))] mt-1 line-clamp-2">{app.description}</p>
                <div className="mt-3 flex items-center text-xs text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t('viewDetails')} <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
