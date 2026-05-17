/**
 * Express 应用工厂
 * 配置中间件、路由挂载、错误处理
 */
import express, { type Express } from 'express';
import cors from 'cors';
import { env } from './config/index.js';
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

  // 健康检查
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 业务路由
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/organizations', orgRouter);
  app.use('/api/v1/permissions', permissionRouter);

  // 错误处理（须在路由之后）
  app.use(errorHandler);

  return app;
}
