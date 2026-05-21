import { z } from 'zod';

export const novelListQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createNovelSchema = z.object({
  title: z.string().min(1).max(200),
  author: z.string().max(100).optional(),
  description: z.string().max(5000).optional(),
  coverUrl: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  status: z.enum(['SERIAL', 'COMPLETED']).default('SERIAL'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const updateNovelSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  author: z.string().max(100).optional(),
  description: z.string().max(5000).optional(),
  coverUrl: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  status: z.enum(['SERIAL', 'COMPLETED']).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const createChapterSchema = z.object({
  chapterIndex: z.number().int().min(1),
  title: z.string().min(1).max(500),
  content: z.string().optional(),
  wordCount: z.number().int().default(0),
});

export const updateChapterSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
  wordCount: z.number().int().optional(),
});

export const saveProgressSchema = z.object({
  novelId: z.string().uuid(),
  chapterId: z.string().uuid(),
  percentage: z.number().min(0).max(100),
});

export const favoriteSchema = z.object({
  novelId: z.string().uuid(),
});

export const translateSchema = z.object({
  text: z.string().min(1).max(10000),
  targetLang: z.string().min(2).max(10),
});

export const translateBatchSchema = z.object({
  texts: z.array(z.string().min(1).max(3000)).min(1).max(20),
  targetLang: z.string().min(2).max(10),
});

export const bannerSchema = z.object({
  title: z.string().min(1).max(100),
  imageUrl: z.string().min(1).max(500),
  linkNovelId: z.string().uuid().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateBannerSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  imageUrl: z.string().max(500).optional(),
  linkNovelId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const translatorSchema = z.object({
  provider: z.enum(['DEEPL', 'GOOGLE', 'MICROSOFT']),
  name: z.string().min(1).max(100),
  apiKey: z.string().min(1).max(500),
  apiEndpoint: z.string().max(500).optional(),
  priority: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateTranslatorSchema = z.object({
  provider: z.enum(['DEEPL', 'GOOGLE', 'MICROSOFT']).optional(),
  name: z.string().min(1).max(100).optional(),
  apiKey: z.string().min(1).max(500).optional(),
  apiEndpoint: z.string().max(500).optional(),
  priority: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const scraperStartSchema = z.object({
  siteName: z.enum(['qidian', 'zongheng']).default('qidian'),
  durationHours: z.number().min(0.1).max(72).default(1),
});

export type NovelListQuery = z.infer<typeof novelListQuerySchema>;
export type CreateNovelInput = z.infer<typeof createNovelSchema>;
export type UpdateNovelInput = z.infer<typeof updateNovelSchema>;
export type CreateChapterInput = z.infer<typeof createChapterSchema>;
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>;
export type SaveProgressInput = z.infer<typeof saveProgressSchema>;
export type FavoriteInput = z.infer<typeof favoriteSchema>;
export type TranslateInput = z.infer<typeof translateSchema>;
export type TranslateBatchInput = z.infer<typeof translateBatchSchema>;
export type BannerInput = z.infer<typeof bannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
export type TranslatorInput = z.infer<typeof translatorSchema>;
export type UpdateTranslatorInput = z.infer<typeof updateTranslatorSchema>;
export type ScraperStartInput = z.infer<typeof scraperStartSchema>;
