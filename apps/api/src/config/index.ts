/**
 * 环境变量配置
 * 通过 Zod Schema 校验并导出类型安全的环境变量
 */
import { z } from 'zod';

/** 环境变量校验 Schema */
const envSchema = z.object({
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  PADDLE_API_KEY: z.string().optional(),
  PADDLE_WEBHOOK_SECRET: z.string().optional(),
  PADDLE_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
  PADDLE_CLIENT_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  APP_URL: z.string().default('http://localhost:3000'),
  API_URL: z.string().default('http://localhost:4000'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/** 环境变量类型 */
export type Env = z.infer<typeof envSchema>;

/** 加载并校验环境变量，失败时立即退出进程 */
function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

/** 全局环境变量实例 */
export const env = loadEnv();
