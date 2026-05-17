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

orgRouter.post('/', authMiddleware, validate(createOrgSchema), (req, res) =>
  organizationController.create(req, res),
);
orgRouter.get('/:orgId', authMiddleware, (req, res) =>
  organizationController.getById(req, res),
);
orgRouter.patch('/:orgId', authMiddleware, validate(updateOrgSchema), (req, res) =>
  organizationController.update(req, res),
);
orgRouter.get('/:orgId/members', authMiddleware, (req, res) =>
  organizationController.getMembers(req, res),
);
orgRouter.post('/:orgId/members', authMiddleware, validate(inviteMemberSchema), (req, res) =>
  organizationController.inviteMember(req, res),
);
orgRouter.patch(
  '/:orgId/members/:memberId',
  authMiddleware,
  validate(updateMemberRoleSchema),
  (req, res) => organizationController.updateMemberRole(req, res),
);
orgRouter.delete('/:orgId/members/:memberId', authMiddleware, (req, res) =>
  organizationController.removeMember(req, res),
);
