/**
 * Dashboard 页面
 * 显示统计卡片和快速入门引导
 * 使用 stagger + fadeSlide 动画序列
 */
'use client';

import { motion } from 'framer-motion';

/** 父级 stagger 容器 */
const stagger = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

/** 子级淡入上滑动画 */
const fadeSlide = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const stats = [
    { label: 'Total Users', value: '—', change: null },
    { label: 'Active Projects', value: '—', change: null },
    { label: 'API Calls', value: '—', change: null },
    { label: 'Uptime', value: '—', change: null },
  ] as const;

  return (
    <motion.div variants={stagger} initial="initial" animate="animate">
      <motion.div variants={fadeSlide}>
        <h1 className="font-display text-3xl text-white">Dashboard</h1>
        <p className="mt-2 text-ink-400">
          Welcome back. Here&apos;s an overview of your platform.
        </p>
      </motion.div>

      {/* 统计卡片网格 */}
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
            <p className="text-sm text-ink-400 font-medium">{stat.label}</p>
            <p className="mt-2 font-display text-2xl text-white">{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* 快速入门卡片 */}
      <motion.div variants={fadeSlide} className="mt-8 glass-surface p-8">
        <h2 className="font-display text-xl text-white">Getting Started</h2>
        <p className="mt-2 text-ink-400">
          Set up your first application to start exploring the platform capabilities.
        </p>
        <div className="mt-6 flex gap-3">
          <button type="button" className="btn-primary text-sm">
            Create Application
          </button>
          <button
            type="button"
            className="px-4 py-2.5 rounded-lg border border-ink-700 text-ink-300 text-sm font-medium hover:bg-ink-800/30 transition-colors"
          >
            View Docs
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
