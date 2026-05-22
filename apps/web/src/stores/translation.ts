/**
 * 翻译状态管理 (Zustand + localStorage 持久化)
 *
 * 管理全局翻译语言偏好和内容寻址的翻译缓存。
 * 短文本（标题、作者、类别名）用 normalize(text) + lang 做 key，
 * 章节正文用 chapterId + ":content:" + lang 做 key。
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

function normalize(text: string): string {
  return text.trim().normalize('NFKC');
}

const MAX_TEXTS_PER_BATCH = 20;
const MAX_CHARS_PER_TEXT = 3000;
const BATCH_DEBOUNCE_MS = 100;

export interface TranslationState {
  targetLang: string;
  cache: Record<string, Record<string, string>>;
  pendingTexts: string[];
  translatingFields: boolean;
  batchTimer: ReturnType<typeof setTimeout> | null;

  setTargetLang: (lang: string) => void;
  getCached: (text: string, targetLang: string) => string | null;
  setCached: (text: string, targetLang: string, translated: string) => void;
  enqueueForBatch: (texts: string[], targetLang: string) => void;
  flushBatch: () => void;
}

export const useTranslationStore = create<TranslationState>()(
  persist(
    (set, get) => ({
      targetLang: 'zh',
      cache: {},
      pendingTexts: [],
      translatingFields: false,
      batchTimer: null,

      setTargetLang: (lang: string) => {
        // Clear in-memory cache when switching language — old results may be stale or mock
        set({ targetLang: lang, cache: {}, pendingTexts: [], translatingFields: false });
        const { batchTimer } = get();
        if (batchTimer) clearTimeout(batchTimer);
      },

      getCached: (text: string, targetLang: string) => {
        const key = normalize(text);
        return get().cache[targetLang]?.[key] ?? null;
      },

      setCached: (text: string, targetLang: string, translated: string) => {
        const key = normalize(text);
        set((state) => ({
          cache: {
            ...state.cache,
            [targetLang]: { ...(state.cache[targetLang] || {}), [key]: translated },
          },
        }));
      },

      enqueueForBatch: (texts: string[], targetLang: string) => {
        if (targetLang === 'zh' || texts.length === 0) return;

        // Deduplicate against existing cache and pending queue
        const existingPending = new Set(get().pendingTexts);
        const uncached = texts.filter((t) => {
          if (!t) return false;
          const key = normalize(t);
          if (get().cache[targetLang]?.[key] !== undefined) return false;
          if (existingPending.has(key)) return false;
          return true;
        });

        if (uncached.length === 0) return;

        // Deduplicate by normalized key
        const seen = new Set(get().pendingTexts.map(normalize));
        const unique = uncached.filter((t) => {
          const k = normalize(t);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });

        if (unique.length === 0) return;

        set((state) => ({
          pendingTexts: [...state.pendingTexts, ...unique],
        }));

        // Debounce: clear existing timer, set new one
        const { batchTimer } = get();
        if (batchTimer) clearTimeout(batchTimer);

        const timer = setTimeout(() => {
          get().flushBatch();
        }, BATCH_DEBOUNCE_MS);

        set({ batchTimer: timer });
      },

      flushBatch: async () => {
        const { pendingTexts, targetLang } = get();
        if (pendingTexts.length === 0 || targetLang === 'zh') return;

        set({ translatingFields: true, pendingTexts: [] });

        const textsToTranslate = [...pendingTexts];

        try {
          // Split into sub-batches respecting limits
          const subBatches: string[][] = [];
          for (let i = 0; i < textsToTranslate.length; i += MAX_TEXTS_PER_BATCH) {
            subBatches.push(textsToTranslate.slice(i, i + MAX_TEXTS_PER_BATCH));
          }

          for (const batch of subBatches) {
            const resp = await api.post<{ code: number; data: { translatedTexts: string[] } }>(
              '/api/v1/reader/translate/batch',
              { texts: batch, targetLang },
            );

            const results = resp.data.translatedTexts;
            for (let i = 0; i < batch.length; i++) {
              // Never cache mock fallback results
              if (results[i] !== undefined && !results[i].startsWith('[Mock ')) {
                get().setCached(batch[i], targetLang, results[i]);
              }
            }

            // Small delay between sub-batches as safety valve
            if (subBatches.length > 1) {
              await new Promise((r) => setTimeout(r, 200));
            }
          }
        } catch {
          // On error, don't cache — user sees original text
          console.warn('[TranslationStore] batch translation failed');
        } finally {
          set({ translatingFields: false });
        }
      },
    }),
    {
      name: 'reader-translation',
      partialize: (state) => ({ targetLang: state.targetLang }),
    },
  ),
);
