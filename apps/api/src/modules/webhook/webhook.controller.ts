import { Request, Response } from 'express';
import { webhookService } from './webhook.service.js';
import { paddleClient } from '../../lib/paddle.js';
import { env } from '../../config/index.js';

export class WebhookController {
  async handlePaddleWebhook(req: Request, res: Response) {
    try {
      // express.raw() 将 body 作为 Buffer，需转为字符串
      const payload = Buffer.isBuffer(req.body)
        ? req.body.toString('utf-8')
        : typeof req.body === 'string'
          ? req.body
          : JSON.stringify(req.body);
      const signature = (req.headers['paddle-signature'] as string) || '';

      const event = await paddleClient.verifyWebhookSignature(
        payload,
        env.PADDLE_WEBHOOK_SECRET || '',
        signature,
      );

      // 异步处理事件，快速返回 200
      webhookService.handleEvent(event).catch((err) => {
        console.error('[Webhook] Async handler error:', err);
      });

      res.status(200).json({ received: true });
    } catch (err) {
      console.error('[Webhook] Signature verification failed:', err);
      res.status(400).json({ error: 'Invalid signature' });
    }
  }
}

export const webhookController = new WebhookController();
