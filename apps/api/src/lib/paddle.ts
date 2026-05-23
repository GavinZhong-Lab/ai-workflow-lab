/**
 * Paddle Billing SDK 封装
 * 统一管理 Paddle API 调用，处理 checkout、订阅、Webhook 等操作
 */
import { Paddle, Environment } from '@paddle/paddle-node-sdk';
import type { EventEntity } from '@paddle/paddle-node-sdk';
import { EnvHttpProxyAgent } from 'undici';
import { setGlobalDispatcher } from 'undici';
import { env } from '../config/index.js';

// 设置全局代理，Paddle SDK 内部的 fetch 调用通过代理访问 Paddle API
setGlobalDispatcher(new EnvHttpProxyAgent());

const paddle = new Paddle(env.PADDLE_API_KEY || 'pdl_missing', {
  environment: env.PADDLE_ENVIRONMENT === 'production' ? Environment.production : Environment.sandbox,
});

export const paddleClient = {
  /** 创建 Paddle 交易（含 Checkout URL） */
  async createCheckout(params: {
    items: { priceId: string; quantity: number }[];
    customerEmail: string;
    organizationId: string;
    successUrl: string;
  }) {
    const transaction = await paddle.transactions.create({
      items: params.items.map((item) => ({
        priceId: item.priceId,
        quantity: item.quantity,
      })),
      customerId: null,
      customData: { organizationId: params.organizationId },
    });

    return {
      checkoutUrl: transaction.checkout?.url ?? '',
      transactionId: transaction.id,
    };
  },

  /** 查询订阅详情 */
  async getSubscription(subscriptionId: string) {
    return paddle.subscriptions.get(subscriptionId);
  },

  /** 取消订阅（立即生效） */
  async cancelSubscription(subscriptionId: string) {
    return paddle.subscriptions.cancel(subscriptionId, { effectiveFrom: 'immediately' });
  },

  /** 更新订阅（升级/降级） */
  async updateSubscription(subscriptionId: string, items: { priceId: string; quantity: number }[]) {
    return paddle.subscriptions.update(subscriptionId, {
      items: items.map((item) => ({
        priceId: item.priceId,
        quantity: item.quantity,
      })),
      prorationBillingMode: 'prorated_immediately',
    });
  },

  /** 获取订阅的支付交易列表（用于查询支付记录） */
  async listTransactions(subscriptionId: string, after?: string) {
    return paddle.transactions.list({
      subscriptionId: [subscriptionId],
      after,
      perPage: 20,
    });
  },

  /** 查询交易详情 */
  async getTransaction(transactionId: string) {
    return paddle.transactions.get(transactionId);
  },

  /** 列出订阅 */
  listSubscriptions(params?: { priceId?: string[]; status?: Array<'active' | 'past_due' | 'canceled' | 'trialing' | 'paused'>; perPage?: number }) {
    return paddle.subscriptions.list({
      priceId: params?.priceId,
      status: params?.status,
      perPage: params?.perPage,
    });
  },

  /** 验证并解析 Webhook 事件 */
  async verifyWebhookSignature(
    payload: string,
    secretKey: string,
    signature: string,
  ): Promise<EventEntity> {
    return paddle.webhooks.unmarshal(payload, secretKey, signature);
  },
};

export type { EventEntity };
