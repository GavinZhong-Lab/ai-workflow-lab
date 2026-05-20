import { Router } from 'express';
import { adminAppsController } from './apps.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { superAdminMiddleware } from '../../middleware/super-admin.js';

export const adminAppsRouter: Router = Router();

// 所有 admin 路由都需要登录 + 超管权限
adminAppsRouter.use(authMiddleware, superAdminMiddleware);

// Apps CRUD
adminAppsRouter.get('/apps', (req, res) => adminAppsController.listApps(req, res));
adminAppsRouter.post('/apps', (req, res) => adminAppsController.createApp(req, res));
adminAppsRouter.patch('/apps/:id', (req, res) => adminAppsController.updateApp(req, res));
adminAppsRouter.delete('/apps/:id', (req, res) => adminAppsController.deleteApp(req, res));

// Banners CRUD
adminAppsRouter.get('/banners', (req, res) => adminAppsController.listBanners(req, res));
adminAppsRouter.post('/banners', (req, res) => adminAppsController.createBanner(req, res));
adminAppsRouter.patch('/banners/:id', (req, res) => adminAppsController.updateBanner(req, res));
adminAppsRouter.delete('/banners/:id', (req, res) => adminAppsController.deleteBanner(req, res));
