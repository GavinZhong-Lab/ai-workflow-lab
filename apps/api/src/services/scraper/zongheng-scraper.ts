/**
 * 纵横中文网爬虫
 * 目标: https://www.zongheng.com/books
 */
import { Page } from 'puppeteer';

export class ZonghengScraper {
  /**
   * 从列表页获取小说列表
   */
  async fetchNovelList(page: Page): Promise<{ url: string; title: string; author: string }[]> {
    const listUrl = 'https://www.zongheng.com/books?worksTypes=0&bookType=0&subWorksTypes=0&totalWord=0&serialStatus=1&vip=0&naodongFilter=0';
    console.log(`[Zongheng] Navigating to ${listUrl}`);

    await page.goto(listUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('.book-list, .bookBox, .rank-list, [class*="book"]', { timeout: 10000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));

    const novels = await page.evaluate(() => {
      const items: { url: string; title: string; author: string }[] = [];

      // Strategy 1: Standard zongheng book list
      document.querySelectorAll('.bookBox, .book-item, .list-item, [class*="bookBox"], [class*="book-item"]').forEach((el) => {
        const link = el.querySelector('a[href*="/book/"]') as HTMLAnchorElement | null;
        const titleEl = el.querySelector('.book-name, .title, h3, [class*="title"], [class*="name"]');
        const authorEl = el.querySelector('.author, .book-author, [class*="author"]');

        if (link) {
          const href = link.href;
          const title = titleEl?.textContent?.trim() || link.textContent?.trim() || '';
          const author = authorEl?.textContent?.trim() || '';
          if (title) items.push({ url: href, title, author });
        }
      });

      // Strategy 2: Generic book links
      if (items.length === 0) {
        const seen = new Set<string>();
        document.querySelectorAll('a[href*="/book/"]').forEach((a) => {
          const href = (a as HTMLAnchorElement).href;
          // Zongheng book URLs: /book/123456
          const match = href.match(/\/book\/(\d+)/);
          if (match && !seen.has(href)) {
            seen.add(href);
            const text = a.closest('li, div, .item')?.textContent?.trim() || a.textContent?.trim() || '';
            items.push({ url: href, title: text.substring(0, 100), author: '' });
          }
        });
      }

      return items.slice(0, 20);
    });

    console.log(`[Zongheng] Extracted ${novels.length} novels from list page`);
    return novels;
  }

  /**
   * 获取小说详情信息
   */
  async fetchNovelInfo(page: Page, novelUrl: string): Promise<{ title?: string; author?: string; description?: string; category?: string }> {
    console.log(`[Zongheng] Fetching novel info: ${novelUrl}`);
    try {
      await page.goto(novelUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await new Promise((r) => setTimeout(r, 2000));

      return await page.evaluate(() => {
        const title = document.querySelector('.book-name, .book-title, h1, .title, [class*="title"]')?.textContent?.trim() || '';
        const author = document.querySelector('.author, .book-author, [class*="author"]')?.textContent?.trim()?.replace(/作者[：:]\s*/, '') || '';
        const description = document.querySelector('.book-desc, .desc, .intro, .book-intro, [class*="desc"], [class*="intro"]')?.textContent?.trim() || '';
        const category = document.querySelector('.book-label, .label, .tag, [class*="label"], [class*="tag"]')?.textContent?.trim() || '';

        return { title, author, description, category };
      });
    } catch (err) {
      console.warn(`[Zongheng] Failed to get novel info: ${(err as Error).message}`);
      return {};
    }
  }

  /**
   * 获取章节目录列表
   */
  async fetchChapterList(page: Page, novelUrl: string): Promise<{ url: string; title: string }[]> {
    console.log(`[Zongheng] Fetching chapter list: ${novelUrl}`);

    try {
      await page.goto(novelUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await new Promise((r) => setTimeout(r, 2000));
    } catch {
      // Continue even if page load fails
    }

    const chapters = await page.evaluate(() => {
      const items: { url: string; title: string }[] = [];

      // Zongheng chapter list
      document.querySelectorAll('.chapter-list li, .catalog-list li, .volume-list li, [class*="chapter"] li, [class*="catalog"] li').forEach((el) => {
        const link = el.querySelector('a[href]') as HTMLAnchorElement | null;
        if (link) {
          const text = link.textContent?.trim() || '';
          if (text && text.length > 1) {
            items.push({ url: link.href, title: text });
          }
        }
      });

      // Generic chapter links
      if (items.length === 0) {
        document.querySelectorAll('a[href*="/chapter/"]').forEach((a) => {
          const text = a.textContent?.trim() || '';
          if (text.length > 1) {
            items.push({ url: (a as HTMLAnchorElement).href, title: text });
          }
        });
      }

      return items;
    });

    console.log(`[Zongheng] Found ${chapters.length} chapters`);
    return chapters;
  }

  /**
   * 获取章节内容，保留段落结构
   */
  async fetchChapterContent(page: Page, chapterUrl: string): Promise<string> {
    console.log(`[Zongheng] Fetching chapter: ${chapterUrl}`);
    try {
      await page.goto(chapterUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await new Promise((r) => setTimeout(r, 1500));

      const html = await page.evaluate(() => {
        const selectors = [
          '.content', '.chapter-content', '.read-content', '#chapter-content',
          '.book-content', '.article-content', '.text', '#content',
          '[class*="content"]', '.reader-box', '.reader-content',
        ];

        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent && el.textContent.trim().length > 50) {
            return el.innerHTML;
          }
        }

        return document.body.innerHTML;
      });

      return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/（本章未完，请点击下一页继续阅读）/g, '')
        .replace(/本章未完.*?继续阅读/g, '')
        .split('\n').map((l: string) => l.trim()).join('\n')
        .trim();
    } catch (err) {
      console.warn(`[Zongheng] Failed to get chapter content: ${(err as Error).message}`);
      return `[Failed to fetch content: ${(err as Error).message}]`;
    }
  }
}
