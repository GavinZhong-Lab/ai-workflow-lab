/**
 * 订阅服务 — 业务逻辑层
 * 处理套餐查询、Checkout 创建、订阅管理、发票查询
 */
import { prisma } from '../../lib/prisma.js';
import { paddleClient } from '../../lib/paddle.js';
import { ErrorCode } from '@saas/shared';

export class SubscriptionService {
  /** 获取所有订阅套餐 */
  async getPlans() {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return { code: ErrorCode.OK, data: plans, message: 'ok' };
  }

  /** 获取当前组织的订阅状态 */
  async getCurrentSubscription(orgId: string) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      return { code: ErrorCode.ORG_NOT_FOUND, data: null, message: 'Organization not found' };
    }

    const sub = await prisma.subscription.findFirst({
      where: { organizationId: orgId, status: { not: 'expired' } },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    // 试用期信息
    const trialEnd = new Date(org.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const isInTrial = now <= trialEnd;
    const daysRemaining = isInTrial ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))) : 0;

    return {
      code: ErrorCode.OK,
      data: {
        subscription: sub ? {
          id: sub.id,
          planName: sub.plan.name,
          status: sub.status,
          employeeCount: sub.employeeCount,
          currentPeriodStart: sub.currentPeriodStart,
          currentPeriodEnd: sub.currentPeriodEnd,
          canceledAt: sub.canceledAt,
        } : null,
        trialInfo: {
          isInTrial,
          trialEndsAt: trialEnd.toISOString(),
          daysRemaining,
        },
        isFree: !sub || sub.plan.paddleBasePriceId === null,
      },
      message: 'ok',
    };
  }

  /** 创建 Paddle Checkout */
  async createCheckout(orgId: string, email: string, planId: string, employeeCount: number, successUrl: string) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.paddleBasePriceId) {
      return { code: ErrorCode.VALIDATION_ERROR, data: null, message: 'Invalid plan' };
    }

    if (!employeeCount || employeeCount < 1 || employeeCount > 100000) {
      return { code: ErrorCode.VALIDATION_ERROR, data: null, message: 'Employee count must be between 1 and 100000' };
    }

    const items: { priceId: string; quantity: number }[] = [
      { priceId: plan.paddleBasePriceId, quantity: 1 },
    ];
    if (plan.paddlePerPersonPriceId && employeeCount > 0) {
      items.push({ priceId: plan.paddlePerPersonPriceId, quantity: employeeCount });
    }

    const { checkoutUrl, transactionId } = await paddleClient.createCheckout({
      items,
      customerEmail: email,
      organizationId: orgId,
      successUrl,
    });

    return {
      code: ErrorCode.OK,
      data: { checkoutUrl, transactionId },
      message: 'ok',
    };
  }

  /** 取消当前订阅 */
  async cancelSubscription(orgId: string) {
    const sub = await prisma.subscription.findFirst({
      where: { organizationId: orgId, status: { in: ['active', 'past_due', 'trialing'] } },
    });
    if (!sub || !sub.paddleSubscriptionId) {
      return { code: ErrorCode.NOT_FOUND, data: null, message: 'No active subscription' };
    }

    await paddleClient.cancelSubscription(sub.paddleSubscriptionId);
    // Paddle Webhook 会更新本地状态

    return { code: ErrorCode.OK, data: null, message: 'Subscription canceled' };
  }

  /** 变更套餐（升级/降级） */
  async changePlan(orgId: string, newPlanId: string, employeeCount?: number) {
    const sub = await prisma.subscription.findFirst({
      where: { organizationId: orgId, status: { in: ['active', 'trialing'] } },
    });
    if (!sub || !sub.paddleSubscriptionId) {
      return { code: ErrorCode.NOT_FOUND, data: null, message: 'No active subscription' };
    }

    const newPlan = await prisma.subscriptionPlan.findUnique({ where: { id: newPlanId } });
    if (!newPlan || !newPlan.paddleBasePriceId) {
      return { code: ErrorCode.VALIDATION_ERROR, data: null, message: 'Invalid plan' };
    }

    const count = employeeCount ?? sub.employeeCount;
    const items: { priceId: string; quantity: number }[] = [
      { priceId: newPlan.paddleBasePriceId, quantity: 1 },
    ];
    if (newPlan.paddlePerPersonPriceId && count > 0) {
      items.push({ priceId: newPlan.paddlePerPersonPriceId, quantity: count });
    }

    await paddleClient.updateSubscription(sub.paddleSubscriptionId, items);
    // Paddle Webhook 会更新本地状态

    return { code: ErrorCode.OK, data: null, message: 'Plan change requested' };
  }

  /** 获取交易列表（含支付记录，用于发票展示） */
  async getInvoices(orgId: string, after?: string) {
    const sub = await prisma.subscription.findFirst({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
    if (!sub?.paddleSubscriptionId) {
      return { code: ErrorCode.OK, data: { invoices: [], cursor: null }, message: 'ok' };
    }

    const collection = await paddleClient.listTransactions(sub.paddleSubscriptionId, after);
    const transactions: unknown[] = [];
    for await (const item of collection) {
      transactions.push(item);
    }

    return {
      code: ErrorCode.OK,
      data: { invoices: transactions, cursor: null },
      message: 'ok',
    };
  }

  /** 获取支付记录 */
  async getPayments(orgId: string, after?: string, limit = 20) {
    const payments = await prisma.payment.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(after ? { cursor: { id: after }, skip: 1 } : {}),
    });

    const hasMore = payments.length > limit;
    const data = hasMore ? payments.slice(0, limit) : payments;

    return {
      code: ErrorCode.OK,
      data: { payments: data, cursor: hasMore ? data[data.length - 1].id : null },
      message: 'ok',
    };
  }
}

export const subscriptionService = new SubscriptionService();
