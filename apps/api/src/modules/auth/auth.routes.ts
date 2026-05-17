/**
 * 认证模块 — 路由定义
 * 挂载认证相关接口路由及中间件
 */
import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema, refreshSchema } from './auth.schema.js';
import { authMiddleware } from '../../middleware/auth.js';

export const authRouter: Router = Router();

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: 用户注册
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               name: { type: string }
 *     responses:
 *       201: { description: 注册成功 }
 *       400: { description: 参数校验失败 }
 *       409: { description: 邮箱已存在 }
 */
authRouter.post('/register', validate(registerSchema), (req, res) => authController.register(req, res));

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: 用户登录
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: 登录成功，返回 accessToken + refreshToken }
 *       401: { description: 邮箱或密码错误 }
 */
authRouter.post('/login', validate(loginSchema), (req, res) => authController.login(req, res));

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: 刷新 Token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: 返回新的 accessToken + refreshToken }
 *       401: { description: Token 无效或已过期 }
 */
authRouter.post('/refresh', validate(refreshSchema), (req, res) => authController.refresh(req, res));

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: 获取当前用户信息
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: 当前用户信息 }
 *       401: { description: 未认证 }
 */
authRouter.get('/me', authMiddleware, (req, res) => authController.me(req, res));
