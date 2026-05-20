/**
 * 付费应用访问控制中间件
 * 实时检查用户是否有权限访问目标付费应用：
 *   1. 免费应用 → 放行
 *   2. 市场不可见（行业不匹配） → 拒绝
 *   3. 有效付费订阅 → 放行
 *   4. 7 天试用期内 → 放行
 *   5. 否则 → 拒绝
 */
import { Response, NextFunction } from 'express';
import { ErrorCode } from '@saas/shared';
import type { AuthRequest } from './auth.js';

/** 检查付费应用访问权限 */
export async function paidAppGuard(req: AuthRequest, res: Response, next: NextFunction) {
  const appKey = req.params.appKey || req.params.key;
  if (!appKey) return next(); // 无 appKey 参数，非应用路由

  try {
    const { prisma } = await import('../lib/prisma.js');

    const app = await prisma.application.findUnique({ where: { key: appKey } });
    if (!app) {
      return res.status(404).json({ code: ErrorCode.NOT_FOUND, data: null, message: 'App not found' });
    }

    // 免费应用直接放行
    if (!app.isPaid) return next();

    // 需要认证
    if (!req.userId) {
      return res.status(401).json({ code: ErrorCode.UNAUTHORIZED, data: null, message: 'Authentication required' });
    }

    // 查询用户组织
    const membership = await prisma.userOrganizationRole.findFirst({
      where: { userId: req.userId },
      include: { organization: true },
    });
    if (!membership) {
      return res.status(403).json({
        code: ErrorCode.FORBIDDEN,
        data: null,
        message: 'No organization membership',
      });
    }

    // 检查市场可见规则（isGeneral 或行业匹配）
    if (!app.isGeneral && app.industries) {
      const industries = app.industries as string[];
      if (industries.length > 0) {
        const orgIndustry = membership.organization.industry || '';
        const l1 = orgIndustry.split('::')[0] || '';
        const matched = industries.some((i: string) => i.startsWith(l1));
        if (!matched) {
          return res.status(403).json({
            code: ErrorCode.FORBIDDEN,
            data: null,
            message: 'Application not available for your industry. Please upgrade your plan.',
          });
        }
      }
    }

    // 检查有效付费订阅
    const activeSub = await prisma.subscription.findFirst({
      where: {
        organizationId: membership.organizationId,
        status: { in: ['active', 'trialing'] },
        plan: { paddleBasePriceId: { not: null } },
      },
    });
    if (activeSub) return next();

    // 检查 7 天试用期
    const trialEnd = new Date(membership.organization.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (new Date() <= trialEnd) return next();

    return res.status(403).json({
      code: ErrorCode.FORBIDDEN,
      data: {
        requiredSubscription: true,
        trialExpired: true,
      },
      message: 'Free trial expired. Please upgrade to Pro or Enterprise to access this application.',
    });
  } catch (err) {
    console.error('[PaidAppGuard] Error:', err);
    return res.status(500).json({ code: ErrorCode.INTERNAL_ERROR, data: null, message: 'Internal error' });
  }
}
