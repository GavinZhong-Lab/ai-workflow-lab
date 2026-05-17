/**
 * Billing 页面（占位）
 * 后续实现 Stripe 订阅管理和发票展示
 */
'use client';

import { motion } from 'framer-motion';

export default function BillingPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-display text-3xl text-white">Billing</h1>
      <p className="mt-2 text-ink-400">Manage your subscription and payment methods.</p>
      <div className="mt-8 glass-surface p-8 text-center">
        <p className="text-ink-500">Subscription management coming soon.</p>
      </div>
    </motion.div>
  );
}
