'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@/components/icon';
import { useAuthStore } from '@/stores/auth-store';

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
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const base = `/short-video/${projectId}`;

  return (
    <div className="flex min-h-screen">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-52 flex-col border-r border-primary/20 bg-surface/70 px-2 py-4 shadow-[0_0_20px_rgba(0,219,233,0.08)] backdrop-blur-xl">
        <Link
          href="/short-video"
          className="mb-4 flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:bg-primary/10 hover:text-primary"
        >
          <Icon name="arrow_back" className="text-sm" />
          返回项目列表
        </Link>

        <div className="mb-4 px-2">
          <p className="text-label-sm text-on-surface-variant">短视频项目</p>
          <h1 className="truncate text-base font-bold text-on-surface">{title}</h1>
        </div>

        <nav className="flex-1 space-y-0.5 px-1">
          {projectLinks.map((link) => {
            const href = `${base}/${link.href}`;
            const active = pathname.startsWith(href);
            return (
              <Link
                key={link.href}
                href={href}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-all duration-200 active:scale-[0.98] ${
                  active
                    ? 'border-r-2 border-primary bg-primary/10 font-bold text-primary'
                    : 'font-medium text-on-surface-variant hover:bg-primary/10 hover:text-primary'
                }`}
              >
                <Icon name={link.icon} filled={active} className="text-xl" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-0.5 border-t border-primary/10 px-1 pt-3">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-on-surface-variant transition-all hover:bg-primary/10 hover:text-primary"
            onClick={() => {
              logout();
              router.push('/login');
            }}
          >
            <Icon name="logout" className="text-xl" />
            登出
          </button>
          {user ? (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-primary/10 bg-surface-container-low p-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                <Icon name="account_circle" className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-on-surface">{user.email}</p>
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      <main className="ml-52 min-h-screen flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1200px] p-gutter">{children}</div>
      </main>
    </div>
  );
}
