import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GenerationComposer } from '@/components/generation-composer';
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
  loading: false,
  message: '',
  onUploadFile: vi.fn(),
  onSubmit: vi.fn(),
};

describe('GenerationComposer model tier', () => {
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
