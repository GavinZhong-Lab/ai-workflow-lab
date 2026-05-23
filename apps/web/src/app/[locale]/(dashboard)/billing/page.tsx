'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Check, Clock, Users, Building2, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { openPaddleCheckout } from '@/lib/paddle';
import { useTranslations } from '@/hooks/use-translations';

interface Plan {
  id: string;
  name: string;
  billingPeriod: string | null;
  baseAmountCents: number;
  perPersonAmountCents: number;
  currency: string;
  features: unknown;
  sortOrder: number;
}

interface SubInfo {
  id: string;
  planName: string;
  status: string;
  employeeCount: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  canceledAt: string | null;
}

interface TrialInfo {
  isInTrial: boolean;
  trialEndsAt: string;
  daysRemaining: number;
}

interface PaymentItem {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-[rgb(var(--color-border))/60] ${className}`} />;
}

function BillingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function BillingPage() {
  const t = useTranslations('dashboard');
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subInfo, setSubInfo] = useState<SubInfo | null>(null);
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [employeeCount, setEmployeeCount] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [plansRes, subRes, paymentsRes] = await Promise.all([
        api.get<{ code: number; data: Plan[] }>('/api/v1/subscriptions/plans'),
        api.get<{ code: number; data: { subscription: SubInfo | null; trialInfo: TrialInfo | null } }>('/api/v1/subscriptions/current'),
        api.get<{ code: number; data: { payments: PaymentItem[] } }>('/api/v1/subscriptions/payments?limit=10'),
      ]);

      if (plansRes.code === 0) setPlans(plansRes.data);
      if (subRes.code === 0) {
        setSubInfo(subRes.data.subscription);
        setTrialInfo(subRes.data.trialInfo);
        if (subRes.data.subscription?.employeeCount) {
          setEmployeeCount(subRes.data.subscription.employeeCount);
        }
      }
      if (paymentsRes.code === 0) setPayments(paymentsRes.data.payments);
    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCheckout = async (planId: string) => {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await api.post<{
        code: number;
        data: { checkoutUrl: string; transactionId: string } | null;
        message: string;
      }>('/api/v1/subscriptions/checkout', { planId, employeeCount });
      if (res.code === 0 && res.data?.transactionId) {
        const checkoutResult = await openPaddleCheckout(res.data.transactionId);
        if (checkoutResult.status === 'completed') {
          try {
            await api.post('/api/v1/subscriptions/sync', { transactionId: res.data.transactionId });
          } catch (syncErr: any) {
            console.error('Sync failed:', syncErr?.message || syncErr);
            // Continue to refresh — webhook may have processed it
          }
        }
        // Always refresh after checkout closes
        await fetchData();
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to create checkout' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to create checkout' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setSubmitting(true);
    try {
      const res = await api.post<{ code: number; message: string }>('/api/v1/subscriptions/cancel');
      if (res.code === 0) {
        setMessage({ type: 'success', text: 'Subscription canceled' });
        fetchData();
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to cancel' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatCents = (cents: number) => `¥${(cents / 100).toFixed(2)}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('zh-CN');
  const calcTotal = (plan: Plan) => plan.baseAmountCents + employeeCount * plan.perPersonAmountCents;

  if (loading) return <BillingSkeleton />;

  const currentPlanId = subInfo?.planName;
  const isFree = !subInfo || plans.find((p) => p.name === subInfo.planName)?.name === 'Free';

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CreditCard className="w-6 h-6 text-amber-500" />
        <h1 className="font-display text-2xl text-[rgb(var(--color-text))]">{t('plan')}</h1>
      </div>

      {/* Trial Status — only show when no active subscription */}
      {trialInfo && !subInfo && (
        <div className={`rounded-xl border p-4 ${trialInfo.isInTrial ? 'border-amber-500/30 bg-amber-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
          <div className="flex items-center gap-2">
            <Clock className={`w-5 h-5 ${trialInfo.isInTrial ? 'text-amber-500' : 'text-red-500'}`} />
            <span className="text-sm font-medium text-[rgb(var(--color-text))]">
              {trialInfo.isInTrial
                ? `7 天试用中 — 剩余 ${trialInfo.daysRemaining} 天（${formatDate(trialInfo.trialEndsAt)} 到期）`
                : '试用已到期，付费应用已锁定。请升级套餐以继续使用。'}
            </span>
          </div>
        </div>
      )}

      {/* Current Subscription */}
      {subInfo && (
        <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--color-text-muted))]">当前套餐</p>
              <p className="font-display text-xl text-[rgb(var(--color-text))]">{subInfo.planName}</p>
              <p className="text-sm text-[rgb(var(--color-text-muted))] mt-1">
                {subInfo.status === 'active' ? '已激活' : subInfo.status} · {subInfo.employeeCount} 人
                {' · '}{formatDate(subInfo.currentPeriodStart)} ~ {formatDate(subInfo.currentPeriodEnd)}
              </p>
            </div>
            {!isFree && (
              <button onClick={handleCancel} disabled={submitting} className="px-4 py-2 rounded-lg border border-red-500/30 text-red-500 text-sm hover:bg-red-500/10 disabled:opacity-50 transition-colors">
                取消订阅
              </button>
            )}
          </div>
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans
          .filter((p) => p.name !== 'Free')
          .map((plan, idx) => {
            const features: string[] = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features as unknown as string[]) || [];
            const total = calcTotal(plan);
            const isCurrent = currentPlanId === plan.name;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`rounded-xl border p-6 relative ${
                  plan.name.toLowerCase().includes('enterprise')
                    ? 'border-purple-500/30 bg-gradient-to-b from-purple-500/5 to-transparent'
                    : isCurrent
                      ? 'border-amber-500/50 bg-amber-500/5'
                      : 'border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]'
                }`}
              >
                {isCurrent && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-xs font-medium">
                    当前
                  </span>
                )}
                <h3 className="font-display text-lg text-[rgb(var(--color-text))] flex items-center gap-2">
                  {plan.name.toLowerCase().includes('enterprise') && <Building2 className="w-5 h-5 text-purple-500" />}
                  {plan.name}
                </h3>
                <p className="text-xs text-[rgb(var(--color-text-muted))] mt-1">
                  {plan.billingPeriod === 'monthly' ? '月付' : plan.billingPeriod === 'yearly' ? '年付' : ''}
                </p>

                {/* Pricing */}
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl text-[rgb(var(--color-text))]">{formatCents(total)}</span>
                    <span className="text-sm text-[rgb(var(--color-text-muted))]">/{plan.billingPeriod === 'yearly' ? '年' : '月'}</span>
                  </div>
                  <div className="mt-2 text-xs text-[rgb(var(--color-text-muted))] space-y-0.5">
                    <p>基础费: {formatCents(plan.baseAmountCents)}/{plan.billingPeriod === 'yearly' ? '年' : '月'}</p>
                    <p>人数费: {formatCents(plan.perPersonAmountCents)}/人/{plan.billingPeriod === 'yearly' ? '年' : '月'} × {employeeCount}人 = {formatCents(plan.perPersonAmountCents * employeeCount)}</p>
                  </div>
                </div>

                {/* Employee Count */}
                {!isCurrent && (
                  <div className="mt-4">
                    <label className="flex items-center gap-1 text-xs text-[rgb(var(--color-text-muted))] mb-1">
                      <Users className="w-3.5 h-3.5" />企业人数
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100000}
                      value={employeeCount}
                      onChange={(e) => setEmployeeCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 px-2 py-1 rounded-lg bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))] text-sm text-[rgb(var(--color-text))]"
                    />
                  </div>
                )}

                {/* Features */}
                <ul className="mt-4 space-y-1.5">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[rgb(var(--color-text-muted))]">
                      <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={isCurrent || submitting}
                  className={`mt-6 w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    plan.name.toLowerCase().includes('enterprise')
                      ? 'bg-purple-500 text-white hover:bg-purple-400'
                      : 'bg-amber-500 text-ink-900 hover:bg-amber-400'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isCurrent ? '当前套餐' : submitting ? '处理中...' : plan.name.toLowerCase().includes('enterprise') ? '升级 Enterprise' : '选择 Pro'}
                </button>
              </motion.div>
            );
          })}
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-lg p-3 text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/30' : 'bg-red-500/10 text-red-500 border border-red-500/30'}`}>
          {message.text}
        </div>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div>
          <h2 className="font-display text-lg text-[rgb(var(--color-text))] mb-3">支付记录</h2>
          <div className="rounded-xl border border-[rgb(var(--color-border))] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))]">
                <tr>
                  <th className="text-left p-3 text-[rgb(var(--color-text-muted))] font-medium">日期</th>
                  <th className="text-left p-3 text-[rgb(var(--color-text-muted))] font-medium">金额</th>
                  <th className="text-left p-3 text-[rgb(var(--color-text-muted))] font-medium">支付方式</th>
                  <th className="text-left p-3 text-[rgb(var(--color-text-muted))] font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-[rgb(var(--color-border))]">
                    <td className="p-3 text-[rgb(var(--color-text))]">{p.paidAt ? formatDate(p.paidAt) : formatDate(p.createdAt)}</td>
                    <td className="p-3 text-[rgb(var(--color-text))]">{formatCents(p.amountCents)}</td>
                    <td className="p-3 text-[rgb(var(--color-text-muted))]">{p.paymentMethod || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        p.status === 'succeeded' ? 'bg-green-500/10 text-green-500' :
                        p.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                        'bg-gray-500/10 text-gray-500'
                      }`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
