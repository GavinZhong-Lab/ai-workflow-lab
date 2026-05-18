/**
 * Settings 设置页面
 * 个人信息编辑、主题切换、语言偏好
 */
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from '@/hooks/use-translations';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { useTheme } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const user = useAuthStore((s) => s.user);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(user?.name || '');

  useEffect(() => setMounted(true), []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.patch('/api/v1/users/me', { name });
      setMsgType('success');
      setMessage(t('profileSaved'));
    } catch (e: unknown) {
      setMsgType('error');
      setMessage((e as { message?: string }).message || tc('error'));
    } finally {
      setSaving(false);
    }
  };

  const switchLocale = (locale: string) => {
    const segments = pathname.split('/');
    segments[1] = locale;
    router.push(segments.join('/'));
  };

  const currentLocale = pathname.split('/')[1] || 'zh-CN';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl"
    >
      <h1 className="font-display text-3xl text-[rgb(var(--color-text))]">{t('title')}</h1>
      <p className="mt-2 text-[rgb(var(--color-text-muted))]">{t('description')}</p>

      {/* 消息 */}
      {message && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className={`mt-4 p-3 rounded-lg text-sm border ${
            msgType === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}
        >
          {message}
        </motion.div>
      )}

      {/* 个人信息 */}
      <section className="mt-8 glass-surface p-6">
        <h2 className="font-display text-lg text-[rgb(var(--color-text))]">{t('profile')}</h2>
        <p className="mt-1 text-sm text-[rgb(var(--color-text-muted))]">{t('profileDesc')}</p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-muted))] mb-1">
              {t('email')}
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="input-field w-full opacity-50 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-muted))] mb-1">
              {t('name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field w-full"
            />
          </div>
          <button
            type="button"
            className="btn-primary text-sm"
            onClick={handleSaveProfile}
            disabled={saving}
          >
            {saving ? tc('saving') : t('saveProfile')}
          </button>
        </div>
      </section>

      {/* 外观设置 */}
      <section className="mt-6 glass-surface p-6">
        <h2 className="font-display text-lg text-[rgb(var(--color-text))]">{t('appearance')}</h2>
        <p className="mt-1 text-sm text-[rgb(var(--color-text-muted))]">{t('appearanceDesc')}</p>

        <div className="mt-4">
          <label className="block text-sm font-medium text-[rgb(var(--color-text-muted))] mb-2">
            {t('theme')}
          </label>
          <div className="flex gap-2">
            {(['dark', 'light', 'system'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTheme(mode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  mounted && theme === mode
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                    : 'border-[rgb(var(--color-border))] text-[rgb(var(--color-text-muted))] hover:bg-ink-800/30'
                }`}
              >
                {t(mode)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 语言设置 */}
      <section className="mt-6 glass-surface p-6">
        <h2 className="font-display text-lg text-[rgb(var(--color-text))]">{t('language')}</h2>
        <p className="mt-1 text-sm text-[rgb(var(--color-text-muted))]">{t('languageDesc')}</p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => switchLocale('zh-CN')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              currentLocale === 'zh-CN'
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                : 'border-[rgb(var(--color-border))] text-[rgb(var(--color-text-muted))] hover:bg-ink-800/30'
            }`}
          >
            {t('zhCN')}
          </button>
          <button
            type="button"
            onClick={() => switchLocale('en-US')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              currentLocale === 'en-US'
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                : 'border-[rgb(var(--color-border))] text-[rgb(var(--color-text-muted))] hover:bg-ink-800/30'
            }`}
          >
            {t('enUS')}
          </button>
        </div>
      </section>
    </motion.div>
  );
}
