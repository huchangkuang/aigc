import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EditPage from '../page';

const {
  getShortVideoProject,
  listAssets,
  listAdoptedEntityImages,
  parseShortVideoSegments,
  updateSegmentPrompt,
  generateSegmentVideo,
} = vi.hoisted(() => ({
  getShortVideoProject: vi.fn(),
  listAssets: vi.fn(),
  listAdoptedEntityImages: vi.fn(),
  parseShortVideoSegments: vi.fn(),
  updateSegmentPrompt: vi.fn(),
  generateSegmentVideo: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ projectId: 'p1' }),
}));

vi.mock('@/components/segment-prompt-editor', () => ({
  SegmentPromptEditor: ({
    onBlurSave,
    onStateChange,
  }: {
    onBlurSave: (payload: unknown) => void;
    onStateChange?: (payload: { prompt: string; assetIds: string[] }) => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() => {
          onStateChange?.({ prompt: 'saved prompt', assetIds: ['asset-1'] });
          onBlurSave({
            seedancePrompt: 'saved prompt',
            referenceAssetIds: ['asset-1'],
            seedancePromptDoc: { type: 'doc', content: [] },
          });
        }}
      >
        触发失焦保存
      </button>
    </div>
  ),
}));

vi.mock('@/lib/api-client', () => ({
  api: {
    getShortVideoProject,
    listAssets,
    listAdoptedEntityImages,
    parseShortVideoSegments,
    updateSegmentPrompt,
    generateSegmentVideo,
  },
}));

describe('EditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getShortVideoProject.mockResolvedValue({
      id: 'p1',
      parsedEntities: null,
      segments: {
        segments: [
          {
            id: 'seg1',
            order: 0,
            durationSec: 8,
            sceneDescription: 'scene',
            characterRefIds: [],
            propRefIds: [],
            seedancePrompt: 'prompt',
          },
        ],
      },
    });
    listAssets.mockResolvedValue([]);
    listAdoptedEntityImages.mockResolvedValue({
      items: [
        {
          assetId: 'asset-1',
          entityId: 'c1',
          entityName: '陆远',
          entityKind: 'character',
          previewUrl: 'https://img/1.png',
        },
      ],
    });
    updateSegmentPrompt.mockResolvedValue({ id: 'seg1' });
    generateSegmentVideo.mockResolvedValue({ id: 'task-1' });
  });

  it('loads adopted entity images', async () => {
    render(<EditPage />);
    expect(await screen.findByText('视频编辑')).toBeInTheDocument();
    await waitFor(() => {
      expect(listAdoptedEntityImages).toHaveBeenCalledWith('p1');
    });
  });

  it('saves prompt on blur', async () => {
    render(<EditPage />);
    fireEvent.click(await screen.findByRole('button', { name: '触发失焦保存' }));
    await waitFor(() => {
      expect(updateSegmentPrompt).toHaveBeenCalledWith('p1', 'seg1', {
        seedancePrompt: 'saved prompt',
        referenceAssetIds: ['asset-1'],
        seedancePromptDoc: { type: 'doc', content: [] },
      });
    });
  });

  it('generates with prompt and assetIds', async () => {
    render(<EditPage />);
    fireEvent.click(await screen.findByRole('button', { name: '触发失焦保存' }));
    fireEvent.click(await screen.findByRole('button', { name: /AI 生成/ }));
    await waitFor(() => {
      expect(generateSegmentVideo).toHaveBeenCalledWith('p1', 'seg1', {
        prompt: 'saved prompt',
        model: '2.0',
        resolution: '720p',
        duration: 8,
        assetIds: ['asset-1'],
      });
    });
  });
});
