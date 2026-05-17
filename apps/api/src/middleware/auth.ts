/**
 * 认证中间件
 * 从 Authorization Header 中提取并校验 JWT Token
 */
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';
import { ErrorCode } from '@saas/shared';

/** 扩展 Request，附加认证后的用户信息 */
export interface AuthRequest extends Request {
  userId?: string;
  orgId?: string;
}

/**
 * 强制认证中间件
 * 请求必须携带有效的 Bearer Token，否则返回 401
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      code: ErrorCode.UNAUTHORIZED,
      data: null,
      message: 'Missing or invalid authorization header',
    });
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.orgId = payload.orgId;
    next();
  } catch {
    return res.status(401).json({
      code: ErrorCode.TOKEN_EXPIRED,
      data: null,
      message: 'Token expired or invalid',
    });
  }
}

/**
 * 可选认证中间件
 * Token 有效时设置 user 信息，无效时不报错，继续执行
 */
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }
  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.orgId = payload.orgId;
  } catch {
    // 忽略无效 token
  }
  next();
}
