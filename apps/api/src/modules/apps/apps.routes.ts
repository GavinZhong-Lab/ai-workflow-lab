import { Router } from 'express';
import { appsController } from './apps.controller.js';
import { authMiddleware } from '../../middleware/auth.js';

export const appsRouter: Router = Router();

appsRouter.get('/', authMiddleware, (req, res) => appsController.getMarketplace(req, res));
appsRouter.get('/:key', authMiddleware, (req, res) => appsController.getByKey(req, res));
