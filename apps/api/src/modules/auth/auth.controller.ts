/**
 * 认证模块 — 控制器
 * 处理 HTTP 请求，调用业务服务并返回响应
 */
import { Request, Response } from 'express';
import { authService } from './auth.service.js';
import type { RegisterInput, LoginInput, RefreshInput } from './auth.schema.js';
import type { AuthRequest } from '../../middleware/auth.js';

/** 认证控制器 */
export class AuthController {
  /** POST /api/v1/auth/register */
  async register(req: Request, res: Response) {
    const { email, password, name, companyName, industry, invitationToken } = req.body as RegisterInput;
    const result = await authService.register(email, password, name, companyName, industry, invitationToken);
    const status = result.code === 0 ? 201 : 409;
    res.status(status).json(result);
  }

  /** POST /api/v1/auth/login */
  async login(req: Request, res: Response) {
    const { email, password } = req.body as LoginInput;
    const result = await authService.login(email, password);
    const status = result.code === 0 ? 200 : 401;
    res.status(status).json(result);
  }

  /** POST /api/v1/auth/refresh */
  async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body as RefreshInput;
    const result = await authService.refresh(refreshToken);
    const status = result.code === 0 ? 200 : 401;
    res.status(status).json(result);
  }

  /** GET /api/v1/auth/me — 获取当前用户信息 */
  async me(req: AuthRequest, res: Response) {
    const { prisma } = await import('../../lib/prisma.js');
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        locale: true,
        theme: true,
        isSuperAdmin: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });
    if (!user) {
      return res.status(404).json({ code: 40401, data: null, message: 'User not found' });
    }
    res.json({ code: 0, data: user, message: 'ok' });
  }
}

export const authController = new AuthController();
