import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SettingsPage from '../page';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/app/(workspace)/short-video/[projectId]/project-context', () => ({
  useProject: () => ({
    project: {
      id: 'p1',
      title: '旧名称',
      rawScript: '',
      parsedEntities: null,
      segments: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    updateProject: vi.fn(),
    refreshProject: vi.fn(),
  }),
}));

vi.mock('@/lib/api-client', () => ({
  api: {
    updateShortVideoProject: vi.fn().mockResolvedValue({
      id: 'p1',
      title: '新名称',
      rawScript: '',
      parsedEntities: null,
      segments: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    deleteShortVideoProject: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('SettingsPage', () => {
  it('renders project settings form', () => {
    render(<SettingsPage />);
    expect(screen.getByLabelText('项目名称')).toHaveValue('旧名称');
    expect(screen.getByRole('button', { name: '保存名称' })).toBeDisabled();
  });

  it('saves project title', async () => {
    const { api } = await import('@/lib/api-client');
    render(<SettingsPage />);

    fireEvent.change(screen.getByLabelText('项目名称'), {
      target: { value: '新名称' },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存名称' }));

    expect(api.updateShortVideoProject).toHaveBeenCalledWith('p1', { title: '新名称' });
  });
});
