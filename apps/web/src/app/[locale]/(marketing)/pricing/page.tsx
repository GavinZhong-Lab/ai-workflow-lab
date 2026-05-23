/**
 * 定价展示页 — 公开访问，数据驱动
 * 价格和功能从 API 读取，Paddle 改价后只需更新数据库，无需改代码
 */
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Minus } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';
import { api } from '@/lib/api';

interface Plan {
  id: string;
  name: string;
  billingPeriod: string | null;
  baseAmountCents: number;
  perPersonAmountCents: number;
  currency: string;
  features: string[];
  sortOrder: number;
}

function formatPrice(cents: number): string {
  if (cents === 0) return '¥0';
  const yuan = cents / 100;
  return `¥${yuan.toLocaleString()}`;
}

function formatPeriod(period: string | null, t: (k: string) => string): string {
  if (!period) return '';
  return period === 'monthly' ? t('perMonth') : t('perYear');
}

function formatPerPerson(period: string | null, t: (k: string) => string): string {
  if (!period) return '';
  return period === 'monthly' ? t('perPersonMonth') : t('perPersonYear');
}

const ALL_FEATURE_KEYS = [
  'freeApps',
  'paidApps',
  'trialDays',
  'maxMembers',
  'maxApps',
  'aiUsage',
  'dataStats',
  'prioritySupport',
  'dedicatedManager',
];

export default function PricingPage() {
  const t = useTranslations('pricing');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ code: number; data: Plan[] }>('/api/v1/subscriptions/plans')
      .then((res) => {
        // res.data is the array directly
        const list = Array.isArray(res.data) ? res.data : [];
        const parsed = list.map((p: Plan) => ({
          ...p,
          features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features || [],
        }));
        setPlans(parsed);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-[rgb(var(--color-text))] mb-3">
          {t('title')}
        </h1>
        <p className="text-[rgb(var(--color-text-muted))] text-lg">{t('subtitle')}</p>
      </motion.div>

      {/* Plan cards */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-3 mb-16">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-[rgb(var(--color-border))] p-6 animate-pulse">
              <div className="h-6 w-20 bg-[rgb(var(--color-border))] rounded mb-2" />
              <div className="h-8 w-16 bg-[rgb(var(--color-border))] rounded mb-4" />
              <div className="h-4 w-full bg-[rgb(var(--color-border))] rounded mb-2" />
              <div className="h-4 w-3/4 bg-[rgb(var(--color-border))] rounded mb-6" />
              <div className="h-10 w-full bg-[rgb(var(--color-accent))/20] rounded" />
            </div>
          ))}
        </div>
      ) : plans.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid gap-6 md:grid-cols-3 mb-16"
        >
          {plans.map((plan) => {
            const isFree = !plan.billingPeriod;
            const planKey = plan.id.replace('plan-', '').replace(/-/g, '');

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 flex flex-col ${
                  planKey === 'proMonthly'
                    ? 'border-[rgb(var(--color-accent))/30] bg-[rgb(var(--color-accent))/5]'
                    : 'border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]'
                }`}
              >
                {planKey === 'proMonthly' && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[rgb(var(--color-accent))] text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Popular
                  </span>
                )}

                <h3 className="text-lg font-semibold text-[rgb(var(--color-text))] mb-1">
                  {t(`plans.${planKey}`)}
                </h3>
                <p className="text-xs text-[rgb(var(--color-text-muted))] mb-4 capitalize">
                  {plan.billingPeriod ? plan.billingPeriod : 'Forever free'}
                </p>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-3xl font-bold text-[rgb(var(--color-text))]">
                    {formatPrice(plan.baseAmountCents)}
                  </span>
                  <span className="text-[rgb(var(--color-text-muted))] text-sm ml-1">
                    {formatPeriod(plan.billingPeriod, t)}
                  </span>
                  {plan.perPersonAmountCents > 0 && (
                    <p className="text-sm text-[rgb(var(--color-text-muted))] mt-1">
                      + {formatPrice(plan.perPersonAmountCents)}
                      {formatPerPerson(plan.billingPeriod, t)}
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6 flex-1">
                  {(plan.features as string[]).map((feat: string, j: number) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-[rgb(var(--color-text-muted))]">
                      <Check className="w-4 h-4 text-[rgb(var(--color-accent))] mt-0.5 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isFree
                      ? 'border border-[rgb(var(--color-border))] text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:border-[rgb(var(--color-border))]'
                      : 'bg-[rgb(var(--color-accent))] text-white hover:bg-[rgb(var(--color-accent-hover))]'
                  }`}
                >
                  {isFree ? t('ctaStart') : t('ctaSubscribe')}
                </button>
              </div>
            );
          })}
        </motion.div>
      ) : null}

      {/* Feature comparison table */}
      {!loading && plans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="overflow-x-auto"
        >
          <h2 className="text-2xl font-bold text-[rgb(var(--color-text))] text-center mb-8">
            {t('featureComparison')}
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(var(--color-border))]">
                <th className="text-left py-3 px-4 text-[rgb(var(--color-text-muted))] font-medium w-40" />
                {plans.map((plan) => {
                  const planKey = plan.id.replace('plan-', '').replace(/-/g, '');
                  return (
                    <th key={plan.id} className="py-3 px-4 text-center text-[rgb(var(--color-text))] font-semibold">
                      {t(`plans.${planKey}`)}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ALL_FEATURE_KEYS.map((key) => (
                <tr key={key} className="border-b border-[rgb(var(--color-border))/50]">
                  <td className="py-3 px-4 text-[rgb(var(--color-text-muted))]">{t(`features.${key}`)}</td>
                  {plans.map((plan) => {
                    const features = plan.features as string[];
                    const has = features.some((f: string) =>
                      f.toLowerCase().includes(key.toLowerCase())
                    );
                    return (
                      <td key={plan.id} className="py-3 px-4 text-center">
                        {has ? (
                          <Check className="w-4 h-4 text-[rgb(var(--color-accent))] inline" />
                        ) : (
                          <Minus className="w-4 h-4 text-[rgb(var(--color-border))] inline" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
