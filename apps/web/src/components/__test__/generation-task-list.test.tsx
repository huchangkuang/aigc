import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GenerationTaskList } from '../generation-task-list';

describe('GenerationTaskList', () => {
  it('shows empty state', () => {
    render(<GenerationTaskList tasks={[]} />);
    expect(screen.getByText(/暂无任务/)).toBeInTheDocument();
  });

  it('renders tasks', () => {
    render(
      <GenerationTaskList
        tasks={[
          {
            id: '1',
            type: 'image',
            status: 'processing',
            inputParams: { prompt: 'hello' },
            createdAt: new Date().toISOString(),
          },
        ]}
      />,
    );
    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByText('文生图')).toBeInTheDocument();
    expect(screen.getByText('生成中')).toBeInTheDocument();
  });
});
