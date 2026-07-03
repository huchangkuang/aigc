import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ScriptPage from '../page';

vi.mock('next/navigation', () => ({
  useParams: () => ({ projectId: 'p1' }),
}));

vi.mock('@/lib/api-client', () => ({
  api: {
    getShortVideoProject: vi.fn().mockResolvedValue({
      id: 'p1',
      title: '测试',
      rawScript: '剧本内容',
      parsedEntities: null,
      segments: null,
      createdAt: '',
      updatedAt: '',
    }),
    updateShortVideoProject: vi.fn(),
    parseShortVideoEntities: vi.fn(),
  },
}));

describe('ScriptPage', () => {
  it('renders script editor', async () => {
    render(<ScriptPage />);
    expect(await screen.findByText('剧本')).toBeInTheDocument();
    expect(screen.getByDisplayValue('剧本内容')).toBeInTheDocument();
  });
});
