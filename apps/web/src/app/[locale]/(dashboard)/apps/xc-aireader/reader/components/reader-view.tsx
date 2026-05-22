'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, List, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';
import { useTranslationStore } from '@/stores/translation';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { ChapterDirectory } from './chapter-directory';
import { LanguageSelector } from './language-selector';
import { useTranslatedText } from '../hooks/use-translated-texts';
import type { NovelDetail, ChapterDetail } from './types';

interface Props {
  novel: NovelDetail;
  chapter: ChapterDetail;
  chapterLoading: boolean;
  chapterError: string | null;
  saveProgress: (novelId: string, chapterId: string, percentage: number) => void;
  prevChapter: () => void;
  nextChapter: () => void;
  goBack: () => void;
  openChapter: (novelId: string, chapterId: string) => void;
}

function Skelly({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-[rgb(var(--color-border))/60]', className)} />;
}

function ReaderNovelTitle({ title }: { title: string }) {
  return <>{useTranslatedText(title)}</>;
}
function ReaderChTitle({ title }: { title: string }) {
  return <>{useTranslatedText(title)}</>;
}

/** Split chapter content into paragraph batches and translate via API */
async function translateChapterContent(
  content: string,
  targetLang: string,
  signal: { aborted: boolean },
): Promise<string> {
  const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  const MAX_TEXTS = 20;
  const MAX_CHARS = 2500;
  const batches: string[][] = [];
  let cur: string[] = [];
  let len = 0;

  for (const p of paragraphs) {
    if ((len + p.length > MAX_CHARS || cur.length >= MAX_TEXTS) && cur.length > 0) {
      batches.push(cur);
      cur = [];
      len = 0;
    }
    cur.push(p);
    len += p.length;
  }
  if (cur.length > 0) batches.push(cur);

  const results: string[] = [];
  for (const batch of batches) {
    if (signal.aborted) break;
    const res = await api.post<{ code: number; data: { translatedTexts: string[] } }>(
      '/api/v1/reader/translate/batch',
      { texts: batch, targetLang },
    );
    results.push(...res.data.translatedTexts);
    if (batches.length > 1) await new Promise((r) => setTimeout(r, 200));
  }

  return results.join('\n\n');
}

export function ReaderView({
  novel, chapter, chapterLoading, chapterError,
  saveProgress, prevChapter, nextChapter,
  goBack, openChapter,
}: Props) {
  const t = useTranslations('reader');
  const [dirOpen, setDirOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<number>(0);

  // Global translation state
  const targetLang = useTranslationStore((s) => s.targetLang);
  const getCached = useTranslationStore((s) => s.getCached);
  const setCached = useTranslationStore((s) => s.setCached);
  const [translatingContent, setTranslatingContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const abortRef = useRef({ aborted: false });

  // Determine display content
  const cacheKey = `${chapter.id}:content`;
  const displayContent = (() => {
    if (targetLang === 'zh') return chapter.content;
    const cached = getCached(cacheKey, targetLang);
    return cached ?? chapter.content;
  })();

  // Translate chapter content when language or chapter changes
  useEffect(() => {
    if (targetLang === 'zh') {
      setTranslatingContent(false);
      setContentError(null);
      return;
    }

    const cached = getCached(cacheKey, targetLang);
    if (cached) {
      setTranslatingContent(false);
      setContentError(null);
      return;
    }

    // Abort any in-progress translation for previous chapter
    abortRef.current.aborted = true;
    const signal = { aborted: false };
    abortRef.current = signal;

    setTranslatingContent(true);
    setContentError(null);

    translateChapterContent(chapter.content, targetLang, signal)
      .then((result) => {
        if (signal.aborted) return;
        // Detect mock fallback — don't cache it
        if (result.startsWith('[Mock ')) {
          setContentError('No translation API configured. Please add a DeepL or Google API key in Admin > Reader > Translators.');
        } else {
          setCached(cacheKey, targetLang, result);
        }
        setTranslatingContent(false);
      })
      .catch((err) => {
        if (signal.aborted) return;
        setContentError(err instanceof Error ? err.message : 'Translation failed');
        setTranslatingContent(false);
      });

    return () => {
      signal.aborted = true;
    };
  }, [chapter.id, targetLang]);

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
            <span className="truncate"><ReaderNovelTitle title={novel.title} /></span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[rgb(var(--color-text-muted))] font-mono">
              {chapter.chapterIndex} / {novel.chapters.length}
            </span>
            <LanguageSelector variant="minimal" />
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
          ) : chapterError ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <AlertTriangle className="w-10 h-10 text-red-400" />
              <p className="text-sm text-[rgb(var(--color-text-muted))]">{chapterError}</p>
              <button
                onClick={() => openChapter(novel.id, chapter.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-ink-900 text-sm font-medium hover:bg-amber-400 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                {t('reader.retry')}
              </button>
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
                <h1 className="font-display text-xl text-[rgb(var(--color-text))]"><ReaderChTitle title={chapter.title} /></h1>
                <p className="text-xs text-[rgb(var(--color-text-muted))] mt-1">
                  <ReaderNovelTitle title={chapter.novel.title} /> · {chapter.wordCount.toLocaleString()} words
                </p>
              </div>

              {/* Translation Error Banner */}
              {contentError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{contentError}</span>
                </div>
              )}

              {/* Content */}
              <div className={cn(
                'leading-loose whitespace-pre-wrap font-serif text-[17px]',
                'text-[rgb(var(--color-text))]'
              )}>
                {displayContent}
              </div>

              {/* Translating overlay */}
              {translatingContent && (
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
