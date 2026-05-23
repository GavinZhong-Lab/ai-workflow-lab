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
    if (!sub) {
      return { code: ErrorCode.NOT_FOUND, data: null, message: 'No active subscription' };
    }

    // 有 paddleSubscriptionId 则通过 Paddle API 取消
    if (sub.paddleSubscriptionId) {
      try {
        await paddleClient.cancelSubscription(sub.paddleSubscriptionId);
      } catch (err) {
        console.error('[Cancel] Paddle cancel failed:', err);
      }
    }

    // 直接更新本地订阅状态（webhook 在本地环境不可达）
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'canceled', canceledAt: new Date() },
    });

    return { code: ErrorCode.OK, data: null, message: 'Subscription canceled' };
  }

  /** 从 Paddle 交易同步订阅状态（用于 Webhook 不可达时的 fallback） */
  async syncFromTransaction(orgId: string, transactionId: string) {
    const transaction = await paddleClient.getTransaction(transactionId);
    if (!transaction) {
      return { code: ErrorCode.NOT_FOUND, data: null, message: 'Transaction not found' };
    }

    const txData = transaction as Record<string, any>;
    const txStatus = txData.status;
    console.log('[Sync] Status:', txStatus, 'subId:', txData.subscriptionId, 'items:', txData.items?.length);

    if (txStatus !== 'completed' && txStatus !== 'billed' && txStatus !== 'paid') {
      return {
        code: ErrorCode.VALIDATION_ERROR,
        data: { status: txStatus },
        message: `Transaction not completed (status: ${txStatus})`,
      };
    }

    // 幂等检查：是否已有 payment + subscription
    const existingPayment = await prisma.payment.findFirst({
      where: { paddleTransactionId: transactionId },
    });

    let subscriptionId = txData.subscriptionId as string | undefined;

    // 如果 transaction 上没有 subscriptionId，从 Paddle 订阅列表按 priceId 查找
    if (!subscriptionId) {
      console.log('[Sync] No subscriptionId on transaction, searching by priceId...');
      const txItems = txData.items as Array<{ price?: { id?: string }; priceId?: string; quantity: number }> || [];
      const priceIds = txItems.map((i: any) => i.price?.id || i.priceId).filter(Boolean) as string[];

      if (priceIds.length > 0) {
        const subCollection = paddleClient.listSubscriptions({ priceId: priceIds, status: ['active', 'trialing'], perPage: 5 });
        for await (const sub of subCollection) {
          const subData = sub as Record<string, any>;
          if (subData.customData?.organizationId === orgId) {
            subscriptionId = subData.id;
            console.log('[Sync] Found subscription by orgId match:', subscriptionId);
            break;
          }
        }
      }

      if (!subscriptionId) {
        console.log('[Sync] Still no subscriptionId, creating subscription from transaction data');
        // 最后兜底：用 transaction items 的 price ID 创建本地订阅记录（无 paddleSubscriptionId）
        const txItems = txData.items as Array<{ price?: { id?: string }; priceId?: string; quantity: number }> || [];
        const basePriceId = txItems[0]?.price?.id || txItems[0]?.priceId;
        const employeeCount = txItems.find((i: any) => i.quantity > 1)?.quantity ?? 1;

        const plan = await prisma.subscriptionPlan.findFirst({
          where: { paddleBasePriceId: basePriceId },
        });

        if (plan) {
          const existing = await prisma.subscription.findFirst({
            where: { organizationId: orgId, status: { not: 'expired' } },
            orderBy: { createdAt: 'desc' },
          });

          if (!existing) {
            await prisma.subscription.create({
              data: {
                organizationId: orgId,
                planId: plan.id,
                employeeCount,
                status: 'active',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              },
            });
            console.log('[Sync] Created local subscription without paddleSubscriptionId');
          }
        }
      }
    }

    // 有 subscriptionId 时从 Paddle 拉取完整数据
    if (subscriptionId) {
      try {
        const paddleSub = await paddleClient.getSubscription(subscriptionId);
        const subData = paddleSub as Record<string, any>;

        const items = (subData.items as Array<{ price?: { id?: string }; priceId?: string; quantity: number }>) || [];
        const baseItem = items[0];
        const basePriceId = baseItem?.price?.id || baseItem?.priceId;
        const employeeCount = items.find((i: { quantity: number }) => i.quantity > 1)?.quantity ?? 1;

        const plan = await prisma.subscriptionPlan.findFirst({
          where: { paddleBasePriceId: basePriceId },
        });

        if (plan) {
          const existing = await prisma.subscription.findFirst({
            where: { paddleSubscriptionId: subscriptionId },
          });

          const periodStart = subData.currentBillingPeriod?.startedAt || subData.startedAt || new Date().toISOString();
          const periodEnd = subData.nextBilledAt || subData.currentBillingPeriod?.endsAt || new Date().toISOString();

          if (existing) {
            await prisma.subscription.update({
              where: { id: existing.id },
              data: {
                status: subData.status || 'active',
                planId: plan.id,
                employeeCount,
                currentPeriodStart: new Date(periodStart),
                currentPeriodEnd: new Date(periodEnd),
                paddleCustomerId: subData.customerId,
              },
            });
          } else {
            await prisma.subscription.create({
              data: {
                paddleSubscriptionId: subscriptionId,
                organizationId: orgId,
                planId: plan.id,
                paddleCustomerId: subData.customerId,
                employeeCount,
                status: subData.status || 'active',
                currentPeriodStart: new Date(periodStart),
                currentPeriodEnd: new Date(periodEnd),
              },
            });
          }

          console.log('[Sync] Subscription saved:', subscriptionId);
        } else {
          console.log('[Sync] Plan not found for price:', basePriceId);
        }
      } catch (err) {
        console.error('[Sync] Failed to fetch subscription from Paddle:', err);
      }
    }

    // 创建支付记录（幂等）
    if (!existingPayment) {
      const totals = txData.details?.totals;
      const amount = totals?.grandTotal || totals?.total || 0;

      await prisma.payment.create({
        data: {
          paddleTransactionId: transactionId,
          organizationId: orgId,
          amountCents: Math.round(Number(amount)),
          currency: txData.currencyCode || 'cny',
          paymentMethod: txData.payments?.[0]?.methodType || null,
          status: 'succeeded',
          paidAt: new Date(),
        },
      });

      console.log('[Sync] Payment recorded');
    }

    return { code: ErrorCode.OK, data: { synced: true }, message: 'Subscription synced' };
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
