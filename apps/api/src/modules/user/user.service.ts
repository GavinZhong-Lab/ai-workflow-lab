/**
 * 用户模块 — 业务服务
 */
import { prisma } from '../../lib/prisma.js';
import { ErrorCode } from '@saas/shared';
import type { UpdateUserInput } from './user.schema.js';

/** 用户业务服务 */
export class UserService {
  /** 获取当前用户完整信息 */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        locale: true,
        theme: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return { code: ErrorCode.USER_NOT_FOUND, data: null, message: 'User not found' };
    }

    return { code: ErrorCode.OK, data: user, message: 'ok' };
  }

  /** 更新当前用户资料（名称、语言、主题） */
  async updateProfile(userId: string, input: UpdateUserInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: input,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        locale: true,
        theme: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    return { code: ErrorCode.OK, data: user, message: 'Profile updated' };
  }

  /** 获取当前用户所属的组织列表 */
  async getOrganizations(userId: string) {
    const orgs = await prisma.userOrganizationRole.findMany({
      where: { userId },
      include: {
        organization: true,
        role: { select: { id: true, name: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });

    const list = orgs.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      logoUrl: m.organization.logoUrl,
      role: m.role.name,
      createdAt: m.organization.createdAt.toISOString(),
    }));

    return { code: ErrorCode.OK, data: { list }, message: 'ok' };
  }
}

export const userService = new UserService();
