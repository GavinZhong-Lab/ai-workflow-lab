'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, BookOpen, Heart, ChevronLeft, ChevronRight, Star, ListFilter } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/cn';
import { ContinueReading } from './continue-reading';
import type { NovelItem, Banner, ProgressEntry } from './types';

interface Props {
  novels: NovelItem[];
  banners: Banner[];
  total: number;
  page: number;
  setPage: (p: number) => void;
  search: string;
  setSearch: (s: string) => void;
  category: string;
  setCategory: (c: string) => void;
  loading: boolean;
  error: string | null;
  favoriteNovelIds: Set<string>;
  favoriteNovels: NovelItem[];
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (v: boolean) => void;
  favLoading: string | null;
  progressMap: Record<string, ProgressEntry>;
  fetchNovels: (p: number, s: string, cat: string) => void;
  openNovel: (id: string) => void;
  openChapter: (novelId: string, chapterId: string) => void;
  toggleFavorite: (id: string) => void;
  statusLabel: (s: string) => string;
  categoryColor: (cat: string | null) => string;
  CATEGORIES: string[];
}

function Skelly({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-[rgb(var(--color-border))/60]', className)} />;
}

export function BrowseView({
  novels, banners, total, page, setPage,
  search, setSearch, category, setCategory,
  loading, error,
  favoriteNovelIds, favoriteNovels, showFavoritesOnly, setShowFavoritesOnly,
  favLoading, progressMap,
  fetchNovels, openNovel, openChapter, toggleFavorite,
  statusLabel, categoryColor, CATEGORIES,
}: Props) {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const t = useTranslations('reader');

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setPage(1);
  };

  const displayList = showFavoritesOnly ? favoriteNovels : novels;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <button
        onClick={() => router.push(`/${locale}/apps`)}
        className="flex items-center gap-1.5 text-sm text-[rgb(var(--color-text-muted))] hover:text-amber-500 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('browse.backToMarketplace')}
      </button>

      {/* Banner */}
      {banners.length > 0 ? (
        <div className="relative overflow-hidden rounded-xl h-48 bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-cyan-500/20">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="font-display text-lg text-[rgb(var(--color-text))]">XC-AiReader</p>
              <p className="text-sm text-[rgb(var(--color-text-muted))]">AI-powered reading with instant translation</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl h-48 bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-cyan-500/20">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <p className="font-display text-2xl text-[rgb(var(--color-text))]">XC-AiReader</p>
              <p className="text-sm text-[rgb(var(--color-text-muted))] mt-1">AI-powered reading with instant translation</p>
            </div>
          </div>
        </div>
      )}

      {/* Continue Reading */}
      <ContinueReading
        novels={novels}
        progressMap={progressMap}
        onContinue={openChapter}
      />

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--color-text-muted))]" />
          <input
            type="text"
            placeholder={t('browse.searchPlaceholder')}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] text-[rgb(var(--color-text))] placeholder:text-[rgb(var(--color-text-muted))] focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat === '全部' ? '' : cat)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                (cat === '全部' && !category) || category === cat
                  ? 'bg-amber-500 text-ink-900'
                  : 'bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]'
              )}
            >
              {t(`category.${cat}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Favorites Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowFavoritesOnly(false)}
          className={cn(
            'text-sm px-3 py-1.5 rounded-lg transition-colors',
            !showFavoritesOnly
              ? 'bg-amber-500/10 text-amber-500 font-medium'
              : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]'
          )}
        >
          {t('browse.allNovels')}
        </button>
        <button
          onClick={() => setShowFavoritesOnly(true)}
          className={cn(
            'text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5',
            showFavoritesOnly
              ? 'bg-amber-500/10 text-amber-500 font-medium'
              : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]'
          )}
        >
          <ListFilter className="w-3.5 h-3.5" />
          {t('browse.myFavorites')}
        </button>
      </div>

      {/* Novel Grid */}
      {loading ? (
        <div className="space-y-6">
          <div className="flex gap-2">
            <Skelly className="w-64 h-10" />
            <Skelly className="w-28 h-10" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skelly key={i} className="h-40" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-[rgb(var(--color-text-muted))] mb-2">{error}</p>
          <button onClick={() => fetchNovels(page, search, category)} className="text-amber-500 text-sm hover:underline">
            Retry
          </button>
        </div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-[rgb(var(--color-border))] mx-auto mb-3" />
          <p className="text-[rgb(var(--color-text-muted))]">
            {showFavoritesOnly ? t('browse.noFavoritesYet') : t('browse.noNovelsFound')}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayList.map((novel, i) => (
              <motion.button
                key={novel.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => openNovel(novel.id)}
                className="text-left p-5 rounded-xl bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] hover:border-amber-500/20 transition-all group relative"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[rgb(var(--color-text))] group-hover:text-amber-500 transition-colors truncate">
                        {novel.title}
                      </h3>
                      {novel.isFeatured && <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      {progressMap[novel.id] && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 shrink-0">
                          {Math.round(progressMap[novel.id].percentage)}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[rgb(var(--color-text-muted))] mt-0.5">
                      {novel.author || t('detail.unknownAuthor')} · {novel.wordCount.toLocaleString()} {t('detail.words')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(novel.id); }}
                    disabled={favLoading === novel.id}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors shrink-0 ml-2',
                      favoriteNovelIds.has(novel.id)
                        ? 'text-red-400 hover:text-red-300'
                        : 'text-[rgb(var(--color-border))] hover:text-amber-500'
                    )}
                  >
                    <Heart className={cn('w-4 h-4', favoriteNovelIds.has(novel.id) && 'fill-current')} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {novel.category && (
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full', categoryColor(novel.category))}>
                      {t(`category.${novel.category}`)}
                    </span>
                  )}
                  <span className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full',
                    novel.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
                  )}>
                    {statusLabel(novel.status)}
                  </span>
                  <span className="text-[10px] text-[rgb(var(--color-text-muted))] ml-auto">
                    {novel._count?.chapters ?? 0} ch · {novel._count?.favorites ?? 0} favs
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Pagination */}
          {!showFavoritesOnly && total > 20 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] disabled:opacity-30 text-[rgb(var(--color-text))]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-[rgb(var(--color-text-muted))]">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="p-2 rounded-lg bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] disabled:opacity-30 text-[rgb(var(--color-text))]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
