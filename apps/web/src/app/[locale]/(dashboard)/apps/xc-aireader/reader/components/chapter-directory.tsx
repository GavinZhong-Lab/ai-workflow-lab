'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';
import { useTranslatedText } from '../hooks/use-translated-texts';
import { cn } from '@/lib/cn';
import type { ChapterItem } from './types';

function DirChapterTitle({ title }: { title: string }) {
  return <>{useTranslatedText(title)}</>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  chapters: ChapterItem[];
  currentChapterId: string;
  onSelect: (chapterId: string) => void;
}

export function ChapterDirectory({ open, onClose, chapters, currentChapterId, onSelect }: Props) {
  const t = useTranslations('reader');
  const listRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLButtonElement>(null);

  // Scroll to current chapter on open
  useEffect(() => {
    if (open && currentRef.current) {
      setTimeout(() => {
        currentRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 200);
    }
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-[rgb(var(--color-bg))] border-l border-[rgb(var(--color-border))] z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--color-border))]">
              <h2 className="font-display text-lg text-[rgb(var(--color-text))]">
                {t('chapterDir.title')} ({chapters.length})
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface))] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div ref={listRef} className="flex-1 overflow-y-auto p-2">
              {chapters.map((ch) => {
                const isCurrent = ch.id === currentChapterId;
                return (
                  <button
                    key={ch.id}
                    ref={isCurrent ? currentRef : undefined}
                    onClick={() => { onSelect(ch.id); onClose(); }}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 group',
                      isCurrent
                        ? 'bg-amber-500/10 border border-amber-500/20'
                        : 'hover:bg-[rgb(var(--color-surface))] border border-transparent'
                    )}
                  >
                    <span className={cn(
                      'text-xs font-mono w-8 shrink-0 text-right',
                      isCurrent ? 'text-amber-500' : 'text-[rgb(var(--color-text-muted))]'
                    )}>
                      {ch.chapterIndex}
                    </span>
                    <span className={cn(
                      'text-sm truncate flex-1',
                      isCurrent ? 'text-amber-500 font-medium' : 'text-[rgb(var(--color-text))]'
                    )}>
                      <DirChapterTitle title={ch.title} />
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 shrink-0">
                        {t('chapterDir.current')}
                      </span>
                    )}
                    <span className="text-[10px] text-[rgb(var(--color-text-muted))] shrink-0 w-10 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      {ch.wordCount}w
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
