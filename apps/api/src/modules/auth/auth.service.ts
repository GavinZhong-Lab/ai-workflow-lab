/**
 * 认证模块 — 业务服务
 * 处理注册、登录、Token 刷新逻辑
 */
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js';
import { ErrorCode } from '@saas/shared';

/** 认证业务服务 */
export class AuthService {
  /**
   * 用户注册
   * 创建用户 -> 创建默认组织 -> 分配 Owner 角色，事务保证原子性
   */
  async register(email: string, password: string, name: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { code: ErrorCode.EMAIL_ALREADY_EXISTS, data: null, message: 'Email already registered' };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, passwordHash, name },
      });

      const org = await tx.organization.create({
        data: {
          name: `${name}'s Workspace`,
          slug: `${user.id}-workspace`,
          createdBy: user.id,
        },
      });

      // 创建系统角色 Owner/Admin/Member
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
        data: { userId: user.id, organizationId: org.id, roleId: ownerRole.id },
      });

      return { user, org };
    });

    const tokens = this.generateTokens(result.user.id, result.org.id);

    return {
      code: ErrorCode.OK,
      data: {
        user: { id: result.user.id, email: result.user.email, name: result.user.name },
        tokens,
      },
      message: 'Registration successful',
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
        user: { id: user.id, email: user.email, name: user.name },
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
