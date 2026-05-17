/**
 * 组织模块 — 业务服务
 */
import { prisma } from '../../lib/prisma.js';
import { ErrorCode } from '@saas/shared';
import type { CreateOrgInput, UpdateOrgInput } from './organization.schema.js';

/** 组织业务服务 */
export class OrganizationService {
  /**
   * 创建组织
   * 事务内创建组织 + 三个系统角色（Owner/Admin/Member） + 分配 Owner 给创建者
   */
  async create(userId: string, input: CreateOrgInput) {
    const existing = await prisma.organization.findUnique({ where: { slug: input.slug } });
    if (existing) {
      return { code: ErrorCode.SLUG_ALREADY_EXISTS, data: null, message: 'Slug already taken' };
    }

    const org = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: input.name, slug: input.slug, createdBy: userId },
      });

      const ownerRole = await tx.role.create({
        data: { organizationId: org.id, name: 'Owner', isSystem: true },
      });
      await tx.role.create({
        data: { organizationId: org.id, name: 'Admin', isSystem: true },
      });
      await tx.role.create({
        data: { organizationId: org.id, name: 'Member', isSystem: true },
      });

      await tx.userOrganizationRole.create({
        data: { userId, organizationId: org.id, roleId: ownerRole.id },
      });

      return org;
    });

    return { code: ErrorCode.OK, data: org, message: 'Organization created' };
  }

  /** 获取组织详情 */
  async getById(orgId: string) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      return { code: ErrorCode.ORG_NOT_FOUND, data: null, message: 'Organization not found' };
    }
    return { code: ErrorCode.OK, data: org, message: 'ok' };
  }

  /** 更新组织信息 */
  async update(orgId: string, input: UpdateOrgInput) {
    const org = await prisma.organization.update({
      where: { id: orgId },
      data: input,
    });
    return { code: ErrorCode.OK, data: org, message: 'Organization updated' };
  }

  /** 获取组织成员列表 */
  async getMembers(orgId: string) {
    const members = await prisma.userOrganizationRole.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatarUrl: true },
        },
        role: {
          select: { id: true, name: true },
        },
      },
    });

    const list = members.map((m) => ({
      userId: m.user.id,
      email: m.user.email,
      name: m.user.name,
      avatarUrl: m.user.avatarUrl,
      roleId: m.role.id,
      roleName: m.role.name,
      joinedAt: m.joinedAt.toISOString(),
    }));

    return { code: ErrorCode.OK, data: { list }, message: 'ok' };
  }

  /** 通过邮箱邀请成员 */
  async inviteMember(orgId: string, email: string, roleId: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return {
        code: ErrorCode.USER_NOT_FOUND,
        data: null,
        message: 'User not found, ask them to register first',
      };
    }

    const existing = await prisma.userOrganizationRole.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
    });
    if (existing) {
      return { code: ErrorCode.CONFLICT, data: null, message: 'User is already a member' };
    }

    await prisma.userOrganizationRole.create({
      data: { userId: user.id, organizationId: orgId, roleId },
    });

    return { code: ErrorCode.OK, data: null, message: 'Member invited' };
  }

  /** 修改成员角色 */
  async updateMemberRole(orgId: string, memberUserId: string, roleId: string) {
    await prisma.userOrganizationRole.update({
      where: { userId_organizationId: { userId: memberUserId, organizationId: orgId } },
      data: { roleId },
    });

    return { code: ErrorCode.OK, data: null, message: 'Member role updated' };
  }

  /** 移除成员 */
  async removeMember(orgId: string, memberUserId: string) {
    await prisma.userOrganizationRole.delete({
      where: { userId_organizationId: { userId: memberUserId, organizationId: orgId } },
    });

    return { code: ErrorCode.OK, data: null, message: 'Member removed' };
  }
}

export const organizationService = new OrganizationService();
