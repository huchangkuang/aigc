import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MediaPreview } from '../media-preview';

describe('MediaPreview', () => {
  it('shows play icon for video thumbnails', () => {
    render(
      <MediaPreview
        src="https://example.com/cat.mp4"
        type="video"
        title="小猫视频"
      />,
    );

    expect(screen.getByRole('button', { name: '播放预览' })).toBeInTheDocument();
    expect(screen.getByText('play_arrow')).toBeInTheDocument();
  });

  it('opens lightbox when clicking a video thumbnail', () => {
    render(
      <MediaPreview
        src="https://example.com/cat.mp4"
        type="video"
        title="小猫视频"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '播放预览' }));
    expect(screen.getByRole('dialog', { name: '小猫视频' })).toBeInTheDocument();
  });

  it('shows zoom affordance for image thumbnails', () => {
    render(
      <MediaPreview
        src="https://example.com/cat.png"
        type="image"
        title="一只橘猫"
      />,
    );

    expect(screen.getByRole('button', { name: '放大预览' })).toBeInTheDocument();
    expect(screen.getByText('zoom_in')).toBeInTheDocument();
  });

  it('renders video with metadata preload in thumbnail variant', () => {
    const { container } = render(
      <MediaPreview
        src="https://example.com/cat.mp4"
        type="video"
        variant="thumbnail"
        title="小猫视频"
      />,
    );

    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute('preload', 'metadata');
    expect(video).toHaveAttribute('src', 'https://example.com/cat.mp4');
  });
});
