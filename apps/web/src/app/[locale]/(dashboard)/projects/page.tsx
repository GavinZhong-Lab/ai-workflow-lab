/**
 * Projects 页面（占位）
 * 后续实现项目和应用的完整管理界面
 */
'use client';

import { motion } from 'framer-motion';

export default function ProjectsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-display text-3xl text-white">Projects</h1>
      <p className="mt-2 text-ink-400">Manage your projects and applications.</p>
      <div className="mt-8 glass-surface p-8 text-center">
        <p className="text-ink-500">
          No projects yet. Create your first application to get started.
        </p>
      </div>
    </motion.div>
  );
}
