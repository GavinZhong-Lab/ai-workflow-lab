/**
 * 权限校验中间件
 * 基于 RBAC 模型，检查当前用户是否拥有目标资源的操作权限
 */
import { Response, NextFunction } from 'express';
import { ErrorCode } from '@saas/shared';
import type { AuthRequest } from './auth.js';

/**
 * 创建权限校验中间件
 * @param applicationKey - 应用标识
 * @param moduleKey - 模块标识
 * @param action - 操作类型 (create/read/update/delete/manage)
 */
export function requirePermission(applicationKey: string, moduleKey: string, action: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId || !req.orgId) {
      return res.status(403).json({
        code: ErrorCode.FORBIDDEN,
        data: null,
        message: 'Authentication required',
      });
    }

    // 动态导入避免循环依赖
    const { prisma } = await import('../lib/prisma.js');

    const hasPermission = await prisma.rolePermission.findFirst({
      where: {
        role: {
          userOrgRoles: {
            some: {
              userId: req.userId,
              organizationId: req.orgId,
            },
          },
        },
        permission: {
          action: { in: [action, 'manage'] },
          module: {
            key: moduleKey,
            application: {
              key: applicationKey,
            },
          },
        },
      },
    });

    if (!hasPermission) {
      return res.status(403).json({
        code: ErrorCode.INSUFFICIENT_PERMISSIONS,
        data: null,
        message: `Missing permission: ${applicationKey}.${moduleKey}:${action}`,
      });
    }

    next();
  };
}
