/**
 * Webhook 服务 — 处理 Paddle 事件回调
 */
import { EventName, type EventEntity } from '@paddle/paddle-node-sdk';
import { prisma } from '../../lib/prisma.js';

export class WebhookService {
  /** 处理 Paddle Webhook 事件 */
  async handleEvent(event: EventEntity) {
    console.log(`[Webhook] Received: ${event.eventType} (${event.eventId})`);

    // 幂等检查 — 使用 eventId 去重（针对交易事件）
    const eventId = event.eventId;
    const existingPayment = await prisma.payment.findFirst({
      where: { paddleTransactionId: eventId },
    });
    if (existingPayment) {
      console.log(`[Webhook] Duplicate event ${eventId}, skipped`);
      return;
    }

    const eventType = event.eventType;

    if (eventType === EventName.SubscriptionActivated) {
      await this.handleSubscriptionActivated(event);
    } else if (eventType === EventName.SubscriptionUpdated) {
      await this.handleSubscriptionUpdated(event);
    } else if (eventType === EventName.SubscriptionCanceled) {
      await this.handleSubscriptionCanceled(event);
    } else if (eventType === EventName.SubscriptionPastDue) {
      await this.handleSubscriptionPastDue(event);
    } else if (eventType === EventName.TransactionCompleted || eventType === EventName.TransactionPaid) {
      await this.handleTransactionCompleted(event);
    } else if (eventType === EventName.TransactionPaymentFailed) {
      await this.handleTransactionFailed(event);
    } else {
      console.log(`[Webhook] Unhandled event type: ${eventType}`);
    }
  }

  private async handleSubscriptionActivated(event: EventEntity) {
    const data = event.data as Record<string, any>;
    const subId = data.id;
    const customData = data.customData as Record<string, any> | undefined;
    const orgId = customData?.organizationId as string | undefined;

    if (!orgId) {
      console.log('[Webhook] No organizationId in custom data, skipped');
      return;
    }

    const items = (data.items as Array<{ price?: { id?: string }; priceId?: string; quantity: number }>) || [];
    const baseItem = items[0];
    const basePriceId = baseItem?.price?.id || baseItem?.priceId;
    const employeeCount = items.find((i) => i.quantity > 1)?.quantity ?? 1;

    const plan = await prisma.subscriptionPlan.findFirst({
      where: { paddleBasePriceId: basePriceId },
    });
    if (!plan) {
      console.log(`[Webhook] Plan not found for price ${basePriceId}`);
      return;
    }

    const now = new Date();
    const periodStart = data.startedAt || data.currentBillingPeriod?.startedAt || now.toISOString();
    const periodEnd = data.nextBillingDate || data.currentBillingPeriod?.endsAt || now.toISOString();

    // findFirst + update/create (paddleSubscriptionId 不是 @unique)
    const existing = await prisma.subscription.findFirst({
      where: { paddleSubscriptionId: subId },
    });

    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          status: 'active',
          planId: plan.id,
          employeeCount: typeof employeeCount === 'number' ? employeeCount : 1,
          currentPeriodStart: new Date(periodStart),
          currentPeriodEnd: new Date(periodEnd),
          paddleCustomerId: data.customerId,
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          paddleSubscriptionId: subId,
          organizationId: orgId,
          planId: plan.id,
          paddleCustomerId: data.customerId,
          employeeCount: typeof employeeCount === 'number' ? employeeCount : 1,
          status: 'active',
          currentPeriodStart: new Date(periodStart),
          currentPeriodEnd: new Date(periodEnd),
        },
      });
    }

    console.log(`[Webhook] Subscription activated: ${subId}`);
  }

  private async handleSubscriptionUpdated(event: EventEntity) {
    const data = event.data as Record<string, any>;
    const subId = data.id;

    await prisma.subscription.updateMany({
      where: { paddleSubscriptionId: subId },
      data: {
        currentPeriodStart: data.currentBillingPeriod?.startedAt
          ? new Date(data.currentBillingPeriod.startedAt)
          : undefined,
        currentPeriodEnd: data.nextBillingDate
          ? new Date(data.nextBillingDate)
          : undefined,
        status: data.status,
      },
    });

    console.log(`[Webhook] Subscription updated: ${subId}`);
  }

  private async handleSubscriptionCanceled(event: EventEntity) {
    const data = event.data as Record<string, any>;
    const subId = data.id;

    await prisma.subscription.updateMany({
      where: { paddleSubscriptionId: subId },
      data: { status: 'canceled', canceledAt: new Date() },
    });

    console.log(`[Webhook] Subscription canceled: ${subId}`);
  }

  private async handleSubscriptionPastDue(event: EventEntity) {
    const data = event.data as Record<string, any>;
    const subId = data.id;

    await prisma.subscription.updateMany({
      where: { paddleSubscriptionId: subId },
      data: { status: 'past_due' },
    });

    console.log(`[Webhook] Subscription past_due: ${subId}`);
  }

  private async handleTransactionCompleted(event: EventEntity) {
    const data = event.data as Record<string, any>;
    const customData = data.customData as Record<string, any> | undefined;
    const orgId = customData?.organizationId as string | undefined;

    if (!orgId) {
      console.log('[Webhook] No organizationId in transaction data');
      return;
    }

    const sub = data.subscriptionId
      ? await prisma.subscription.findFirst({
          where: { paddleSubscriptionId: data.subscriptionId },
        })
      : null;

    const totals = data.details?.totals;
    const amount = totals?.grandTotal || totals?.total || 0;

    await prisma.payment.create({
      data: {
        paddleTransactionId: event.eventId,
        organizationId: orgId,
        subscriptionId: sub?.id,
        paddleInvoiceId: data.invoiceId || null,
        amountCents: Math.round(Number(amount) * 100),
        currency: (data.currencyCode as string) || 'cny',
        paymentMethod: data.payments?.[0]?.methodType || null,
        status: 'succeeded',
        paidAt: new Date(),
      },
    });

    console.log(`[Webhook] Payment succeeded: ${event.eventId}`);
  }

  private async handleTransactionFailed(event: EventEntity) {
    const data = event.data as Record<string, any>;
    const customData = data.customData as Record<string, any> | undefined;
    const orgId = customData?.organizationId as string | undefined;

    if (!orgId) return;

    const totals = data.details?.totals;
    const amount = totals?.grandTotal || totals?.total || 0;

    await prisma.payment.create({
      data: {
        paddleTransactionId: event.eventId,
        organizationId: orgId,
        amountCents: Math.round(Number(amount) * 100),
        currency: (data.currencyCode as string) || 'cny',
        status: 'failed',
      },
    });

    console.log(`[Webhook] Payment failed: ${event.eventId}`);
  }
}

export const webhookService = new WebhookService();
