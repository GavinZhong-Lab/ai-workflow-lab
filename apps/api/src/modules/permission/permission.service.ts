/**
 * 权限模块 — 业务服务
 * 管理应用、模块、角色及权限分配
 */
import { prisma } from '../../lib/prisma.js';
import { ErrorCode } from '@saas/shared';

/** 权限业务服务 */
export class PermissionService {
  /** 获取所有活跃应用（含模块和权限定义） */
  async listApplications() {
    const apps = await prisma.application.findMany({
      where: { isActive: true },
      include: { modules: { include: { permissions: true } } },
    });
    return { code: ErrorCode.OK, data: { list: apps }, message: 'ok' };
  }

  /** 注册新应用 */
  async createApplication(input: { name: string; key: string; description?: string }) {
    const existing = await prisma.application.findUnique({ where: { key: input.key } });
    if (existing) {
      return { code: ErrorCode.CONFLICT, data: null, message: 'Application key already exists' };
    }
    const app = await prisma.application.create({ data: input });
    return { code: ErrorCode.OK, data: app, message: 'Application created' };
  }

  /**
   * 为应用创建功能模块
   * 自动创建默认权限项（create/read/update/delete/manage）
   */
  async createModule(appId: string, input: { name: string; key: string; description?: string }) {
    const existing = await prisma.module.findUnique({
      where: { applicationId_key: { applicationId: appId, key: input.key } },
    });
    if (existing) {
      return {
        code: ErrorCode.CONFLICT,
        data: null,
        message: 'Module key already exists in this application',
      };
    }

    const mod = await prisma.$transaction(async (tx) => {
      const mod = await tx.module.create({
        data: { ...input, applicationId: appId },
      });

      const actions = ['create', 'read', 'update', 'delete', 'manage'];
      await tx.permission.createMany({
        data: actions.map((action) => ({
          moduleId: mod.id,
          action,
          description: `${action} ${input.name}`,
        })),
      });

      return mod;
    });

    return { code: ErrorCode.OK, data: mod, message: 'Module created with default permissions' };
  }

  /** 获取组织下的所有角色及其权限 */
  async listRoles(orgId: string) {
    const roles = await prisma.role.findMany({
      where: { organizationId: orgId },
      include: {
        rolePermissions: {
          include: {
            permission: {
              include: {
                module: {
                  include: { application: true },
                },
              },
            },
          },
        },
      },
    });

    const list = roles.map((r) => ({
      id: r.id,
      name: r.name,
      isSystem: r.isSystem,
      permissions: r.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        moduleId: rp.permission.moduleId,
        moduleName: rp.permission.module.name,
        applicationId: rp.permission.module.applicationId,
        applicationName: rp.permission.module.application.name,
        action: rp.permission.action,
      })),
    }));

    return { code: ErrorCode.OK, data: { list }, message: 'ok' };
  }

  /** 创建自定义角色并分配权限 */
  async createRole(orgId: string, input: { name: string; permissionIds: string[] }) {
    const existing = await prisma.role.findUnique({
      where: { organizationId_name: { organizationId: orgId, name: input.name } },
    });
    if (existing) {
      return { code: ErrorCode.CONFLICT, data: null, message: 'Role name already exists' };
    }

    const role = await prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: { organizationId: orgId, name: input.name },
      });
      if (input.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: input.permissionIds.map((permId) => ({
            roleId: role.id,
            permissionId: permId,
          })),
        });
      }
      return role;
    });

    return { code: ErrorCode.OK, data: role, message: 'Role created' };
  }

  /** 更新角色的权限列表（全量替换） */
  async updateRolePermissions(roleId: string, permissionIds: string[]) {
    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permId) => ({ roleId, permissionId: permId })),
        });
      }
    });
    return { code: ErrorCode.OK, data: null, message: 'Permissions updated' };
  }

  /** 删除自定义角色（系统角色不可删除） */
  async deleteRole(roleId: string) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return { code: ErrorCode.ROLE_NOT_FOUND, data: null, message: 'Role not found' };
    }
    if (role.isSystem) {
      return { code: ErrorCode.FORBIDDEN, data: null, message: 'System roles cannot be deleted' };
    }
    await prisma.role.delete({ where: { id: roleId } });
    return { code: ErrorCode.OK, data: null, message: 'Role deleted' };
  }
}

export const permissionService = new PermissionService();
