/**
 * 成员人数上限检查工具
 * 在「生成邀请」和「注册接受邀请」时调用，确保不超过套餐人数上限
 *   - Free: 上限 3 人
 *   - Pro: 上限 = 订阅时填写的 employeeCount
 *   - Enterprise: 不限
 */
import { prisma } from '../lib/prisma.js';

export interface LimitCheckResult {
  allowed: boolean;
  currentCount: number;
  maxAllowed: number | null;
  message?: string;
}

export async function checkMemberLimit(
  organizationId: string,
  newMemberCount: number = 1,
): Promise<LimitCheckResult> {
  const currentCount = await prisma.userOrganizationRole.count({
    where: { organizationId },
  });

  // 查询当前有效订阅
  const sub = await prisma.subscription.findFirst({
    where: {
      organizationId,
      status: { in: ['active', 'trialing'] },
    },
    include: { plan: true },
  });

  // 无订阅或 Free 套餐：上限 3
  if (!sub || !sub.plan.paddleBasePriceId) {
    const max = 3;
    if (currentCount + newMemberCount > max) {
      return {
        allowed: false,
        currentCount,
        maxAllowed: max,
        message: `Free plan allows up to ${max} members. Please upgrade to Pro or Enterprise.`,
      };
    }
    return { allowed: true, currentCount, maxAllowed: max };
  }

  // Enterprise：不限
  if (sub.plan.name.toLowerCase().includes('enterprise')) {
    return { allowed: true, currentCount, maxAllowed: null };
  }

  // Pro：上限 = employeeCount
  const max = sub.employeeCount;
  if (currentCount + newMemberCount > max) {
    return {
      allowed: false,
      currentCount,
      maxAllowed: max,
      message: `Your plan allows up to ${max} members. Current: ${currentCount}. Please upgrade to add more.`,
    };
  }

  return { allowed: true, currentCount, maxAllowed: max };
}
