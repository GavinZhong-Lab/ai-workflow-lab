import { Router } from 'express';
import { readerController } from './reader.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { novelListQuerySchema, translateSchema, translateBatchSchema, saveProgressSchema, favoriteSchema } from './reader.schema.js';

export const readerRouter: Router = Router();

// All reader routes require authentication
readerRouter.use(authMiddleware);

// Novels
readerRouter.get('/novels', validate(novelListQuerySchema, 'query'), (req, res) => readerController.listNovels(req, res));
readerRouter.get('/novels/:id', (req, res) => readerController.getNovel(req, res));
readerRouter.get('/novels/:id/chapters/:chapterId', (req, res) => readerController.getChapter(req, res));

// Favorites
readerRouter.get('/favorites', (req, res) => readerController.listFavorites(req, res));
readerRouter.post('/favorites', validate(favoriteSchema), (req, res) => readerController.addFavorite(req, res));
readerRouter.delete('/favorites/:novelId', (req, res) => readerController.removeFavorite(req, res));

// Reading Progress
readerRouter.get('/progress', (req, res) => readerController.listProgress(req, res));
readerRouter.post('/progress', validate(saveProgressSchema), (req, res) => readerController.saveProgress(req, res));

// Translation
readerRouter.post('/translate', validate(translateSchema), (req, res) => readerController.translate(req, res));
readerRouter.post('/translate/batch', validate(translateBatchSchema), (req, res) => readerController.translateBatch(req, res));

// Banners
readerRouter.get('/banners', (req, res) => readerController.listBanners(req, res));
