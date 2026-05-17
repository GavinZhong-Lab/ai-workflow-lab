/**
 * 请求校验中间件
 * 使用 Zod Schema 对请求参数进行类型安全的校验
 */
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ErrorCode } from '@saas/shared';

/** 校验目标：body / query / params */
type ValidationTarget = 'body' | 'query' | 'params';

/**
 * 创建校验中间件
 * @param schema - Zod 校验 Schema
 * @param target - 校验的请求对象属性
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[target]);
      req[target] = data; // 替换为经过 transform 的数据
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          code: ErrorCode.VALIDATION_ERROR,
          data: null,
          message: err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
        });
      }
      next(err);
    }
  };
}
