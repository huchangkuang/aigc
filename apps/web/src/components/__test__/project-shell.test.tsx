import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProjectShell } from '../project-shell';

vi.mock('next/navigation', () => ({
  usePathname: () => '/short-video/p1/script',
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
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
