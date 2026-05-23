/**
 * 法律页面通用组件
 * 服务条款 / 隐私政策 / 退款政策 共用此组件
 * 内容来自 i18n，修改政策只需编辑 JSON 文件
 */
'use client';

import { useTranslations } from '@/hooks/use-translations';

interface LegalPageProps {
  pageKey: 'terms' | 'privacy' | 'refund';
}

export function LegalPage({ pageKey }: LegalPageProps) {
  const t = useTranslations('legal');

  const title = t(`${pageKey}.title`);
  const lastUpdated = t(`${pageKey}.lastUpdated`);
  const content = t(`${pageKey}.content`);

  const sections = content
    .split('\n## ')
    .filter(Boolean)
    .map((s) => {
      const lines = s.split('\n');
      const heading = lines[0].replace(/^## /, '');
      const body = lines.slice(1).join('\n').trim();
      return { heading, body };
    });

  const firstSection = sections[0];
  const restSections = sections.slice(1);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-[rgb(var(--color-text))] mb-2">{title}</h1>
      <p className="text-sm text-[rgb(var(--color-text-muted))] mb-10">{lastUpdated}</p>

      <div className="flex gap-10">
        {/* Desktop sidebar TOC */}
        <nav className="hidden lg:block w-48 shrink-0">
          <div className="sticky top-20 space-y-1">
            {sections.map((s, i) => (
              <a
                key={i}
                href={`#section-${i}`}
                className="block text-sm text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors py-1"
              >
                {s.heading}
              </a>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1 max-w-none">
          {firstSection && (
            <section id="section-0" className="mb-8">
              <h2 className="text-xl font-semibold text-[rgb(var(--color-text))] mb-3">{firstSection.heading}</h2>
              {firstSection.body.split('\n\n').map((para, j) => (
                <p key={j} className="text-[rgb(var(--color-text-muted))] leading-relaxed mb-3">
                  {para}
                </p>
              ))}
            </section>
          )}

          {restSections.map((s, i) => (
            <section key={i} id={`section-${i + 1}`} className="mb-8">
              <h2 className="text-xl font-semibold text-[rgb(var(--color-text))] mb-3">{s.heading}</h2>
              {s.body.split('\n\n').map((para, j) => (
                <p key={j} className="text-[rgb(var(--color-text-muted))] leading-relaxed mb-3">
                  {para}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
