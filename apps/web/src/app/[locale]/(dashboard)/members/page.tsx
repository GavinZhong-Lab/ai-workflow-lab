/**
 * Members 页面（占位）
 * 后续实现组织成员管理和邀请流程
 */
'use client';

import { motion } from 'framer-motion';

export default function MembersPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-display text-3xl text-white">Members</h1>
      <p className="mt-2 text-ink-400">Manage team members and their roles.</p>
      <div className="mt-8 glass-surface p-8 text-center">
        <p className="text-ink-500">
          Member management will be available once you set up your organization.
        </p>
      </div>
    </motion.div>
  );
}
