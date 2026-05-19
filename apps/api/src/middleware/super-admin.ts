/**
 * 超级管理员中间件
 * 校验当前用户是否为超级管理员（系统级角色）
 */
import { Response, NextFunction } from 'express';
import { ErrorCode } from '@saas/shared';
import type { AuthRequest } from './auth.js';

/**
 * 超级管理员权限中间件
 * 必须在 authMiddleware 之后使用（依赖 req.userId）
 */
export async function superAdminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({
      code: ErrorCode.UNAUTHORIZED,
      data: null,
      message: 'Authentication required',
    });
  }

  const { prisma } = await import('../lib/prisma.js');

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { isSuperAdmin: true },
  });

  if (!user?.isSuperAdmin) {
    return res.status(403).json({
      code: ErrorCode.INSUFFICIENT_PERMISSIONS,
      data: null,
      message: 'Requires super admin privileges',
    });
  }

  next();
}
