/**
 * 用户模块 — 路由定义
 */
import { Router } from 'express';
import { userController } from './user.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { updateUserSchema } from './user.schema.js';

export const userRouter: Router = Router();

/**
 * @openapi
 * /api/v1/users/me:
 *   get:
 *     tags: [Users]
 *     summary: 获取个人信息
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: 用户个人资料 }
 *       401: { description: 未认证 }
 */
userRouter.get('/me', authMiddleware, (req, res) => userController.getProfile(req, res));

/**
 * @openapi
 * /api/v1/users/me:
 *   patch:
 *     tags: [Users]
 *     summary: 更新个人信息
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               avatarUrl: { type: string }
 *               locale: { type: string }
 *               theme: { type: string }
 *     responses:
 *       200: { description: 更新成功 }
 *       401: { description: 未认证 }
 */
userRouter.patch('/me', authMiddleware, validate(updateUserSchema), (req, res) =>
  userController.updateProfile(req, res),
);

/**
 * @openapi
 * /api/v1/users/me/organizations:
 *   get:
 *     tags: [Users]
 *     summary: 获取我的组织列表
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: 组织列表 }
 *       401: { description: 未认证 }
 */
userRouter.get('/me/organizations', authMiddleware, (req, res) =>
  userController.getOrganizations(req, res),
);
