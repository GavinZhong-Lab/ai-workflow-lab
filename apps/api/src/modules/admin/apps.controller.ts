import { Response } from 'express';
import { adminAppsService } from './apps.service.js';
import type { AuthRequest } from '../../middleware/auth.js';

export class AdminAppsController {
  // --- Apps ---
  async listApps(_req: AuthRequest, res: Response) {
    const result = await adminAppsService.listApps();
    res.json(result);
  }

  async createApp(req: AuthRequest, res: Response) {
    const result = await adminAppsService.createApp(req.body);
    const status = result.code === 0 ? 201 : 400;
    res.status(status).json(result);
  }

  async updateApp(req: AuthRequest, res: Response) {
    const result = await adminAppsService.updateApp(req.params.id, req.body);
    const status = result.code === 0 ? 200 : 404;
    res.status(status).json(result);
  }

  async deleteApp(req: AuthRequest, res: Response) {
    const result = await adminAppsService.deleteApp(req.params.id);
    const status = result.code === 0 ? 200 : 404;
    res.status(status).json(result);
  }

  // --- Banners ---
  async listBanners(_req: AuthRequest, res: Response) {
    const result = await adminAppsService.listBanners();
    res.json(result);
  }

  async createBanner(req: AuthRequest, res: Response) {
    const result = await adminAppsService.createBanner(req.body);
    const status = result.code === 0 ? 201 : 400;
    res.status(status).json(result);
  }

  async updateBanner(req: AuthRequest, res: Response) {
    const result = await adminAppsService.updateBanner(req.params.id, req.body);
    const status = result.code === 0 ? 200 : 404;
    res.status(status).json(result);
  }

  async deleteBanner(req: AuthRequest, res: Response) {
    const result = await adminAppsService.deleteBanner(req.params.id);
    const status = result.code === 0 ? 200 : 404;
    res.status(status).json(result);
  }
}

export const adminAppsController = new AdminAppsController();
