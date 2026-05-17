/**
 * 用户模块 — 控制器
 */
import { Response } from 'express';
import { userService } from './user.service.js';
import type { AuthRequest } from '../../middleware/auth.js';

/** 用户控制器 */
export class UserController {
  /** GET /api/v1/users/me */
  async getProfile(req: AuthRequest, res: Response) {
    const result = await userService.getProfile(req.userId!);
    res.json(result);
  }

  /** PATCH /api/v1/users/me */
  async updateProfile(req: AuthRequest, res: Response) {
    const result = await userService.updateProfile(req.userId!, req.body);
    res.json(result);
  }

  /** GET /api/v1/users/me/organizations */
  async getOrganizations(req: AuthRequest, res: Response) {
    const result = await userService.getOrganizations(req.userId!);
    res.json(result);
  }
}

export const userController = new UserController();
