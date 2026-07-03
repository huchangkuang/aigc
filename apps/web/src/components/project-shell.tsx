'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/icon';

const projectLinks = [
  { href: 'script', label: '剧本', icon: 'description' },
  { href: 'assets', label: '资产', icon: 'inventory_2' },
  { href: 'edit', label: '视频编辑', icon: 'movie' },
  { href: 'settings', label: '项目设置', icon: 'settings' },
] as const;

export function ProjectShell({
  projectId,
  title,
  children,
}: {
  projectId: string;
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const base = `/short-video/${projectId}`;

  return (
    <div className="flex gap-gutter">
      <aside className="w-44 shrink-0 space-y-1">
        <Link
          href="/short-video"
          className="mb-3 flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary"
        >
          <Icon name="arrow_back" className="text-sm" />
          返回项目列表
        </Link>
        <p className="mb-2 truncate px-2 text-sm font-bold text-on-surface">{title}</p>
        {projectLinks.map((link) => {
          const href = `${base}/${link.href}`;
          const active = pathname.startsWith(href);
          return (
            <Link
              key={link.href}
              href={href}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-all ${
                active
                  ? 'bg-primary/10 font-bold text-primary'
                  : 'text-on-surface-variant hover:bg-primary/5 hover:text-primary'
              }`}
            >
              <Icon name={link.icon} filled={active} className="text-lg" />
              {link.label}
            </Link>
          );
        })}
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
