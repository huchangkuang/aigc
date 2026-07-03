'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@/components/icon';
import { useAuthStore } from '@/stores/auth-store';

const SIDEBAR_WIDTH = 'w-56';

const navLinks = [
  { href: '/generate', label: '素材生成', icon: 'auto_awesome' },
  { href: '/short-video', label: '短视频', icon: 'movie' },
  { href: '/tasks', label: '任务中心', icon: 'playlist_play' },
  { href: '/assets', label: '资产库', icon: 'collections' },
  { href: '/trash', label: '回收站', icon: 'delete' },
] as const;

function isProjectWorkspace(pathname: string) {
  return /^\/short-video\/[^/]+/.test(pathname);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const projectMode = isProjectWorkspace(pathname);

  return (
    <div className="min-h-screen bg-background">
      {!projectMode ? (
        <aside
          className={`fixed left-0 top-0 z-50 flex h-screen ${SIDEBAR_WIDTH} flex-col border-r border-primary/20 bg-surface/70 px-2 py-4 shadow-[0_0_20px_rgba(0,219,233,0.1)] backdrop-blur-xl`}
        >
          <div className="mb-6 px-2">
            <h1 className="text-base font-bold tracking-tight text-primary">AIGC 工作台</h1>
            <p className="text-label-sm mt-0.5 text-on-surface-variant">专业创作</p>
          </div>

          <nav className="flex-1 space-y-0.5 px-1">
            {navLinks.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-all duration-300 active:scale-95 ${
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
                  <p className="truncate text-[10px] text-on-surface-variant">预设账号</p>
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      ) : null}

      <main
        className={
          projectMode
            ? 'min-h-screen'
            : 'ml-56 min-h-screen overflow-y-auto'
        }
      >
        <div
          className={
            projectMode
              ? 'min-h-screen'
              : 'mx-auto max-w-[1400px] p-gutter'
          }
        >
          {children}
        </div>
      </main>
    </div>
  );
}
