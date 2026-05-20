import { Router } from 'express';
import { webhookController } from './webhook.controller.js';

export const webhookRouter = Router();

// Paddle Webhook — 需要 raw body 用于签名验证
// 注意：路由挂载前需要在 app.ts 中对此路径跳过 express.json() 解析
webhookRouter.post('/paddle', webhookController.handlePaddleWebhook);
