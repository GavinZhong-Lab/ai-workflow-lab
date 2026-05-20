import { Router } from 'express';
import { appsController } from './apps.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { paidAppGuard } from '../../middleware/paid-app-guard.js';

export const appsRouter: Router = Router();

appsRouter.get('/', authMiddleware, (req, res) => appsController.getMarketplace(req, res));
appsRouter.get('/:key', authMiddleware, paidAppGuard, (req, res) => appsController.getByKey(req, res));
