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

/**
 * @openapi
 * /api/v1/permissions/applications:
 *   get:
 *     tags: [Permissions]
 *     summary: 获取应用列表
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: 应用列表 }
 */
permissionRouter.get('/applications', authMiddleware, (req, res) =>
  permissionController.listApplications(req, res),
);

/**
 * @openapi
 * /api/v1/permissions/applications:
 *   post:
 *     tags: [Permissions]
 *     summary: 创建应用
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, key]
 *             properties:
 *               name: { type: string }
 *               key: { type: string }
 *               description: { type: string }
 *     responses:
 *       201: { description: 应用创建成功 }
 */
permissionRouter.post(
  '/applications',
  authMiddleware,
  validate(createApplicationSchema),
  (req, res) => permissionController.createApplication(req, res),
);

/**
 * @openapi
 * /api/v1/permissions/applications/{appId}/modules:
 *   post:
 *     tags: [Permissions]
 *     summary: 为应用创建模块
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: appId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, key]
 *             properties:
 *               name: { type: string }
 *               key: { type: string }
 *     responses:
 *       201: { description: 模块创建成功 }
 */
permissionRouter.post(
  '/applications/:appId/modules',
  authMiddleware,
  validate(createModuleSchema),
  (req, res) => permissionController.createModule(req, res),
);

/**
 * @openapi
 * /api/v1/permissions/orgs/{orgId}/roles:
 *   get:
 *     tags: [Permissions]
 *     summary: 获取组织角色列表
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: orgId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: 角色列表 }
 */
permissionRouter.get('/orgs/:orgId/roles', authMiddleware, (req, res) =>
  permissionController.listRoles(req, res),
);

/**
 * @openapi
 * /api/v1/permissions/orgs/{orgId}/roles:
 *   post:
 *     tags: [Permissions]
 *     summary: 创建组织角色
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: orgId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       201: { description: 角色创建成功 }
 */
permissionRouter.post(
  '/orgs/:orgId/roles',
  authMiddleware,
  validate(createRoleSchema),
  (req, res) => permissionController.createRole(req, res),
);

/**
 * @openapi
 * /api/v1/permissions/roles/{roleId}/permissions:
 *   put:
 *     tags: [Permissions]
 *     summary: 为角色分配权限
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: roleId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissionIds: { type: array, items: { type: string, format: uuid } }
 *     responses:
 *       200: { description: 权限分配成功 }
 */
permissionRouter.put('/roles/:roleId/permissions', authMiddleware, (req, res) =>
  permissionController.updateRolePermissions(req, res),
);

/**
 * @openapi
 * /api/v1/permissions/roles/{roleId}:
 *   delete:
 *     tags: [Permissions]
 *     summary: 删除角色
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: roleId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: 删除成功 }
 *       404: { description: 角色不存在 }
 */
permissionRouter.delete('/roles/:roleId', authMiddleware, (req, res) =>
  permissionController.deleteRole(req, res),
);
