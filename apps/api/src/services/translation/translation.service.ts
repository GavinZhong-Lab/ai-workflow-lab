/**
 * 翻译服务 — 按优先级链式调用翻译引擎
 * 优先 DeepL → Google → Mock fallback
 */
import { prisma } from '../../lib/prisma.js';
import { EnvHttpProxyAgent } from 'undici';

const agent = new EnvHttpProxyAgent();

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
      dispatcher: agent,
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
      dispatcher: agent,
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
      dispatcher: agent,
    });
    if (!resp.ok) throw new Error(`Microsoft ${resp.status}: ${await resp.text()}`);
    const data = await resp.json() as { translations: { text: string }[] }[];
    return data[0]?.translations?.[0]?.text || null;
  }

  /** Mock 翻译 — 开发/降级用，返回原文本带标记 */
  private mockTranslate(text: string, targetLang: string): string {
    return `[Mock ${targetLang}] ${text}`;
  }

  // ============ Batch Methods ============

  /** 批量翻译 — 优先使用供应商原生数组支持 */
  async translateBatch(texts: string[], targetLang: string): Promise<(string | null)[]> {
    const configs = await this.getActiveConfigs();
    if (configs.length === 0) {
      return texts.map((t) => this.mockTranslate(t, targetLang));
    }

    for (const cfg of configs) {
      try {
        const results = await this.callProviderBatch(
          cfg.provider, cfg.apiKey, cfg.apiEndpoint, texts, targetLang,
        );
        if (results && results.length > 0) {
          return results;
        }
      } catch (err) {
        console.warn(`[Translation] ${cfg.provider} batch failed:`, (err as Error).message);
      }
    }

    return texts.map((t) => this.mockTranslate(t, targetLang));
  }

  private async callProviderBatch(
    provider: string, apiKey: string, endpoint: string | null,
    texts: string[], targetLang: string,
  ): Promise<(string | null)[] | null> {
    switch (provider) {
      case 'DEEPL': return this.callDeepLBatch(apiKey, endpoint, texts, targetLang);
      case 'GOOGLE': return this.callGoogleBatch(apiKey, endpoint, texts, targetLang);
      case 'MICROSOFT': return this.callMicrosoftBatch(apiKey, endpoint, texts, targetLang);
      default: return null;
    }
  }

  private async callDeepLBatch(apiKey: string, endpoint: string | null, texts: string[], targetLang: string): Promise<(string | null)[] | null> {
    if (!apiKey || apiKey.startsWith('****')) return null;
    const baseUrl = endpoint || 'https://api-free.deepl.com/v2/translate';
    const resp = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Authorization': `DeepL-Auth-Key ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: texts, target_lang: targetLang.toUpperCase() }),
      dispatcher: agent,
    });
    if (!resp.ok) throw new Error(`DeepL ${resp.status}: ${await resp.text()}`);
    const data = await resp.json() as { translations: { text: string }[] };
    return data.translations?.map((t) => t.text) || null;
  }

  private async callGoogleBatch(apiKey: string, endpoint: string | null, texts: string[], targetLang: string): Promise<(string | null)[] | null> {
    if (!apiKey || apiKey.startsWith('****')) return null;
    const baseUrl = endpoint || 'https://translation.googleapis.com/language/translate/v2';
    const resp = await fetch(`${baseUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: texts, target: targetLang, format: 'text' }),
      dispatcher: agent,
    });
    if (!resp.ok) throw new Error(`Google ${resp.status}: ${await resp.text()}`);
    const data = await resp.json() as { data: { translations: { translatedText: string }[] } };
    return data.data?.translations?.map((t) => t.translatedText) || null;
  }

  private async callMicrosoftBatch(apiKey: string, endpoint: string | null, texts: string[], targetLang: string): Promise<(string | null)[] | null> {
    if (!apiKey || apiKey.startsWith('****')) return null;
    const baseUrl = endpoint || 'https://api.cognitive.microsofttranslator.com/translate';
    const body = texts.map((t) => ({ Text: t }));
    const resp = await fetch(`${baseUrl}?api-version=3.0&to=${targetLang}`, {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      dispatcher: agent,
    });
    if (!resp.ok) throw new Error(`Microsoft ${resp.status}: ${await resp.text()}`);
    const data = await resp.json() as { translations: { text: string }[] }[];
    return data.map((item) => item.translations?.[0]?.text || null);
  }
}

export const translationService = new TranslationService();
