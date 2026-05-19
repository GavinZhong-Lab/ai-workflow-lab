import { Response } from 'express';
import { appsService } from './apps.service.js';
import type { AuthRequest } from '../../middleware/auth.js';

export class AppsController {
  async getMarketplace(req: AuthRequest, res: Response) {
    const result = await appsService.getMarketplace(req.orgId!);
    res.json(result);
  }

  async getByKey(req: AuthRequest, res: Response) {
    const result = await appsService.getByKey(req.params.key);
    const status = result.code === 0 ? 200 : 404;
    res.status(status).json(result);
  }
}

export const appsController = new AppsController();
