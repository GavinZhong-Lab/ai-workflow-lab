/**
 * 组织模块 — 路由定义
 */
import { Router } from 'express';
import { organizationController } from './organization.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/permission.js';
import { validate } from '../../middleware/validate.js';
import {
  createOrgSchema,
  updateOrgSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from './organization.schema.js';

export const orgRouter: Router = Router();

// ---- 组织 CRUD ----

/** POST / — 创建组织（仅需认证） */
orgRouter.post('/', authMiddleware, validate(createOrgSchema), (req, res) =>
  organizationController.create(req, res),
);

/** GET /:orgId — 获取组织详情 */
orgRouter.get('/:orgId', authMiddleware, requirePermission('demo', 'organization', 'read'), (req, res) =>
  organizationController.getById(req, res),
);

/** PATCH /:orgId — 更新组织信息 */
orgRouter.patch('/:orgId', authMiddleware, requirePermission('demo', 'organization', 'update'), validate(updateOrgSchema), (req, res) =>
  organizationController.update(req, res),
);

// ---- 成员管理（需对应权限） ----

/** GET /:orgId/members — 查看成员列表 */
orgRouter.get('/:orgId/members', authMiddleware, requirePermission('demo', 'members', 'read'), (req, res) =>
  organizationController.getMembers(req, res),
);

/** POST /:orgId/members — 邀请成员 */
orgRouter.post('/:orgId/members', authMiddleware, requirePermission('demo', 'members', 'create'), validate(inviteMemberSchema), (req, res) =>
  organizationController.inviteMember(req, res),
);

/** PATCH /:orgId/members/:memberId — 修改成员角色 */
orgRouter.patch(
  '/:orgId/members/:memberId',
  authMiddleware,
  requirePermission('demo', 'members', 'update'),
  validate(updateMemberRoleSchema),
  (req, res) => organizationController.updateMemberRole(req, res),
);

/** DELETE /:orgId/members/:memberId — 移除成员 */
orgRouter.delete('/:orgId/members/:memberId', authMiddleware, requirePermission('demo', 'members', 'delete'), (req, res) =>
  organizationController.removeMember(req, res),
);

// ---- 邀请管理 ----

/** GET /:orgId/invitations — 查看待处理邀请 */
orgRouter.get('/:orgId/invitations', authMiddleware, requirePermission('demo', 'members', 'read'), (req, res) =>
  organizationController.getPendingInvitations(req, res),
);

/** DELETE /:orgId/invitations/:invitationId — 取消邀请 */
orgRouter.delete('/:orgId/invitations/:invitationId', authMiddleware, requirePermission('demo', 'members', 'create'), (req, res) =>
  organizationController.cancelInvitation(req, res),
);

/** POST /invitations/:token/accept — 接受邀请（需登录） */
orgRouter.post('/invitations/:token/accept', authMiddleware, (req, res) =>
  organizationController.acceptInvitation(req, res),
);
