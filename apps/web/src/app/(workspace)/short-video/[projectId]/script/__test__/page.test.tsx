import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ScriptPage from '../page';
import { api } from '@/lib/api-client';

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
    updateShortVideoProject: vi.fn().mockResolvedValue({
      id: 'p1',
      rawScript: '剧本内容',
      parsedEntities: null,
      segments: null,
    }),
    parseShortVideoEntities: vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                id: 'p1',
                rawScript: '剧本内容',
                parsedEntities: {
                  characters: [{ id: 'c1', kind: 'character', name: 'A', description: '', imagePrompt: '' }],
                  scenes: [],
                  props: [],
                },
                segments: null,
              }),
            50,
          );
        }),
    ),
  },
}));

describe('ScriptPage', () => {
  it('renders script editor', async () => {
    render(<ScriptPage />);
    expect(await screen.findByText('剧本')).toBeInTheDocument();
    expect(screen.getByDisplayValue('剧本内容')).toBeInTheDocument();
  });

  it('shows immediate loading when parsing entities', async () => {
    render(<ScriptPage />);
    await screen.findByDisplayValue('剧本内容');

    fireEvent.click(screen.getByRole('button', { name: /解析角色/ }));

    expect(screen.getByRole('button', { name: /解析中/ })).toBeDisabled();
    expect(screen.getByDisplayValue('剧本内容')).toBeDisabled();

    await waitFor(() => {
      expect(api.parseShortVideoEntities).toHaveBeenCalledWith('p1');
    });
  });
});
