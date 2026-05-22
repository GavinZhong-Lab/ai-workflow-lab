'use client';

import { Globe, Loader2 } from 'lucide-react';
import { useTranslationStore } from '@/stores/translation';
import { cn } from '@/lib/cn';

const LANGUAGES = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ru', label: 'Русский' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
];

interface Props {
  variant?: 'full' | 'minimal';
  className?: string;
}

export function LanguageSelector({ variant = 'full', className }: Props) {
  const targetLang = useTranslationStore((s) => s.targetLang);
  const setTargetLang = useTranslationStore((s) => s.setTargetLang);
  const translatingFields = useTranslationStore((s) => s.translatingFields);

  const isActive = targetLang !== 'zh';

  return (
    <div className={cn('relative flex items-center', className)}>
      {translatingFields ? (
        <span
          className={cn(
            'flex items-center gap-1 rounded-lg text-xs',
            variant === 'full'
              ? 'px-3 py-1.5 bg-amber-500/10 text-amber-500'
              : 'px-2 py-1 bg-[rgb(var(--color-surface))] text-amber-500',
          )}
        >
          <Loader2 className="w-3 h-3 animate-spin" />
          {variant === 'full' && 'Translating...'}
        </span>
      ) : (
        <>
          <Globe
            className={cn(
              'absolute left-2 w-3 h-3 pointer-events-none z-10',
              isActive ? 'text-amber-500' : 'text-[rgb(var(--color-text-muted))]',
            )}
          />
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className={cn(
              'appearance-none pl-7 pr-6 rounded-lg text-xs font-medium transition-colors cursor-pointer',
              'bg-[rgb(var(--color-surface))] border-0 focus:outline-none focus:ring-1 focus:ring-amber-500/30',
              variant === 'full' ? 'py-1.5' : 'py-1',
              isActive
                ? 'text-amber-500 bg-amber-500/10'
                : 'text-[rgb(var(--color-text-muted))]',
            )}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}

export { LANGUAGES };
