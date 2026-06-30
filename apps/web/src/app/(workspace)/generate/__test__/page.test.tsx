import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GeneratePage from '../page';
import { setComposerDraft, composerDraftStore } from '@/stores/composer-draft-store';

vi.mock('@/lib/api-client', () => ({
  api: {
    listTasks: vi.fn().mockResolvedValue([]),
    createTask: vi.fn(),
  },
}));

describe('GeneratePage', () => {
  it('renders generation form', () => {
    render(<GeneratePage />);
    expect(screen.getByRole('heading', { name: '创作中心' })).toBeInTheDocument();
    expect(screen.getByText('开始生成')).toBeInTheDocument();
  });

  it('applies composer draft on mount', () => {
    composerDraftStore.clearDraft();
    setComposerDraft({
      mode: 'promptOnly',
      prompt: '回填提示词',
    });

    render(<GeneratePage />);
    expect(screen.getByDisplayValue('回填提示词')).toBeInTheDocument();
  });
});
