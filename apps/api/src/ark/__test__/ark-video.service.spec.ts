import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ArkVideoService } from '../ark-video.service';

describe('ArkVideoService', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock;
  });

  async function createService(apiKey?: string) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArkVideoService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'ARK_API_KEY') return apiKey;
              return undefined;
            },
          },
        },
      ],
    }).compile();
    return module.get(ArkVideoService);
  }

  it('is not configured without API key', async () => {
    const service = await createService();
    expect(service.isConfigured()).toBe(false);
    await expect(
      service.createTask({
        model: 'doubao-seedance-2-0-260128',
        content: [{ type: 'text', text: 'hi' }],
      }),
    ).rejects.toThrow('not configured');
  });

  it('creates task via Ark API', async () => {
    const service = await createService('test-key');
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ id: 'cgt-1' }),
    });

    await expect(
      service.createTask({
        model: 'doubao-seedance-2-0-260128',
        content: [{ type: 'text', text: 'hi' }],
        duration: 11,
      }),
    ).resolves.toEqual({ id: 'cgt-1' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      }),
    );
  });

  it('gets task status', async () => {
    const service = await createService('test-key');
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          id: 'cgt-1',
          status: 'succeeded',
          content: { video_url: 'https://example.com/out.mp4' },
        }),
    });

    await expect(service.getTask('cgt-1')).resolves.toMatchObject({
      status: 'succeeded',
      content: { video_url: 'https://example.com/out.mp4' },
    });
  });
});
