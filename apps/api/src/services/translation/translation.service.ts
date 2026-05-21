/**
 * 翻译服务 — 按优先级链式调用翻译引擎
 * 优先 DeepL → Google → Mock fallback
 */
import { prisma } from '../../lib/prisma.js';

class TranslationService {
  /** 按优先级获取活跃的翻译配置 */
  private async getActiveConfigs() {
    return prisma.translationConfig.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' },
    });
  }

  /** 翻译文本，按优先级尝试各个引擎 */
  async translate(text: string, targetLang: string): Promise<string | null> {
    const configs = await this.getActiveConfigs();
    if (configs.length === 0) return this.mockTranslate(text, targetLang);

    for (const cfg of configs) {
      try {
        const result = await this.callProvider(cfg.provider, cfg.apiKey, cfg.apiEndpoint, text, targetLang);
        if (result) return result;
      } catch (err) {
        console.warn(`[Translation] ${cfg.provider} failed:`, (err as Error).message);
      }
    }

    return this.mockTranslate(text, targetLang);
  }

  /** 调用指定翻译引擎 */
  private async callProvider(
    provider: string,
    apiKey: string,
    endpoint: string | null,
    text: string,
    targetLang: string,
  ): Promise<string | null> {
    switch (provider) {
      case 'DEEPL':
        return this.callDeepL(apiKey, endpoint, text, targetLang);
      case 'GOOGLE':
        return this.callGoogle(apiKey, endpoint, text, targetLang);
      case 'MICROSOFT':
        return this.callMicrosoft(apiKey, endpoint, text, targetLang);
      default:
        return null;
    }
  }

  private async callDeepL(apiKey: string, endpoint: string | null, text: string, targetLang: string): Promise<string | null> {
    if (!apiKey || apiKey.startsWith('****')) return null;
    const baseUrl = endpoint || 'https://api-free.deepl.com/v2/translate';
    const resp = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        target_lang: targetLang.toUpperCase(),
      }),
    });
    if (!resp.ok) throw new Error(`DeepL ${resp.status}: ${await resp.text()}`);
    const data = await resp.json() as { translations: { text: string }[] };
    return data.translations?.[0]?.text || null;
  }

  private async callGoogle(apiKey: string, endpoint: string | null, text: string, targetLang: string): Promise<string | null> {
    if (!apiKey || apiKey.startsWith('****')) return null;
    const baseUrl = endpoint || 'https://translation.googleapis.com/language/translate/v2';
    const resp = await fetch(`${baseUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        target: targetLang,
        format: 'text',
      }),
    });
    if (!resp.ok) throw new Error(`Google ${resp.status}: ${await resp.text()}`);
    const data = await resp.json() as { data: { translations: { translatedText: string }[] } };
    return data.data?.translations?.[0]?.translatedText || null;
  }

  private async callMicrosoft(apiKey: string, endpoint: string | null, text: string, targetLang: string): Promise<string | null> {
    if (!apiKey || apiKey.startsWith('****')) return null;
    const baseUrl = endpoint || 'https://api.cognitive.microsofttranslator.com/translate';
    const resp = await fetch(`${baseUrl}?api-version=3.0&to=${targetLang}`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ Text: text }]),
    });
    if (!resp.ok) throw new Error(`Microsoft ${resp.status}: ${await resp.text()}`);
    const data = await resp.json() as { translations: { text: string }[] }[];
    return data[0]?.translations?.[0]?.text || null;
  }

  /** Mock 翻译 — 开发/降级用，返回原文本带标记 */
  private mockTranslate(text: string, targetLang: string): string {
    return `[Mock ${targetLang}] ${text}`;
  }
}

export const translationService = new TranslationService();
