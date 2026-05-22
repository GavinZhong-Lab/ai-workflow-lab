'use client';

import { useEffect } from 'react';
import { useTranslationStore } from '@/stores/translation';

function normalize(text: string): string {
  return text.trim().normalize('NFKC');
}

/** 翻译单条文本，返回原文或译文（翻译中返回原文作为占位） */
export function useTranslatedText(original: string): string {
  const targetLang = useTranslationStore((s) => s.targetLang);
  const cache = useTranslationStore((s) => s.cache);
  const enqueueForBatch = useTranslationStore((s) => s.enqueueForBatch);

  // Always call hooks unconditionally — React requires stable hook order
  const key = targetLang !== 'zh' && original ? normalize(original) : '';
  const cached = key ? cache[targetLang]?.[key] : undefined;

  useEffect(() => {
    if (key && cached === undefined) {
      enqueueForBatch([original], targetLang);
    }
  }, [key, cached, original, targetLang, enqueueForBatch]);

  if (targetLang === 'zh' || !original) return original;
  return cached ?? original;
}

/** 批量翻译文本，返回 { original: translated } 映射 */
export function useTranslatedTexts(originals: string[]): Record<string, string> {
  const targetLang = useTranslationStore((s) => s.targetLang);
  const cache = useTranslationStore((s) => s.cache);
  const enqueueForBatch = useTranslationStore((s) => s.enqueueForBatch);

  // Always compute — no conditional hooks
  const isZh = targetLang === 'zh';
  const result: Record<string, string> = {};
  const uncached: string[] = [];

  if (!isZh) {
    for (const text of originals) {
      if (!text) continue;
      const key = normalize(text);
      const cached = cache[targetLang]?.[key];
      if (cached !== undefined) {
        result[text] = cached;
      } else {
        result[text] = text;
        uncached.push(text);
      }
    }
  }

  const uncachedKey = uncached.join('\x00');

  useEffect(() => {
    if (!isZh && uncached.length > 0) {
      enqueueForBatch(uncached, targetLang);
    }
  }, [uncachedKey, targetLang, enqueueForBatch, isZh]);

  return result;
}
