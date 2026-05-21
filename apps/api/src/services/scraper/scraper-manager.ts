/**
 * ScraperManager — 爬虫引擎单例调度器
 * 管理 Puppeteer 浏览器实例、启动/停止、定时器、状态同步
 */
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, Page } from 'puppeteer';
import type { ScraperLog, ScraperNovelProgress } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { QidianScraper } from './qidian-scraper.js';
import { ZonghengScraper } from './zongheng-scraper.js';

puppeteer.use(StealthPlugin());

// ============ Types ============

export interface ScraperStats {
  novelsTotal: number;
  novelsCompleted: number;
  novelsIncomplete: number;
  chaptersTotal: number;
  errors: number;
}

interface RunningState {
  isRunning: boolean;
  isStopping: boolean;
  siteName: string;
  durationHours: number;
  deadline: number;
  scraperLogId: string;
  currentNovelTitle: string | null;
  currentChapterIndex: number;
  currentTotalChapters: number;
  startedAt: number;
  stats: ScraperStats;
}

// ============ User-Agent Pool ============

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:126.0) Gecko/20100101 Firefox/126.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 OPR/111.0.0.0',
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function randomDelay(min = 3000, max = 8000): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============ Manager ============

class ScraperManager {
  private state: RunningState = this.emptyState();
  private browser: Browser | null = null;

  private emptyState(): RunningState {
    return {
      isRunning: false,
      isStopping: false,
      siteName: '',
      durationHours: 0,
      deadline: 0,
      scraperLogId: '',
      currentNovelTitle: null,
      currentChapterIndex: 0,
      currentTotalChapters: 0,
      startedAt: 0,
      stats: { novelsTotal: 0, novelsCompleted: 0, novelsIncomplete: 0, chaptersTotal: 0, errors: 0 },
    };
  }

  /** 检查是否有运行中的爬虫 */
  get isRunning(): boolean {
    return this.state.isRunning;
  }

  /** 获取实时状态（供 API 查询） */
  getStatus() {
    const s = this.state;
    if (!s.isRunning) return { isRunning: false };

    const elapsed = Date.now() - s.startedAt;
    const remaining = Math.max(0, s.deadline - Date.now());
    return {
      isRunning: true,
      siteName: s.siteName,
      durationHours: s.durationHours,
      elapsedMinutes: Math.floor(elapsed / 60000),
      remainingMinutes: Math.ceil(remaining / 60000),
      deadline: new Date(s.deadline).toISOString(),
      scraperLogId: s.scraperLogId,
      currentNovelTitle: s.currentNovelTitle,
      currentChapterIndex: s.currentChapterIndex,
      currentTotalChapters: s.currentTotalChapters,
      stats: s.stats,
      startedAt: new Date(s.startedAt).toISOString(),
    };
  }

  /** 检查是否已超时 */
  private isDeadlineExpired(): boolean {
    return Date.now() >= this.state.deadline;
  }

  /** 检查是否正在停止 */
  private isStopping(): boolean {
    return this.state.isStopping;
  }

  /** 启动爬虫 */
  async start(siteName: string, durationHours: number, scraperLogId: string): Promise<void> {
    if (this.state.isRunning) {
      throw new Error('Scraper is already running');
    }

    const deadline = Date.now() + durationHours * 3600000;

    this.state = {
      isRunning: true,
      isStopping: false,
      siteName,
      durationHours,
      deadline,
      scraperLogId,
      currentNovelTitle: null,
      currentChapterIndex: 0,
      currentTotalChapters: 0,
      startedAt: Date.now(),
      stats: { novelsTotal: 0, novelsCompleted: 0, novelsIncomplete: 0, chaptersTotal: 0, errors: 0 },
    };

    // 在后台异步运行
    this.runLoop(siteName, scraperLogId, deadline).catch(async (err) => {
      console.error('[Scraper] Fatal error:', err);
      await this.cleanup('FAILED', (err as Error).message);
    });
  }

  /** 优雅停止 */
  async stop(): Promise<void> {
    if (!this.state.isRunning) return;
    this.state.isStopping = true;
    console.log('[Scraper] Stop requested — will finish current operation');
  }

  // ============ Main Loop ============

  private async runLoop(siteName: string, scraperLogId: string, deadline: number): Promise<void> {
    console.log(`[Scraper] Starting ${siteName} scraper, deadline: ${new Date(deadline).toISOString()}`);

    try {
      // 启动浏览器
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
        ],
      });

      const scraper = siteName === 'qidian' ? new QidianScraper() : new ZonghengScraper();

      // 优先恢复未完成的小说
      const incompleteNovels = await prisma.scraperNovelProgress.findMany({
        where: { siteName, status: 'INCOMPLETE' },
        orderBy: { lastChapterIndex: 'desc' },
      });

      if (incompleteNovels.length > 0) {
        console.log(`[Scraper] Resuming ${incompleteNovels.length} incomplete novels`);
        for (const progress of incompleteNovels) {
          if (this.isStopping() || this.isDeadlineExpired()) break;
          await prisma.scraperNovelProgress.update({
            where: { id: progress.id },
            data: { status: 'RUNNING', scraperLogId },
          });
          await this.scrapeNovel(scraper, progress.novelUrl!, progress, deadline);
        }
      }

      // 从列表页采集新小说
      if (!this.isStopping() && !this.isDeadlineExpired()) {
        console.log('[Scraper] Fetching novel list...');
        const novelUrls = await this.fetchNovelListSafely(scraper);
        console.log(`[Scraper] Found ${novelUrls.length} novels`);

        for (const { url, title, author } of novelUrls) {
          if (this.isStopping() || this.isDeadlineExpired()) break;

          // 去重检查
          const exists = await this.checkDuplicate(url, title, author);
          if (exists) {
            console.log(`[Scraper] Skipping duplicate: ${title}`);
            continue;
          }

          this.state.currentNovelTitle = title;
          this.state.stats.novelsTotal++;

          // 创建进度记录
          const progress = await prisma.scraperNovelProgress.create({
            data: {
              scraperLogId,
              siteName,
              novelTitle: title,
              novelUrl: url,
              author,
              status: 'RUNNING',
            },
          });

          await this.scrapeNovel(scraper, url, progress, deadline);
        }
      }

      await this.cleanup('COMPLETED', null);
    } catch (err) {
      console.error('[Scraper] Run loop error:', err);
      await this.cleanup('FAILED', (err as Error).message);
    }
  }

  /** 安全地获取小说列表 */
  private async fetchNovelListSafely(scraper: QidianScraper | ZonghengScraper): Promise<{ url: string; title: string; author: string }[]> {
    if (!this.browser) return [];
    const page = await this.browser.newPage();
    try {
      await page.setUserAgent(randomUA());
      return await scraper.fetchNovelList(page);
    } catch (err) {
      console.error('[Scraper] Failed to fetch novel list:', err);
      return [];
    } finally {
      await page.close().catch(() => {});
    }
  }

  /** 抓取单本小说 */
  private async scrapeNovel(
    scraper: QidianScraper | ZonghengScraper,
    novelUrl: string,
    progress: ScraperNovelProgress,
    deadline: number,
  ): Promise<void> {
    if (!this.browser) return;
    const page = await this.browser.newPage();

    try {
      await page.setUserAgent(randomUA());

      // 获取章节目录
      const chapters = await scraper.fetchChapterList(page, novelUrl);
      if (chapters.length === 0) {
        await prisma.scraperNovelProgress.update({
          where: { id: progress.id },
          data: { status: 'FAILED', errorMessage: 'No chapters found' },
        });
        return;
      }

      // 超过 10000 章上限，只取前 10000
      const cappedChapters = chapters.slice(0, 10000);

      await prisma.scraperNovelProgress.update({
        where: { id: progress.id },
        data: { totalChapters: cappedChapters.length },
      });

      // 创建或获取 Novel 记录
      let novel = await prisma.novel.findFirst({
        where: { sourceUrl: novelUrl },
      });

      if (!novel) {
        // Try get novel info from the detail page
        const novelInfo = await scraper.fetchNovelInfo(page, novelUrl).catch(() => ({})) as { title?: string; author?: string; description?: string; category?: string; isCompleted?: boolean; isFree?: boolean };

        // Skip non-free or non-completed novels
        if (novelInfo.isCompleted === false || novelInfo.isFree === false) {
          const reason = novelInfo.isCompleted === false ? 'Not completed' : 'VIP/paid novel';
          console.warn(`[Scraper] Skipping novel "${progress.novelTitle}": ${reason}`);
          await prisma.scraperNovelProgress.update({
            where: { id: progress.id },
            data: { status: 'FAILED', errorMessage: `Skipped: ${reason}` },
          });
          return;
        }

        novel = await prisma.novel.create({
          data: {
            title: novelInfo.title || progress.novelTitle,
            author: novelInfo.author || progress.author || '',
            description: novelInfo.description || '',
            category: novelInfo.category || '',
            sourceType: 'SCRAPED',
            sourceUrl: novelUrl,
            status: 'SERIAL',
          },
        });

        await prisma.scraperNovelProgress.update({
          where: { id: progress.id },
          data: { novelId: novel.id },
        });
      }

      const startIdx = progress.lastChapterIndex;

      // 逐章抓取
      for (let i = startIdx; i < cappedChapters.length; i++) {
        this.state.currentChapterIndex = i + 1;
        this.state.currentTotalChapters = cappedChapters.length;

        if (this.isStopping() || this.isDeadlineExpired()) {
          await prisma.scraperNovelProgress.update({
            where: { id: progress.id },
            data: {
              status: 'INCOMPLETE',
              lastChapterIndex: i,
              fetchedChapters: i,
            },
          });
          this.state.stats.novelsIncomplete++;
          console.log(`[Scraper] Incomplete: ${progress.novelTitle} (${i}/${cappedChapters.length})`);
          return;
        }

        const ch = cappedChapters[i];
        try {
          // Check if chapter already exists
          const existingChapter = await prisma.chapter.findFirst({
            where: { novelId: novel.id, chapterIndex: i + 1 },
          });

          if (!existingChapter) {
            const content = await scraper.fetchChapterContent(page, ch.url);

            // Stop at VIP-locked chapters — remaining are also VIP
            if (content === '__VIP__') {
              await prisma.scraperNovelProgress.update({
                where: { id: progress.id },
                data: {
                  status: 'INCOMPLETE',
                  lastChapterIndex: i,
                  fetchedChapters: i,
                  errorMessage: 'Hit VIP paywall',
                },
              });
              this.state.stats.novelsIncomplete++;
              console.log(`[Scraper] VIP paywall at chapter ${i + 1}, stopping: ${progress.novelTitle}`);
              return;
            }

            await prisma.chapter.create({
              data: {
                novelId: novel.id,
                chapterIndex: i + 1,
                title: ch.title,
                content,
                wordCount: content.length,
                sourceUrl: ch.url,
              },
            });

            this.state.stats.chaptersTotal++;
          }

          await prisma.scraperNovelProgress.update({
            where: { id: progress.id },
            data: {
              fetchedChapters: i + 1,
              lastChapterIndex: i + 1,
            },
          });

          console.log(`[Scraper] Chapter ${i + 1}/${cappedChapters.length}: ${ch.title}`);

          // Update ScraperLog with current progress
          await prisma.scraperLog.update({
            where: { id: this.state.scraperLogId },
            data: {
              chapterCount: { increment: 1 },
              message: `正在抓取【${progress.novelTitle} - ${ch.title}】(${i + 1}/${cappedChapters.length})`,
            },
          });

        } catch (err) {
          console.error(`[Scraper] Failed chapter ${i + 1} of ${progress.novelTitle}:`, (err as Error).message);
          this.state.stats.errors++;
        }

        // Random delay between chapters
        await randomDelay();
      }

      // Novel complete — update wordCount
      const totalWords = await prisma.chapter.aggregate({
        where: { novelId: novel.id },
        _sum: { wordCount: true },
      });
      await prisma.novel.update({
        where: { id: novel.id },
        data: { wordCount: totalWords._sum.wordCount ?? 0 },
      });

      await prisma.scraperNovelProgress.update({
        where: { id: progress.id },
        data: { status: 'COMPLETED', fetchedChapters: cappedChapters.length },
      });

      this.state.stats.novelsCompleted++;
      console.log(`[Scraper] Completed: ${progress.novelTitle} (${cappedChapters.length} chapters)`);

    } catch (err) {
      console.error(`[Scraper] Failed novel ${progress.novelTitle}:`, (err as Error).message);
      await prisma.scraperNovelProgress.update({
        where: { id: progress.id },
        data: { status: 'FAILED', errorMessage: (err as Error).message },
      });
    } finally {
      await page.close().catch(() => {});
    }
  }

  /** 去重检查 */
  private async checkDuplicate(url: string, title: string, author: string): Promise<boolean> {
    // 1. sourceUrl 精确匹配
    const byUrl = await prisma.novel.findUnique({ where: { sourceUrl: url } });
    if (byUrl) return true;

    // 2. title + author 组合匹配
    const byTitle = await prisma.novel.findFirst({
      where: { title, author },
    });
    if (byTitle) return true;

    return false;
  }

  /** 清理 */
  private async cleanup(status: string, message: string | null): Promise<void> {
    console.log(`[Scraper] Cleaning up: ${status}`);

    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }

    // 将仍在 RUNNING 状态的 progress 标记为 INCOMPLETE
    if (this.state.scraperLogId) {
      await prisma.scraperNovelProgress.updateMany({
        where: { scraperLogId: this.state.scraperLogId, status: 'RUNNING' },
        data: { status: 'INCOMPLETE' },
      });

      await prisma.scraperLog.update({
        where: { id: this.state.scraperLogId },
        data: {
          status,
          message,
          finishedAt: new Date(),
          novelCount: this.state.stats.novelsTotal,
          novelCompleted: this.state.stats.novelsCompleted,
          novelIncomplete: this.state.stats.novelsIncomplete,
          chapterCount: this.state.stats.chaptersTotal,
        },
      });
    }

    this.state = this.emptyState();
  }
}

export const scraperManager = new ScraperManager();
