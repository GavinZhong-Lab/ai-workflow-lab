'use client';

import { useReaderData } from './hooks/use-reader-data';
import { useTranslations } from '@/hooks/use-translations';
import { BrowseView } from './components/browse-view';
import { DetailView } from './components/detail-view';
import { ReaderView } from './components/reader-view';

export default function ReaderModulePage() {
  const data = useReaderData();
  const t = useTranslations('reader');

  const statusLabel = (s: string) =>
    s === 'COMPLETED' ? t('detail.statusCompleted') : t('detail.statusSerial');

  if (data.view === 'browse') {
    return (
      <BrowseView
        novels={data.novels}
        banners={data.banners}
        total={data.total}
        page={data.page}
        setPage={data.setPage}
        search={data.search}
        setSearch={data.setSearch}
        category={data.category}
        setCategory={data.setCategory}
        loading={data.loading}
        error={data.error}
        favoriteNovelIds={data.favoriteNovelIds}
        favoriteNovels={data.favoriteNovels}
        showFavoritesOnly={data.showFavoritesOnly}
        setShowFavoritesOnly={data.setShowFavoritesOnly}
        favLoading={data.favLoading}
        progressMap={data.progressMap}
        fetchNovels={data.fetchNovels}
        openNovel={data.openNovel}
        openChapter={data.openChapter}
        toggleFavorite={data.toggleFavorite}
        statusLabel={statusLabel}
        categoryColor={data.categoryColor}
        CATEGORIES={data.CATEGORIES}
      />
    );
  }

  if (data.view === 'detail' && data.selectedNovel) {
    return (
      <DetailView
        novel={data.selectedNovel}
        favoriteNovelIds={data.favoriteNovelIds}
        favLoading={data.favLoading}
        progressMap={data.progressMap}
        openChapter={data.openChapter}
        toggleFavorite={data.toggleFavorite}
        goBack={data.goBack}
        statusLabel={statusLabel}
        categoryColor={data.categoryColor}
      />
    );
  }

  if (data.view === 'reader' && data.selectedChapter && data.selectedNovel) {
    return (
      <ReaderView
        novel={data.selectedNovel}
        chapter={data.selectedChapter}
        chapterLoading={data.chapterLoading}
        readerLang={data.readerLang}
        translating={data.translating}
        displayContent={data.displayContent}
        saveProgress={data.saveProgress}
        prevChapter={data.prevChapter}
        nextChapter={data.nextChapter}
        switchReaderLang={data.switchReaderLang}
        goBack={data.goBack}
        openChapter={data.openChapter}
        LANGUAGES={data.LANGUAGES}
      />
    );
  }

  return null;
}
