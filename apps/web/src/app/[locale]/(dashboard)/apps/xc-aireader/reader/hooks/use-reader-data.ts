'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { NovelItem, NovelDetail, ChapterDetail, Banner, ProgressEntry, ViewState } from '../components/types';

const CATEGORIES = ['全部', '玄幻', '仙侠', '都市', '历史', '科幻', '游戏', '悬疑', '轻小说', '短篇'];

export function useReaderData() {
  // --- View state ---
  const [view, setView] = useState<ViewState>('browse');
  const [selectedNovel, setSelectedNovel] = useState<NovelDetail | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<ChapterDetail | null>(null);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [chapterError, setChapterError] = useState<string | null>(null);

  // --- Browse state ---
  const [novels, setNovels] = useState<NovelItem[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Favorites ---
  const [favoriteNovelIds, setFavoriteNovelIds] = useState<Set<string>>(new Set());
  const [favoriteNovels, setFavoriteNovels] = useState<NovelItem[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favLoading, setFavLoading] = useState<string | null>(null);

  // --- Progress ---
  const [progressMap, setProgressMap] = useState<Record<string, ProgressEntry>>({});

  // ============ Data Fetching ============

  const fetchNovels = useCallback(async (p: number, s: string, cat: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(p));
      params.set('limit', '20');
      if (s) params.set('search', s);
      if (cat && cat !== '全部') params.set('category', cat);

      const res = await api.get<{ code: number; data: { list: NovelItem[]; total: number }; message: string }>(
        `/api/v1/reader/novels?${params.toString()}`
      );
      setNovels(res.data.list);
      setTotal(res.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBanners = useCallback(async () => {
    try {
      const res = await api.get<{ code: number; data: { list: Banner[] }; message: string }>('/api/v1/reader/banners');
      setBanners(res.data.list);
    } catch { /* non-critical */ }
  }, []);

  const fetchFavorites = useCallback(async () => {
    try {
      const res = await api.get<{ code: number; data: { list: { novelId: string; novel: NovelItem }[] }; message: string }>('/api/v1/reader/favorites');
      setFavoriteNovelIds(new Set(res.data.list.map((f) => f.novelId)));
      setFavoriteNovels(res.data.list.map((f) => f.novel));
    } catch { /* non-critical */ }
  }, []);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await api.get<{ code: number; data: { list: { novelId: string; chapterId: string; percentage: number; chapter: { title: string; chapterIndex: number } }[] }; message: string }>('/api/v1/reader/progress');
      const map: Record<string, ProgressEntry> = {};
      for (const p of res.data.list) {
        map[p.novelId] = {
          chapterId: p.chapterId,
          chapterTitle: p.chapter?.title || '',
          chapterIndex: p.chapter?.chapterIndex || 0,
          percentage: p.percentage,
        };
      }
      setProgressMap(map);
    } catch { /* non-critical */ }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Initial data load
  useEffect(() => {
    fetchNovels(page, debouncedSearch, category);
    fetchBanners();
    fetchFavorites();
    fetchProgress();
  }, [page, debouncedSearch, category]);

  // ============ Actions ============

  const openNovel = useCallback(async (novelId: string) => {
    setLoading(true);
    try {
      const res = await api.get<{ code: number; data: NovelDetail | null; message: string }>(`/api/v1/reader/novels/${novelId}`);
      if (res.data) {
        setSelectedNovel(res.data);
        setView('detail');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  const openChapter = useCallback(async (novelId: string, chapterId: string) => {
    setChapterLoading(true);
    setChapterError(null);
    try {
      // Fetch novel detail if not already loaded
      if (!selectedNovel || selectedNovel.id !== novelId) {
        const novelRes = await api.get<{ code: number; data: NovelDetail | null; message: string }>(`/api/v1/reader/novels/${novelId}`);
        if (novelRes.data) setSelectedNovel(novelRes.data);
      }

      const res = await api.get<{ code: number; data: ChapterDetail | null; message: string }>(`/api/v1/reader/novels/${novelId}/chapters/${chapterId}`);
      if (res.data) {
        setSelectedChapter(res.data);
        setView('reader');

        // Save initial progress only if no existing record for this novel
        if (!progressMap[novelId]) {
          api.post('/api/v1/reader/progress', { novelId, chapterId, percentage: 0 }).catch(() => {});
        }
      }
    } catch (err) {
      setChapterError(err instanceof Error ? err.message : 'Failed to load chapter');
    } finally {
      setChapterLoading(false);
    }
  }, [selectedNovel, progressMap]);

  const prevChapter = useCallback(() => {
    if (selectedChapter?.prev && selectedNovel) {
      openChapter(selectedNovel.id, selectedChapter.prev.id);
    }
  }, [selectedChapter, selectedNovel, openChapter]);

  const nextChapter = useCallback(() => {
    if (selectedChapter?.next && selectedNovel) {
      openChapter(selectedNovel.id, selectedChapter.next.id);
    }
  }, [selectedChapter, selectedNovel, openChapter]);

  const toggleFavorite = useCallback(async (novelId: string) => {
    setFavLoading(novelId);
    try {
      if (favoriteNovelIds.has(novelId)) {
        await api.delete(`/api/v1/reader/favorites/${novelId}`);
        setFavoriteNovelIds((prev) => { const n = new Set(prev); n.delete(novelId); return n; });
        setFavoriteNovels((prev) => prev.filter((f) => f.id !== novelId));
      } else {
        await api.post('/api/v1/reader/favorites', { novelId });
        setFavoriteNovelIds((prev) => new Set(prev).add(novelId));
        // Re-fetch to get updated favorite novels list
        fetchFavorites();
      }
    } catch { /* ignore */ }
    finally { setFavLoading(null); }
  }, [favoriteNovelIds, fetchFavorites]);

  const saveProgress = useCallback(async (novelId: string, chapterId: string, percentage: number) => {
    try {
      await api.post('/api/v1/reader/progress', { novelId, chapterId, percentage });
      setProgressMap((prev) => ({
        ...prev,
        [novelId]: { ...prev[novelId], chapterId, percentage },
      }));
    } catch { /* ignore */ }
  }, []);

  const goBack = useCallback(() => {
    if (view === 'reader') setView('detail');
    else if (view === 'detail') { setView('browse'); setSelectedNovel(null); }
  }, [view]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (view === 'reader') {
        if (e.key === 'ArrowLeft') prevChapter();
        if (e.key === 'ArrowRight') nextChapter();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [view, prevChapter, nextChapter]);

  // ============ Helpers ============

  const statusLabel = (s: string) => s === 'COMPLETED' ? '已完结' : '连载中';
  const categoryColor = (cat: string | null) => {
    const colors: Record<string, string> = {
      '玄幻': 'bg-purple-500/10 text-purple-400', '仙侠': 'bg-blue-500/10 text-blue-400',
      '都市': 'bg-green-500/10 text-green-400', '历史': 'bg-yellow-500/10 text-yellow-400',
      '科幻': 'bg-cyan-500/10 text-cyan-400', '游戏': 'bg-pink-500/10 text-pink-400',
      '悬疑': 'bg-orange-500/10 text-orange-400', '轻小说': 'bg-rose-500/10 text-rose-400',
      '短篇': 'bg-teal-500/10 text-teal-400',
    };
    return cat ? colors[cat] || 'bg-gray-500/10 text-gray-400' : 'bg-gray-500/10 text-gray-400';
  };

  return {
    // View
    view, setView, selectedNovel, selectedChapter, chapterLoading, chapterError,
    // Browse
    novels, banners, total, page, setPage, search, setSearch,
    category, setCategory, loading, error,
    // Favorites
    favoriteNovelIds, favoriteNovels, showFavoritesOnly, setShowFavoritesOnly,
    favLoading,
    // Progress
    progressMap,
    // Actions
    fetchNovels, openNovel, openChapter, prevChapter, nextChapter,
    toggleFavorite, saveProgress, goBack,
    // Helpers
    statusLabel, categoryColor, CATEGORIES,
  };
}
