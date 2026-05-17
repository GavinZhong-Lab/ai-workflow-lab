/**
 * Dashboard 页面
 * 从后端获取真实数据，展示统计卡片和快速入门引导
 */
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from '@/hooks/use-translations';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

interface OrgInfo {
  id: string;
  name: string;
  slug: string;
  roleName: string;
}

interface MemberData {
  list: { userId: string }[];
}

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const fadeSlide = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const user = useAuthStore((s) => s.user);
  const orgId = useAuthStore((s) => s.orgId);
  const setOrgId = useAuthStore((s) => s.setOrgId);

  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // 获取用户所属组织
        const orgsRes = await api.get<{
          code: number;
          data: { list: OrgInfo[] };
        }>('/api/v1/users/me/organizations');

        const orgs = orgsRes.data?.list || [];
        if (orgs.length > 0) {
          const primary = orgs[0];
          setOrg(primary);

          // 设置 orgId 到 store（如果尚未设置）
          if (!orgId) {
            setOrgId(primary.id);
          }

          // 获取成员数量
          const membersRes = await api.get<{
            code: number;
            data: MemberData;
          }>(`/api/v1/organizations/${primary.id}/members`);

          setMemberCount(membersRes.data?.list?.length ?? 0);
        }
      } catch {
        // 静默失败，显示占位值
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = [
    { label: t('totalUsers'), value: loading ? '—' : String(memberCount ?? '—') },
    { label: t('activeProjects'), value: '1' },
    { label: t('orgName'), value: org?.name || '—' },
    { label: t('plan'), value: 'Free' },
  ];

  return (
    <motion.div variants={stagger} initial="initial" animate="animate">
      <motion.div variants={fadeSlide}>
        <h1 className="font-display text-3xl text-[rgb(var(--color-text))]">
          {t('title')}
        </h1>
        <p className="mt-2 text-[rgb(var(--color-text-muted))]">
          {t('welcome')}{user?.name || user?.email}。{t('overview')}
        </p>
      </motion.div>

      {/* 统计卡片 */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8"
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={fadeSlide}
            className="glass-surface p-5 hover:border-amber-500/20 transition-all duration-300"
          >
            <p className="text-sm text-[rgb(var(--color-text-muted))] font-medium">
              {stat.label}
            </p>
            <p className="mt-2 font-display text-2xl text-[rgb(var(--color-text))]">
              {stat.value}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* 快速入门卡片 */}
      <motion.div variants={fadeSlide} className="mt-8 glass-surface p-8">
        <h2 className="font-display text-xl text-[rgb(var(--color-text))]">
          {t('gettingStarted')}
        </h2>
        <p className="mt-2 text-[rgb(var(--color-text-muted))]">
          {t('gettingStartedDesc')}
        </p>
        <div className="mt-6 flex gap-3">
          <button type="button" className="btn-primary text-sm">
            {t('createApp')}
          </button>
          <button
            type="button"
            className="px-4 py-2.5 rounded-lg border border-[rgb(var(--color-border))] text-[rgb(var(--color-text-muted))] text-sm font-medium hover:bg-ink-800/30 transition-colors"
          >
            {t('viewDocs')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
