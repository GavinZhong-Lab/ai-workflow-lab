import { Response } from 'express';
import { readerService } from './reader.service.js';
import type { AuthRequest } from '../../middleware/auth.js';
import type { NovelListQuery } from './reader.schema.js';

export class ReaderController {
  async listNovels(req: AuthRequest, res: Response) {
    const result = await readerService.listNovels(req.query as unknown as NovelListQuery);
    res.json(result);
  }

  async getNovel(req: AuthRequest, res: Response) {
    const result = await readerService.getNovel(req.params.id);
    res.status(result.code === 0 ? 200 : 404).json(result);
  }

  async getChapter(req: AuthRequest, res: Response) {
    const result = await readerService.getChapter(req.params.id, req.params.chapterId);
    res.status(result.code === 0 ? 200 : 404).json(result);
  }

  async listFavorites(req: AuthRequest, res: Response) {
    const result = await readerService.listFavorites(req.userId!);
    res.json(result);
  }

  async addFavorite(req: AuthRequest, res: Response) {
    const result = await readerService.addFavorite(req.userId!, req.body);
    res.json(result);
  }

  async removeFavorite(req: AuthRequest, res: Response) {
    const result = await readerService.removeFavorite(req.userId!, req.params.novelId);
    res.json(result);
  }

  async listProgress(req: AuthRequest, res: Response) {
    const result = await readerService.listProgress(req.userId!);
    res.json(result);
  }

  async saveProgress(req: AuthRequest, res: Response) {
    const result = await readerService.saveProgress(req.userId!, req.body);
    res.json(result);
  }

  async translate(req: AuthRequest, res: Response) {
    const result = await readerService.translate(req.body);
    res.status(result.code === 0 ? 200 : 429).json(result);
  }

  async translateBatch(req: AuthRequest, res: Response) {
    const result = await readerService.translateBatch(req.body);
    res.json(result);
  }

  async listBanners(_req: AuthRequest, res: Response) {
    const result = await readerService.listBanners();
    res.json(result);
  }
}

export const readerController = new ReaderController();
