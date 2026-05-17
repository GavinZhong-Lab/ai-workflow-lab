/**
 * JWT 工具
 * 提供 Access Token 和 Refresh Token 的签发与校验
 */
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/index.js';
import type { JwtPayload } from '@saas/shared';

/** 签发 Access Token（短期有效） */
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload as object, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

/** 签发 Refresh Token（长期有效） */
export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload as object, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
}

/** 校验 Access Token，返回载荷 */
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
}

/** 校验 Refresh Token，返回载荷 */
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}
