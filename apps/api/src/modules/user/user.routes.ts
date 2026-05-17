/**
 * 用户模块 — 路由定义
 */
import { Router } from 'express';
import { userController } from './user.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { updateUserSchema } from './user.schema.js';

export const userRouter: Router = Router();

userRouter.get('/me', authMiddleware, (req, res) => userController.getProfile(req, res));
userRouter.patch('/me', authMiddleware, validate(updateUserSchema), (req, res) =>
  userController.updateProfile(req, res),
);
userRouter.get('/me/organizations', authMiddleware, (req, res) =>
  userController.getOrganizations(req, res),
);
