/**
 * 组织模块 — 路由定义
 */
import { Router } from 'express';
import { organizationController } from './organization.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createOrgSchema,
  updateOrgSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from './organization.schema.js';

export const orgRouter: Router = Router();

/**
 * @openapi
 * /api/v1/organizations:
 *   post:
 *     tags: [Organizations]
 *     summary: 创建组织
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *               logoUrl: { type: string }
 *     responses:
 *       201: { description: 组织创建成功 }
 *       400: { description: 参数校验失败 }
 */
orgRouter.post('/', authMiddleware, validate(createOrgSchema), (req, res) =>
  organizationController.create(req, res),
);

/**
 * @openapi
 * /api/v1/organizations/{orgId}:
 *   get:
 *     tags: [Organizations]
 *     summary: 获取组织详情
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: orgId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: 组织详情 }
 *       404: { description: 组织不存在 }
 */
orgRouter.get('/:orgId', authMiddleware, (req, res) =>
  organizationController.getById(req, res),
);

/**
 * @openapi
 * /api/v1/organizations/{orgId}:
 *   patch:
 *     tags: [Organizations]
 *     summary: 更新组织信息
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: orgId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               logoUrl: { type: string }
 *     responses:
 *       200: { description: 更新成功 }
 *       404: { description: 组织不存在 }
 */
orgRouter.patch('/:orgId', authMiddleware, validate(updateOrgSchema), (req, res) =>
  organizationController.update(req, res),
);

/**
 * @openapi
 * /api/v1/organizations/{orgId}/members:
 *   get:
 *     tags: [Organizations]
 *     summary: 获取组织成员列表
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: orgId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: 成员列表 }
 */
orgRouter.get('/:orgId/members', authMiddleware, (req, res) =>
  organizationController.getMembers(req, res),
);

/**
 * @openapi
 * /api/v1/organizations/{orgId}/members:
 *   post:
 *     tags: [Organizations]
 *     summary: 邀请成员加入组织
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: orgId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *               roleId: { type: string, format: uuid }
 *     responses:
 *       201: { description: 邀请成功 }
 *       400: { description: 参数校验失败 }
 */
orgRouter.post('/:orgId/members', authMiddleware, validate(inviteMemberSchema), (req, res) =>
  organizationController.inviteMember(req, res),
);

/**
 * @openapi
 * /api/v1/organizations/{orgId}/members/{memberId}:
 *   patch:
 *     tags: [Organizations]
 *     summary: 更新成员角色
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: orgId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: memberId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleId]
 *             properties:
 *               roleId: { type: string, format: uuid }
 *     responses:
 *       200: { description: 角色更新成功 }
 *       404: { description: 成员或角色不存在 }
 */
orgRouter.patch(
  '/:orgId/members/:memberId',
  authMiddleware,
  validate(updateMemberRoleSchema),
  (req, res) => organizationController.updateMemberRole(req, res),
);

/**
 * @openapi
 * /api/v1/organizations/{orgId}/members/{memberId}:
 *   delete:
 *     tags: [Organizations]
 *     summary: 移除组织成员
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: orgId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: memberId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: 移除成功 }
 *       404: { description: 成员不存在 }
 */
orgRouter.delete('/:orgId/members/:memberId', authMiddleware, (req, res) =>
  organizationController.removeMember(req, res),
);
