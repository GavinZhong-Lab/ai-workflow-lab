import type { Prisma } from '@prisma/client';

type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';

/** Owner 角色：所有模块的 manage 权限 */
const OWNER_PERMS: [string, Action][] = [
  ['dashboard', 'manage'],
  ['projects', 'manage'],
  ['settings', 'manage'],
  ['members', 'manage'],
  ['organization', 'manage'],
];

/** Admin 角色：members CRUD + 其他模块只读 */
const ADMIN_PERMS: [string, Action][] = [
  ['members', 'create'],
  ['members', 'read'],
  ['members', 'update'],
  ['members', 'delete'],
  ['organization', 'read'],
  ['organization', 'update'],
  ['dashboard', 'read'],
  ['projects', 'read'],
  ['settings', 'read'],
];

/** Member 角色：所有模块只读 */
const MEMBER_PERMS: [string, Action][] = [
  ['members', 'read'],
  ['organization', 'read'],
  ['dashboard', 'read'],
  ['projects', 'read'],
  ['settings', 'read'],
];

interface CreatedRoles {
  ownerRoleId: string;
  adminRoleId: string;
  memberRoleId: string;
}

/**
 * 为新创建的角色分配默认 RBAC 权限。
 * 权限分配与 prisma/seed.ts 保持一致。
 * 必须在事务中调用，传入事务 client。
 */
export async function assignDefaultPermissions(
  tx: Prisma.TransactionClient,
  roles: CreatedRoles,
) {
  const permissions = await tx.permission.findMany({
    include: { module: { select: { key: true } } },
  });

  // 按 moduleKey -> action -> permissionId 组织
  const permMap: Record<string, Record<string, string>> = {};
  for (const perm of permissions) {
    if (!permMap[perm.module.key]) permMap[perm.module.key] = {};
    permMap[perm.module.key][perm.action] = perm.id;
  }

  const data: { roleId: string; permissionId: string }[] = [];

  for (const entry of [
    { roleId: roles.ownerRoleId, perms: OWNER_PERMS },
    { roleId: roles.adminRoleId, perms: ADMIN_PERMS },
    { roleId: roles.memberRoleId, perms: MEMBER_PERMS },
  ]) {
    for (const [moduleKey, action] of entry.perms) {
      const permId = permMap[moduleKey]?.[action];
      if (permId) {
        data.push({ roleId: entry.roleId, permissionId: permId });
      }
    }
  }

  if (data.length > 0) {
    await tx.rolePermission.createMany({ data });
  }
}
