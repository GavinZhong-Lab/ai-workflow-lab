/**
 * 全局错误处理中间件
 * 捕获所有未处理的异常，返回统一的错误响应格式
 */
import { Request, Response, NextFunction } from 'express';
import { ErrorCode } from '@saas/shared';
import { env } from '../config/index.js';

/**
 * 统一错误处理中间件
 * 在生产环境隐藏内部错误详情，开发环境输出完整堆栈
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('[Error]', err.message, err.stack);

  return res.status(500).json({
    code: ErrorCode.INTERNAL_ERROR,
    data: null,
    message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}
