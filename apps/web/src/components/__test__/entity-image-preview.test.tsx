import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EntityImagePreview } from '../entity-image-preview';

vi.mock('@/components/icon', () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}));

describe('EntityImagePreview', () => {
  it('shows generating overlay when generating', () => {
    render(
      <EntityImagePreview
        alt="角色"
        adopted={false}
        showAdopt={false}
        generating
        onAdopt={() => undefined}
      />,
    );

    expect(screen.getByText('生成中…')).toBeInTheDocument();
    expect(screen.getByTestId('icon-progress_activity')).toBeInTheDocument();
  });
});
