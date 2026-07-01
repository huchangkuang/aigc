import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from '../app-shell';

vi.mock('next/navigation', () => ({
  usePathname: () => '/generate',
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (s: { logout: () => void }) => unknown) =>
    selector({ logout: vi.fn() }),
}));

describe('AppShell', () => {
  it('renders navigation links', () => {
    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );
    expect(screen.getByText('素材生成')).toBeInTheDocument();
    expect(screen.getByText('任务中心')).toBeInTheDocument();
    expect(screen.getByText('资产库')).toBeInTheDocument();
    expect(screen.getByText('回收站')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
