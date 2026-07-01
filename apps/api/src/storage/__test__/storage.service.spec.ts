import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from '../storage.service';

const signatureUrl = jest.fn();
const deleteObject = jest.fn();

jest.mock('ali-oss', () => {
  return jest.fn().mockImplementation(() => ({
    put: jest.fn(),
    delete: (...args: unknown[]) => deleteObject(...args),
    signatureUrl: (...args: unknown[]) => signatureUrl(...args),
  }));
});

function createOssModule() {
  return Test.createTestingModule({
    providers: [
      StorageService,
      {
        provide: ConfigService,
        useValue: {
          get: jest.fn((key: string) => {
            const values: Record<string, string> = {
              OSS_REGION: 'oss-cn-hangzhou',
              OSS_ACCESS_KEY_ID: 'key',
              OSS_ACCESS_KEY_SECRET: 'secret',
              OSS_BUCKET: 'bucket',
            };
            return values[key];
          }),
        },
      },
    ],
  }).compile();
}

describe('StorageService', () => {
  beforeEach(() => {
    signatureUrl.mockReset();
    deleteObject.mockReset();
  });

  it('uploads in mock mode', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'STORAGE_MOCK') return 'true';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    const service = module.get(StorageService);
    const result = await service.uploadBuffer(
      'assets/u1/a1.png',
      Buffer.from('x'),
      'image/png',
    );
    expect(result.ossKey).toBe('assets/u1/a1.png');
    expect(await service.getSignedUrl('assets/u1/a1.png')).toContain('mock.local');
  });

  it('throws when oss is not configured', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => undefined),
          },
        },
      ],
    }).compile();

    const service = module.get(StorageService);
    await expect(
      service.uploadBuffer('key', Buffer.from('x'), 'image/jpeg'),
    ).rejects.toThrow('对象存储未配置');
  });

  it('persistFromUrl downloads and uploads in mock mode', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    }) as typeof fetch;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'STORAGE_MOCK') return 'true';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    const service = module.get(StorageService);
    const result = await service.persistFromUrl(
      'u1',
      'asset1',
      'https://example.com/image.png',
      'image/png',
    );
    expect(result.ossKey).toBe('assets/u1/asset1.png');

    global.fetch = originalFetch;
  });

  it('returns the same signed url for the same ossKey within cache ttl', async () => {
    signatureUrl
      .mockReturnValueOnce('https://bucket.oss.com/a1.png?sig=1')
      .mockReturnValueOnce('https://bucket.oss.com/a1.png?sig=2');

    const module = await createOssModule();
    const service = module.get(StorageService);

    const first = await service.getSignedUrl('assets/u1/a1.png');
    const second = await service.getSignedUrl('assets/u1/a1.png');

    expect(first).toBe('https://bucket.oss.com/a1.png?sig=1');
    expect(second).toBe(first);
    expect(signatureUrl).toHaveBeenCalledTimes(1);
  });

  it('generates a new signed url after cache ttl expires', async () => {
    jest.useFakeTimers();
    signatureUrl
      .mockReturnValueOnce('https://bucket.oss.com/a1.png?sig=1')
      .mockReturnValueOnce('https://bucket.oss.com/a1.png?sig=2');

    const module = await createOssModule();
    const service = module.get(StorageService);

    const first = await service.getSignedUrl('assets/u1/a1.png', 100);
    jest.advanceTimersByTime(91_000);
    const second = await service.getSignedUrl('assets/u1/a1.png', 100);

    expect(first).toBe('https://bucket.oss.com/a1.png?sig=1');
    expect(second).toBe('https://bucket.oss.com/a1.png?sig=2');
    expect(signatureUrl).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it('deleteObject is no-op in mock mode', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'STORAGE_MOCK') return 'true';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    const service = module.get(StorageService);
    await expect(service.deleteObject('assets/u1/a1.png')).resolves.toBeUndefined();
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it('deleteObject removes object from oss', async () => {
    deleteObject.mockResolvedValue(undefined);

    const module = await createOssModule();
    const service = module.get(StorageService);

    await service.deleteObject('assets/u1/a1.png');
    expect(deleteObject).toHaveBeenCalledWith('assets/u1/a1.png');
  });

  it('deleteObject treats missing key as success', async () => {
    deleteObject.mockRejectedValue({ code: 'NoSuchKey', message: 'not found' });

    const module = await createOssModule();
    const service = module.get(StorageService);

    await expect(service.deleteObject('assets/u1/missing.png')).resolves.toBeUndefined();
  });
});
