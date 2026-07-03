import {
  buildSegmentParseMessages,
  parseEntitiesJson,
  parseSegmentsJson,
} from '../script-parser';

describe('script-parser', () => {
  it('parses entities JSON', () => {
    const result = parseEntitiesJson({
      characters: [
        {
          id: 'c1',
          name: '悟行',
          description: '青年修士',
          imagePrompt: 'young cultivator',
        },
      ],
      scenes: [],
      props: [],
    });

    expect(result.characters).toHaveLength(1);
    expect(result.characters[0].kind).toBe('character');
  });

  it('parses segments JSON', () => {
    const result = parseSegmentsJson({
      segments: [
        {
          id: 'seg1',
          order: 0,
          durationSec: 6,
          sceneDescription: '天河云境',
          characterRefIds: ['c1'],
          seedancePrompt: '悟行在天河云境飞行',
        },
      ],
    });

    expect(result.segments[0].durationSec).toBe(6);
  });

  it('requires Chinese seedancePrompt in segment parse messages', () => {
    const messages = buildSegmentParseMessages('剧本', {
      characters: [],
      scenes: [],
      props: [],
    });
    expect(messages[0].content).toContain('seedancePrompt 必须使用中文');
  });
});
