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
    update: {
      name: 'Free',
      baseAmountCents: 0,
      perPersonAmountCents: 0,
      currency: 'cny',
      features: JSON.stringify(['最多 3 名成员', '7 天付费应用试用']),
    },
    create: {
      id: 'plan-free',
      name: 'Free',
      billingPeriod: null,
      baseAmountCents: 0,
      perPersonAmountCents: 0,
      paddleBasePriceId: null,
      paddlePerPersonPriceId: null,
      currency: 'cny',
      features: JSON.stringify(['最多 3 名成员', '7 天付费应用试用']),
      sortOrder: 0,
    },
  });

  const proMonthly = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-pro-monthly' },
    update: {
      name: 'Pro (月付)',
      baseAmountCents: 9900,
      perPersonAmountCents: 2000,
      currency: 'cny',
      features: JSON.stringify(['最多等于开通人数', '全部应用', '全部功能', '优先支持']),
    },
    create: {
      id: 'plan-pro-monthly',
      name: 'Pro (月付)',
      billingPeriod: 'monthly',
      baseAmountCents: 9900,
      perPersonAmountCents: 2000,
      paddleBasePriceId: null,  // 在 Paddle Dashboard 创建后填入
      paddlePerPersonPriceId: null,
      currency: 'cny',
      features: JSON.stringify(['最多等于开通人数', '全部应用', '全部功能', '优先支持']),
      sortOrder: 1,
    },
  });

  const proYearly = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-pro-yearly' },
    update: {
      baseAmountCents: 99000,
      perPersonAmountCents: 20000,
      currency: 'cny',
      features: JSON.stringify(['最多等于开通人数', '全部应用', '全部功能', '优先支持', '年付享 8.3 折']),
    },
    create: {
      id: 'plan-pro-yearly',
      name: 'Pro (年付)',
      billingPeriod: 'yearly',
      baseAmountCents: 99000,
      perPersonAmountCents: 20000,
      paddleBasePriceId: null,
      paddlePerPersonPriceId: null,
      currency: 'cny',
      features: JSON.stringify(['最多等于开通人数', '全部应用', '全部功能', '优先支持', '年付享 8.3 折']),
      sortOrder: 2,
    },
  });

  const enterpriseYearly = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-enterprise-yearly' },
    update: {
      baseAmountCents: 299000,
      perPersonAmountCents: 50000,
      currency: 'cny',
      features: JSON.stringify(['不限成员', '全部应用', '全部功能', 'AI 使用次数提升（后续上线）', 'SaaS 业务数据统计（后续上线）', '更多自动化流程（后续上线）', '专属客户经理', 'SLA 保障']),
    },
    create: {
      id: 'plan-enterprise-yearly',
      name: 'Enterprise (年付)',
      billingPeriod: 'yearly',
      baseAmountCents: 299000,
      perPersonAmountCents: 50000,
      paddleBasePriceId: null,
      paddlePerPersonPriceId: null,
      currency: 'cny',
      features: JSON.stringify(['不限成员', '全部应用', '全部功能', 'AI 使用次数提升（后续上线）', 'SaaS 业务数据统计（后续上线）', '更多自动化流程（后续上线）', '专属客户经理', 'SLA 保障']),
      sortOrder: 3,
    },
  });

  console.log('Plans seeded:', freePlan.name, proMonthly.name, proYearly.name, enterpriseYearly.name);

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
    { name: 'CRM', key: 'crm', description: 'Customer relationship management — track leads, deals, and contacts', iconUrl: null, isGeneral: true, isFeatured: true, isPaid: true, industries: [], sortOrder: 0, modules: [
      { name: 'Leads', key: 'leads', description: 'Manage and track sales leads' },
      { name: 'Contacts', key: 'contacts', description: 'Customer contact directory' },
      { name: 'Deals', key: 'deals', description: 'Sales pipeline and deal tracking' },
      { name: 'Reports', key: 'reports', description: 'Sales analytics and reports' },
    ]},
    { name: 'HR', key: 'hr', description: 'Human resources — employee records, attendance, and onboarding', iconUrl: null, isGeneral: true, isFeatured: true, isPaid: false, industries: [], sortOrder: 1, modules: [
      { name: 'Employees', key: 'employees', description: 'Employee directory and profiles' },
      { name: 'Attendance', key: 'attendance', description: 'Time tracking and attendance records' },
      { name: 'Onboarding', key: 'onboarding', description: 'New hire onboarding workflows' },
    ]},
    { name: 'Project Management', key: 'projects', description: 'Project management — tasks, timelines, and team collaboration', iconUrl: null, isGeneral: true, isFeatured: true, isPaid: false, industries: [], sortOrder: 2, modules: [
      { name: 'Tasks', key: 'tasks', description: 'Task management and assignment' },
      { name: 'Timeline', key: 'timeline', description: 'Project timeline and Gantt charts' },
      { name: 'Team', key: 'team', description: 'Team collaboration and communication' },
      { name: 'Docs', key: 'docs', description: 'Project documentation and wiki' },
    ]},
    { name: 'E-commerce', key: 'ecommerce', description: 'E-commerce platform — products, orders, and inventory management', iconUrl: null, isGeneral: false, isFeatured: true, isPaid: true, industries: ['电子商务/B2C/综合电商', '电子商务/D2C/独立站'], sortOrder: 3, modules: [
      { name: 'Products', key: 'products', description: 'Product catalog management' },
      { name: 'Orders', key: 'orders', description: 'Order processing and fulfillment' },
      { name: 'Inventory', key: 'inventory', description: 'Stock and warehouse management' },
    ]},
    { name: 'Online Education', key: 'edu', description: 'Online education — course creation, student management, and assessments', iconUrl: null, isGeneral: false, isFeatured: true, isPaid: true, industries: ['教育/在线教育/K12', '教育/在线教育/职业教育'], sortOrder: 4, modules: [
      { name: 'Courses', key: 'courses', description: 'Course creation and curriculum design' },
      { name: 'Students', key: 'students', description: 'Student enrollment and progress tracking' },
      { name: 'Assessments', key: 'assessments', description: 'Quizzes, exams, and grading' },
    ]},
    { name: 'Healthcare', key: 'healthcare', description: 'Healthcare management — patient records, appointments, and prescriptions', iconUrl: null, isGeneral: false, isFeatured: false, isPaid: true, industries: ['医疗/医疗信息化/电子病历', '医疗/互联网医疗/在线问诊'], sortOrder: 5, modules: [
      { name: 'Patients', key: 'patients', description: 'Patient records and history' },
      { name: 'Appointments', key: 'appointments', description: 'Scheduling and calendar management' },
    ]},
    { name: 'FinTech', key: 'fintech', description: 'Financial technology — risk assessment, lending, and compliance', iconUrl: null, isGeneral: false, isFeatured: false, isPaid: true, industries: ['金融/金融科技/支付', '金融/金融科技/风控'], sortOrder: 6, modules: [
      { name: 'Risk', key: 'risk', description: 'Risk assessment and scoring' },
      { name: 'Compliance', key: 'compliance', description: 'Regulatory compliance tracking' },
    ]},
    { name: 'Demo App', key: 'demo', description: 'Default demo application for testing platform features', iconUrl: null, isGeneral: true, isFeatured: false, isPaid: false, industries: [], sortOrder: 99, modules: [
      { name: 'Dashboard', key: 'dashboard', description: 'Overview and analytics' },
      { name: 'Settings', key: 'settings', description: 'Application configuration' },
    ]},
    { name: 'XC-AiReader', key: 'xc-aireader', description: 'AI-powered novel reader with translation support', iconUrl: null, isGeneral: true, isFeatured: true, isPaid: false, industries: [], sortOrder: 10, modules: [
      { name: 'Reader', key: 'reader', description: 'Read novels and manage favorites' },
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
        isPaid: appDef.isPaid,
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
        isPaid: appDef.isPaid,
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

  // ======== Reader App 种子数据 ========

  // --- 示例小说 ---
  const novelSeeds = [
    {
      title: '星辰变',
      author: '我吃西红柿',
      description: '一部修真玄幻小说，讲述了一个少年从凡人到宇宙之主的成长历程。星辰变功法，逆转乾坤，掌控星辰之力。',
      category: '玄幻',
      status: 'COMPLETED',
      sourceType: 'UPLOAD',
      isFeatured: true,
      sortOrder: 1,
      chapters: [
        { chapterIndex: 1, title: '第一章 秦羽', content: '秦羽睁开眼，发现自己躺在一张木床上...这是一个修炼的世界，强者为王。他暗暗发誓，一定要成为强者，保护自己在意的人。', wordCount: 1200 },
        { chapterIndex: 2, title: '第二章 星辰诀', content: '秦羽意外获得了一本上古秘籍《星辰诀》。这本功法以星辰之力淬炼肉身，修炼到极致可化身星辰，不死不灭。', wordCount: 1100 },
        { chapterIndex: 3, title: '第三章 初入修炼', content: '在师傅的指导下，秦羽开始了艰苦的修炼之路。每天天不亮就起床打坐，吸收天地灵气，淬炼经脉。', wordCount: 1050 },
      ],
    },
    {
      title: '全职高手',
      author: '蝴蝶蓝',
      description: '网游竞技小说的巅峰之作，讲述电竞选手叶修被俱乐部驱逐后，在网吧重新开始，重返荣耀巅峰的传奇故事。',
      category: '游戏',
      status: 'COMPLETED',
      sourceType: 'UPLOAD',
      isFeatured: true,
      sortOrder: 2,
      chapters: [
        { chapterIndex: 1, title: '第一章 被驱逐的高手', content: '叶修站在嘉世俱乐部门口，手里拿着解约书。被称为「荣耀教科书」的他，竟然也有被扫地出门的一天。', wordCount: 1300 },
        { chapterIndex: 2, title: '第二章 兴欣网吧', content: '叶修来到了兴欣网吧，遇到了老板陈果。他决定在这里重新开始，用新号「君莫笑」再战荣耀。', wordCount: 1250 },
      ],
    },
    {
      title: '三体',
      author: '刘慈欣',
      description: '中国科幻文学的里程碑之作，讲述了地球文明与三体文明的信息交流、生死搏杀，以及宇宙中的黑暗森林法则。',
      category: '科幻',
      status: 'COMPLETED',
      sourceType: 'UPLOAD',
      isFeatured: false,
      sortOrder: 3,
      chapters: [
        { chapterIndex: 1, title: '第一章 科学边界', content: '汪淼被邀请加入一个名为「科学边界」的组织。全球的科学家们正面临一个诡异的现象——物理学似乎不存在了。', wordCount: 1500 },
      ],
    },
  ];

  for (const ns of novelSeeds) {
    const { chapters, ...novelData } = ns;
    const novel = await prisma.novel.upsert({
      where: { id: `novel-${ns.title}` },
      update: { ...novelData },
      create: { id: `novel-${ns.title}`, ...novelData },
    });

    for (const ch of chapters) {
      await prisma.chapter.upsert({
        where: { novelId_chapterIndex: { novelId: novel.id, chapterIndex: ch.chapterIndex } },
        update: ch,
        create: { ...ch, novelId: novel.id },
      });
    }

    // Update wordCount from chapters
    const totalWords = await prisma.chapter.aggregate({
      where: { novelId: novel.id },
      _sum: { wordCount: true },
    });
    await prisma.novel.update({
      where: { id: novel.id },
      data: { wordCount: totalWords._sum.wordCount ?? 0 },
    });
  }
  console.log(`${novelSeeds.length} novels with chapters seeded`);

  // --- Reader Banners ---
  const readerBannerDefs = [
    { title: '热门推荐 - 星辰变', imageUrl: '/banners/banner-1.jpg', sortOrder: 0, isActive: true },
    { title: '新书上线 - 全职高手', imageUrl: '/banners/banner-2.jpg', sortOrder: 1, isActive: true },
    { title: '科幻必读 - 三体', imageUrl: '/banners/banner-3.jpg', sortOrder: 2, isActive: true },
  ];

  for (const bDef of readerBannerDefs) {
    await prisma.readerBanner.create({
      data: bDef,
    });
  }
  console.log(`${readerBannerDefs.length} reader banners seeded`);

  // --- 默认翻译配置（未激活，等待配置 API Key） ---
  const translatorSeeds = [
    { id: 'translator-deepl', provider: 'DEEPL', name: 'DeepL 翻译', apiKey: '', apiEndpoint: 'https://api-free.deepl.com/v2/translate', priority: 0, isActive: false },
    { id: 'translator-google', provider: 'GOOGLE', name: 'Google 翻译', apiKey: '', apiEndpoint: 'https://translation.googleapis.com/language/translate/v2', priority: 1, isActive: false },
  ];

  for (const tDef of translatorSeeds) {
    await prisma.translationConfig.upsert({
      where: { id: tDef.id },
      update: {},
      create: tDef,
    });
  }
  console.log(`${translatorSeeds.length} translation configs seeded`);

  // --- Reader 权限分配给测试组织 ---
  const readerPermIds = modulePermissionMap['xc-aireader.reader'] || [];
  // Owner: manage reader
  for (const permId of readerPermIds) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: ownerRole.id, permissionId: permId } },
      update: {},
      create: { roleId: ownerRole.id, permissionId: permId },
    });
  }
  // Admin: read reader
  const readerAdminPermIds = readerPermIds.filter((_, i) => i === 1);
  for (const permId of readerAdminPermIds) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permId } },
      update: {},
      create: { roleId: adminRole.id, permissionId: permId },
    });
  }
  // Member: read reader
  for (const permId of readerAdminPermIds) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: memberRole.id, permissionId: permId } },
      update: {},
      create: { roleId: memberRole.id, permissionId: permId },
    });
  }
  console.log('Reader RBAC permissions seeded');

  console.log('');
  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
