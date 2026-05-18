/**
 * 注册页面
 * 分屏布局：左侧装饰面板 + 右侧注册表单
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from '@/hooks/use-translations';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Suspense } from 'react';

function RegisterForm({ params }: { params: { locale: string } }) {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [joinedOrgName, setJoinedOrgName] = useState<string | null>(null);
  const invitationToken = searchParams.get('invitationToken');

  // 预填邀请邮箱（如果有 token）
  const prefilled = useRef(false);

  /** 处理注册表单提交 */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body: Record<string, string> = { name, email, password };
      if (invitationToken) {
        body.invitationToken = invitationToken;
      }

      const res = await api.post<{
        data: {
          user: { id: string; email: string; name: string | null };
          tokens: { accessToken: string; refreshToken: string };
          joinedOrg?: boolean;
        };
      }>('/api/v1/auth/register', body);

      setAuth(res.data.tokens.accessToken, res.data.tokens.refreshToken, res.data.user);

      if (res.data.joinedOrg) {
        setJoinedOrgName('the organization');
        setTimeout(() => router.push(`/${params.locale}/dashboard`), 1500);
      } else {
        router.push(`/${params.locale}/dashboard`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-ink-950">
      {/* 左侧装饰面板 */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-ink-900">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-ember-500/5" />
        <div className="absolute top-1/3 right-1/3 w-80 h-80 bg-amber-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-amber-400/8 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="font-display text-5xl text-white leading-tight">
              {invitationToken ? (
                <>
                  You&apos;re
                  <br />
                  <span className="text-amber-500">invited</span>
                </>
              ) : (
                <>
                  Start your
                  <br />
                  <span className="text-amber-500">journey</span>
                </>
              )}
            </h1>
            <p className="mt-6 text-lg text-ink-300 max-w-md leading-relaxed">
              {invitationToken
                ? 'Create your account to join the organization and start collaborating with your team.'
                : 'Create your free account and start building your SaaS application with all the tools you need.'}
            </p>
          </motion.div>
        </div>
      </div>

      {/* 右侧注册表单 */}
      <div className="flex-1 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-sm"
        >
          <h2 className="font-display text-3xl text-white">{t('registerTitle')}</h2>
          <p className="mt-2 text-ink-400">{t('registerDesc')}</p>

          {invitationToken && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm"
            >
              You are accepting an invitation. Your account will be added to the organization automatically.
            </motion.div>
          )}

          {joinedOrgName && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm"
            >
              Account created! You have joined {joinedOrgName}. Redirecting...
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-3 rounded-lg bg-ember-500/10 border border-ember-500/30 text-ember-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleRegister} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink-300 mb-1.5">
                {t('name')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field w-full"
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-300 mb-1.5">
                {t('email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-300 mb-1.5">
                {t('password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full"
                placeholder="Min. 8 characters"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center py-3 disabled:opacity-50"
            >
              {loading ? t('loading') : t('registerButton')}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-400">
            {t('hasAccount')}{' '}
            <Link
              href={`/${params.locale}/login`}
              className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
            >
              {t('login')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function RegisterPage({ params }: { params: { locale: string } }) {
  return (
    <Suspense>
      <RegisterForm params={params} />
    </Suspense>
  );
}
