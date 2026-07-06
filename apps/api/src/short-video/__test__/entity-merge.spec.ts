import { mergeParsedEntities, mergeSegments } from '../entity-merge';
import type { ParsedEntities, SegmentsData } from '../short-video.types';

describe('entity-merge', () => {
  it('preserves assetId on re-parse', () => {
    const existing: ParsedEntities = {
      characters: [
        {
          id: 'c1',
          kind: 'character',
          name: '悟行',
          description: 'old',
          imagePrompt: 'old prompt',
          assetId: 'asset-1',
        },
      ],
      scenes: [],
      props: [],
    };

    const incoming: ParsedEntities = {
      characters: [
        {
          id: 'c1',
          kind: 'character',
          name: '悟行',
          description: 'new desc',
          imagePrompt: 'new prompt',
        },
      ],
      scenes: [],
      props: [],
    };

    const merged = mergeParsedEntities(existing, incoming);
    expect(merged.characters[0].assetId).toBe('asset-1');
    expect(merged.characters[0].description).toBe('new desc');
  });

  it('preserves videoAssetId on segment re-parse without user edits', () => {
    const existing: SegmentsData = {
      segments: [
        {
          id: 'seg1',
          order: 0,
          durationSec: 5,
          sceneDescription: 'old',
          characterRefIds: [],
          propRefIds: [],
          seedancePrompt: 'old prompt',
          videoAssetId: 'video-1',
        },
      ],
    };

    const incoming: SegmentsData = {
      segments: [
        {
          id: 'seg1',
          order: 0,
          durationSec: 6,
          sceneDescription: 'new',
          characterRefIds: [],
          propRefIds: [],
          seedancePrompt: 'new prompt',
        },
      ],
    };

    const merged = mergeSegments(existing, incoming);
    expect(merged.segments[0].videoAssetId).toBe('video-1');
    expect(merged.segments[0].durationSec).toBe(6);
    expect(merged.segments[0].seedancePrompt).toBe('new prompt');
  });

  it('preserves user-edited prompt fields on segment re-parse', () => {
    const existing: SegmentsData = {
      segments: [
        {
          id: 'seg1',
          order: 0,
          durationSec: 5,
          sceneDescription: 'old',
          characterRefIds: [],
          propRefIds: [],
          seedancePrompt: 'user edited',
          referenceAssetIds: ['asset-1'],
          seedancePromptDoc: { type: 'doc', content: [] },
          videoAssetId: 'video-1',
        },
      ],
    };

    const incoming: SegmentsData = {
      segments: [
        {
          id: 'seg1',
          order: 0,
          durationSec: 6,
          sceneDescription: 'new',
          characterRefIds: [],
          propRefIds: [],
          seedancePrompt: 'new prompt',
        },
      ],
    };

    const merged = mergeSegments(existing, incoming);
    expect(merged.segments[0].videoAssetId).toBe('video-1');
    expect(merged.segments[0].durationSec).toBe(6);
    expect(merged.segments[0].sceneDescription).toBe('new');
    expect(merged.segments[0].seedancePrompt).toBe('user edited');
    expect(merged.segments[0].referenceAssetIds).toEqual(['asset-1']);
    expect(merged.segments[0].seedancePromptDoc).toEqual({ type: 'doc', content: [] });
  });
});
