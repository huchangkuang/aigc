import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EntityImageHistory } from '../entity-image-history';
import { EntityImagePreview } from '../entity-image-preview';

const items = [
  {
    id: 'a1',
    previewUrl: 'https://example.com/1.png',
    createdAt: '2026-01-01',
    adopted: true,
  },
  {
    id: 'a2',
    previewUrl: 'https://example.com/2.png',
    createdAt: '2026-01-02',
    adopted: false,
  },
];

describe('EntityImageHistory', () => {
  it('renders thumbnails and selects preview on click', () => {
    const onSelect = vi.fn();
    render(
      <EntityImageHistory
        items={items}
        previewAssetId="a1"
        onSelect={onSelect}
        onUpload={vi.fn()}
      />,
    );

    expect(screen.getByText('历史记录')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button')[2]);
    expect(onSelect).toHaveBeenCalledWith('a2');
  });

  it('triggers upload when file is chosen', () => {
    const onUpload = vi.fn();
    render(
      <EntityImageHistory items={[]} onSelect={vi.fn()} onUpload={onUpload} />,
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'ref.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onUpload).toHaveBeenCalledWith(file);
  });
});

describe('EntityImagePreview', () => {
  it('shows adopted badge and adopt button when not adopted', () => {
    const onAdopt = vi.fn();
    render(
      <EntityImagePreview
        previewUrl="https://example.com/2.png"
        alt="角色"
        adopted={false}
        showAdopt
        onAdopt={onAdopt}
      />,
    );

    expect(screen.queryByText('已采用')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /采纳/ }));
    expect(onAdopt).toHaveBeenCalled();
  });

  it('shows adopted badge when adopted', () => {
    render(
      <EntityImagePreview
        previewUrl="https://example.com/1.png"
        alt="角色"
        adopted
        showAdopt={false}
        onAdopt={vi.fn()}
      />,
    );

    expect(screen.getByText('已采用')).toBeInTheDocument();
  });
});
