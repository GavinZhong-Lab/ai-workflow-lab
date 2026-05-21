import { prisma } from '../../lib/prisma.js';
import { ErrorCode } from '@saas/shared';
import type {
  NovelListQuery, CreateNovelInput, UpdateNovelInput,
  CreateChapterInput, UpdateChapterInput,
  SaveProgressInput, FavoriteInput, TranslateInput, TranslateBatchInput,
  BannerInput, UpdateBannerInput,
  TranslatorInput, UpdateTranslatorInput,
  ScraperStartInput,
} from './reader.schema.js';
import { translationService } from '../../services/translation/translation.service.js';
import { scraperManager } from '../../services/scraper/scraper-manager.js';

// ============ Novels ============

export class ReaderService {
  /** 小说列表（公开） */
  async listNovels(query: NovelListQuery) {
    const { search, category, page, limit } = query;
    const where: Record<string, unknown> = { isActive: true };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;

    const [total, list] = await Promise.all([
      prisma.novel.count({ where }),
      prisma.novel.findMany({
        where,
        select: {
          id: true, title: true, author: true, coverUrl: true,
          category: true, status: true, wordCount: true,
          isFeatured: true, sourceType: true, sortOrder: true,
          _count: { select: { chapters: true, favorites: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      code: ErrorCode.OK,
      data: { list, total, page, pageSize: limit },
      message: 'ok',
    };
  }

  /** 小说详情 */
  async getNovel(novelId: string) {
    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
      include: {
        chapters: {
          select: { id: true, chapterIndex: true, title: true, wordCount: true },
          orderBy: { chapterIndex: 'asc' },
        },
        _count: { select: { favorites: true } },
      },
    });
    if (!novel || !novel.isActive) {
      return { code: ErrorCode.NOT_FOUND, data: null, message: 'Novel not found' };
    }
    return { code: ErrorCode.OK, data: novel, message: 'ok' };
  }

  /** 获取章节内容 */
  async getChapter(novelId: string, chapterId: string) {
    const chapter = await prisma.chapter.findFirst({
      where: { id: chapterId, novelId, novel: { isActive: true } },
      include: {
        novel: { select: { title: true } },
      },
    });
    if (!chapter) {
      return { code: ErrorCode.NOT_FOUND, data: null, message: 'Chapter not found' };
    }

    // 获取前后章 ID
    const [prev, next] = await Promise.all([
      prisma.chapter.findFirst({
        where: { novelId, chapterIndex: chapter.chapterIndex - 1 },
        select: { id: true, title: true, chapterIndex: true },
      }),
      prisma.chapter.findFirst({
        where: { novelId, chapterIndex: chapter.chapterIndex + 1 },
        select: { id: true, title: true, chapterIndex: true },
      }),
    ]);

    return {
      code: ErrorCode.OK,
      data: { ...chapter, prev, next },
      message: 'ok',
    };
  }

  // ============ Favorites ============

  async listFavorites(userId: string) {
    const favs = await prisma.userFavorite.findMany({
      where: { userId },
      include: {
        novel: {
          select: {
            id: true, title: true, author: true, coverUrl: true,
            category: true, status: true, wordCount: true,
            isFeatured: true, sourceType: true, sortOrder: true,
            _count: { select: { chapters: true, favorites: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { code: ErrorCode.OK, data: { list: favs }, message: 'ok' };
  }

  async addFavorite(userId: string, input: FavoriteInput) {
    const novel = await prisma.novel.findUnique({ where: { id: input.novelId } });
    if (!novel) return { code: ErrorCode.NOT_FOUND, data: null, message: 'Novel not found' };

    const existing = await prisma.userFavorite.findUnique({
      where: { userId_novelId: { userId, novelId: input.novelId } },
    });
    if (existing) return { code: ErrorCode.OK, data: existing, message: 'Already favorited' };

    const fav = await prisma.userFavorite.create({
      data: { userId, novelId: input.novelId },
    });
    return { code: ErrorCode.OK, data: fav, message: 'Favorited' };
  }

  async removeFavorite(userId: string, novelId: string) {
    await prisma.userFavorite.deleteMany({ where: { userId, novelId } });
    return { code: ErrorCode.OK, data: null, message: 'Unfavorited' };
  }

  // ============ Progress ============

  async listProgress(userId: string) {
    const list = await prisma.userReadingProgress.findMany({
      where: { userId },
      include: {
        novel: { select: { id: true, title: true, coverUrl: true, author: true } },
        chapter: { select: { id: true, title: true, chapterIndex: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return { code: ErrorCode.OK, data: { list }, message: 'ok' };
  }

  async saveProgress(userId: string, input: SaveProgressInput) {
    const progress = await prisma.userReadingProgress.upsert({
      where: { userId_novelId: { userId, novelId: input.novelId } },
      create: {
        userId,
        novelId: input.novelId,
        chapterId: input.chapterId,
        percentage: input.percentage,
      },
      update: {
        chapterId: input.chapterId,
        percentage: input.percentage,
      },
    });
    return { code: ErrorCode.OK, data: progress, message: 'Progress saved' };
  }

  // ============ Translation ============

  async translate(input: TranslateInput) {
    const result = await translationService.translate(input.text, input.targetLang);
    if (!result) {
      return { code: ErrorCode.RATE_LIMIT, data: null, message: 'Translation quota exceeded. Please try later.' };
    }
    return { code: ErrorCode.OK, data: { translatedText: result, sourceLang: 'zh' }, message: 'ok' };
  }

  async translateBatch(input: TranslateBatchInput) {
    const translatedTexts: string[] = [];
    for (let i = 0; i < input.texts.length; i++) {
      const result = await translationService.translate(input.texts[i], input.targetLang);
      if (!result) break;
      translatedTexts.push(result);
      if (input.texts.length > 1 && i < input.texts.length - 1) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    return { code: ErrorCode.OK, data: { translatedTexts }, message: 'ok' };
  }

  // ============ Banners ============

  async listBanners() {
    const banners = await prisma.readerBanner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return { code: ErrorCode.OK, data: { list: banners }, message: 'ok' };
  }
}

export const readerService = new ReaderService();

// ============ Admin Service ============

export class ReaderAdminService {
  // --- Novel CRUD ---

  async listNovels(page = 1, limit = 20) {
    const [total, list] = await Promise.all([
      prisma.novel.count(),
      prisma.novel.findMany({
        select: {
          id: true, title: true, author: true, coverUrl: true,
          category: true, status: true, wordCount: true,
          sourceType: true, isActive: true, isFeatured: true, sortOrder: true,
          _count: { select: { chapters: true } },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return { code: ErrorCode.OK, data: { list, total, page, pageSize: limit }, message: 'ok' };
  }

  async getNovel(novelId: string) {
    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
      include: { chapters: { orderBy: { chapterIndex: 'asc' } } },
    });
    if (!novel) return { code: ErrorCode.NOT_FOUND, data: null, message: 'Novel not found' };
    return { code: ErrorCode.OK, data: novel, message: 'ok' };
  }

  async createNovel(input: CreateNovelInput) {
    const novel = await prisma.novel.create({ data: input });
    return { code: ErrorCode.OK, data: novel, message: 'Novel created' };
  }

  async updateNovel(novelId: string, input: UpdateNovelInput) {
    const novel = await prisma.novel.findUnique({ where: { id: novelId } });
    if (!novel) return { code: ErrorCode.NOT_FOUND, data: null, message: 'Novel not found' };
    const updated = await prisma.novel.update({ where: { id: novelId }, data: input });
    return { code: ErrorCode.OK, data: updated, message: 'Novel updated' };
  }

  async deleteNovel(novelId: string) {
    await prisma.novel.delete({ where: { id: novelId } });
    return { code: ErrorCode.OK, data: null, message: 'Novel deleted' };
  }

  // --- Chapter CRUD ---

  async createChapter(novelId: string, input: CreateChapterInput) {
    const novel = await prisma.novel.findUnique({ where: { id: novelId } });
    if (!novel) return { code: ErrorCode.NOT_FOUND, data: null, message: 'Novel not found' };

    const chapter = await prisma.chapter.upsert({
      where: { novelId_chapterIndex: { novelId, chapterIndex: input.chapterIndex } },
      create: { ...input, novelId },
      update: { title: input.title, content: input.content, wordCount: input.wordCount },
    });

    // Update novel wordCount
    const totalWords = await prisma.chapter.aggregate({
      where: { novelId },
      _sum: { wordCount: true },
    });
    await prisma.novel.update({
      where: { id: novelId },
      data: { wordCount: totalWords._sum.wordCount ?? 0 },
    });

    return { code: ErrorCode.OK, data: chapter, message: 'Chapter saved' };
  }

  async updateChapter(chapterId: string, input: UpdateChapterInput) {
    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
    if (!chapter) return { code: ErrorCode.NOT_FOUND, data: null, message: 'Chapter not found' };
    const updated = await prisma.chapter.update({ where: { id: chapterId }, data: input });
    return { code: ErrorCode.OK, data: updated, message: 'Chapter updated' };
  }

  async deleteChapter(chapterId: string) {
    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
    if (!chapter) return { code: ErrorCode.NOT_FOUND, data: null, message: 'Chapter not found' };
    await prisma.chapter.delete({ where: { id: chapterId } });

    // Update novel wordCount
    const totalWords = await prisma.chapter.aggregate({
      where: { novelId: chapter.novelId },
      _sum: { wordCount: true },
    });
    await prisma.novel.update({
      where: { id: chapter.novelId },
      data: { wordCount: totalWords._sum.wordCount ?? 0 },
    });

    return { code: ErrorCode.OK, data: null, message: 'Chapter deleted' };
  }

  // --- Banner CRUD ---

  async listBanners() {
    const banners = await prisma.readerBanner.findMany({ orderBy: { sortOrder: 'asc' } });
    return { code: ErrorCode.OK, data: { list: banners }, message: 'ok' };
  }

  async createBanner(input: BannerInput) {
    const banner = await prisma.readerBanner.create({ data: input });
    return { code: ErrorCode.OK, data: banner, message: 'Banner created' };
  }

  async updateBanner(bannerId: string, input: UpdateBannerInput) {
    const banner = await prisma.readerBanner.findUnique({ where: { id: bannerId } });
    if (!banner) return { code: ErrorCode.NOT_FOUND, data: null, message: 'Banner not found' };
    const updated = await prisma.readerBanner.update({ where: { id: bannerId }, data: input });
    return { code: ErrorCode.OK, data: updated, message: 'Banner updated' };
  }

  async deleteBanner(bannerId: string) {
    await prisma.readerBanner.delete({ where: { id: bannerId } });
    return { code: ErrorCode.OK, data: null, message: 'Banner deleted' };
  }

  // --- Translation Config CRUD ---

  async listTranslators() {
    const list = await prisma.translationConfig.findMany({
      select: {
        id: true, provider: true, name: true, apiEndpoint: true,
        priority: true, isActive: true,
        // Mask API key
        apiKey: true,
      },
      orderBy: { priority: 'asc' },
    });
    const masked = list.map((t) => ({
      ...t,
      apiKey: t.apiKey ? `****${t.apiKey.slice(-4)}` : '',
    }));
    return { code: ErrorCode.OK, data: { list: masked }, message: 'ok' };
  }

  async createTranslator(input: TranslatorInput) {
    const cfg = await prisma.translationConfig.create({ data: input });
    return { code: ErrorCode.OK, data: cfg, message: 'Translator config created' };
  }

  async updateTranslator(id: string, input: UpdateTranslatorInput) {
    const cfg = await prisma.translationConfig.findUnique({ where: { id } });
    if (!cfg) return { code: ErrorCode.NOT_FOUND, data: null, message: 'Config not found' };
    const updated = await prisma.translationConfig.update({ where: { id }, data: input });
    return { code: ErrorCode.OK, data: updated, message: 'Translator config updated' };
  }

  async deleteTranslator(id: string) {
    await prisma.translationConfig.delete({ where: { id } });
    return { code: ErrorCode.OK, data: null, message: 'Translator config deleted' };
  }

  // ============ Scraper ============

  async startScraper(input: ScraperStartInput) {
    if (scraperManager.isRunning) {
      return { code: ErrorCode.OK, data: null, message: 'Scraper is already running' };
    }

    const siteName = input.siteName || 'qidian';
    const log = await prisma.scraperLog.create({
      data: {
        siteName,
        status: 'RUNNING',
        durationHours: Math.round(input.durationHours),
        startedAt: new Date(),
      },
    });

    // Start async scraping (non-blocking)
    scraperManager.start(siteName, input.durationHours, log.id).catch((err) => {
      console.error('[Scraper] Async start failed:', err);
    });

    return { code: ErrorCode.OK, data: log, message: 'Scraper started' };
  }

  async stopScraper() {
    if (!scraperManager.isRunning) {
      return { code: ErrorCode.OK, data: null, message: 'No running scraper' };
    }

    await scraperManager.stop();

    return { code: ErrorCode.OK, data: null, message: 'Scraper stopping — finishing current operation' };
  }

  async getScraperStatus() {
    const liveStatus = scraperManager.getStatus();

    // Merge with DB data for incomplete novels count
    const incompleteCount = await prisma.scraperNovelProgress.count({
      where: { status: { in: ['INCOMPLETE', 'FAILED'] } },
    });

    const lastLog = await prisma.scraperLog.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!liveStatus.isRunning) {
      return {
        code: ErrorCode.OK,
        data: { running: false, incompleteCount, lastLog },
        message: 'No running scraper',
      };
    }

    return {
      code: ErrorCode.OK,
      data: { ...liveStatus, incompleteCount },
      message: 'ok',
    };
  }

  async listIncompleteNovels() {
    const list = await prisma.scraperNovelProgress.findMany({
      where: {
        OR: [
          { status: 'INCOMPLETE' },
          { status: 'FAILED' },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });
    return { code: ErrorCode.OK, data: { list }, message: 'ok' };
  }

  async resumeNovel(id: string) {
    const progress = await prisma.scraperNovelProgress.findUnique({ where: { id } });
    if (!progress) {
      return { code: ErrorCode.NOT_FOUND, data: null, message: 'Progress record not found' };
    }
    if (progress.status === 'COMPLETED') {
      return { code: ErrorCode.OK, data: progress, message: 'Already completed' };
    }

    // Set to INCOMPLETE so scraper picks it up on next run
    const updated = await prisma.scraperNovelProgress.update({
      where: { id },
      data: { status: 'INCOMPLETE', errorMessage: null },
    });

    return { code: ErrorCode.OK, data: updated, message: 'Will resume on next scraper run' };
  }

  async abandonNovel(id: string) {
    const progress = await prisma.scraperNovelProgress.findUnique({ where: { id } });
    if (!progress) {
      return { code: ErrorCode.NOT_FOUND, data: null, message: 'Progress record not found' };
    }

    await prisma.scraperNovelProgress.update({
      where: { id },
      data: { status: 'FAILED', errorMessage: 'Abandoned by admin' },
    });

    return { code: ErrorCode.OK, data: null, message: 'Abandoned' };
  }

  async listScraperLogs() {
    const logs = await prisma.scraperLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return { code: ErrorCode.OK, data: { list: logs }, message: 'ok' };
  }
}

export const readerAdminService = new ReaderAdminService();
