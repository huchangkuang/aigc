import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProjectShell } from '../project-shell';

vi.mock('next/navigation', () => ({
  usePathname: () => '/short-video/p1/script',
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (s: { user: null; logout: () => void }) => unknown) =>
    selector({ user: null, logout: vi.fn() }),
}));

describe('ProjectShell', () => {
  it('renders project sidebar tabs', () => {
    render(
      <ProjectShell projectId="p1" title="测试项目">
        <div>content</div>
      </ProjectShell>,
    );
    expect(screen.getByText('剧本')).toBeInTheDocument();
    expect(screen.getByText('资产')).toBeInTheDocument();
    expect(screen.getByText('视频编辑')).toBeInTheDocument();
    expect(screen.getByText('项目设置')).toBeInTheDocument();
    expect(screen.getByText('返回项目列表')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
