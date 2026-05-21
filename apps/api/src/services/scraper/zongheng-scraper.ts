/**
 * 纵横中文网爬虫
 *
 * 站点架构：
 * - 书库/列表：www.zongheng.com/books (Nuxt SPA)
 * - 书籍详情：www.zongheng.com/detail/{bookId} (Nuxt SPA, meta 标签有 SSR 数据)
 * - 章节目录：m.zongheng.com/chapter/list/{bookId} (JS 渲染)
 * - 章节阅读：read.zongheng.com/chapter/{bookId}/{chapterId}.html (传统 SSR)
 */
import { Page } from 'puppeteer';

// Evaluate functions are defined as strings to avoid esbuild transpilation
// (esbuild adds __name() calls that don't exist in browser context)

const EVAL_NOVEL_LIST = `
  var items = [];
  var seen = {};
  var allDetailLinks = document.querySelectorAll('a[href*="/detail/"]');
  var titleLinks = [];

  for (var i = 0; i < allDetailLinks.length; i++) {
    var a = allDetailLinks[i];
    var text = (a.innerText || a.textContent || '').trim();
    if (text.length > 1 && text.length < 50) {
      titleLinks.push(a);
    }
  }

  for (var j = 0; j < titleLinks.length; j++) {
    if (items.length >= 20) break;
    var link = titleLinks[j];
    var href = link.href;
    var idMatch = href.match(/\\/detail\\/(\\d+)/);
    if (!idMatch || seen[href]) continue;
    seen[href] = true;

    var title = (link.innerText || link.textContent || '').trim();

    var contentDiv = link.closest('[class*="-content"]');
    var card = link.closest('[class*="-item"]');
    var context = contentDiv || card;
    var contextText = '';
    if (context) {
      contextText = (context.innerText || context.textContent || '');
    }

    var author = '';
    var rawLines = contextText.split('\\n');
    var lines = [];
    for (var li = 0; li < rawLines.length; li++) {
      var l = rawLines[li].trim();
      if (l) lines.push(l);
    }
    for (var k = 0; k < lines.length; k++) {
      var line = lines[k];
      if (line.indexOf('·') !== -1 && line.indexOf('http') === -1) {
        var parts = line.split('·');
        var cleanParts = [];
        for (var pi = 0; pi < parts.length; pi++) {
          cleanParts.push(parts[pi].trim());
        }
        if (cleanParts.length >= 2 && cleanParts[0].length < 30 && cleanParts[0].length > 1) {
          author = cleanParts[0];
          break;
        }
      }
    }

    items.push({ url: href, title: title, author: author });
  }
  items;
`;

const EVAL_NOVEL_INFO = `
  var title = '';
  var author = '';
  var description = '';
  var category = '';
  var isCompleted = false;
  var isFree = true;

  var ogTitle = document.querySelector('meta[name="og:novel:book_name"]');
  if (ogTitle) {
    title = ogTitle.getAttribute('content') || '';
  }
  if (!title) {
    var h1 = document.querySelector('h1');
    title = (h1 && h1.textContent || '').trim();
  }

  var bodyText = document.body.innerText || document.body.textContent || '';
  var authorMatch = bodyText.match(/作者[：:]\\s*([^\\n]{1,30})/);
  if (authorMatch) author = authorMatch[1].trim();

  var ogDesc = document.querySelector('meta[name="og:description"]');
  if (ogDesc) {
    var raw = ogDesc.getAttribute('content') || '';
    description = raw
      .replace(/^纵横小说网提供作者[^》]*《[^》]*》，/, '')
      .replace(/^.*?《.*?》.*?小说，/, '')
      .replace(/最新章节全文阅读服务.*?：/, '')
      .trim();
  }
  if (!description || description.length < 20) {
    var descEl = document.querySelector('.book-desc, .desc, .intro, [class*="desc"], [class*="intro"], [class*="summary"]');
    if (descEl && descEl.textContent) {
      description = descEl.textContent.trim();
    }
  }

  var ogCat = document.querySelector('meta[name="og:novel:category"]');
  if (ogCat) category = ogCat.getAttribute('content') || '';

  // Check completion status
  if (bodyText.indexOf('已完结') !== -1 || bodyText.indexOf('完本') !== -1) {
    isCompleted = true;
  }

  // Check for VIP/付费 indicators
  var vipEls = document.querySelectorAll('[class*="vip"], [class*="VIP"], [class*="pay"], [class*="lock"]');
  if (vipEls.length > 0 && bodyText.indexOf('免费') === -1) {
    isFree = false;
  }
  if (bodyText.indexOf('付费阅读') !== -1 || bodyText.indexOf('VIP专享') !== -1) {
    isFree = false;
  }

  ({ title: title, author: author, description: description, category: category, isCompleted: isCompleted, isFree: isFree });
`;

const EVAL_SCROLL = `
  new Promise(function (resolve) {
    var lastHeight = 0;
    var attempts = 0;
    function doScroll() {
      window.scrollTo(0, document.body.scrollHeight);
      setTimeout(function () {
        var newHeight = document.body.scrollHeight;
        if (newHeight === lastHeight || attempts >= 10) {
          window.scrollTo(0, 0);
          resolve();
        } else {
          lastHeight = newHeight;
          attempts++;
          doScroll();
        }
      }, 1500);
    }
    doScroll();
  });
`;

const EVAL_CHAPTER_LIST = `
  var items = [];
  var seen = {};

  var chapterLinks = document.querySelectorAll('a[href*="/chapter/"]');
  for (var i = 0; i < chapterLinks.length; i++) {
    var a = chapterLinks[i];
    var href = a.href;
    var text = (a.textContent || '').trim();
    if (!seen[href] && text.length > 1 && text.length < 200) {
      seen[href] = true;
      items.push({ url: href, title: text });
    }
  }

  if (items.length === 0) {
    var allLinks = document.querySelectorAll('a[href]');
    for (var j = 0; j < allLinks.length; j++) {
      var b = allLinks[j];
      var href2 = b.href;
      var text2 = (b.textContent || '').trim();
      var isChapterLike =
        /第[一二三四五六七八九十百千零\\d]+章/.test(text2) ||
        /^第[\\d]+章/.test(text2) ||
        /^[\\d]+[\\.、]/.test(text2);
      if (!seen[href2] && isChapterLike && text2.length < 200) {
        seen[href2] = true;
        items.push({ url: href2, title: text2 });
      }
    }
  }

  items;
`;

const EVAL_CHAPTER_CONTENT = `
  (function() {
    // Check for CAPTCHA page first
    var bodyText = document.body.textContent || document.body.innerText || '';
    if (bodyText.indexOf('验证码') !== -1 || bodyText.indexOf('验证') !== -1 ||
        bodyText.indexOf('点击图中文字') !== -1 || bodyText.indexOf('滑块') !== -1 ||
        bodyText.indexOf('拖至最右侧') !== -1) {
      return '__CAPTCHA__';
    }

    // Check for VIP/paywall — short teaser content with subscription prompt
    var contentEl = document.querySelector('.content');
    var contentText = contentEl ? (contentEl.textContent || '').trim() : '';
    if (contentText.length > 0 && contentText.length < 100) {
      if (contentText.indexOf('VIP') !== -1 || contentText.indexOf('付费') !== -1 ||
          contentText.indexOf('订阅') !== -1 || contentText.indexOf('充值') !== -1 ||
          contentText.indexOf('购买') !== -1) {
        return '__VIP__';
      }
    }
    if (bodyText.indexOf('VIP章节') !== -1 && bodyText.indexOf('订阅') !== -1) {
      return '__VIP__';
    }
    if (bodyText.indexOf('本章为付费章节') !== -1 || bodyText.indexOf('以下为VIP章节') !== -1) {
      return '__VIP__';
    }

    // Try .content first (full text in read.zongheng.com)
    if (contentEl && contentText.length > 50) {
      if (contentText.indexOf('验证码') !== -1 && contentText.indexOf('点击图中文字') !== -1) {
        return '__CAPTCHA__';
      }
      return contentEl.innerHTML;
    }

    // Fallback: .reader p tags for full reading content
    var reader = document.querySelector('.reader');
    if (reader) {
      var paras = reader.querySelectorAll('p');
      if (paras.length > 0) {
        var parts = [];
        for (var i = 0; i < paras.length; i++) {
          parts.push(paras[i].innerHTML);
        }
        return parts.join('</p><p>');
      }
    }

    return document.body.innerHTML;
  })()
`;

export class ZonghengScraper {
  private readonly BASE_WWW = 'https://www.zongheng.com';
  private readonly BASE_READ = 'https://read.zongheng.com';

  async fetchNovelList(page: Page): Promise<{ url: string; title: string; author: string }[]> {
    // 免费 + 已完结书库列表
    const sources = [
      'https://www.zongheng.com/books?worksTypes=0&bookType=0&subWorksTypes=0&totalWord=0&serialStatus=1&vip=0&naodongFilter=0',
    ];

    const allNovels: { url: string; title: string; author: string }[] = [];
    const seenUrls = new Set<string>();

    for (const listUrl of sources) {
      if (allNovels.length >= 20) break;
      console.log(`[Zongheng] Navigating to ${listUrl}`);

      try {
        await page.goto(listUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise((r) => setTimeout(r, 3000));

        const novels = await page.evaluate(EVAL_NOVEL_LIST) as { url: string; title: string; author: string }[];

        console.log(`[Zongheng] Extracted ${novels.length} novels from ${listUrl}`);
        for (const n of novels) {
          if (!seenUrls.has(n.url)) {
            seenUrls.add(n.url);
            allNovels.push(n);
          }
        }
      } catch (err) {
        console.warn(`[Zongheng] Failed to fetch list from ${listUrl}: ${(err as Error).message}`);
      }
    }

    return allNovels.slice(0, 20);
  }

  async fetchNovelInfo(page: Page, novelUrl: string): Promise<{ title?: string; author?: string; description?: string; category?: string; isCompleted?: boolean; isFree?: boolean }> {
    console.log(`[Zongheng] Fetching novel info: ${novelUrl}`);

    try {
      await page.goto(novelUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await new Promise((r) => setTimeout(r, 2000));

      return await page.evaluate(EVAL_NOVEL_INFO) as { title?: string; author?: string; description?: string; category?: string; isCompleted?: boolean; isFree?: boolean };
    } catch (err) {
      console.warn(`[Zongheng] Failed to get novel info: ${(err as Error).message}`);
      return {};
    }
  }

  async fetchChapterList(page: Page, novelUrl: string): Promise<{ url: string; title: string }[]> {
    const idMatch = novelUrl.match(/\/detail\/(\d+)/);
    if (!idMatch) {
      console.warn(`[Zongheng] Could not extract bookId from URL: ${novelUrl}`);
      return [];
    }
    const bookId = idMatch[1];

    const catalogUrl = `https://m.zongheng.com/chapter/list/${bookId}`;
    console.log(`[Zongheng] Fetching chapter list: ${catalogUrl}`);

    try {
      await page.goto(catalogUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('body', { timeout: 10000 });
      await new Promise((r) => setTimeout(r, 3000));

      // Scroll to trigger lazy loading
      await page.evaluate(EVAL_SCROLL);

      const chapters = await page.evaluate(EVAL_CHAPTER_LIST) as { url: string; title: string }[];

      // Filter out non-real chapters (latest chapter entries, ads, etc.)
      const realChapters = chapters.filter((ch) => {
        const t = ch.title;
        return !t.startsWith('最新章节') && !t.includes('更新时间') && t.length > 1;
      });

      // Keep mobile URLs (m.zongheng.com) — they have lighter anti-scraping than read.zongheng.com
      const resolved = realChapters.map((ch) => {
        let url = ch.url;
        if (url.startsWith('//')) {
          url = 'https:' + url;
        } else if (url.startsWith('/')) {
          url = 'https://m.zongheng.com' + url;
        } else if (!url.startsWith('http')) {
          url = 'https://m.zongheng.com/chapter/' + url.replace(/^.*chapter\//, '');
        }
        return { url, title: ch.title };
      });

      console.log(`[Zongheng] Found ${resolved.length} chapters`);
      return resolved;
    } catch (err) {
      console.warn(`[Zongheng] Failed to get chapter list: ${(err as Error).message}`);
      return [];
    }
  }

  async fetchChapterContent(page: Page, chapterUrl: string): Promise<string> {
    console.log(`[Zongheng] Fetching chapter: ${chapterUrl}`);

    try {
      await page.goto(chapterUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForSelector('.content, .reader-box, #chapter_, .reader', { timeout: 10000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 1500));

      const html = await page.evaluate(EVAL_CHAPTER_CONTENT) as string;

      if (html === '__VIP__') {
        console.warn('[Zongheng] VIP chapter detected, skipping');
        return '__VIP__';
      }

      if (html === '__CAPTCHA__') {
        console.warn('[Zongheng] CAPTCHA detected, skipping chapter');
        return '[CAPTCHA detected — chapter skipped]';
      }

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
