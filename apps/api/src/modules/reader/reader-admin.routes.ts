import { Router } from 'express';
import { readerAdminController } from './reader-admin.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { superAdminMiddleware } from '../../middleware/super-admin.js';
import { validate } from '../../middleware/validate.js';
import {
  createNovelSchema, updateNovelSchema,
  createChapterSchema, updateChapterSchema,
  bannerSchema, updateBannerSchema,
  translatorSchema, updateTranslatorSchema,
  scraperStartSchema,
} from './reader.schema.js';

export const readerAdminRouter: Router = Router();

readerAdminRouter.use(authMiddleware, superAdminMiddleware);

// Novel CRUD
readerAdminRouter.get('/reader/novels', (req, res) => readerAdminController.listNovels(req, res));
readerAdminRouter.get('/reader/novels/:id', (req, res) => readerAdminController.getNovel(req, res));
readerAdminRouter.post('/reader/novels', validate(createNovelSchema), (req, res) => readerAdminController.createNovel(req, res));
readerAdminRouter.patch('/reader/novels/:id', validate(updateNovelSchema), (req, res) => readerAdminController.updateNovel(req, res));
readerAdminRouter.delete('/reader/novels/:id', (req, res) => readerAdminController.deleteNovel(req, res));

// Chapter CRUD
readerAdminRouter.post('/reader/novels/:novelId/chapters', validate(createChapterSchema), (req, res) => readerAdminController.createChapter(req, res));
readerAdminRouter.patch('/reader/chapters/:chapterId', validate(updateChapterSchema), (req, res) => readerAdminController.updateChapter(req, res));
readerAdminRouter.delete('/reader/chapters/:chapterId', (req, res) => readerAdminController.deleteChapter(req, res));

// Banner CRUD
readerAdminRouter.get('/reader/banners', (req, res) => readerAdminController.listBanners(req, res));
readerAdminRouter.post('/reader/banners', validate(bannerSchema), (req, res) => readerAdminController.createBanner(req, res));
readerAdminRouter.patch('/reader/banners/:id', validate(updateBannerSchema), (req, res) => readerAdminController.updateBanner(req, res));
readerAdminRouter.delete('/reader/banners/:id', (req, res) => readerAdminController.deleteBanner(req, res));

// Translator CRUD
readerAdminRouter.get('/reader/translators', (req, res) => readerAdminController.listTranslators(req, res));
readerAdminRouter.post('/reader/translators', validate(translatorSchema), (req, res) => readerAdminController.createTranslator(req, res));
readerAdminRouter.patch('/reader/translators/:id', validate(updateTranslatorSchema), (req, res) => readerAdminController.updateTranslator(req, res));
readerAdminRouter.delete('/reader/translators/:id', (req, res) => readerAdminController.deleteTranslator(req, res));

// Scraper
readerAdminRouter.post('/reader/scraper/start', validate(scraperStartSchema), (req, res) => readerAdminController.startScraper(req, res));
readerAdminRouter.post('/reader/scraper/stop', (req, res) => readerAdminController.stopScraper(req, res));
readerAdminRouter.get('/reader/scraper/status', (req, res) => readerAdminController.getScraperStatus(req, res));
readerAdminRouter.get('/reader/scraper/incomplete', (req, res) => readerAdminController.listIncompleteNovels(req, res));
readerAdminRouter.post('/reader/scraper/incomplete/:id/resume', (req, res) => readerAdminController.resumeNovel(req, res));
readerAdminRouter.post('/reader/scraper/incomplete/:id/abandon', (req, res) => readerAdminController.abandonNovel(req, res));
readerAdminRouter.get('/reader/scraper/logs', (req, res) => readerAdminController.listScraperLogs(req, res));
