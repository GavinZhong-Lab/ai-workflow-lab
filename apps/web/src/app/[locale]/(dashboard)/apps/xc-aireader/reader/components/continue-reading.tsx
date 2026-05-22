'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';
import { useTranslatedText } from '../hooks/use-translated-texts';
import type { NovelItem, ProgressEntry } from './types';

function ContinueTitle({ title }: { title: string }) {
  return <>{useTranslatedText(title)}</>;
}
function ContinueChTitle({ title }: { title: string }) {
  return <>{useTranslatedText(title)}</>;
}

interface Props {
  novels: NovelItem[];
  progressMap: Record<string, ProgressEntry>;
  onContinue: (novelId: string, chapterId: string) => void;
}

export function ContinueReading({ novels, progressMap, onContinue }: Props) {
  const t = useTranslations('reader');

  // Inject scrollbar-hide CSS once
  useEffect(() => {
    const id = 'scrollbar-hide-style';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}`;
    document.head.appendChild(style);
  }, []);

  // Find novels that have reading progress
  const entries = novels
    .filter((n) => progressMap[n.id])
    .map((n) => ({ novel: n, progress: progressMap[n.id] }));

  if (entries.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-medium text-[rgb(var(--color-text))] mb-3">
        {t('browse.continueReading')}
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {entries.map(({ novel, progress }) => (
          <motion.button
            key={novel.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => onContinue(novel.id, progress.chapterId)}
            className="flex-shrink-0 w-56 text-left p-4 rounded-xl bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] hover:border-amber-500/30 transition-all group"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-10 rounded bg-gradient-to-br from-amber-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[rgb(var(--color-text))] group-hover:text-amber-500 transition-colors truncate">
                  <ContinueTitle title={novel.title} />
                </p>
                <p className="text-[10px] text-[rgb(var(--color-text-muted))] truncate">
                  {progress.chapterTitle ? <ContinueChTitle title={progress.chapterTitle} /> : `Ch.${progress.chapterIndex}`}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full bg-[rgb(var(--color-border))] overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, progress.percentage || 0))}%` }}
                />
              </div>
              <span className="text-[10px] text-amber-500 font-mono shrink-0">
                {Math.round(progress.percentage || 0)}%
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
