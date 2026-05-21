/**
 * 起点中文网爬虫
 * 目标: https://www.qidian.com/all/
 */
import { Page } from 'puppeteer';

export class QidianScraper {
  private readonly BASE = 'https://www.qidian.com';

  /**
   * 从列表页获取小说列表
   * 解析渲染后的 DOM，提取小说 URL、标题、作者
   */
  async fetchNovelList(page: Page): Promise<{ url: string; title: string; author: string }[]> {
    const results: { url: string; title: string; author: string }[] = [];

    // 起点免费小说列表页
    const listUrl = 'https://www.qidian.com/all/action1-vip0/';
    console.log(`[Qidian] Navigating to ${listUrl}`);

    await page.goto(listUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    // Wait for book list to render
    await page.waitForSelector('.book-img-text, .all-book-list, .book-list, [class*="book"]', { timeout: 10000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));

    // Try multiple selector strategies for the book list
    const novels = await page.evaluate(() => {
      const items: { url: string; title: string; author: string }[] = [];

      // Strategy 1: Standard qidian book list structure
      document.querySelectorAll('.book-img-text li, .all-book-list li, .book-list > li, .rank-list li').forEach((el) => {
        const link = el.querySelector('a[href*="/book/"], a[data-bid]') as HTMLAnchorElement | null;
        const titleEl = el.querySelector('h2 a, h3 a, h4 a, .book-title, .book-name, [class*="title"]');
        const authorEl = el.querySelector('.author, .book-author, [class*="author"]');

        const href = link?.getAttribute('href') || '';
        const title = titleEl?.textContent?.trim() || '';
        const author = authorEl?.textContent?.trim() || '';

        if (href && title) {
          items.push({ url: href.startsWith('http') ? href : `https:${href}`, title, author });
        }
      });

      // Strategy 2: Generic link extraction from book cards
      if (items.length === 0) {
        document.querySelectorAll('li[data-bid], div[data-bid], .book-item, [class*="book-item"], [class*="BookItem"]').forEach((el) => {
          const link = el.querySelector('a[href]') as HTMLAnchorElement | null;
          const href = link?.getAttribute('href') || '';
          const text = link?.textContent?.trim() || el.textContent?.trim() || '';

          if (href && text && (href.includes('/book/') || href.includes('/info/'))) {
            const authorEl = el.querySelector('[class*="author"], .author-name');
            items.push({
              url: href.startsWith('http') ? href : `https:${href}`,
              title: text.substring(0, 100),
              author: authorEl?.textContent?.trim() || '',
            });
          }
        });
      }

      // Strategy 3: Find all links matching book detail pattern
      if (items.length === 0) {
        const seen = new Set<string>();
        document.querySelectorAll('a[href*="/book/"]').forEach((a) => {
          const href = (a as HTMLAnchorElement).href;
          const text = a.textContent?.trim() || '';
          if (!seen.has(href) && text.length > 1 && text.length < 80) {
            seen.add(href);
            items.push({ url: href, title: text, author: '' });
          }
        });
      }

      return items.slice(0, 20); // Limit to 20 novels per scrape session
    });

    console.log(`[Qidian] Extracted ${novels.length} novels from list page`);
    return novels;
  }

  /**
   * 获取小说详情信息（封面、简介、分类）
   */
  async fetchNovelInfo(page: Page, novelUrl: string): Promise<{ title?: string; author?: string; description?: string; category?: string }> {
    console.log(`[Qidian] Fetching novel info: ${novelUrl}`);
    try {
      await page.goto(novelUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await new Promise((r) => setTimeout(r, 2000));

      return await page.evaluate(() => {
        const title = document.querySelector('.book-info h1 em, .book-info h1, .book-info h2, .book-name, .book-title, [class*="BookTitle"]')?.textContent?.trim() || '';

        // Author: search broadly for "作者" pattern
        let author = '';
        const candidates: string[] = [];
        // Collect all text snippets that mention 作者
        document.querySelectorAll('a, span, em, i').forEach((el) => {
          const text = el.textContent?.trim() || '';
          if ((text.startsWith('作者') || text.includes('作者：') || text.includes('作者:')) && text.length < 80) {
            candidates.push(text);
          }
        });
        // Pick the best match — prefer shorter strings with 作者 prefix
        candidates.sort((a, b) => a.length - b.length);
        for (const t of candidates) {
          const cleaned = t.replace(/^作者[：:]\s*/, '').trim();
          if (cleaned && cleaned.length < 30 && !cleaned.includes('作品') && !cleaned.includes('字数')) {
            author = cleaned;
            break;
          }
        }
        // Fallback: try .writer class or [data-author]
        if (!author) {
          const writerEl = document.querySelector('.writer, [data-author]');
          if (writerEl) author = writerEl.textContent?.trim()?.replace(/作者[：:]\s*/, '') || '';
        }

        // Description: get innerHTML to preserve line breaks
        const descEl = document.querySelector('#book-intro-detail, .book-intro, .intro, .book-desc, .desc, .description, [class*="intro"], [class*="desc"]');
        let description = '';
        if (descEl && descEl.textContent && descEl.textContent.trim().length > 0) {
          description = descEl.innerHTML
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
            .replace(/[ \t]+/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .split('\n').map(l => l.trim()).join('\n')
            .trim();
        }

        const category = document.querySelector('.book-category a, .book-category span, .tag, .label, [class*="category"] a, [class*="tag"] a')?.textContent?.trim() || '';

        return { title, author, description, category };
      });
    } catch (err) {
      console.warn(`[Qidian] Failed to get novel info: ${(err as Error).message}`);
      return {};
    }
  }

  /**
   * 获取章节目录列表
   */
  async fetchChapterList(page: Page, novelUrl: string): Promise<{ url: string; title: string }[]> {
    console.log(`[Qidian] Fetching chapter list: ${novelUrl}`);

    try {
      await page.goto(novelUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      // Wait for content to render
      await page.waitForSelector('body', { timeout: 5000 });
      await new Promise((r) => setTimeout(r, 3000));
    } catch {
      // Continue even if page load fails
    }

    const chapters = await page.evaluate(() => {
      const items: { url: string; title: string }[] = [];
      const seen = new Set<string>();

      // Extract the book ID from the URL to filter chapter links
      const bookIdMatch = window.location.href.match(/\/book\/(\d+)/);
      const bookId = bookIdMatch ? bookIdMatch[1] : '';

      // Strategy 1: Look for chapter links with /chapter/BOOK_ID/ pattern
      document.querySelectorAll('a[href*="/chapter/"]').forEach((a) => {
        const href = (a as HTMLAnchorElement).href;
        const text = a.textContent?.trim() || '';
        if (!seen.has(href) && text.length > 1 && text.length < 200) {
          seen.add(href);
          items.push({ url: href, title: text });
        }
      });

      // Strategy 2: Look for catalog/chapter list containers specifically
      if (items.length === 0) {
        const catalogSelectors = [
          '#j-catalogWrap', '.catalog-content', '.chapter-list', '.catalog-list',
          '.volume-list', '#catalog', '[class*="catalog"]', '[id*="catalog"]',
          '.book-chapter', '.chapter-wrap',
        ];

        for (const sel of catalogSelectors) {
          const container = document.querySelector(sel);
          if (container) {
            const links = container.querySelectorAll('a[href]');
            links.forEach((a) => {
              const href = (a as HTMLAnchorElement).href;
              const text = a.textContent?.trim() || '';
              // Filter: chapter title should contain Chinese chapter number patterns or be reasonably short
              const isChapterLike = text.match(/第[一二三四五六七八九十百千零\d]+章/) ||
                                    text.match(/^第[\d]+章/) ||
                                    (text.length > 2 && text.length < 150 && !text.includes('下载') && !text.includes('APP') && !text.includes('扫码'));
              if (!seen.has(href) && isChapterLike && href.includes('/chapter/')) {
                seen.add(href);
                items.push({ url: href, title: text });
              }
            });
            if (items.length > 0) break;
          }
        }
      }

      // Strategy 3: Find all chapter links matching /chapter/ path filtered by book ID
      if (items.length === 0 && bookId) {
        document.querySelectorAll(`a[href*="${bookId}"]`).forEach((a) => {
          const href = (a as HTMLAnchorElement).href;
          const text = a.textContent?.trim() || '';
          if (!seen.has(href) && href.includes('/chapter/') && text.length > 2 && text.length < 200) {
            seen.add(href);
            items.push({ url: href, title: text });
          }
        });
      }

      // Strategy 4: Broader search but filter for chapter-like patterns only
      if (items.length === 0) {
        document.querySelectorAll('a[href*="/chapter/"]').forEach((a) => {
          const href = (a as HTMLAnchorElement).href;
          const text = a.textContent?.trim() || '';
          // More strict filtering: must look like a chapter title
          const looksLikeChapter = (
            text.includes('第') &&
            text.includes('章') &&
            text.length < 200 &&
            !text.includes('最新章节') &&
            !href.includes('/xuanhuan/') &&
            !href.includes('/qihuan/') &&
            !href.includes('/wuxia/') &&
            !href.includes('/xianxia/') &&
            !href.includes('/dushi/') &&
            !href.includes('/xianshi/') &&
            !href.includes('/lishi/') &&
            !href.includes('/junshi/') &&
            !href.includes('/kehuan/') &&
            !href.includes('/lingyi/')
          );

          if (!seen.has(href) && looksLikeChapter) {
            seen.add(href);
            items.push({ url: href, title: text });
          }
        });
      }

      return items;
    });

    console.log(`[Qidian] Found ${chapters.length} chapters`);
    return chapters;
  }

  /**
   * 获取章节内容，保留段落结构
   */
  async fetchChapterContent(page: Page, chapterUrl: string): Promise<string> {
    console.log(`[Qidian] Fetching chapter: ${chapterUrl}`);
    try {
      await page.goto(chapterUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await new Promise((r) => setTimeout(r, 1500));

      const html = await page.evaluate(() => {
        const selectors = [
          '.read-content', '.chapter-content', '.content', '#chapter-content',
          '.book-content', '.article-content', '.text', '#content',
          '[class*="read-content"]', '[class*="chapter-content"]',
          '.main-text', '.book-text',
        ];

        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent && el.textContent.trim().length > 50) {
            return el.innerHTML;
          }
        }

        return document.body.innerHTML;
      });

      // Convert HTML to paragraph-preserving plain text
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
      console.warn(`[Qidian] Failed to get chapter content: ${(err as Error).message}`);
      return `[Failed to fetch content: ${(err as Error).message}]`;
    }
  }
}
