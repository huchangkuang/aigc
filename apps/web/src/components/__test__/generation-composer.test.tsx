import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GenerationComposer, type ReferencePreview } from '@/components/generation-composer';
import { api } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  api: {
    listModels: vi.fn(),
  },
}));

const baseProps = {
  type: 'video_t2v' as const,
  onTypeChange: vi.fn(),
  model: '720',
  onModelChange: vi.fn(),
  prompt: '',
  onPromptChange: vi.fn(),
  references: [],
  onRemoveReference: vi.fn(),
  aspectRatio: '16:9',
  onAspectRatioChange: vi.fn(),
  frames: 121,
  onFramesChange: vi.fn(),
  templateId: 'hitchcock_dolly_in',
  onTemplateIdChange: vi.fn(),
  cameraStrength: 'medium',
  onCameraStrengthChange: vi.fn(),
  videoReferences: [] as ReferencePreview[],
  onRemoveVideoReference: vi.fn(),
  onUploadVideoFile: vi.fn(),
  audioReferences: [] as ReferencePreview[],
  onRemoveAudioReference: vi.fn(),
  onUploadAudioFile: vi.fn(),
  duration: 5,
  onDurationChange: vi.fn(),
  resolution: '720p',
  onResolutionChange: vi.fn(),
  loading: false,
  message: '',
  onUploadFile: vi.fn(),
  onSubmit: vi.fn(),
};

describe('GenerationComposer model tier', () => {
  it('lists all seedance model variants', async () => {
    vi.mocked(api.listModels).mockResolvedValue([
      { id: '2.0', label: 'Seedance 2.0' },
      { id: '2.0-fast', label: 'Seedance 2.0 Fast' },
      { id: '2.0-mini', label: 'Seedance 2.0 Mini' },
    ]);

    render(<GenerationComposer {...baseProps} type="video_seedance_r2v" />);

    await waitFor(() => {
      expect(api.listModels).toHaveBeenCalledWith('video_seedance_r2v', {
        silent: true,
      });
    });

    expect(screen.getByRole('option', { name: 'Seedance 2.0 Fast' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Seedance 2.0 Mini' })).toBeInTheDocument();
  });

  it('shows seedance resolution options for 2.0 model', async () => {
    vi.mocked(api.listModels).mockResolvedValue([
      { id: '2.0', label: 'Seedance 2.0' },
    ]);

    render(
      <GenerationComposer
        {...baseProps}
        type="video_seedance_t2v"
        model="2.0"
        resolution="720p"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('option', { name: '1080P' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '4K' })).toBeInTheDocument();
    });
  });

  it('shows first-frame upload for seedance i2v first', () => {
    render(
      <GenerationComposer {...baseProps} type="video_seedance_i2v_first" model="2.0" />,
    );

    expect(screen.getByText('上传首帧')).toBeInTheDocument();
    expect(screen.queryByText('参考视频')).not.toBeInTheDocument();
  });

  it('limits resolution options for seedance fast model', async () => {
    const onResolutionChange = vi.fn();
    vi.mocked(api.listModels).mockResolvedValue([
      { id: '2.0-fast', label: 'Seedance 2.0 Fast' },
    ]);

    render(
      <GenerationComposer
        {...baseProps}
        type="video_seedance_r2v"
        model="2.0-fast"
        resolution="1080p"
        onResolutionChange={onResolutionChange}
      />,
    );

    await waitFor(() => {
      expect(onResolutionChange).toHaveBeenCalledWith('720p');
    });
    expect(screen.queryByRole('option', { name: '1080P' })).not.toBeInTheDocument();
  });

  it('loads model options for current type', async () => {
    vi.mocked(api.listModels).mockResolvedValue([
      { id: '720', label: '720P' },
      { id: '1080', label: '1080P' },
      { id: 'pro', label: 'Pro' },
    ]);

    render(<GenerationComposer {...baseProps} />);

    await waitFor(() => {
      expect(api.listModels).toHaveBeenCalledWith('video_t2v', { silent: true });
    });

    expect(screen.getByRole('option', { name: '1080P' })).toBeInTheDocument();
  });

  it('resets model when current value is unavailable for type', async () => {
    const onModelChange = vi.fn();
    vi.mocked(api.listModels).mockResolvedValue([{ id: '720', label: '720P' }]);

    render(
      <GenerationComposer
        {...baseProps}
        type="video_i2v_recamera"
        model="pro"
        onModelChange={onModelChange}
      />,
    );

    await waitFor(() => {
      expect(onModelChange).toHaveBeenCalledWith('720');
    });
  });
});
