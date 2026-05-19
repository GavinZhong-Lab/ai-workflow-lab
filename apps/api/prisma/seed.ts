/**
 * 数据库种子脚本
 * 初始化订阅计划、示例应用、Banner、权限、测试用户、超管等基础数据
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

  // ======== 超级管理员 ========
  const superAdminPassword = await bcrypt.hash('SuperAdmin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@saas.com' },
    update: { isSuperAdmin: true },
    create: { id: 'user-super-admin', email: 'admin@saas.com', passwordHash: superAdminPassword, name: 'Super Admin', isSuperAdmin: true },
  });
  console.log('Super admin seeded: admin@saas.com / SuperAdmin123');

  // ======== 示例应用 ========
  const appDefs = [
    { name: 'CRM', key: 'crm', description: 'Customer relationship management — track leads, deals, and contacts', iconUrl: null, isGeneral: true, isFeatured: true, industries: [], sortOrder: 0, modules: [
      { name: 'Leads', key: 'leads', description: 'Manage and track sales leads' },
      { name: 'Contacts', key: 'contacts', description: 'Customer contact directory' },
      { name: 'Deals', key: 'deals', description: 'Sales pipeline and deal tracking' },
      { name: 'Reports', key: 'reports', description: 'Sales analytics and reports' },
    ]},
    { name: 'HR', key: 'hr', description: 'Human resources — employee records, attendance, and onboarding', iconUrl: null, isGeneral: true, isFeatured: true, industries: [], sortOrder: 1, modules: [
      { name: 'Employees', key: 'employees', description: 'Employee directory and profiles' },
      { name: 'Attendance', key: 'attendance', description: 'Time tracking and attendance records' },
      { name: 'Onboarding', key: 'onboarding', description: 'New hire onboarding workflows' },
    ]},
    { name: 'Project Management', key: 'projects', description: 'Project management — tasks, timelines, and team collaboration', iconUrl: null, isGeneral: true, isFeatured: true, industries: [], sortOrder: 2, modules: [
      { name: 'Tasks', key: 'tasks', description: 'Task management and assignment' },
      { name: 'Timeline', key: 'timeline', description: 'Project timeline and Gantt charts' },
      { name: 'Team', key: 'team', description: 'Team collaboration and communication' },
      { name: 'Docs', key: 'docs', description: 'Project documentation and wiki' },
    ]},
    { name: 'E-commerce', key: 'ecommerce', description: 'E-commerce platform — products, orders, and inventory management', iconUrl: null, isGeneral: false, isFeatured: true, industries: ['电子商务/B2C/综合电商', '电子商务/D2C/独立站'], sortOrder: 3, modules: [
      { name: 'Products', key: 'products', description: 'Product catalog management' },
      { name: 'Orders', key: 'orders', description: 'Order processing and fulfillment' },
      { name: 'Inventory', key: 'inventory', description: 'Stock and warehouse management' },
    ]},
    { name: 'Online Education', key: 'edu', description: 'Online education — course creation, student management, and assessments', iconUrl: null, isGeneral: false, isFeatured: true, industries: ['教育/在线教育/K12', '教育/在线教育/职业教育'], sortOrder: 4, modules: [
      { name: 'Courses', key: 'courses', description: 'Course creation and curriculum design' },
      { name: 'Students', key: 'students', description: 'Student enrollment and progress tracking' },
      { name: 'Assessments', key: 'assessments', description: 'Quizzes, exams, and grading' },
    ]},
    { name: 'Healthcare', key: 'healthcare', description: 'Healthcare management — patient records, appointments, and prescriptions', iconUrl: null, isGeneral: false, isFeatured: false, industries: ['医疗/医疗信息化/电子病历', '医疗/互联网医疗/在线问诊'], sortOrder: 5, modules: [
      { name: 'Patients', key: 'patients', description: 'Patient records and history' },
      { name: 'Appointments', key: 'appointments', description: 'Scheduling and calendar management' },
    ]},
    { name: 'FinTech', key: 'fintech', description: 'Financial technology — risk assessment, lending, and compliance', iconUrl: null, isGeneral: false, isFeatured: false, industries: ['金融/金融科技/支付', '金融/金融科技/风控'], sortOrder: 6, modules: [
      { name: 'Risk', key: 'risk', description: 'Risk assessment and scoring' },
      { name: 'Compliance', key: 'compliance', description: 'Regulatory compliance tracking' },
    ]},
    { name: 'Demo App', key: 'demo', description: 'Default demo application for testing platform features', iconUrl: null, isGeneral: true, isFeatured: false, industries: [], sortOrder: 99, modules: [
      { name: 'Dashboard', key: 'dashboard', description: 'Overview and analytics' },
      { name: 'Settings', key: 'settings', description: 'Application configuration' },
    ]},
  ];

  const modulePermissionMap: Record<string, string[]> = {};

  for (const appDef of appDefs) {
    const app = await prisma.application.upsert({
      where: { key: appDef.key },
      update: {
        name: appDef.name,
        description: appDef.description,
        isGeneral: appDef.isGeneral,
        isFeatured: appDef.isFeatured,
        industries: appDef.industries,
        sortOrder: appDef.sortOrder,
      },
      create: {
        name: appDef.name,
        key: appDef.key,
        description: appDef.description,
        iconUrl: appDef.iconUrl,
        isGeneral: appDef.isGeneral,
        isFeatured: appDef.isFeatured,
        industries: appDef.industries,
        sortOrder: appDef.sortOrder,
      },
    });

    for (const mod of appDef.modules) {
      const m = await prisma.module.upsert({
        where: { applicationId_key: { applicationId: app.id, key: mod.key } },
        update: { description: mod.description },
        create: { applicationId: app.id, name: mod.name, key: mod.key, description: mod.description, sortOrder: 0 },
      });

      const actions = ['create', 'read', 'update', 'delete', 'manage'];
      for (const action of actions) {
        const perm = await prisma.permission.upsert({
          where: { moduleId_action: { moduleId: m.id, action } },
          update: {},
          create: { moduleId: m.id, action, description: `${action} ${mod.name}` },
        });
        const permKey = `${appDef.key}.${mod.key}`;
        if (!modulePermissionMap[permKey]) modulePermissionMap[permKey] = [];
        modulePermissionMap[permKey].push(perm.id);
      }
    }
  }

  console.log(`${appDefs.length} applications with modules and permissions seeded`);

  // ======== 示例 Banner ========
  const bannerDefs = [
    { title: 'Discover CRM', description: 'Manage leads, contacts, and deals in one place', imageUrl: '', linkAppKey: 'crm', sortOrder: 0, isActive: true },
    { title: 'HR Made Simple', description: 'Employee records, attendance, and onboarding', imageUrl: '', linkAppKey: 'hr', sortOrder: 1, isActive: true },
    { title: 'Ship Projects Faster', description: 'Task management and team collaboration', imageUrl: '', linkAppKey: 'projects', sortOrder: 2, isActive: true },
  ];

  for (const bDef of bannerDefs) {
    await prisma.appBanner.create({
      data: { title: bDef.title, description: bDef.description, imageUrl: bDef.imageUrl, linkAppKey: bDef.linkAppKey, sortOrder: bDef.sortOrder, isActive: bDef.isActive },
    });
  }
  console.log(`${bannerDefs.length} banners seeded`);

  // ======== 测试组织与用户 ========
  const passwordHash = await bcrypt.hash('Test123456', 12);

  const testOwner = await prisma.user.upsert({
    where: { email: 'owner@test.com' },
    update: {},
    create: { id: 'user-test-owner', email: 'owner@test.com', passwordHash, name: 'Test Owner' },
  });

  const testOrg = await prisma.organization.upsert({
    where: { slug: 'test-org' },
    update: {},
    create: { name: 'Test Org', slug: 'test-org', createdBy: testOwner.id },
  });

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

  // 分配 RBAC 权限 — 只针对 demo 应用
  const demoPermIds = modulePermissionMap['demo.dashboard'] || [];
  const demoSettingsPermIds = modulePermissionMap['demo.settings'] || [];

  // Owner: manage demo
  for (const permId of demoPermIds) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: ownerRole.id, permissionId: permId } },
      update: {},
      create: { roleId: ownerRole.id, permissionId: permId },
    });
  }
  for (const permId of demoSettingsPermIds) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: ownerRole.id, permissionId: permId } },
      update: {},
      create: { roleId: ownerRole.id, permissionId: permId },
    });
  }

  // Admin: read dashboard + settings
  const adminPermIds = [
    ...(demoPermIds.filter((_, i) => i === 1)), // read
    ...(demoSettingsPermIds.filter((_, i) => i === 1)),
  ];
  for (const permId of adminPermIds) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permId } },
      update: {},
      create: { roleId: adminRole.id, permissionId: permId },
    });
  }

  // Member: read dashboard only
  const memberPermIds = demoPermIds.filter((_, i) => i === 1);
  for (const permId of memberPermIds) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: memberRole.id, permissionId: permId } },
      update: {},
      create: { roleId: memberRole.id, permissionId: permId },
    });
  }

  console.log('Roles and RBAC permissions seeded');

  // 分配组织角色给用户
  await prisma.userOrganizationRole.upsert({
    where: { userId_organizationId: { userId: testOwner.id, organizationId: testOrg.id } },
    update: {},
    create: { userId: testOwner.id, organizationId: testOrg.id, roleId: ownerRole.id },
  });

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
  console.log('  Super Admin: admin@saas.com / SuperAdmin123');
  console.log('  owner@test.com  / Test123456 — Owner (full access)');
  console.log('  admin@test.com  / Test123456 — Admin');
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
