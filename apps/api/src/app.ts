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

/** 创建并配置 Express 应用实例 */
export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: env.APP_URL, credentials: true }));
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

  // 错误处理（须在路由之后）
  app.use(errorHandler);

  return app;
}
