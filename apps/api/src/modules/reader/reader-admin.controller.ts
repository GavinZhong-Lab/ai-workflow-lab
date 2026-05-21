import { Response } from 'express';
import { readerAdminService } from './reader.service.js';
import type { AuthRequest } from '../../middleware/auth.js';

export class ReaderAdminController {
  // ============ Novels ============

  async listNovels(req: AuthRequest, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await readerAdminService.listNovels(page, limit);
    res.json(result);
  }

  async getNovel(req: AuthRequest, res: Response) {
    const result = await readerAdminService.getNovel(req.params.id);
    res.status(result.code === 0 ? 200 : 404).json(result);
  }

  async createNovel(req: AuthRequest, res: Response) {
    const result = await readerAdminService.createNovel(req.body);
    res.status(201).json(result);
  }

  async updateNovel(req: AuthRequest, res: Response) {
    const result = await readerAdminService.updateNovel(req.params.id, req.body);
    res.status(result.code === 0 ? 200 : 404).json(result);
  }

  async deleteNovel(req: AuthRequest, res: Response) {
    const result = await readerAdminService.deleteNovel(req.params.id);
    res.json(result);
  }

  // ============ Chapters ============

  async createChapter(req: AuthRequest, res: Response) {
    const result = await readerAdminService.createChapter(req.params.novelId, req.body);
    res.status(201).json(result);
  }

  async updateChapter(req: AuthRequest, res: Response) {
    const result = await readerAdminService.updateChapter(req.params.chapterId, req.body);
    res.status(result.code === 0 ? 200 : 404).json(result);
  }

  async deleteChapter(req: AuthRequest, res: Response) {
    const result = await readerAdminService.deleteChapter(req.params.chapterId);
    res.json(result);
  }

  // ============ Banners ============

  async listBanners(_req: AuthRequest, res: Response) {
    const result = await readerAdminService.listBanners();
    res.json(result);
  }

  async createBanner(req: AuthRequest, res: Response) {
    const result = await readerAdminService.createBanner(req.body);
    res.status(201).json(result);
  }

  async updateBanner(req: AuthRequest, res: Response) {
    const result = await readerAdminService.updateBanner(req.params.id, req.body);
    res.status(result.code === 0 ? 200 : 404).json(result);
  }

  async deleteBanner(req: AuthRequest, res: Response) {
    const result = await readerAdminService.deleteBanner(req.params.id);
    res.json(result);
  }

  // ============ Translators ============

  async listTranslators(_req: AuthRequest, res: Response) {
    const result = await readerAdminService.listTranslators();
    res.json(result);
  }

  async createTranslator(req: AuthRequest, res: Response) {
    const result = await readerAdminService.createTranslator(req.body);
    res.status(201).json(result);
  }

  async updateTranslator(req: AuthRequest, res: Response) {
    const result = await readerAdminService.updateTranslator(req.params.id, req.body);
    res.status(result.code === 0 ? 200 : 404).json(result);
  }

  async deleteTranslator(req: AuthRequest, res: Response) {
    const result = await readerAdminService.deleteTranslator(req.params.id);
    res.json(result);
  }

  // ============ Scraper ============

  async startScraper(req: AuthRequest, res: Response) {
    const result = await readerAdminService.startScraper(req.body);
    res.json(result);
  }

  async stopScraper(_req: AuthRequest, res: Response) {
    const result = await readerAdminService.stopScraper();
    res.json(result);
  }

  async getScraperStatus(_req: AuthRequest, res: Response) {
    const result = await readerAdminService.getScraperStatus();
    res.json(result);
  }

  async listIncompleteNovels(_req: AuthRequest, res: Response) {
    const result = await readerAdminService.listIncompleteNovels();
    res.json(result);
  }

  async resumeNovel(req: AuthRequest, res: Response) {
    const result = await readerAdminService.resumeNovel(req.params.id);
    res.json(result);
  }

  async abandonNovel(req: AuthRequest, res: Response) {
    const result = await readerAdminService.abandonNovel(req.params.id);
    res.json(result);
  }

  async listScraperLogs(_req: AuthRequest, res: Response) {
    const result = await readerAdminService.listScraperLogs();
    res.json(result);
  }
}

export const readerAdminController = new ReaderAdminController();
