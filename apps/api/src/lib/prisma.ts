/**
 * Prisma 客户端单例
 * 开发环境复用全局实例，避免热重载时创建过多连接
 */
import { PrismaClient } from '@prisma/client';
import { env } from '../config/index.js';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/** Prisma 客户端实例 */
export const prisma = globalForPrisma.prisma || new PrismaClient();

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
