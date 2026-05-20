import { prisma } from '../../lib/prisma.js';
import { ErrorCode } from '@saas/shared';

export class AppsService {
  /** 获取应用市场列表（Banner + 精选 + 分组应用） */
  async getMarketplace(orgId: string | undefined) {
    // 获取组织行业（超管无组织时仅展示通用应用）
    let l1Industry = '';
    if (orgId) {
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { industry: true },
      });
      const industry = org?.industry || '';
      l1Industry = industry.split('::')[0] || '';
    }

    // Banner
    const banners = await prisma.appBanner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // 所有活跃应用
    const allApps = await prisma.application.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        iconUrl: true,
        isGeneral: true,
        isFeatured: true,
        isPaid: true,
        industries: true,
        sortOrder: true,
      },
    });

    // 过滤：通用应用 OR 行业匹配（无组织时展示全部应用，方便超管预览）
    const matchedApps = allApps.filter((app) => {
      if (app.isGeneral) return true;
      if (!l1Industry) return true; // 无组织时展示所有应用
      const industries = app.industries as string[];
      return industries.some((i) => i.startsWith(l1Industry));
    });

    // 分组
    const featured = matchedApps.filter((a) => a.isFeatured);
    const general = matchedApps.filter((a) => a.isGeneral && !a.isFeatured);
    const industrySpecific = matchedApps.filter((a) => !a.isGeneral && !a.isFeatured);

    return {
      code: ErrorCode.OK,
      data: {
        banners,
        featured,
        apps: {
          general,
          industrySpecific,
        },
      },
      message: 'ok',
    };
  }

  /** 获取应用详情 */
  async getByKey(key: string) {
    const app = await prisma.application.findUnique({
      where: { key },
      include: {
        modules: {
          orderBy: { sortOrder: 'asc' },
          select: {
            key: true,
            name: true,
            description: true,
            sortOrder: true,
          },
        },
      },
    });

    if (!app || !app.isActive) {
      return { code: ErrorCode.NOT_FOUND, data: null, message: 'App not found' };
    }

    return { code: ErrorCode.OK, data: app, message: 'ok' };
  }
}

export const appsService = new AppsService();
