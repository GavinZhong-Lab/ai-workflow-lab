/**
 * Express 应用工厂
 * 配置中间件、路由挂载、错误处理
 */
import express, { type Express } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/index.js';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler } from './middleware/error-handler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { userRouter } from './modules/user/user.routes.js';
import { orgRouter } from './modules/organization/organization.routes.js';
import { permissionRouter } from './modules/permission/permission.routes.js';
import { appsRouter } from './modules/apps/apps.routes.js';
import { adminAppsRouter } from './modules/admin/apps.routes.js';
import { subscriptionRouter } from './modules/subscription/subscription.routes.js';
import { webhookRouter } from './modules/webhook/webhook.routes.js';
import { industries } from './data/industries.js';

/** 创建并配置 Express 应用实例 */
export function createApp(): Express {
  const app = express();

  app.use(cors({
    origin: (origin, cb) => {
      const allowed = [env.APP_URL, 'https://ai-workflow-lab-web.vercel.app', 'https://ai-workflow-lab.vercel.app'];
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin || allowed.includes(origin)) return cb(null, true);
      // Allow Vercel preview deployments
      if (origin.endsWith('.vercel.app')) return cb(null, true);
      cb(null, false);
    },
    credentials: true,
  }));

  // Webhook 路由需要 raw body 用于 Paddle 签名验证
  app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }), webhookRouter);

  // 其他路由使用 JSON 解析
  app.use(express.json());

  /**
   * @openapi
   * /api/health:
   *   get:
   *     tags: [System]
   *     summary: 健康检查
   *     responses:
   *       200:
   *         description: OK
   */
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API 文档
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'SaaS Platform API Docs',
  }));

  // 业务路由
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/organizations', orgRouter);
  app.use('/api/v1/permissions', permissionRouter);
  app.use('/api/v1/apps', appsRouter);
  app.use('/api/v1/admin', adminAppsRouter);
  app.use('/api/v1/subscriptions', subscriptionRouter);

  // 行业数据（静态 JSON，24h 缓存）
  app.get('/api/v1/industries', (_req, res) => {
    res.set('Cache-Control', 'public, max-age=86400');
    res.json({ code: 0, data: industries, message: 'ok' });
  });

  // 错误处理（须在路由之后）
  app.use(errorHandler);

  return app;
}
