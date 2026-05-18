/**
 * 数据库种子脚本
 * 初始化订阅计划、演示应用、权限、测试用户等基础数据
 * 运行: pnpm db:seed (在 apps/api 下) 或 tsx prisma/seed.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ======== 订阅计划 ========
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
      stripePriceId: null,
      amountCents: 2900,
      currency: 'usd',
      features: JSON.stringify(['Up to 20 members', '5 applications', 'All features', 'Priority support']),
      sortOrder: 1,
    },
  });

  console.log('Plans seeded:', freePlan.name, proPlan.name);

  // ======== 演示应用与模块 ========
  const demoApp = await prisma.application.upsert({
    where: { key: 'demo' },
    update: {},
    create: { name: 'Demo App', key: 'demo', description: 'Default demo application for testing' },
  });

  const demoModules = [
    { name: 'Dashboard', key: 'dashboard', sortOrder: 0 },
    { name: 'Projects', key: 'projects', sortOrder: 1 },
    { name: 'Settings', key: 'settings', sortOrder: 2 },
    { name: 'Members', key: 'members', sortOrder: 3 },
    { name: 'Organization', key: 'organization', sortOrder: 4 },
  ];

  const modulePermissionMap: Record<string, string[]> = {};

  for (const mod of demoModules) {
    const m = await prisma.module.upsert({
      where: { applicationId_key: { applicationId: demoApp.id, key: mod.key } },
      update: {},
      create: { applicationId: demoApp.id, name: mod.name, key: mod.key, sortOrder: mod.sortOrder },
    });

    const actions = ['create', 'read', 'update', 'delete', 'manage'];
    for (const action of actions) {
      const perm = await prisma.permission.upsert({
        where: { moduleId_action: { moduleId: m.id, action } },
        update: {},
        create: { moduleId: m.id, action, description: `${action} ${mod.name}` },
      });
      if (!modulePermissionMap[mod.key]) modulePermissionMap[mod.key] = [];
      modulePermissionMap[mod.key].push(perm.id);
    }
  }

  console.log('Demo application, modules, and permissions seeded');

  // ======== 测试组织与用户 ========
  const passwordHash = await bcrypt.hash('Test123456', 12);

  // 先创建 Owner 用户 (organization.createdBy 需要引用存在的 User)
  const testOwner = await prisma.user.upsert({
    where: { email: 'owner@test.com' },
    update: {},
    create: { id: 'user-test-owner', email: 'owner@test.com', passwordHash, name: 'Test Owner' },
  });

  // 创建测试组织
  const testOrg = await prisma.organization.upsert({
    where: { slug: 'test-org' },
    update: {},
    create: { name: 'Test Org', slug: 'test-org', createdBy: testOwner.id },
  });

  // 创建系统角色 (如果尚未存在)
  const ownerRole = await prisma.role.upsert({
    where: { id: 'role-test-owner' },
    update: {},
    create: { id: 'role-test-owner', organizationId: testOrg.id, name: 'Owner', isSystem: true },
  });
  const adminRole = await prisma.role.upsert({
    where: { id: 'role-test-admin' },
    update: {},
    create: { id: 'role-test-admin', organizationId: testOrg.id, name: 'Admin', isSystem: true },
  });
  const memberRole = await prisma.role.upsert({
    where: { id: 'role-test-member' },
    update: {},
    create: { id: 'role-test-member', organizationId: testOrg.id, name: 'Member', isSystem: true },
  });

  // 分配 RBAC 权限
  // Owner: 所有模块的 manage 权限
  for (const [moduleKey, permIds] of Object.entries(modulePermissionMap)) {
    const managePermId = permIds[4]; // manage 是第 5 个 action
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: ownerRole.id, permissionId: managePermId } },
      update: {},
      create: { roleId: ownerRole.id, permissionId: managePermId },
    });
  }

  // Admin: members (create/read/update/delete) + organization (read/update)
  const adminPerms: [string, number][] = [
    ['members', 0], ['members', 1], ['members', 2], ['members', 3],
    ['organization', 1], ['organization', 2],
    ['dashboard', 1], ['projects', 1], ['settings', 1],
  ];
  for (const [moduleKey, actionIdx] of adminPerms) {
    const permId = modulePermissionMap[moduleKey]?.[actionIdx];
    if (permId) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permId } },
        update: {},
        create: { roleId: adminRole.id, permissionId: permId },
      });
    }
  }

  // Member: members (read) + organization (read) + dashboard/projects/settings (read)
  const memberPerms: [string, number][] = [
    ['members', 1], ['organization', 1],
    ['dashboard', 1], ['projects', 1], ['settings', 1],
  ];
  for (const [moduleKey, actionIdx] of memberPerms) {
    const permId = modulePermissionMap[moduleKey]?.[actionIdx];
    if (permId) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: memberRole.id, permissionId: permId } },
        update: {},
        create: { roleId: memberRole.id, permissionId: permId },
      });
    }
  }

  console.log('Roles and RBAC permissions seeded');

  // Owner 已创建，只需分配角色
  await prisma.userOrganizationRole.upsert({
    where: { userId_organizationId: { userId: testOwner.id, organizationId: testOrg.id } },
    update: {},
    create: { userId: testOwner.id, organizationId: testOrg.id, roleId: ownerRole.id },
  });

  // 创建 Admin 和 Member 用户
  const otherUsers = [
    { id: 'user-test-admin', email: 'admin@test.com', name: 'Test Admin', roleId: adminRole.id },
    { id: 'user-test-member', email: 'member@test.com', name: 'Test Member', roleId: memberRole.id },
  ];

  for (const tu of otherUsers) {
    const user = await prisma.user.upsert({
      where: { email: tu.email },
      update: {},
      create: { id: tu.id, email: tu.email, passwordHash, name: tu.name },
    });

    await prisma.userOrganizationRole.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId: testOrg.id } },
      update: {},
      create: { userId: user.id, organizationId: testOrg.id, roleId: tu.roleId },
    });
  }

  console.log('Test users seeded:');
  console.log('  owner@test.com  / Test123456 — Owner (full access)');
  console.log('  admin@test.com  / Test123456 — Admin (member CRUD + org read/update)');
  console.log('  member@test.com / Test123456 — Member (read only)');
  console.log('');
  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
