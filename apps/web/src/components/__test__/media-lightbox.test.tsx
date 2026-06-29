import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MediaLightbox } from '../media-lightbox';

describe('MediaLightbox', () => {
  it('renders image preview and closes on backdrop click', () => {
    const onClose = vi.fn();
    render(
      <MediaLightbox
        open
        onClose={onClose}
        src="https://example.com/cat.png"
        type="image"
        title="一只橘猫"
      />,
    );

    expect(screen.getByRole('dialog', { name: '一只橘猫' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '一只橘猫' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('dialog', { name: '一只橘猫' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when pressing Escape', () => {
    const onClose = vi.fn();
    render(
      <MediaLightbox
        open
        onClose={onClose}
        src="https://example.com/cat.mp4"
        type="video"
      />,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
