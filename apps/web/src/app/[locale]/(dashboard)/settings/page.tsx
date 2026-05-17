/**
 * Settings 页面（占位）
 * 后续实现账户设置、组织配置
 */
'use client';

import { motion } from 'framer-motion';

export default function SettingsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-display text-3xl text-white">Settings</h1>
      <p className="mt-2 text-ink-400">Manage your account and organization settings.</p>
      <div className="mt-8 glass-surface p-8 text-center">
        <p className="text-ink-500">Settings panel coming soon.</p>
      </div>
    </motion.div>
  );
}
