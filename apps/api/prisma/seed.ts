/**
 * 数据库种子脚本
 * 初始化订阅计划、演示应用、默认权限等基础数据
 * 运行: pnpm db:seed (在 apps/api 下) 或 tsx prisma/seed.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ---- 订阅计划 ----
  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-free' },
    update: {},
    create: {
      id: 'plan-free',
      name: 'Free',
      billingPeriod: null,
      amountCents: 0,
      currency: 'usd',
      features: JSON.stringify(['Up to 3 members', '1 application', 'Basic features']),
      sortOrder: 0,
    },
  });

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-pro-monthly' },
    update: {},
    create: {
      id: 'plan-pro-monthly',
      name: 'Pro',
      billingPeriod: 'monthly',
      stripePriceId: null, // 在 Stripe Dashboard 中创建后填写
      amountCents: 2900,
      currency: 'usd',
      features: JSON.stringify([
        'Up to 20 members',
        '5 applications',
        'All features',
        'Priority support',
      ]),
      sortOrder: 1,
    },
  });

  console.log('Plans seeded:', freePlan.name, proPlan.name);

  // ---- 演示应用与模块 ----
  const demoApp = await prisma.application.upsert({
    where: { key: 'demo' },
    update: {},
    create: {
      name: 'Demo App',
      key: 'demo',
      description: 'Default demo application for testing',
    },
  });

  const demoModules = [
    { name: 'Dashboard', key: 'dashboard', sortOrder: 0 },
    { name: 'Projects', key: 'projects', sortOrder: 1 },
    { name: 'Settings', key: 'settings', sortOrder: 2 },
  ];

  for (const mod of demoModules) {
    const m = await prisma.module.upsert({
      where: { applicationId_key: { applicationId: demoApp.id, key: mod.key } },
      update: {},
      create: {
        applicationId: demoApp.id,
        name: mod.name,
        key: mod.key,
        sortOrder: mod.sortOrder,
      },
    });

    // 创建默认权限项
    const actions = ['create', 'read', 'update', 'delete', 'manage'];
    for (const action of actions) {
      await prisma.permission.upsert({
        where: { moduleId_action: { moduleId: m.id, action } },
        update: {},
        create: {
          moduleId: m.id,
          action,
          description: `${action} ${mod.name}`,
        },
      });
    }
  }

  console.log('Demo application and modules seeded');
  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
