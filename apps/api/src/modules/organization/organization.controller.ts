/**
 * 组织模块 — 控制器
 */
import type { Response } from 'express';
import { organizationService } from './organization.service.js';
import type { AuthRequest } from '../../middleware/auth.js';

/** 组织控制器 */
export class OrganizationController {
  /** POST /api/v1/organizations */
  async create(req: AuthRequest, res: Response) {
    const result = await organizationService.create(req.userId!, req.body);
    res.status(result.code === 0 ? 201 : 409).json(result);
  }

  /** GET /api/v1/organizations/:orgId */
  async getById(req: AuthRequest, res: Response) {
    const result = await organizationService.getById(req.params.orgId);
    res.status(result.code === 0 ? 200 : 404).json(result);
  }

  /** PATCH /api/v1/organizations/:orgId */
  async update(req: AuthRequest, res: Response) {
    const result = await organizationService.update(req.params.orgId, req.body);
    res.json(result);
  }

  /** GET /api/v1/organizations/:orgId/members */
  async getMembers(req: AuthRequest, res: Response) {
    const result = await organizationService.getMembers(req.params.orgId);
    res.json(result);
  }

  /** POST /api/v1/organizations/:orgId/members — 邀请成员 */
  async inviteMember(req: AuthRequest, res: Response) {
    const { email, roleId } = req.body;
    const result = await organizationService.inviteMember(req.params.orgId, email, roleId, req.userId!);
    res.json(result);
  }

  /** PATCH /api/v1/organizations/:orgId/members/:memberId — 修改成员角色 */
  async updateMemberRole(req: AuthRequest, res: Response) {
    const result = await organizationService.updateMemberRole(
      req.params.orgId, req.params.memberId, req.userId!, req.body.roleId,
    );
    res.json(result);
  }

  /** DELETE /api/v1/organizations/:orgId/members/:memberId — 移除成员 */
  async removeMember(req: AuthRequest, res: Response) {
    const result = await organizationService.removeMember(req.params.orgId, req.params.memberId);
    res.json(result);
  }

  /** GET /api/v1/organizations/:orgId/invitations — 待处理邀请 */
  async getPendingInvitations(req: AuthRequest, res: Response) {
    const result = await organizationService.getPendingInvitations(req.params.orgId);
    res.json(result);
  }

  /** DELETE /api/v1/organizations/:orgId/invitations/:invitationId — 取消邀请 */
  async cancelInvitation(req: AuthRequest, res: Response) {
    const result = await organizationService.cancelInvitation(req.params.orgId, req.params.invitationId);
    res.json(result);
  }

  /** POST /api/v1/invitations/:token/accept — 接受邀请 */
  async acceptInvitation(req: AuthRequest, res: Response) {
    const result = await organizationService.acceptInvitation(req.params.token, req.userId!);
    res.json(result);
  }
}

export const organizationController = new OrganizationController();
