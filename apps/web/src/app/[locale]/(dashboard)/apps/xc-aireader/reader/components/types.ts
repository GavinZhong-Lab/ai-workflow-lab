// ============ Shared Types ============

export interface NovelItem {
  id: string; title: string; author: string | null; coverUrl: string | null;
  category: string | null; status: string; wordCount: number;
  isFeatured: boolean; sourceType: string; sortOrder: number;
  _count: { chapters: number; favorites: number };
}

export interface ChapterItem {
  id: string; chapterIndex: number; title: string; wordCount: number;
}

export interface NovelDetail {
  id: string; title: string; author: string | null; description: string | null;
  coverUrl: string | null; category: string | null; status: string; wordCount: number;
  chapters: ChapterItem[];
  _count: { favorites: number };
}

export interface ChapterDetail {
  id: string; chapterIndex: number; title: string; content: string; wordCount: number;
  novel: { title: string };
  prev: { id: string; title: string; chapterIndex: number } | null;
  next: { id: string; title: string; chapterIndex: number } | null;
}

export interface Banner {
  id: string; title: string; imageUrl: string; linkNovelId: string | null;
  sortOrder: number; isActive: boolean;
}

export interface ProgressEntry {
  chapterId: string;
  chapterTitle: string;
  chapterIndex: number;
  percentage: number;
}

export type ViewState = 'browse' | 'detail' | 'reader';
