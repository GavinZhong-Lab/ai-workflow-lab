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

authRouter.post('/register', validate(registerSchema), (req, res) => authController.register(req, res));
authRouter.post('/login', validate(loginSchema), (req, res) => authController.login(req, res));
authRouter.post('/refresh', validate(refreshSchema), (req, res) => authController.refresh(req, res));
authRouter.get('/me', authMiddleware, (req, res) => authController.me(req, res));
