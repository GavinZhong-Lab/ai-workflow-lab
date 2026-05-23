/**
 * 页脚组件 — 展示政策链接，用于 Paddle 域名验证
 * 用在公开页面（登录/注册/营销页），不出现在仪表盘
 */
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from '@/hooks/use-translations';

export function Footer() {
  const params = useParams();
  const locale = (params?.locale as string) || 'zh-CN';
  const t = useTranslations('footer');

  const links = [
    { href: '/pricing', label: t('pricing') },
    { href: '/terms', label: t('terms') },
    { href: '/privacy', label: t('privacy') },
    { href: '/refund', label: t('refund') },
  ];

  return (
    <footer className="border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))]">
      <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
        <span className="text-xs text-[rgb(var(--color-text-muted))]">{t('copyright')}</span>
        <nav className="flex items-center gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={`/${locale}${link.href}`}
              className="text-xs text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
