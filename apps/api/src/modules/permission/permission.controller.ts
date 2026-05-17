/**
 * 权限模块 — 控制器
 */
import { Request, Response } from 'express';
import { permissionService } from './permission.service.js';
import type { AuthRequest } from '../../middleware/auth.js';

/** 权限控制器 */
export class PermissionController {
  /** GET /api/v1/permissions/applications */
  async listApplications(_req: Request, res: Response) {
    const result = await permissionService.listApplications();
    res.json(result);
  }

  /** POST /api/v1/permissions/applications */
  async createApplication(req: Request, res: Response) {
    const result = await permissionService.createApplication(req.body);
    const status = result.code === 0 ? 201 : 409;
    res.status(status).json(result);
  }

  /** POST /api/v1/permissions/applications/:appId/modules */
  async createModule(req: Request, res: Response) {
    const result = await permissionService.createModule(req.params.appId, req.body);
    const status = result.code === 0 ? 201 : 409;
    res.status(status).json(result);
  }

  /** GET /api/v1/permissions/orgs/:orgId/roles */
  async listRoles(req: AuthRequest, res: Response) {
    const result = await permissionService.listRoles(req.params.orgId);
    res.json(result);
  }

  /** POST /api/v1/permissions/orgs/:orgId/roles */
  async createRole(req: AuthRequest, res: Response) {
    const result = await permissionService.createRole(req.params.orgId, req.body);
    const status = result.code === 0 ? 201 : 409;
    res.status(status).json(result);
  }

  /** PUT /api/v1/permissions/roles/:roleId/permissions */
  async updateRolePermissions(req: Request, res: Response) {
    const result = await permissionService.updateRolePermissions(
      req.params.roleId,
      req.body.permissionIds,
    );
    res.json(result);
  }

  /** DELETE /api/v1/permissions/roles/:roleId */
  async deleteRole(req: Request, res: Response) {
    const result = await permissionService.deleteRole(req.params.roleId);
    res.json(result);
  }
}

export const permissionController = new PermissionController();
