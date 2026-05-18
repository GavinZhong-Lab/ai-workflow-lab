/**
 * 组织模块 — 业务服务
 */
import crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';
import { sendInvitationEmail } from '../../lib/email.js';
import { ErrorCode } from '@saas/shared';
import type { CreateOrgInput, UpdateOrgInput } from './organization.schema.js';

/** 组织业务服务 */
export class OrganizationService {
  /** 创建组织 */
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
      await tx.role.create({ data: { organizationId: org.id, name: 'Admin', isSystem: true } });
      await tx.role.create({ data: { organizationId: org.id, name: 'Member', isSystem: true } });

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
    if (!org) return { code: ErrorCode.ORG_NOT_FOUND, data: null, message: 'Organization not found' };
    return { code: ErrorCode.OK, data: org, message: 'ok' };
  }

  /** 更新组织信息 */
  async update(orgId: string, input: UpdateOrgInput) {
    const org = await prisma.organization.update({ where: { id: orgId }, data: input });
    return { code: ErrorCode.OK, data: org, message: 'Organization updated' };
  }

  /** 获取组织成员列表 */
  async getMembers(orgId: string) {
    const members = await prisma.userOrganizationRole.findMany({
      where: { organizationId: orgId },
      include: {
        user: { select: { id: true, email: true, name: true, avatarUrl: true } },
        role: { select: { id: true, name: true } },
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

  /** 邀请成员 — 创建 Invitation 记录并发送邮件 */
  async inviteMember(orgId: string, email: string, roleId: string, invitedByUserId: string) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return { code: ErrorCode.ORG_NOT_FOUND, data: null, message: 'Organization not found' };

    // 检查是否已是成员
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const alreadyMember = await prisma.userOrganizationRole.findUnique({
        where: { userId_organizationId: { userId: existingUser.id, organizationId: orgId } },
      });
      if (alreadyMember) {
        return { code: ErrorCode.CONFLICT, data: null, message: 'User is already a member' };
      }
    }

    // 检查是否已有待处理邀请
    const existingInvite = await prisma.invitation.findFirst({
      where: { organizationId: orgId, email, status: 'pending' },
    });
    if (existingInvite) {
      return { code: ErrorCode.INVITATION_ALREADY_SENT, data: null, message: 'Invitation already sent to this email' };
    }

    // 创建邀请
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await prisma.invitation.create({
      data: { organizationId: orgId, email, roleId, token, invitedBy: invitedByUserId, expiresAt },
    });

    // 异步发送邮件
    const inviter = await prisma.user.findUnique({ where: { id: invitedByUserId } });
    sendInvitationEmail({
      to: email,
      inviterName: inviter?.name || 'A user',
      orgName: org.name,
      token,
    }).catch((err) => console.error('[Email] Background send failed:', err));

    return { code: ErrorCode.OK, data: { id: invitation.id, email, status: 'pending', token }, message: 'Invitation sent' };
  }

  /** 接受邀请 */
  async acceptInvitation(token: string, userId: string) {
    const invitation = await prisma.invitation.findUnique({ where: { token } });
    if (!invitation) return { code: ErrorCode.INVITATION_NOT_FOUND, data: null, message: 'Invitation not found' };
    if (invitation.status === 'accepted') {
      return { code: ErrorCode.INVITATION_ALREADY_ACCEPTED, data: null, message: 'Invitation already accepted' };
    }
    if (invitation.expiresAt < new Date()) {
      return { code: ErrorCode.INVITATION_EXPIRED, data: null, message: 'Invitation has expired' };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email !== invitation.email) {
      return { code: ErrorCode.INVITATION_EMAIL_MISMATCH, data: null, message: 'Email does not match invitation' };
    }

    // 事务：添加成员 + 标记邀请为已接受
    await prisma.$transaction(async (tx) => {
      await tx.userOrganizationRole.create({
        data: { userId, organizationId: invitation.organizationId, roleId: invitation.roleId },
      });
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted', acceptedAt: new Date() },
      });
    });

    return { code: ErrorCode.OK, data: { organizationId: invitation.organizationId }, message: 'Invitation accepted' };
  }

  /** 获取待处理邀请列表 */
  async getPendingInvitations(orgId: string) {
    const invitations = await prisma.invitation.findMany({
      where: { organizationId: orgId, status: 'pending', expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      include: { role: { select: { name: true } } },
    });
    const list = invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      roleName: inv.role.name,
      status: inv.status,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
    }));
    return { code: ErrorCode.OK, data: { list }, message: 'ok' };
  }

  /** 取消邀请 */
  async cancelInvitation(orgId: string, invitationId: string) {
    const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
    if (!invitation || invitation.organizationId !== orgId) {
      return { code: ErrorCode.INVITATION_NOT_FOUND, data: null, message: 'Invitation not found' };
    }
    if (invitation.status !== 'pending') {
      return { code: ErrorCode.CONFLICT, data: null, message: 'Invitation cannot be cancelled' };
    }

    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'cancelled' },
    });

    return { code: ErrorCode.OK, data: null, message: 'Invitation cancelled' };
  }

  /** 修改成员角色 — 不允许修改 Owner */
  async updateMemberRole(orgId: string, memberUserId: string, operatorUserId: string, roleId: string) {
    // 不能修改自己
    const memberRecord = await prisma.userOrganizationRole.findUnique({
      where: { userId_organizationId: { userId: memberUserId, organizationId: orgId } },
      include: { role: true },
    });
    if (!memberRecord) {
      return { code: ErrorCode.NOT_FOUND, data: null, message: 'Member not found' };
    }
    if (memberRecord.role.name.toLowerCase() === 'owner') {
      return { code: ErrorCode.FORBIDDEN, data: null, message: 'Cannot change Owner role' };
    }

    await prisma.userOrganizationRole.update({
      where: { userId_organizationId: { userId: memberUserId, organizationId: orgId } },
      data: { roleId },
    });

    return { code: ErrorCode.OK, data: null, message: 'Member role updated' };
  }

  /** 移除成员 — 不允许移除 Owner */
  async removeMember(orgId: string, memberUserId: string) {
    const memberRecord = await prisma.userOrganizationRole.findUnique({
      where: { userId_organizationId: { userId: memberUserId, organizationId: orgId } },
      include: { role: true },
    });
    if (!memberRecord) {
      return { code: ErrorCode.NOT_FOUND, data: null, message: 'Member not found' };
    }
    if (memberRecord.role.name.toLowerCase() === 'owner') {
      return { code: ErrorCode.FORBIDDEN, data: null, message: 'Cannot remove the organization Owner' };
    }

    await prisma.userOrganizationRole.delete({
      where: { userId_organizationId: { userId: memberUserId, organizationId: orgId } },
    });

    return { code: ErrorCode.OK, data: null, message: 'Member removed' };
  }
}

export const organizationService = new OrganizationService();
