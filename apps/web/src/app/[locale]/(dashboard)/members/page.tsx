/**
 * Members 成员管理页面
 * 展示成员列表、邀请成员、修改角色、移除成员
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from '@/hooks/use-translations';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

interface Member {
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  roleId: string;
  roleName: string;
  joinedAt: string;
}

interface Role {
  id: string;
  name: string;
}

export default function MembersPage() {
  const t = useTranslations('members');
  const tc = useTranslations('common');
  const orgId = useAuthStore((s) => s.orgId);
  const setOrgId = useAuthStore((s) => s.setOrgId);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 如果没有 orgId，自动获取
  useEffect(() => {
    if (orgId) return;
    api.get<{ code: number; data: { list: { id: string }[] } }>('/api/v1/users/me/organizations')
      .then((res) => {
        if (res.data?.list?.length > 0) {
          setOrgId(res.data.list[0].id);
        }
      })
      .catch(() => {});
  }, [orgId, setOrgId]);

  // Invite dialog
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState('');

  const fetchMembers = useCallback(async () => {
    if (!orgId) return;
    try {
      const res = await api.get<{ code: number; data: { list: Member[] } }>(
        `/api/v1/organizations/${orgId}/members`,
      );
      setMembers(res.data?.list || []);
    } catch {
      setError(tc('error'));
    }
  }, [orgId, tc]);

  const fetchRoles = useCallback(async () => {
    if (!orgId) return;
    try {
      const res = await api.get<{ code: number; data: { list: Role[] } }>(
        `/api/v1/permissions/orgs/${orgId}/roles`,
      );
      const roleList = res.data?.list || [];
      setRoles(roleList);
      if (roleList.length > 0 && !inviteRoleId) {
        setInviteRoleId(roleList[0].id);
      }
    } catch {
      // ignore
    }
  }, [orgId, inviteRoleId]);

  useEffect(() => {
    if (!orgId) return;
    async function init() {
      setLoading(true);
      await Promise.all([fetchMembers(), fetchRoles()]);
      setLoading(false);
    }
    init();
  }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteRoleId) return;
    setInviting(true);
    setMessage('');
    try {
      await api.post(`/api/v1/organizations/${orgId}/members`, {
        email: inviteEmail.trim(),
        roleId: inviteRoleId,
      });
      setMessage(t('memberInvited'));
      setInviteEmail('');
      setShowInvite(false);
      await fetchMembers();
    } catch (e: unknown) {
      const err = e as { message?: string };
      setMessage(err.message || tc('error'));
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (memberUserId: string, newRoleId: string) => {
    try {
      await api.patch(`/api/v1/organizations/${orgId}/members/${memberUserId}`, {
        roleId: newRoleId,
      });
      setMessage(t('roleUpdated'));
      await fetchMembers();
    } catch {
      setMessage(tc('error'));
    }
  };

  const handleRemove = async (memberUserId: string) => {
    if (!window.confirm(t('removeConfirm'))) return;
    try {
      await api.delete(`/api/v1/organizations/${orgId}/members/${memberUserId}`);
      setMessage(t('memberRemoved'));
      await fetchMembers();
    } catch {
      setMessage(tc('error'));
    }
  };

  const getRoleBadgeClass = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'owner':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'admin':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      default:
        return 'bg-ink-500/15 text-ink-400 border-ink-500/30';
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      {/* 页头 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-[rgb(var(--color-text))]">{t('title')}</h1>
          <p className="mt-2 text-[rgb(var(--color-text-muted))]">{t('description')}</p>
        </div>
        <button
          type="button"
          className="btn-primary text-sm self-start"
          onClick={() => setShowInvite(true)}
        >
          {t('invite')}
        </button>
      </div>

      {/* 消息提示 */}
      {message && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-3 rounded-lg bg-amber-500/10 text-amber-400 text-sm border border-amber-500/20"
        >
          {message}
        </motion.div>
      )}

      {/* 成员列表 */}
      <div className="mt-6">
        {loading ? (
          <div className="glass-surface p-8 text-center text-[rgb(var(--color-text-muted))]">
            {tc('loading')}
          </div>
        ) : error ? (
          <div className="glass-surface p-8 text-center">
            <p className="text-red-400">{error}</p>
            <button
              type="button"
              className="mt-3 text-sm text-amber-500 hover:underline"
              onClick={() => { setError(''); fetchMembers(); }}
            >
              {tc('retry')}
            </button>
          </div>
        ) : members.length === 0 ? (
          <div className="glass-surface p-8 text-center text-[rgb(var(--color-text-muted))]">
            {t('noMembers')}
          </div>
        ) : (
          <div className="glass-surface overflow-hidden">
            {/* 表头 */}
            <div className="hidden sm:grid grid-cols-[1fr_1.5fr_1fr_80px] gap-4 px-6 py-3 border-b border-[rgb(var(--color-border))] text-xs font-medium text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
              <span>{t('name')}</span>
              <span>{t('email')}</span>
              <span>{t('role')}</span>
              <span>{t('actions')}</span>
            </div>

            {/* 成员行 */}
            {members.map((member, i) => {
              const isCurrentUser = member.userId === currentUserId;
              const isOwner = member.roleName.toLowerCase() === 'owner';
              return (
                <motion.div
                  key={member.userId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col sm:grid sm:grid-cols-[1fr_1.5fr_1fr_80px] gap-2 sm:gap-4 px-6 py-4 border-b border-[rgb(var(--color-border))] last:border-b-0 hover:bg-[rgb(var(--color-surface))/0.5] transition-colors"
                >
                  {/* 姓名 + 头像 */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ink-600 to-ink-700 flex items-center justify-center text-xs font-medium text-ink-300 ring-1 ring-ink-700 shrink-0">
                      {(member.name?.[0] || member.email[0]).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-[rgb(var(--color-text))] truncate">
                      {member.name || '—'}
                    </span>
                  </div>

                  {/* 邮箱 */}
                  <div className="flex items-center text-sm text-[rgb(var(--color-text-muted))] truncate sm:pl-0 pl-11">
                    {member.email}
                  </div>

                  {/* 角色 Badge + 选择器 */}
                  <div className="flex items-center gap-2 sm:pl-0 pl-11">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${getRoleBadgeClass(member.roleName)}`}
                    >
                      {member.roleName}
                    </span>
                    {!isOwner && (
                      <select
                        value={member.roleId}
                        onChange={(e) => handleChangeRole(member.userId, e.target.value)}
                        className="text-xs bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded px-1.5 py-0.5 text-[rgb(var(--color-text))] focus:outline-none focus:border-amber-500"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* 操作 */}
                  <div className="flex items-center sm:pl-0 pl-11">
                    {!isCurrentUser && !isOwner && (
                      <button
                        type="button"
                        onClick={() => handleRemove(member.userId)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        {t('remove')}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* 邀请弹窗 */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowInvite(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative glass-surface p-6 w-full max-w-md mx-4"
          >
            <h2 className="font-display text-xl text-[rgb(var(--color-text))]">
              {t('inviteTitle')}
            </h2>
            <p className="mt-1 text-sm text-[rgb(var(--color-text-muted))]">
              {t('inviteDesc')}
            </p>

            <div className="mt-4 space-y-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder={t('email')}
                className="input-field w-full"
              />
              <select
                value={inviteRoleId}
                onChange={(e) => setInviteRoleId(e.target.value)}
                className="input-field w-full"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex gap-3 justify-end">
              <button
                type="button"
                className="px-4 py-2.5 rounded-lg border border-[rgb(var(--color-border))] text-sm font-medium text-[rgb(var(--color-text-muted))] hover:bg-ink-800/30 transition-colors"
                onClick={() => setShowInvite(false)}
              >
                {tc('cancel')}
              </button>
              <button
                type="button"
                className="btn-primary text-sm"
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
              >
                {inviting ? tc('saving') : t('inviteButton')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
