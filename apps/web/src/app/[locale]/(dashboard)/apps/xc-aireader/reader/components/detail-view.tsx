'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Heart } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/cn';
import type { NovelDetail, ProgressEntry } from './types';

interface Props {
  novel: NovelDetail;
  favoriteNovelIds: Set<string>;
  favLoading: string | null;
  progressMap: Record<string, ProgressEntry>;
  openChapter: (novelId: string, chapterId: string) => void;
  toggleFavorite: (novelId: string) => void;
  goBack: () => void;
  statusLabel: (s: string) => string;
  categoryColor: (cat: string | null) => string;
}

export function DetailView({
  novel, favoriteNovelIds, favLoading, progressMap,
  openChapter, toggleFavorite, goBack,
  statusLabel, categoryColor,
}: Props) {
  const t = useTranslations('reader');
  const progress = progressMap[novel.id];

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-[rgb(var(--color-text-muted))] hover:text-amber-500 transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t('detail.backToBrowse')}
      </button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-20 h-28 rounded-lg bg-gradient-to-br from-amber-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-8 h-8 text-amber-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl text-[rgb(var(--color-text))]">{novel.title}</h1>
              <button
                onClick={() => toggleFavorite(novel.id)}
                disabled={favLoading === novel.id}
                className={cn('p-1.5 rounded-lg transition-colors', favoriteNovelIds.has(novel.id) ? 'text-red-400' : 'text-[rgb(var(--color-border))] hover:text-amber-500')}
              >
                <Heart className={cn('w-5 h-5', favoriteNovelIds.has(novel.id) && 'fill-current')} />
              </button>
            </div>
            <p className="text-sm text-[rgb(var(--color-text-muted))]">
              {novel.author || t('detail.unknownAuthor')} · {novel.wordCount.toLocaleString()} {t('detail.words')}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {novel.category && (
                <span className={cn('text-xs px-2 py-0.5 rounded-full', categoryColor(novel.category))}>
                  {t(`category.${novel.category}`)}
                </span>
              )}
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                novel.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
              )}>
                {statusLabel(novel.status)}
              </span>
              <span className="text-xs text-[rgb(var(--color-text-muted))]">
                {novel._count.favorites} {t('detail.favorites')}
              </span>
            </div>
            {novel.description && (
              <p className="mt-3 text-sm text-[rgb(var(--color-text-muted))] leading-relaxed line-clamp-4">{novel.description}</p>
            )}
          </div>
        </div>

        {/* Continue Reading */}
        {progress && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => openChapter(novel.id, progress.chapterId)}
            className="w-full p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/30 transition-all group text-left"
          >
            <p className="text-sm font-medium text-amber-500">
              {t('detail.continueReading')}
            </p>
            <p className="text-xs text-[rgb(var(--color-text-muted))] mt-1">
              {t('detail.continueFromCh').replace('{index}', String(progress.chapterIndex))} — {Math.round(progress.percentage)}%
            </p>
          </motion.button>
        )}

        {/* Chapter List */}
        <div>
          <h2 className="font-display text-lg text-[rgb(var(--color-text))] mb-3">
            {t('detail.chaptersCount').replace('{count}', String(novel.chapters.length))}
          </h2>
          {novel.chapters.length === 0 ? (
            <p className="text-sm text-[rgb(var(--color-text-muted))]">{t('detail.noChaptersYet')}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {novel.chapters.map((ch, i) => (
                <motion.button
                  key={ch.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => openChapter(novel.id, ch.id)}
                  className={cn(
                    'text-left px-4 py-3 rounded-lg bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] hover:border-amber-500/20 transition-all group',
                    progress?.chapterId === ch.id && 'border-amber-500/30'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[rgb(var(--color-text-muted))] font-mono w-6 shrink-0">
                      {ch.chapterIndex}
                    </span>
                    <span className="text-sm text-[rgb(var(--color-text))] group-hover:text-amber-500 transition-colors truncate">
                      {ch.title}
                    </span>
                    {progress?.chapterId === ch.id && (
                      <span className="text-[10px] text-amber-500 ml-auto shrink-0">
                        {Math.round(progress.percentage)}%
                      </span>
                    )}
                    <span className="text-[10px] text-[rgb(var(--color-text-muted))] ml-auto shrink-0">
                      {ch.wordCount}w
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
