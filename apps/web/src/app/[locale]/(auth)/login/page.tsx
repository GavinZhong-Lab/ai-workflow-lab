/**
 * 登录页面
 * 分屏布局：左侧装饰面板 + 右侧登录表单
 * 使用 Framer Motion 入场动画
 */
'use client';

import { useState } from 'react';
import { useTranslations } from '@/hooks/use-translations';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

export default function LoginPage({ params }: { params: { locale: string } }) {
  const t = useTranslations('auth');
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setOrgName = useAuthStore((s) => s.setOrgName);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /** 处理登录表单提交 */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post<{
        data: {
          user: { id: string; email: string; name: string | null };
          tokens: { accessToken: string; refreshToken: string };
          currentOrg: { id: string; name: string } | null;
        };
      }>('/api/v1/auth/login', { email, password });

      setAuth(
        res.data.tokens.accessToken,
        res.data.tokens.refreshToken,
        res.data.user,
        res.data.currentOrg?.id,
      );
      if (res.data.currentOrg?.name) {
        setOrgName(res.data.currentOrg.name);
      }
      router.push(`/${params.locale}/dashboard`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[rgb(var(--color-bg))]">
      {/* 左侧装饰面板 — 始终保持深色 */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-[rgb(18,25,45)]">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-ember-500/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-ember-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="font-display text-5xl text-white leading-tight">
              <span className="text-amber-500">{t('loginTagline')}</span>
            </h1>
            <p className="mt-6 text-lg text-slate-400 max-w-md leading-relaxed">
              {t('loginHeroDesc')}
            </p>
          </motion.div>
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div className="flex-1 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-sm"
        >
          <h2 className="font-display text-3xl text-[rgb(var(--color-text))]">{t('loginTitle')}</h2>
          <p className="mt-2 text-[rgb(var(--color-text-muted))]">{t('loginDesc')}</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--color-text-muted))] mb-1.5">
                {t('email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full"
                placeholder={t('emailPlaceholder')}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--color-text-muted))] mb-1.5">
                {t('password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full"
                placeholder={t('passwordPlaceholder')}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center py-3 disabled:opacity-50"
            >
              {loading ? t('loading') : t('loginButton')}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[rgb(var(--color-text-muted))]">
            {t('noAccount')}{' '}
            <Link
              href={`/${params.locale}/register`}
              className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
            >
              {t('register')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
