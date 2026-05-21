'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Globe, List, Loader2 } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/cn';
import { ChapterDirectory } from './chapter-directory';
import type { NovelDetail, ChapterDetail } from './types';

interface Props {
  novel: NovelDetail;
  chapter: ChapterDetail;
  chapterLoading: boolean;
  readerLang: string;
  translating: boolean;
  displayContent: string;
  saveProgress: (novelId: string, chapterId: string, percentage: number) => void;
  prevChapter: () => void;
  nextChapter: () => void;
  switchReaderLang: (lang: string) => void;
  goBack: () => void;
  openChapter: (novelId: string, chapterId: string) => void;
  LANGUAGES: { code: string; label: string }[];
}

function Skelly({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-[rgb(var(--color-border))/60]', className)} />;
}

export function ReaderView({
  novel, chapter, chapterLoading,
  readerLang, translating, displayContent,
  saveProgress, prevChapter, nextChapter, switchReaderLang,
  goBack, openChapter, LANGUAGES,
}: Props) {
  const t = useTranslations('reader');
  const [dirOpen, setDirOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<number>(0);

  // Scroll-based progress saving (2s debounce)
  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;
    const el = contentRef.current;
    const pct = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
    if (isNaN(pct) || pct < 0) return;
    if (Math.abs(pct - lastSavedRef.current) < 1) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveProgress(novel.id, chapter.id, pct);
      lastSavedRef.current = pct;
    }, 2000);
  }, [novel.id, chapter.id, saveProgress]);

  // Flush progress on chapter change or unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (contentRef.current) {
        const el = contentRef.current;
        const pct = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
        if (!isNaN(pct) && pct >= 0 && pct !== lastSavedRef.current) {
          saveProgress(novel.id, chapter.id, pct);
        }
      }
    };
  }, [chapter.id]);

  // Reset scroll position on chapter change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
      lastSavedRef.current = 0;
    }
  }, [chapter.id]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevChapter();
      if (e.key === 'ArrowRight') nextChapter();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prevChapter, nextChapter]);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Fixed Top Nav */}
      <div className="sticky top-0 z-30 bg-[rgb(var(--color-bg))]/80 backdrop-blur-md border-b border-[rgb(var(--color-border))] -mx-4 px-4">
        <div className="flex items-center justify-between h-12 max-w-3xl mx-auto">
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-sm text-[rgb(var(--color-text-muted))] hover:text-amber-500 transition-colors min-w-0"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span className="truncate">{novel.title}</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[rgb(var(--color-text-muted))] font-mono">
              {chapter.chapterIndex} / {novel.chapters.length}
            </span>

            {/* Language selector */}
            <div className="relative flex items-center">
              {translating ? (
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[rgb(var(--color-surface))] text-xs text-amber-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {t('reader.translating')}
                </span>
              ) : (
                <>
                  <Globe className="absolute left-2 w-3 h-3 text-[rgb(var(--color-text-muted))] pointer-events-none z-10" />
                  <select
                    value={readerLang}
                    onChange={(e) => switchReaderLang(e.target.value)}
                    className={cn(
                      'appearance-none pl-7 pr-6 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                      'bg-[rgb(var(--color-surface))] border-0 focus:outline-none focus:ring-1 focus:ring-amber-500/30',
                      readerLang !== 'zh'
                        ? 'text-amber-500 bg-amber-500/10'
                        : 'text-[rgb(var(--color-text-muted))]'
                    )}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div
        ref={contentRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-3xl mx-auto px-4">
          {chapterLoading ? (
            <div className="space-y-3 py-8">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skelly key={i} className={cn('h-4', i % 4 === 0 ? 'w-3/4' : 'w-full')} />
              ))}
            </div>
          ) : (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 py-6"
            >
              {/* Title */}
              <div className="text-center py-4">
                <h1 className="font-display text-xl text-[rgb(var(--color-text))]">{chapter.title}</h1>
                <p className="text-xs text-[rgb(var(--color-text-muted))] mt-1">
                  {chapter.novel.title} · {chapter.wordCount.toLocaleString()} words
                </p>
              </div>

              {/* Content */}
              <div className={cn(
                'leading-loose whitespace-pre-wrap font-serif text-[17px]',
                'text-[rgb(var(--color-text))]'
              )}>
                {displayContent}
              </div>

              {/* Translating overlay */}
              {translating && (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-amber-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('reader.translating')}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Floating Bottom Bar */}
      <div className="sticky bottom-0 z-30 bg-[rgb(var(--color-bg))]/80 backdrop-blur-md border-t border-[rgb(var(--color-border))] -mx-4 px-4 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex items-center justify-between h-14 max-w-3xl mx-auto">
          <button
            onClick={prevChapter}
            disabled={!chapter.prev}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors',
              'bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))]',
              'text-[rgb(var(--color-text))] hover:border-amber-500/20',
              'disabled:opacity-30'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t('reader.prevChapter')}</span>
          </button>

          <button
            onClick={() => setDirOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] text-[rgb(var(--color-text))] hover:border-amber-500/20 transition-colors"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">{t('reader.chapterDirectory')}</span>
          </button>

          <button
            onClick={nextChapter}
            disabled={!chapter.next}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors',
              'bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))]',
              'text-[rgb(var(--color-text))] hover:border-amber-500/20',
              'disabled:opacity-30'
            )}
          >
            <span className="hidden sm:inline">{t('reader.nextChapter')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-center text-[10px] text-[rgb(var(--color-text-muted))] pb-1">
          {t('reader.keyboardHint')}
        </p>
      </div>

      {/* Chapter Directory Drawer */}
      <ChapterDirectory
        open={dirOpen}
        onClose={() => setDirOpen(false)}
        chapters={novel.chapters}
        currentChapterId={chapter.id}
        onSelect={(chId) => openChapter(novel.id, chId)}
      />
    </div>
  );
}
