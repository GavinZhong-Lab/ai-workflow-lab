import { prisma } from '../../lib/prisma.js';
import { ErrorCode } from '@saas/shared';

export class AdminAppsService {
  /** 获取所有应用（含已下线） */
  async listApps() {
    const apps = await prisma.application.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { modules: true } },
      },
    });
    return { code: ErrorCode.OK, data: apps, message: 'ok' };
  }

  /** 创建应用 */
  async createApp(data: {
    key: string;
    name: string;
    description?: string;
    iconUrl?: string;
    isGeneral: boolean;
    isFeatured: boolean;
    isPaid: boolean;
    industries: string[];
    sortOrder: number;
    isActive: boolean;
  }) {
    const existing = await prisma.application.findUnique({ where: { key: data.key } });
    if (existing) {
      return { code: ErrorCode.CONFLICT, data: null, message: 'App key already exists' };
    }
    const app = await prisma.application.create({ data });
    return { code: ErrorCode.OK, data: app, message: 'ok' };
  }

  /** 更新应用 */
  async updateApp(id: string, data: {
    name?: string;
    description?: string;
    iconUrl?: string;
    isGeneral?: boolean;
    isFeatured?: boolean;
    isPaid?: boolean;
    industries?: string[];
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const app = await prisma.application.findUnique({ where: { id } });
    if (!app) {
      return { code: ErrorCode.NOT_FOUND, data: null, message: 'App not found' };
    }
    const updated = await prisma.application.update({ where: { id }, data });
    return { code: ErrorCode.OK, data: updated, message: 'ok' };
  }

  /** 删除应用 */
  async deleteApp(id: string) {
    const app = await prisma.application.findUnique({ where: { id } });
    if (!app) {
      return { code: ErrorCode.NOT_FOUND, data: null, message: 'App not found' };
    }
    await prisma.application.delete({ where: { id } });
    return { code: ErrorCode.OK, data: null, message: 'ok' };
  }

  // --- Banner CRUD ---

  /** 获取所有 Banner */
  async listBanners() {
    const banners = await prisma.appBanner.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return { code: ErrorCode.OK, data: banners, message: 'ok' };
  }

  /** 创建 Banner */
  async createBanner(data: {
    title: string;
    description?: string;
    imageUrl: string;
    linkAppKey?: string;
    sortOrder: number;
    isActive: boolean;
  }) {
    const banner = await prisma.appBanner.create({ data });
    return { code: ErrorCode.OK, data: banner, message: 'ok' };
  }

  /** 更新 Banner */
  async updateBanner(id: string, data: {
    title?: string;
    description?: string;
    imageUrl?: string;
    linkAppKey?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const banner = await prisma.appBanner.findUnique({ where: { id } });
    if (!banner) {
      return { code: ErrorCode.NOT_FOUND, data: null, message: 'Banner not found' };
    }
    const updated = await prisma.appBanner.update({ where: { id }, data });
    return { code: ErrorCode.OK, data: updated, message: 'ok' };
  }

  /** 删除 Banner */
  async deleteBanner(id: string) {
    const banner = await prisma.appBanner.findUnique({ where: { id } });
    if (!banner) {
      return { code: ErrorCode.NOT_FOUND, data: null, message: 'Banner not found' };
    }
    await prisma.appBanner.delete({ where: { id } });
    return { code: ErrorCode.OK, data: null, message: 'ok' };
  }
}

export const adminAppsService = new AdminAppsService();
