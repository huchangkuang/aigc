import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TaskQueueDock } from './task-queue-dock';

describe('TaskQueueDock', () => {
  it('toggles expanded task list', () => {
    render(
      <TaskQueueDock
        tasks={[
          {
            id: '1',
            type: 'image',
            status: 'done',
            inputParams: { prompt: 'test' },
            createdAt: new Date().toISOString(),
          },
        ]}
      />,
    );

    expect(screen.getByText('任务队列')).toBeInTheDocument();
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
    expect(screen.queryByText('test')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /任务队列/ }));
    expect(screen.getByText('test')).toBeInTheDocument();
  });
});
