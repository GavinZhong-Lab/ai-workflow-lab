/**
 * 权限模块 — 路由定义
 */
import { Router } from 'express';
import { permissionController } from './permission.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createApplicationSchema,
  createModuleSchema,
  createRoleSchema,
} from './permission.schema.js';

export const permissionRouter: Router = Router();

// 应用管理
permissionRouter.get('/applications', authMiddleware, (req, res) =>
  permissionController.listApplications(req, res),
);
permissionRouter.post(
  '/applications',
  authMiddleware,
  validate(createApplicationSchema),
  (req, res) => permissionController.createApplication(req, res),
);

// 模块管理
permissionRouter.post(
  '/applications/:appId/modules',
  authMiddleware,
  validate(createModuleSchema),
  (req, res) => permissionController.createModule(req, res),
);

// 角色管理
permissionRouter.get('/orgs/:orgId/roles', authMiddleware, (req, res) =>
  permissionController.listRoles(req, res),
);
permissionRouter.post(
  '/orgs/:orgId/roles',
  authMiddleware,
  validate(createRoleSchema),
  (req, res) => permissionController.createRole(req, res),
);

// 权限分配
permissionRouter.put('/roles/:roleId/permissions', authMiddleware, (req, res) =>
  permissionController.updateRolePermissions(req, res),
);
permissionRouter.delete('/roles/:roleId', authMiddleware, (req, res) =>
  permissionController.deleteRole(req, res),
);
