/**
 * 认证模块 — 业务服务
 * 处理注册、登录、Token 刷新逻辑
 */
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js';
import { assignDefaultPermissions } from '../../lib/rbac.js';
import { checkMemberLimit } from '../../middleware/member-limit.js';
import { ErrorCode } from '@saas/shared';

/** 认证业务服务 */
export class AuthService {
  /**
   * 用户注册
   * 创建用户 -> 创建默认组织 -> 分配 Owner 角色，事务保证原子性
   */
  async register(email: string, password: string, name: string, companyName: string, industry: string, invitationToken?: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { code: ErrorCode.EMAIL_ALREADY_EXISTS, data: null, message: 'Email already registered' };
    }

    // 验证邀请 token（如果提供）
    let acceptOrgId: string | null = null;
    if (invitationToken) {
      const invitation = await prisma.invitation.findUnique({ where: { token: invitationToken } });
      if (!invitation) {
        return { code: ErrorCode.INVITATION_NOT_FOUND, data: null, message: 'Invalid invitation token' };
      }
      if (invitation.status !== 'pending') {
        return { code: ErrorCode.INVITATION_ALREADY_ACCEPTED, data: null, message: 'Invitation is no longer valid' };
      }
      if (invitation.expiresAt < new Date()) {
        return { code: ErrorCode.INVITATION_EXPIRED, data: null, message: 'Invitation has expired' };
      }
      if (invitation.email !== email) {
        return { code: ErrorCode.INVITATION_EMAIL_MISMATCH, data: null, message: 'Email does not match the invitation' };
      }

      // 检查成员人数上限
      const limitCheck = await checkMemberLimit(invitation.organizationId, 1);
      if (!limitCheck.allowed) {
        return { code: ErrorCode.FORBIDDEN, data: null, message: limitCheck.message };
      }

      acceptOrgId = invitation.organizationId;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, passwordHash, name },
      });

      // 如果有邀请，加入邀请组织；否则创建个人 Workspace
      let primaryOrgId: string;

      if (acceptOrgId && invitationToken) {
        // 接受邀请：加入已有组织
        const invitation = await tx.invitation.findUnique({ where: { token: invitationToken } });
        if (invitation && invitation.status === 'pending') {
          await tx.userOrganizationRole.create({
            data: { userId: user.id, organizationId: invitation.organizationId, roleId: invitation.roleId },
          });
          await tx.invitation.update({
            where: { id: invitation.id },
            data: { status: 'accepted', acceptedAt: new Date() },
          });
          primaryOrgId = invitation.organizationId;
        } else {
          // 邀请已失效，回退到创建个人 Workspace
          const fallbackOrg = await tx.organization.create({
            data: { name: companyName, slug: `${user.id}-workspace`, industry, createdBy: user.id },
          });
          const ownerRole = await tx.role.create({
            data: { organizationId: fallbackOrg.id, name: 'Owner', isSystem: true },
          });
          const adminRole = await tx.role.create({ data: { organizationId: fallbackOrg.id, name: 'Admin', isSystem: true } });
          const memberRole = await tx.role.create({ data: { organizationId: fallbackOrg.id, name: 'Member', isSystem: true } });
          await assignDefaultPermissions(tx, {
            ownerRoleId: ownerRole.id,
            adminRoleId: adminRole.id,
            memberRoleId: memberRole.id,
          });
          await tx.userOrganizationRole.create({
            data: { userId: user.id, organizationId: fallbackOrg.id, roleId: ownerRole.id },
          });
          primaryOrgId = fallbackOrg.id;
        }
      } else {
        // 无邀请：创建个人 Workspace
        const org = await tx.organization.create({
          data: { name: companyName, slug: `${user.id}-workspace`, industry, createdBy: user.id },
        });
        const ownerRole = await tx.role.create({
          data: { organizationId: org.id, name: 'Owner', isSystem: true },
        });
        const adminRole = await tx.role.create({ data: { organizationId: org.id, name: 'Admin', isSystem: true } });
        const memberRole = await tx.role.create({ data: { organizationId: org.id, name: 'Member', isSystem: true } });
        await assignDefaultPermissions(tx, {
          ownerRoleId: ownerRole.id,
          adminRoleId: adminRole.id,
          memberRoleId: memberRole.id,
        });
        await tx.userOrganizationRole.create({
          data: { userId: user.id, organizationId: org.id, roleId: ownerRole.id },
        });
        primaryOrgId = org.id;
      }

      return { user, orgId: primaryOrgId };
    });

    const tokens = this.generateTokens(result.user.id, result.orgId);

    return {
      code: ErrorCode.OK,
      data: {
        user: { id: result.user.id, email: result.user.email, name: result.user.name, isSuperAdmin: result.user.isSuperAdmin },
        tokens,
        joinedOrg: acceptOrgId ? true : false,
      },
      message: acceptOrgId ? 'Registration successful — you have joined the organization' : 'Registration successful',
    };
  }

  /**
   * 用户登录
   * 校验邮箱密码 -> 查找所属组织 -> 更新最后登录时间 -> 签发 Token
   */
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return { code: ErrorCode.INVALID_CREDENTIALS, data: null, message: 'Invalid email or password' };
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return { code: ErrorCode.INVALID_CREDENTIALS, data: null, message: 'Invalid email or password' };
    }

    const firstOrgRole = await prisma.userOrganizationRole.findFirst({
      where: { userId: user.id },
      include: { organization: true },
      orderBy: { joinedAt: 'asc' },
    });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const tokens = this.generateTokens(user.id, firstOrgRole?.organizationId);

    return {
      code: ErrorCode.OK,
      data: {
        user: { id: user.id, email: user.email, name: user.name, isSuperAdmin: user.isSuperAdmin },
        tokens,
        currentOrg: firstOrgRole?.organization ?? null,
      },
      message: 'Login successful',
    };
  }

  /**
   * 刷新 Token
   * 校验 Refresh Token -> 撤销旧 Token -> 签发新 Token 对
   */
  async refresh(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);

      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
      if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
        return { code: ErrorCode.TOKEN_INVALID, data: null, message: 'Refresh token invalid or revoked' };
      }

      // 撤销旧 Token
      await prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      });

      const tokens = this.generateTokens(payload.sub, payload.orgId);

      return { code: ErrorCode.OK, data: tokens, message: 'Tokens refreshed' };
    } catch {
      return { code: ErrorCode.TOKEN_INVALID, data: null, message: 'Refresh token invalid' };
    }
  }

  /** 生成 Token 对并持久化 Refresh Token */
  private generateTokens(userId: string, orgId?: string) {
    const payload = { sub: userId, orgId };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    prisma.refreshToken
      .create({ data: { userId, tokenHash, expiresAt } })
      .catch(console.error);

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
