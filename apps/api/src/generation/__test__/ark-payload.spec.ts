import { buildArkContent, buildArkCreateBody } from '../ark-payload';

describe('ark-payload', () => {
  it('builds multimodal content with roles', () => {
    expect(
      buildArkContent({
        prompt: '果茶广告',
        image_urls: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
        video_urls: ['https://example.com/v.mp4'],
        audio_urls: ['https://example.com/a.mp3'],
      }),
    ).toEqual([
      { type: 'text', text: '果茶广告' },
      {
        type: 'image_url',
        image_url: { url: 'https://example.com/a.jpg' },
        role: 'reference_image',
      },
      {
        type: 'image_url',
        image_url: { url: 'https://example.com/b.jpg' },
        role: 'reference_image',
      },
      {
        type: 'video_url',
        video_url: { url: 'https://example.com/v.mp4' },
        role: 'reference_video',
      },
      {
        type: 'audio_url',
        audio_url: { url: 'https://example.com/a.mp3' },
        role: 'reference_audio',
      },
    ]);
  });

  it('builds create body with defaults', () => {
    expect(
      buildArkCreateBody('doubao-seedance-2-0-260128', {
        prompt: 'hello',
      }),
    ).toEqual({
      model: 'doubao-seedance-2-0-260128',
      content: [{ type: 'text', text: 'hello' }],
      generate_audio: true,
      ratio: '16:9',
      duration: 5,
      watermark: false,
    });
  });
});
